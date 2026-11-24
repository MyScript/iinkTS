import type { TInteractiveInkCanvas } from "@/canvas"
import type {
  TJIIXEdgeElement,
  TJIIXEdgeLine,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXNodeElement,
  TJIIXStrokeItem,
  TJIIXTextElement,
} from "@/client"
import { extractEdgeEndpoints, JIIXEdgeKind, JIIXElementType } from "@/client"
import { BoxOps, isDeepEqual, OBBOps, type TDraft } from "@/core"
import { LoggerCategory } from "@/logger"
import type { TStroke } from "@/symbol"
import { isStroke, resolveConnectionAnchors } from "@/symbol"
import { SymbolGeometry } from "@/symbol-utils"

import { CanvasTool } from "../base/CanvasTool"
import { GESTURE_OPERATION_LABELS } from "./GestureOperationLabels"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 * @remarks Simplified synchronizer that only manages JIIX block IDs and stroke lifecycle
 */
export class IISynchronizerManager extends IIAbstractManager {
  protected managerName = "IISynchronizerManager"

  #synchronizePromise?: Promise<void>
  // True when synchronize() was called while a sync was already running.
  // The running sync will re-run once to capture strokes added during it.
  #dirtyDuringSync = false
  // Last-seen content snapshot per JIIX block id, so an unchanged block (the
  // common case for the bulk of a large, already-synced document) can be
  // skipped instead of being reprocessed on every synchronize().
  #lastElementSnapshots = new Map<string, string>()

