import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TIIHistoryChanges } from "@/history"
import { GestureHandler } from "@/manager/interactive/gestures/GestureHandler"
import type { GestureHelpers } from "@/manager/interactive/gestures/GestureHelpers"
import type { TGesture } from "@/manager/interactive/gestures/GestureTypes"
import type { TStroke, TText } from "@/symbol"
import { isRecognizedMath, SymbolType, type TSymbol } from "@/symbol"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import { TextOps } from "@/symbol/text/Text"

/**
 * Handler for SCRATCH gesture type
 * Erases or partially removes symbols by scratching over them
 * @group Manager
 */
export class ScratchGestureHandler extends GestureHandler {
  readonly gestureType = "SCRATCH" as const

  constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers) {
    super(editor, helpers)
  }

  /**
   * Compute scratch on strokes by subtracting the gesture stroke
   * @param gesture - The gesture information with subStrokes
   * @param stroke - The stroke to scratch
   * @returns Array of resulting strokes (before/after the scratch)
   */
  computeScratchOnStrokes(gesture: TGesture, stroke: TStroke): TStroke[] {
    const newStrokes: TStroke[] = []
    const partPointersToRemove = gesture.subStrokes?.find((ss) => ss.fullStrokeId === stroke.id)
    if (partPointersToRemove) {
      const strokePartToErase = StrokeOps.create()
      partPointersToRemove.x.forEach((x, i) =>
        StrokeOps.addPointer(strokePartToErase, {
          x,
          y: partPointersToRemove.y[i],
          p: 1,
          t: 1,
        })
      )
      const subStrokes = StrokeOps.substract(stroke, strokePartToErase)
      if (subStrokes.before && subStrokes.before.pointers.length > 1) {
        newStrokes.push(subStrokes.before)
      }
      if (subStrokes.after && subStrokes.after.pointers.length > 1) {
        newStrokes.push(subStrokes.after)
      }
    }
    return newStrokes
  }

  /**
   * Compute scratch on text symbol by removing overlapping characters
   * @param gestureStroke - The gesture stroke
   * @param textSymbol - The text symbol to scratch
   * @returns Updated text symbol, or undefined if all characters removed
   */
  computeScratchOnText(gestureStroke: TStroke, textSymbol: TText): TText | undefined {
    const charsToRemove = TextOps.getChildrenOverlaps(textSymbol, gestureStroke.pointers)
    if (textSymbol.chars.length == charsToRemove.length) {
      return
    } else {
      charsToRemove.forEach((c) => {
        const cIndex = textSymbol.chars.findIndex((c1) => c1.id === c.id)
        textSymbol.chars.splice(cIndex, 1)
      })
      this.typeset.updateBounds(textSymbol)
      return textSymbol
    }
  }

  /**
   * Compute scratch on any symbol type
   * Handles different logic for each symbol type:
   * - Stroke: Uses computeScratchOnStrokes
   * - RecognizedText: Scratches child strokes, preserves decorators
   * - RecognizedMath/Diagram: Scratches child strokes, cleans solver outputs
   * - Text: Uses computeScratchOnText
   * - Math/Shape/Edge: Complete erasure
   *
   * @param gestureStroke - The gesture stroke
   * @param gesture - The gesture information
   * @param symbol - The symbol to scratch
   * @returns Object with 'erased' flag or 'replaced' array of new symbols
   */
  computeScratchOnSymbol(
    gestureStroke: TStroke,
    gesture: TGesture,
    symbol: TSymbol
  ): { erased?: boolean; replaced?: TSymbol[] } {
    switch (symbol.type) {
      case SymbolType.Stroke: {
        const strokesScratchedResult = this.computeScratchOnStrokes(gesture, symbol)
        if (strokesScratchedResult.length) {
          return {
            replaced: strokesScratchedResult,
          }
        } else {
          return { erased: true }
        }
      }
      case SymbolType.Text: {
        const textScratchedResult = this.computeScratchOnText(gestureStroke, symbol)
        if (textScratchedResult) {
          return {
            replaced: [textScratchedResult],
          }
        } else {
          return {
            erased: true,
          }
        }
      }
      case SymbolType.Math: {
        // Math symbols should be erased entirely when scratched
        return {
          erased: true,
        }
      }
      case SymbolType.Shape:
      case SymbolType.Edge:
      default: {
        return {
          erased: true,
        }
      }
    }
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyScratchGesture", {
      gestureStroke,
      gesture,
    })
    if (!gesture.strokeIds.length) {
      this.logger.warn("applyScratchGesture", "Unable to apply scratch because there are no strokes")
      return
    }

    const symbolsToErase: TSymbol[] = []
    const symbolsToReplace: {
      oldSymbols: TSymbol[]
      newSymbols: TSymbol[]
    } = { oldSymbols: [], newSymbols: [] }

    gesture.strokeIds.forEach((id) => {
      const sym = this.model.getRootSymbol(id)
      if (
        sym &&
        !symbolsToErase.some((s) => s.id === sym.id) &&
        !symbolsToReplace.oldSymbols.some((s) => s.id === sym.id)
      ) {
        const result = this.computeScratchOnSymbol(gestureStroke, gesture, sym)
        if (result.erased) {
          symbolsToErase.push(sym)
        } else if (result.replaced) {
          symbolsToReplace.newSymbols.push(...result.replaced)
          symbolsToReplace.oldSymbols.push(sym)
        }
      }
    })

    // Handle dependent math blocks
    const affectedMathSymbols = [
      ...symbolsToErase.filter(isRecognizedMath),
      ...symbolsToReplace.oldSymbols.filter(isRecognizedMath),
    ]

    const dependentBlocksToClean = new Set<string>()
    for (const mathSymbol of affectedMathSymbols) {
      if (!mathSymbol.jiixBlockId) {
        continue
      }

      const deps = await this.editor.math.getDependencies(mathSymbol.jiixBlockId)
      if (deps?.dependentBlocks && deps.dependentBlocks.length > 0) {
        this.logger.info(
          "applyScratch",
          `Math symbol ${mathSymbol.jiixBlockId} has ${deps.dependentBlocks.length} dependent blocks, clearing their solver outputs`
        )
        deps.dependentBlocks.forEach((blockId) => dependentBlocksToClean.add(blockId))
      }
    }

    for (const blockId of dependentBlocksToClean) {
      await this.editor.math.clearSolverOutputs(blockId)
      this.logger.info("applyScratch", `Cleared solver outputs from dependent block ${blockId}`)
    }

    const promises: Promise<void | TSymbol[]>[] = []
    const changes: TIIHistoryChanges = {}

    if (symbolsToErase.length) {
      promises.push(
        this.editor.removeSymbols(
          symbolsToErase.map((s) => s.id),
          false
        )
      )
      changes.erased = symbolsToErase
    }

    if (symbolsToReplace.newSymbols.length) {
      changes.replaced = symbolsToReplace
      promises.push(this.editor.replaceSymbols(symbolsToReplace.oldSymbols, symbolsToReplace.newSymbols, false))
    }

    this.history.push(this.model, changes)
    await Promise.all(promises)
  }
}
