import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TIIHistoryChanges } from "@/history"
import type { TPoint, TStroke, TText } from "@/symbol"
import { isText, SymbolType, type TSymbol } from "@/symbol"
import { BoxOps } from "@/symbol/primitives/Box"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import { TextOps } from "@/symbol/text/Text"
import { MatrixTransform } from "@/transform"
import { computeAverage, isBetween } from "@/utils"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { InsertAction } from "../GestureTypes"

/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Manager
 */
export class InsertGestureHandler extends GestureHandler {
  readonly gestureType = "INSERT" as const

  constructor(editor: TInteractiveInkEditor, helpers: GestureHelpers) {
    super(editor, helpers)
  }

  /**
   * Create strokes from gesture substrokes
   * Reconstructs pointers with pressure and time information
   * @param strokeOrigin - The original stroke to get style and pointer info
   * @param subStrokes - Array of substroke data (x,y coordinates)
   * @returns Array of new strokes
   */
  createStrokesFromGestureSubStroke(strokeOrigin: TStroke, subStrokes: { x: number[]; y: number[] }[]): TStroke[] {
    const strokes: TStroke[] = []
    if (subStrokes[0]) {
      const subStroke = StrokeOps.create(strokeOrigin.style)
      subStrokes[0].x.forEach((x, i) => {
        subStroke.pointers.push({
          x,
          y: subStrokes[0].y[i],
          p: strokeOrigin.pointers.at(i)?.p || 1,
          t: strokeOrigin.pointers.at(i)?.t || Math.max(...subStroke.pointers.map((p) => p.t + 20)),
        })
      })
      StrokeOps.updateBounds(subStroke)
      strokes.push(subStroke)
    }
    if (subStrokes[1]) {
      const subStroke = StrokeOps.create(strokeOrigin.style)
      subStrokes[1].x.forEach((x, i) => {
        subStroke.pointers.push({
          x,
          y: subStrokes[1].y[i],
          p: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.p || 1,
          t:
            strokeOrigin.pointers.at(subStroke.pointers.length + i)?.t ||
            Math.max(...subStroke.pointers.map((p) => p.t + 20)),
        })
      })
      StrokeOps.updateBounds(subStroke)
      strokes.push(subStroke)
    }
    return strokes
  }

  /**
   * Compute split stroke into before/after parts
   * Applies translation to the "after" stroke
   * @param strokeOrigin - The original stroke to split
   * @param subStrokes - Array of substroke data
   * @returns Object with optional before and after strokes
   */
  computeSplitStroke(
    strokeOrigin: TStroke,
    subStrokes: { x: number[]; y: number[] }[]
  ): { before?: TStroke; after?: TStroke } {
    let after: TStroke | undefined
    const newStrokes = this.createStrokesFromGestureSubStroke(strokeOrigin, subStrokes)

    if (newStrokes[1]) {
      after = newStrokes[1]
      this.translator.applyToSymbol(after, MatrixTransform.identity().translate(this.strokeSpaceWidth, 0))
    }
    return {
      before: newStrokes[0],
      after,
    }
  }

  /**
   * Compute changes needed when splitting a stroke
   * Handles both simple Stroke symbols with child strokes
   * @param gestureStroke - The gesture stroke
   * @param strokeIdToSplit - ID of the stroke to split
   * @param subStrokes - Substroke data
   * @returns History changes object with translate and replaced arrays
   */
  computeChangesOnSplitStroke(
    gestureStroke: TStroke,
    strokeIdToSplit: string,
    subStrokes: {
      fullStrokeId: string
      x: number[]
      y: number[]
    }[]
  ): TIIHistoryChanges {
    const translate: {
      symbols: TSymbol[]
      tx: number
      ty: number
    }[] = []
    const replaced: {
      oldSymbols: TSymbol[]
      newSymbols: TSymbol[]
    } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(
      (s) =>
        gestureStroke.id !== s.id &&
        this.isSymbolInRow(gestureStroke, s) &&
        gestureStroke.bounds.center.x < s.bounds.center.x - s.bounds.width / 2
    )

    const symbolToSplit = this.model.getRootSymbol(strokeIdToSplit)
    if (symbolToSplit?.type === SymbolType.Stroke) {
      const newStrokes = this.computeSplitStroke(symbolToSplit, subStrokes)
      if (newStrokes.before) {
        replaced.newSymbols.push(newStrokes.before)
      }
      if (newStrokes.after) {
        replaced.newSymbols.push(newStrokes.after)
      }
      replaced.oldSymbols.push(symbolToSplit)
    }
    if (symbolsAfterGestureInRow.length) {
      translate.push({
        symbols: symbolsAfterGestureInRow,
        tx: this.strokeSpaceWidth,
        ty: 0,
      })
    }

    return {
      translate,
      replaced,
    }
  }

