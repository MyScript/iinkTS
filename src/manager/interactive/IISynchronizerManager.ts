import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
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

  constructor(editor: TInteractiveInkEditor) {
    super(editor, LoggerCategory.SYNCHRONIZER)
    this.logger.info("constructor", "IISynchronizerManager")
  }

  #createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Synchronization timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  }

  async synchronize(): Promise<void> {
    if (this.#synchronizePromise) {
      this.logger.debug("synchronize", "Synchronization already in progress, will re-run after")
      this.#dirtyDuringSync = true
      await this.#synchronizePromise
      return
    }

    this.#synchronizePromise = this.editor.trackOperation("Synchronizing", async () => this.#syncLoop())

    try {
      await this.#synchronizePromise
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

        await Promise.race([
          this.#doSynchronize(),
          this.#createTimeoutPromise(IISynchronizerManager.SYNCHRONIZE_TIMEOUT),
        ])

        if (attempt > 1) {
          this.logger.info("synchronize", `Synchronization succeeded on attempt ${attempt}`)
        }
        return
      } catch (error) {
        lastError = error as Error
        const isTimeout = error instanceof Error && error.message.includes("timeout")

        if (isTimeout) {
          this.logger.error(
            "synchronize",
            `Timeout on attempt ${attempt}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS}:`,
            error
          )
          if (attempt < IISynchronizerManager.MAX_RETRY_ATTEMPTS) {
            this.logger.warn(
              "synchronize",
              `Will retry synchronization (attempt ${attempt + 1}/${IISynchronizerManager.MAX_RETRY_ATTEMPTS})`
            )
            await new Promise((resolve) => setTimeout(resolve, 500))
            continue
          }
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

  /** Resolves once no stroke is being actively drawn — writing always wins over sync. */
  async #waitForWriteIdle(): Promise<void> {
    while (this.model.currentSymbol) {
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
    // Never contend with an in-progress stroke for the main thread.
    await this.#waitForWriteIdle()

    try {
      console.log("#doSynchronize")
      await this.editor.export(["application/vnd.myscript.jiix"])

      this.editor.jiix.invalidateIndex()
      this.editor.history.update(this.model)
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to export JIIX:", error)
      throw error
    }

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
      if (this.#lastElementSnapshots.get(el.id) !== snapshotKey) {
        this.#lastElementSnapshots.set(el.id, snapshotKey)
        try {
          const items = this.#getElementItems(el)

          const strokes = this.#getStrokesFromItems(items)
          for (const stroke of strokes) {
            this.#updateBlockMetadata(stroke, el)

            if (el.type === JIIXElementType.Text) {
              this.editor.jiix.updateTextMetadata(stroke, el)
            }

            stroke.modificationDate = now
          }
        } catch (error) {
          this.logger.error("#doSynchronize", `Failed to synchronize element of type ${el.type}:`, error)
        }
      }

      processedSinceYield++
      if (processedSinceYield >= IISynchronizerManager.SYNC_YIELD_CHUNK_SIZE) {
        processedSinceYield = 0
        // A big document (thousands of elements) would otherwise keep this loop
        // running synchronously for one long stretch, delaying any pointer input
        // (e.g. a new stroke) queued up behind it until the whole loop is done.
        await new Promise((resolve) => requestAnimationFrame(resolve))
        await this.#waitForWriteIdle()
      }
    }

    // Yield to event loop so pointer events can be processed before math enrichment
    await Promise.resolve()

    // Enrich math blocks with dependencies — parallel with individual timeout to avoid one hanging block stalling the whole sync
    const mathBlockIds = this.model.mathBlocks.map((mb) => mb.id)
    const ENRICH_TIMEOUT_MS = 5000
    await Promise.allSettled(
      mathBlockIds.map(async (blockId) => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`enrichMathDependencies timeout for "${blockId}"`)), ENRICH_TIMEOUT_MS)
        )
        try {
          await Promise.race([this.editor.math.enrichMathDependencies(blockId), timeout])
        } catch (err) {
          this.logger.error("synchronize", "Error enriching math dependencies:", err)
        }
      })
    )

    // Cleanup invalid math dependencies
    try {
      this.editor.math.cleanupMathDependencies(mathBlockIds)
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to cleanup math dependencies:", error)
    }

    // Refresh math overlays
    try {
      this.editor.overlays.refresh()
    } catch (error) {
      this.logger.error("#doSynchronize", "Failed to refresh math overlays:", error)
    }
    this.editor.history.update(this.model)

    this.editor.event.emitSynchronized()
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