  static readonly MAX_RETRY_ATTEMPTS = 3
  static readonly RETRY_DELAY_MS = 500
  /** How long one math block's dependency enrichment may take before the sync stops waiting for it */
  static readonly ENRICH_TIMEOUT_MS = 5000
  /** Main-thread time `#doSynchronize`'s loop may take before yielding a frame, so a large
   * document doesn't block pending pointer input in one go. A time budget, not an element count:
   * counting yielded one frame per N elements even when the pass had nothing to do. */
  static readonly SYNC_YIELD_BUDGET_MS = 8

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.SYNCHRONIZER)
    this.logger.info("constructor", "IISynchronizerManager")
  }

  async synchronize(): Promise<void> {
    if (this.#synchronizePromise) {
      this.logger.debug("synchronize", "Synchronization already in progress, will re-run after")
      this.#dirtyDuringSync = true
      await this.#synchronizePromise
      return
    }

    this.#synchronizePromise = this.canvas.trackOperation("Synchronizing", async () => this.#syncLoop())

    try {
      await this.#synchronizePromise
      if (this.canvas.tool === CanvasTool.Select) {
        this.canvas.menu.context.update()
      }
    } finally {
      this.#synchronizePromise = undefined
    }
  }

  async #syncLoop(): Promise<void> {
    do {
      this.#dirtyDuringSync = false
      await this.#synchronizeWithRetry()
    } while (this.#dirtyDuringSync)
  }

  /** Retries any failure (in practice the export round-trip: element failures are caught per element) */
  async #synchronizeWithRetry(): Promise<void> {
    const maxAttempts = IISynchronizerManager.MAX_RETRY_ATTEMPTS
    for (let attempt = 1; ; attempt++) {
      try {
        await this.#doSynchronize()
        if (attempt > 1) {
          this.logger.info("synchronize", `Synchronization succeeded on attempt ${attempt}`)
        }
        return
      } catch (error) {
        if (attempt >= maxAttempts) {
          this.logger.error("synchronize", `Synchronization failed after ${maxAttempts} attempts:`, error)
          throw error
        }
        this.logger.warn("synchronize", `Will retry synchronization (attempt ${attempt + 1}/${maxAttempts})`)
        await new Promise((resolve) => setTimeout(resolve, IISynchronizerManager.RETRY_DELAY_MS))
      }
    }
  }

  /** Never contend with an in-progress gesture (writing, translating, resizing, rotating) for the main thread. */
  async #waitForGestureIdle(): Promise<void> {
    while (GESTURE_OPERATION_LABELS.some((label) => this.canvas.hasOperation(label))) {
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  }

  /** Serializes only the fields `#updateBlockMetadata`/`updateTextMetadata` actually read,
   * so an unrelated JIIX field changing doesn't cause a false "changed" positive. */
  #elementSnapshotKey(element: TJIIXElement): string {
    switch (element.type) {
      case JIIXElementType.Text:
        return JSON.stringify({
          type: element.type,
          label: element.label,
          words0: element.words?.[0],
          chars0: element.chars?.[0],
          lines0: element.lines?.[0],
        })
      case JIIXElementType.Math:
        return JSON.stringify({ type: element.type, label: element.label })
      default:
        // Nodes and edges carry none of the fields read: their type is the whole key
        return JSON.stringify({ type: element.type })
    }
  }

  async #doSynchronize(): Promise<void> {
    // Never contend with an in-progress gesture for the main thread.
    await this.#waitForGestureIdle()

    try {
      await this.canvas.export(["application/vnd.myscript.jiix"])
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to export JIIX:", error)
      throw error
    }

    // export() is a network round-trip - a gesture can start while it was in flight. Re-check
    // before processing its result, since a small document (fewer elements than one yield chunk)
    // would otherwise run the whole loop below in one synchronous pass without ever checking again.
    await this.#waitForGestureIdle()

    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    this.logger.debug("synchronize", "JIIX elements:", jiix?.elements)

    if (!jiix) {
      this.logger.warn("synchronize", "No JIIX export available")
      return
    }

    const now = Date.now()

    // Stamps the document as changed up front: the per-stroke commits below all pass
    // `markDirty: false`, because jiixBlockId/anchors are local bookkeeping and must not clear
    // `model.exports`, which the very sync being processed just populated.
    this.model.touch()
    let sliceStart = performance.now()
    for (const el of jiix.elements || []) {
      const snapshotKey = this.#elementSnapshotKey(el)
      try {
        const items = this.#getElementItems(el)
        const strokes = this.#getStrokesFromItems(items)
        // Even when the element's content fingerprint is unchanged, the live strokes may have
        // lost their jiixBlockId (e.g. a history snapshot restored by undo()/redo() after clear())
        // — re-annotate whenever the metadata itself is missing, not only on content changes.
        const needsMetadata = strokes.some((s) => s.jiixBlockId !== el.id)
        if (needsMetadata || this.#lastElementSnapshots.get(el.id) !== snapshotKey) {
          for (const committed of strokes) {
            const stroke = this.#draftStroke(committed.id)
            if (!stroke) {
              continue
            }
            this.#updateBlockMetadata(stroke, el)

            if (el.type === JIIXElementType.Text) {
              this.canvas.jiix.updateTextMetadata(stroke, el)
            }

            stroke.modificationDate = now
            // jiixBlockId/jiixBlockType are local bookkeeping, not part of the JIIX export
            // content — must not clear model.exports, which was just populated by the
            // canvas.export() call this very sync is processing the result of.
            this.model.commitSymbol(stroke, false)
          }
          // Recorded only once every write for this element has landed. Setting it before the
          // loop meant a throw halfway through marked the element as synced for the rest of the
          // session: `needsMetadata` cannot rescue it, because jiixBlockId is already correct
          // and the lost write (text metadata) is in neither that check nor the snapshot key.
          this.#lastElementSnapshots.set(el.id, snapshotKey)
        }

        // Connection anchors must reflect the LATEST JIIX truth on every sync, not only when
        // the metadata-caching gate above says something "changed" — that gate is keyed off
        // fields (label/words/chars/lines) that don't exist on Edge elements, so it would
        // otherwise never re-run once an edge's jiixBlockId is first set, leaving anchors
        // stale after later syncs report a different (or no) connection.
        this.#syncEdgeConnections(el, strokes)
      } catch (error) {
        this.logger.error("#doSynchronize", `Failed to synchronize element of type ${el.type}:`, error)
      }

      if (performance.now() - sliceStart >= IISynchronizerManager.SYNC_YIELD_BUDGET_MS) {
        // A big document (thousands of elements) would otherwise keep this loop
        // running synchronously for one long stretch, delaying any pointer input
        // (e.g. a new stroke) queued up behind it until the whole loop is done.
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await this.#waitForGestureIdle()
        sliceStart = performance.now()
      }
    }

    // Yield to event loop so pointer events can be processed before math enrichment
    await Promise.resolve()

    // Enrich math blocks with dependencies — parallel with individual timeout to avoid one hanging block stalling the whole sync
    const mathBlockIds = this.model.mathBlocks.map((m) => m.id)
    await Promise.allSettled(
      mathBlockIds.map(async (blockId) => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error(`enrichMathDependencies timeout for "${blockId}"`)),
            IISynchronizerManager.ENRICH_TIMEOUT_MS
          )
        })
        try {
          // `isStale` lets the enrichment discard its result instead of committing it if strokes
          // kept coming in while the backend round-trip was in flight (this pass's mathBlockIds
          // snapshot may already be outdated by the time the response lands) - a fresh, correct
          // enrichment is guaranteed to run right after via `#dirtyDuringSync`/`#syncLoop`.
          await Promise.race([this.canvas.math.enrichMathDependencies(blockId, () => this.#dirtyDuringSync), timeout])
        } catch (err) {
          if (this.#dirtyDuringSync) {
            this.logger.debug(
              "synchronize",
              `Ignoring enrichMathDependencies failure for stale block "${blockId}":`,
              err
            )
          } else {
            this.logger.error("synchronize", "Error enriching math dependencies:", err)
          }
        } finally {
          clearTimeout(timer)
        }
      })
    )

    // Cleanup invalid math dependencies
    try {
      this.canvas.math.cleanupMathDependencies(mathBlockIds)
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to cleanup math dependencies:", error)
    }

    // Refresh math overlays
    try {
      this.canvas.overlays.refresh()
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to refresh math overlays:", error)
    }

    this.canvas.event.emitSynchronized()
  }

  /**
   * Get all stroke items from a JIIX element
   */
  #getElementItems(
    element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement
  ): TJIIXStrokeItem[] {
    const items: TJIIXStrokeItem[] = []

    switch (element.type) {
      case JIIXElementType.Text:
        // Collect all word items (including those with refs - embedded math)
        element.words?.forEach((word) => {
          if (word.items) {
            items.push(...word.items)
          }
        })
        break

      case JIIXElementType.Math:
        // Collect items from expressions
        if (element.items) {
          items.push(...element.items)
        }
        if (element.expressions) {
          element.expressions.forEach((expr) => {
            items.push(...this.#collectMathExpressionItems(expr))
          })
        }
        break

      case JIIXElementType.Node:
        if (element.items) {
          items.push(...element.items)
        }
        break

      case JIIXElementType.Edge:
        if (element.kind === JIIXEdgeKind.PolyEdge) {
          element.edges?.forEach((edge: TJIIXEdgeLine) => {
            if (edge.items) {
              items.push(...edge.items)
            }
          })
        } else if (element.items) {
          items.push(...element.items)
        }
        break
    }

    return items
  }

  /**
   * Recursively collect items from math expressions
   */
  #collectMathExpressionItems(expr: TJIIXMathExpression): TJIIXStrokeItem[] {
    const items: TJIIXStrokeItem[] = []

    if (!expr) {
      return items
    }

    if ("items" in expr && expr.items && Array.isArray(expr.items)) {
      items.push(...expr.items)
    }

    if ("operands" in expr && expr.operands && Array.isArray(expr.operands)) {
      expr.operands.forEach((operand: TJIIXMathExpression) => {
        items.push(...this.#collectMathExpressionItems(operand))
      })
    }

    return items
  }

  /**
   * The committed strokes JIIX items point to. Read, not drafted: most of them are left untouched,
   * and a draft is a full copy - only the strokes about to be written get one, see {@link #draftStroke}.
   */
  #getStrokesFromItems(items: TJIIXStrokeItem[]): TStroke[] {
    const strokes: TStroke[] = []
    const seen = new Set<string>()

    for (const item of items) {
      const strokeId = item["full-id"]
      if (!strokeId || seen.has(strokeId)) {
        continue
      }
      seen.add(strokeId)
      const symbol = this.model.getSymbol(strokeId)
      if (symbol && isStroke(symbol)) {
        strokes.push(symbol)
      }
    }

    return strokes
  }

  #draftStroke(id: string): TDraft<TStroke> | undefined {
    const draft = this.model.draftSymbol(id)
    return draft && isStroke(draft) ? draft : undefined
  }

  /**
   * Update block metadata (jiixBlockId, jiixBlockType ONLY)
   */
  #updateBlockMetadata(
    stroke: TDraft<TStroke>,
    element: TJIIXTextElement | TJIIXMathElement | TJIIXNodeElement | TJIIXEdgeElement
  ): void {
    stroke.jiixBlockId = element.id

    switch (element.type) {
      case JIIXElementType.Text:
        stroke.jiixBlockType = "Text"
        break
      case JIIXElementType.Math:
        stroke.jiixBlockType = "Math"
        break
      case JIIXElementType.Node:
        stroke.jiixBlockType = "Node"
        break
      case JIIXElementType.Edge:
        stroke.jiixBlockType = "Edge"
        break
    }

    this.logger.debug(
      "#updateBlockMetadata",
      `Updated ${stroke.id}: jiixBlockId=${element.id}, jiixBlockType=${stroke.jiixBlockType}`
    )
  }

  /**
   * Resolve and store this edge element's connection anchors on every one of its strokes.
   * Always overwrites from the latest JIIX truth — a connection reported in a previous sync
   * but absent now is cleared, not kept. A stroke whose anchors already match is left as is.
   */
  #syncEdgeConnections(el: TJIIXElement, strokes: TStroke[]): void {
    if (el.type !== JIIXElementType.Edge) {
      return
    }
    const { startAnchor, endAnchor } = this.#resolveEdgeAnchors(el)
    strokes.forEach(({ id }) => {
      // Re-read: the metadata loop may have just committed a newer version of this stroke
      const current = this.model.getSymbol(id)
      if (!current || !isStroke(current)) {
        return
      }
      if (isDeepEqual(current.startAnchor, startAnchor) && isDeepEqual(current.endAnchor, endAnchor)) {
        return
      }
      const stroke = this.#draftStroke(id)
      if (!stroke) {
        return
      }
      stroke.startAnchor = startAnchor
      stroke.endAnchor = endAnchor
      // Anchors aren't part of the JIIX export content either — same reasoning as the
      // metadata-update loop above.
      this.model.commitSymbol(stroke, false)
    })
  }

  #resolveEdgeAnchors(el: TJIIXEdgeElement): Pick<TStroke, "startAnchor" | "endAnchor"> {
    const endpoints = extractEdgeEndpoints(el)
    const connectedIds = el.connected ?? []
    if (!endpoints || connectedIds.length === 0) {
      return { startAnchor: undefined, endAnchor: undefined }
    }
    const connections = connectedIds
      .map((blockId) => {
        const strokeIds = this.canvas.jiix.getStrokesForElement(blockId)
        const boxes = strokeIds
          .map((id) => this.model.getSymbol(id))
          .filter((s): s is TStroke => !!s && isStroke(s))
          .map((s) => OBBOps.toBox(SymbolGeometry.boundsOf(s)))
        if (boxes.length === 0) {
          return undefined
        }
        return { targetId: blockId, box: BoxOps.createFromBoxes(boxes) }
      })
      .filter((c): c is { targetId: string; box: ReturnType<typeof BoxOps.createFromBoxes> } => !!c)
    return resolveConnectionAnchors(endpoints.start, endpoints.end, connections)
  }
}
