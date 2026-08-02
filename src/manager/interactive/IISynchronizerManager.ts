import { GESTURE_OPERATION_LABELS } from "@/canvas/AbstractCanvas"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { CanvasTool } from "@/Constants"
import { LoggerCategory } from "@/logger"
import type {
  TJIIXEdgeElement,
  TJIIXEdgeLine,
  TJIIXElement,
  TJIIXMathElement,
  TJIIXMathExpression,
  TJIIXNodeElement,
  TJIIXStrokeItem,
  TJIIXTextElement,
} from "@/model"
import { JIIXEdgeKind, JIIXElementType } from "@/model"
import type { TStroke } from "@/symbol"
import { isStroke } from "@/symbol"

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

  static readonly SYNCHRONIZE_TIMEOUT = 30000
  static readonly MAX_RETRY_ATTEMPTS = 3
  /** Elements processed between yields in `#doSynchronize`'s loop, so a large
   * document doesn't block the main thread (and pending pointer input) in one go. */
  static readonly SYNC_YIELD_CHUNK_SIZE = 50

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

  async #synchronizeWithRetry(): Promise<void> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= IISynchronizerManager.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        if (attempt > 1) {
          this.logger.warn("synchronize", `Retry attempt ${attempt}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS}`)
        }

        await this.#doSynchronize()

        if (attempt > 1) {
          this.logger.info("synchronize", `Synchronization succeeded on attempt ${attempt}`)
        }
        return
      } catch (error) {
        lastError = error as Error

        if (attempt < IISynchronizerManager.MAX_RETRY_ATTEMPTS) {
          this.logger.warn(
            "synchronize",
            `Will retry synchronization (attempt ${attempt + 1}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS})`
          )
          await new Promise((resolve) => setTimeout(resolve, 500))
          continue
        } else {
          // Non-timeout error - don't retry, fail immediately
          this.logger.error("synchronize", "Synchronization failed with non-timeout error:", error)
          throw error
        }
      }
    }

    this.logger.error(
      "synchronize",
      `Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`
    )
    throw lastError || new Error(`Synchronization failed after ${IISynchronizerManager.MAX_RETRY_ATTEMPTS} attempts`)
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
    const textElement = element as TJIIXTextElement
    return JSON.stringify({
      type: element.type,
      label: textElement.label,
      words0: textElement.words?.[0],
      chars0: textElement.chars?.[0],
      lines0: textElement.lines?.[0],
    })
  }

  async #doSynchronize(): Promise<void> {
    // Never contend with an in-progress gesture for the main thread.
    await this.#waitForGestureIdle()

    try {
      await this.canvas.export(["application/vnd.myscript.jiix"])
      this.canvas.history.update(this.model)
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

    this.model.modificationDate = now
    // Process each element — strokes are reference types, so in-place mutation is
    // immediately visible in model.symbols without calling the O(n) updateSymbol()
    let processedSinceYield = 0
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
          this.#lastElementSnapshots.set(el.id, snapshotKey)
          for (const stroke of strokes) {
            this.#updateBlockMetadata(stroke, el)

            if (el.type === JIIXElementType.Text) {
              this.canvas.jiix.updateTextMetadata(stroke, el)
            }

            stroke.modificationDate = now
          }
        }
      } catch (error) {
        this.logger.error("#doSynchronize", `Failed to synchronize element of type ${el.type}:`, error)
      }

      processedSinceYield++
      if (processedSinceYield >= IISynchronizerManager.SYNC_YIELD_CHUNK_SIZE) {
        processedSinceYield = 0
        // A big document (thousands of elements) would otherwise keep this loop
        // running synchronously for one long stretch, delaying any pointer input
        // (e.g. a new stroke) queued up behind it until the whole loop is done.
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await this.#waitForGestureIdle()
      }
    }

    // Yield to event loop so pointer events can be processed before math enrichment
    await Promise.resolve()

    // Enrich math blocks with dependencies — parallel with individual timeout to avoid one hanging block stalling the whole sync
    const mathBlockIds = this.model.mathBlocks.map((m) => m.id)
    const ENRICH_TIMEOUT_MS = 5000
    await Promise.allSettled(
      mathBlockIds.map(async (blockId) => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`enrichMathDependencies timeout for "${blockId}"`)), ENRICH_TIMEOUT_MS)
        )
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
    this.canvas.history.update(this.model)

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
   * Get strokes from JIIX items
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
      const symbol = this.model.getRootSymbol(strokeId)
      if (symbol && isStroke(symbol)) {
        strokes.push(symbol)
      }
    }

    return strokes
  }

  /**
   * Update block metadata (jiixBlockId, jiixBlockType ONLY)
   */
  #updateBlockMetadata(
    stroke: TStroke,
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
}