  /**
   * Compute changes when splitting a Text symbol
   * @param gestureStroke - The gesture stroke
   * @param textToSplit - The text symbol to split
   * @param insertAction - The insert action mode
   * @returns History changes object
   */
  computeChangesOnSplitText(gestureStroke: TStroke, textToSplit: TText, insertAction: InsertAction): TIIHistoryChanges {
    const translate: {
      symbols: TSymbol[]
      tx: number
      ty: number
    }[] = []
    const replaced: {
      oldSymbols: TSymbol[]
      newSymbols: TSymbol[]
    } = { oldSymbols: [], newSymbols: [] }

    const symbolsAfterGestureInRow = this.model.symbols.filter(
      (s) =>
        gestureStroke.id !== s.id &&
        this.isSymbolInRow(gestureStroke, s) &&
        gestureStroke.bounds.center.x < s.bounds.center.x - s.bounds.width / 2
    )
    const symbolsBelow = this.model.symbols.filter((s) => this.isSymbolBelow(gestureStroke, s))

    const charsBefore = textToSplit.chars.filter(
      (c) => c.bounds.x + c.bounds.width / 2 <= gestureStroke.bounds.center.x
    )
    const charsAfter = textToSplit.chars.filter((c) => c.bounds.x + c.bounds.width / 2 > gestureStroke.bounds.center.x)
    const newTexts: TText[] = []
    if (charsBefore.length && charsAfter.length) {
      const textBefore = TextOps.create(
        charsBefore,
        textToSplit.point,
        BoxOps.createFromBoxes(charsBefore.map((c) => c.bounds))
      )
      this.typeset.setBounds(textBefore)
      newTexts.push(textBefore)

      let pointAfter: TPoint
      if (insertAction === InsertAction.LineBreak) {
        // For line break, position at start of next line
        pointAfter = {
          x: textToSplit.point.x,
          y: textToSplit.point.y + this.rowHeight,
        }
      } else {
        // For insert, add horizontal space
        pointAfter = {
          x:
            textBefore.point.x +
            textBefore.bounds.width +
            this.typeset.getSpaceWidth(computeAverage(textBefore.chars.map((c) => c.fontSize))),
          y: textBefore.point.y,
        }
      }
      const textAfter = TextOps.create(charsAfter, pointAfter, BoxOps.createFromBoxes(charsAfter.map((c) => c.bounds)))
      this.typeset.setBounds(textAfter)
      newTexts.push(textAfter)
      replaced.newSymbols = newTexts
      replaced.oldSymbols = [textToSplit]
    }

    // Handle other symbols based on insert action
    if (insertAction === InsertAction.LineBreak) {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({
          symbols: symbolsAfterGestureInRow.filter((s) => s.id !== gestureStroke.id),
          tx: 0,
          ty: this.rowHeight,
        })
      }
      if (symbolsBelow.length) {
        translate.push({
          symbols: symbolsBelow,
          tx: 0,
          ty: this.rowHeight,
        })
      }
    } else {
      if (symbolsAfterGestureInRow?.length) {
        translate.push({
          symbols: symbolsAfterGestureInRow.filter((s) => s.id !== gestureStroke.id),
          tx: this.strokeSpaceWidth,
          ty: 0,
        })
      }
    }

    return {
      translate,
      replaced,
    }
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyInsertGesture", {
      gestureStroke,
      gesture,
    })

    const symbolsRow = this.model.symbols.filter(
      (s) => gestureStroke.id !== s.id && this.isSymbolInRow(gestureStroke, s)
    )
    const textToSplit = symbolsRow.find(
      (s) =>
        isText(s) &&
        isBetween(
          gestureStroke.bounds.center.x,
          s.bounds.center.x - s.bounds.width / 2,
          s.bounds.center.x + s.bounds.width / 2
        )
    ) as TText | undefined
    const symbolsBeforeGestureInRow = symbolsRow.filter(
      (s) => gestureStroke.bounds.center.x > s.bounds.center.x + s.bounds.width / 2
    )
    const symbolsAfterGestureInRow = symbolsRow.filter(
      (s) => gestureStroke.bounds.center.x < s.bounds.center.x - s.bounds.width / 2
    )

    const symbolsBelow = this.model.symbols.filter((s) => this.isSymbolBelow(gestureStroke, s))

    let changes: TIIHistoryChanges | undefined
    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      changes = this.computeChangesOnSplitStroke(gestureStroke, gesture.strokeIds[0], gesture.subStrokes)
    } else if (textToSplit) {
      changes = this.computeChangesOnSplitText(gestureStroke, textToSplit, this.manager.insertAction)
    } else if (symbolsAfterGestureInRow.length) {
      const translate: {
        symbols: TSymbol[]
        tx: number
        ty: number
      }[] = []
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        translateX =
          Math.min(...symbolsBeforeGestureInRow.map((s) => s.bounds.center.x - s.bounds.width / 2)) -
          Math.min(...symbolsAfterGestureInRow.map((s) => s.bounds.center.x - s.bounds.width / 2))
      }

      switch (this.manager.insertAction) {
        case InsertAction.LineBreak:
          translate.push({
            symbols: symbolsAfterGestureInRow,
            tx: translateX,
            ty: this.rowHeight,
          })
          if (symbolsBelow.length) {
            translate.push({
              symbols: symbolsBelow,
              tx: 0,
              ty: this.rowHeight,
            })
          }
          break
        case InsertAction.Insert:
          translate.push({
            symbols: symbolsAfterGestureInRow,
            tx: this.strokeSpaceWidth * 2,
            ty: 0,
          })
          break
      }
      changes = { translate }
    } else if (
      symbolsBeforeGestureInRow.length &&
      symbolsBelow.length &&
      this.manager.insertAction === InsertAction.LineBreak
    ) {
      changes = {
        translate: [
          {
            symbols: symbolsBelow,
            tx: 0,
            ty: this.rowHeight,
          },
        ],
      }
    }

    if (changes) {
      this.history.push(this.model, changes)
      const promises: Promise<void>[] = []
      if (changes.translate?.length) {
        promises.push(
          ...changes.translate.map((tr) => this.manager.translator.translate(tr.symbols, tr.tx, tr.ty, false))
        )
      }
      if (changes.replaced?.newSymbols.length) {
        promises.push(this.editor.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false))
      }
      await Promise.all(promises)
    }
  }
}
