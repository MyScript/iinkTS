import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPoint, TPointer } from "@/core"
import { BoxOps, computeAverage, isBetween, MatrixTransform } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import type { TDecorator, TStroke, TText } from "@/symbol"
import { cloneSymbol, isText, SymbolType, type TSymbol } from "@/symbol"
import { StrokeUtil, SymbolGeometry, symbolRegistry, TextUtil } from "@/symbol-utils"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { InsertAction } from "../GestureTypes"

/**
 * A group of symbols to shift, and by how much.
 *
 * Not a history form. It used to be one — `TIIHistoryChanges.translate` — and these handlers used
 * one object both to record the step and to drive it. History records before/after pairs now, so
 * the two parted ways: this stays as the instruction, and `apply` snapshots around it.
 * @group Manager
 */
export type TShift = { symbols: TSymbol[]; tx: number; ty: number }

/**
 * What a split computes: the symbols it replaces, and the groups it shifts to make room.
 * @group Manager
 */
export type TSplitOutcome = { replaced: { oldSymbols: TSymbol[]; newSymbols: TSymbol[] }; shifts: TShift[] }

/**
 * Handler for INSERT gesture type
 * Inserts line breaks or space by drawing vertical line
 * @group Manager
 */
export class InsertGestureHandler extends GestureHandler {
  readonly gestureType = "INSERT" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
  }

  /**
   * The `dt` the pointer at `index` had in the stroke being split, or one step past the last
   * pointer already kept when the split runs off the end of the original.
   *
   * `??` and not `||`: the first pointer of a stroke has a `dt` of exactly 0, and `||` would read
   * that as missing and fabricate a time for a pointer that has a perfectly good one.
   */
  protected deltaAt(strokeOrigin: TStroke, index: number, kept: TPointer[]): number {
    const original = strokeOrigin.pointers.at(index)?.dt
    if (original !== undefined) {
      return original
    }
    return kept.length ? Math.max(...kept.map((p) => p.dt)) + 20 : 0
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
      // Same origin as the stroke it is cut from: its pointers keep the `dt` they were captured
      // with, and those count from that origin. A fresh `creationTime` here would place every
      // one of them at the instant of the split.
      const subStroke = StrokeUtil.createEmpty(strokeOrigin.style, strokeOrigin.pointerType, strokeOrigin.creationTime)
      subStrokes[0].x.forEach((x, i) => {
        subStroke.pointers.push({
          x,
          y: subStrokes[0].y[i],
          p: strokeOrigin.pointers.at(i)?.p || 1,
          dt: this.deltaAt(strokeOrigin, i, subStroke.pointers),
        })
      })
      strokes.push(subStroke)
    }
    if (subStrokes[1]) {
      // Same origin as the stroke it is cut from: its pointers keep the `dt` they were captured
      // with, and those count from that origin. A fresh `creationTime` here would place every
      // one of them at the instant of the split.
      const subStroke = StrokeUtil.createEmpty(strokeOrigin.style, strokeOrigin.pointerType, strokeOrigin.creationTime)
      subStrokes[1].x.forEach((x, i) => {
        subStroke.pointers.push({
          x,
          y: subStrokes[1].y[i],
          p: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.p || 1,
          dt: this.deltaAt(strokeOrigin, subStroke.pointers.length + i, subStroke.pointers),
        })
      })
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
  ): TSplitOutcome {
    const shifts: TShift[] = []
    const replaced: {
      oldSymbols: TSymbol[]
      newSymbols: TSymbol[]
    } = { oldSymbols: [], newSymbols: [] }

    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)
    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of throwing.
    const symbolsAfterGestureInRow = this.model.symbols.filter((s) => {
      if (gestureStroke.id === s.id || !symbolRegistry.has(s.type) || !this.isSymbolInRow(gestureStroke, s)) {
        return false
      }
      const b = SymbolGeometry.boundsOf(s)
      return gestureBounds.center.x < b.center.x - b.width / 2
    })

    const symbolToSplit = this.model.getSymbol(strokeIdToSplit)
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
      shifts.push({
        symbols: symbolsAfterGestureInRow,
        tx: this.strokeSpaceWidth,
        ty: 0,
      })
    }

    return {
      replaced,
      shifts,
    }
  }

  /**
   * Compute changes when splitting a Text symbol
   * @param gestureStroke - The gesture stroke
   * @param textToSplit - The text symbol to split
   * @param insertAction - The insert action mode
   * @returns History changes object
   */
  computeChangesOnSplitText(gestureStroke: TStroke, textToSplit: TText, insertAction: InsertAction): TSplitOutcome {
    const shifts: TShift[] = []
    const replaced: {
      oldSymbols: TSymbol[]
      newSymbols: TSymbol[]
    } = { oldSymbols: [], newSymbols: [] }

    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)
    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of throwing.
    const symbolsAfterGestureInRow = this.model.symbols.filter((s) => {
      if (gestureStroke.id === s.id || !symbolRegistry.has(s.type) || !this.isSymbolInRow(gestureStroke, s)) {
        return false
      }
      const b = SymbolGeometry.boundsOf(s)
      return gestureBounds.center.x < b.center.x - b.width / 2
    })
    const symbolsBelow = this.model.symbols.filter(
      (s) => symbolRegistry.has(s.type) && this.isSymbolBelow(gestureStroke, s)
    )

    // `c.bounds` below is a typeset child's own box (`TSymbolChar`, not a `TSymbol`) — it has no
    // registered util and is out of `SymbolGeometry`'s scope, so it stays a direct field read.
    const charsBefore = textToSplit.chars.filter((c) => c.bounds.x + c.bounds.width / 2 <= gestureBounds.center.x)
    const charsAfter = textToSplit.chars.filter((c) => c.bounds.x + c.bounds.width / 2 > gestureBounds.center.x)
    const newTexts: TText[] = []
    if (charsBefore.length && charsAfter.length) {
      const textBefore = TextUtil.createText(
        charsBefore,
        textToSplit.point,
        BoxOps.createFromBoxes(charsBefore.map((c) => c.bounds))
      )
      textBefore.decorators = textToSplit.decorators.map((d) => cloneSymbol(d) as TDecorator)
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
            SymbolGeometry.boundsOf(textBefore).width +
            this.typeset.getSpaceWidth(computeAverage(textBefore.chars.map((c) => c.fontSize))),
          y: textBefore.point.y,
        }
      }
      const textAfter = TextUtil.createText(
        charsAfter,
        pointAfter,
        BoxOps.createFromBoxes(charsAfter.map((c) => c.bounds))
      )
      textAfter.decorators = textToSplit.decorators.map((d) => cloneSymbol(d) as TDecorator)
      this.typeset.setBounds(textAfter)
      newTexts.push(textAfter)
      replaced.newSymbols = newTexts
      replaced.oldSymbols = [textToSplit]
    }

    // Handle other symbols based on insert action
    if (insertAction === InsertAction.LineBreak) {
      if (symbolsAfterGestureInRow?.length) {
        shifts.push({
          symbols: symbolsAfterGestureInRow.filter((s) => s.id !== gestureStroke.id),
          tx: 0,
          ty: this.rowHeight,
        })
      }
      if (symbolsBelow.length) {
        shifts.push({
          symbols: symbolsBelow,
          tx: 0,
          ty: this.rowHeight,
        })
      }
    } else {
      if (symbolsAfterGestureInRow?.length) {
        shifts.push({
          symbols: symbolsAfterGestureInRow.filter((s) => s.id !== gestureStroke.id),
          tx: this.strokeSpaceWidth,
          ty: 0,
        })
      }
    }

    return {
      replaced,
      shifts,
    }
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyInsertGesture", {
      gestureStroke,
      gesture,
    })

    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)
    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of
    // throwing. Every set derived below is a subset of symbolsRow/symbolsBelow, so gating here
    // keeps every later geometry read in this method safe without repeating the check on each.
    const symbolsRow = this.model.symbols.filter(
      (s) => symbolRegistry.has(s.type) && gestureStroke.id !== s.id && this.isSymbolInRow(gestureStroke, s)
    )

    const textToSplit = symbolsRow.find((s) => {
      if (!isText(s)) {
        return false
      }
      const b = SymbolGeometry.boundsOf(s)
      return isBetween(gestureBounds.center.x, b.center.x - b.width / 2, b.center.x + b.width / 2)
    }) as TText | undefined
    const symbolsBeforeGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return gestureBounds.center.x > b.center.x + b.width / 2
    })
    const symbolsAfterGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return gestureBounds.center.x < b.center.x - b.width / 2
    })

    const symbolsBelow = this.model.symbols.filter(
      (s) => symbolRegistry.has(s.type) && this.isSymbolBelow(gestureStroke, s)
    )

    let outcome: TSplitOutcome | undefined
    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      outcome = this.computeChangesOnSplitStroke(gestureStroke, gesture.strokeIds[0], gesture.subStrokes)
    } else if (textToSplit) {
      outcome = this.computeChangesOnSplitText(gestureStroke, textToSplit, this.manager.insertAction)
    } else if (symbolsAfterGestureInRow.length) {
      const shifts: TShift[] = []
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        const leftEdge = (s: TSymbol) => {
          const b = SymbolGeometry.boundsOf(s)
          return b.center.x - b.width / 2
        }
        translateX =
          Math.min(...symbolsBeforeGestureInRow.map(leftEdge)) - Math.min(...symbolsAfterGestureInRow.map(leftEdge))
      }

      switch (this.manager.insertAction) {
        case InsertAction.LineBreak:
          shifts.push({
            symbols: symbolsAfterGestureInRow,
            tx: translateX,
            ty: this.rowHeight,
          })
          if (symbolsBelow.length) {
            shifts.push({
              symbols: symbolsBelow,
              tx: 0,
              ty: this.rowHeight,
            })
          }
          break
        case InsertAction.Insert:
          shifts.push({
            symbols: symbolsAfterGestureInRow,
            tx: this.strokeSpaceWidth * 2,
            ty: 0,
          })
          break
      }
      outcome = { replaced: { oldSymbols: [], newSymbols: [] }, shifts }
    } else if (
      symbolsBeforeGestureInRow.length &&
      symbolsBelow.length &&
      this.manager.insertAction === InsertAction.LineBreak
    ) {
      outcome = {
        replaced: { oldSymbols: [], newSymbols: [] },
        shifts: [{ symbols: symbolsBelow, tx: 0, ty: this.rowHeight }],
      }
    }

    if (outcome) {
      const changes: TIIHistoryChanges = {}
      if (outcome.replaced.newSymbols.length) {
        changes.replaced = outcome.replaced
      }
      // Snapshotted before the shift, then paired with what the document holds after it. The
      // translations run with `addToHistory` false — this step is one undoable unit, not one per
      // group — so nothing else records them. `translator.translate` and not `applyMatrix`: only
      // the former also moves the connected edges and tells the server.
      const snapshots = outcome.shifts.map(({ symbols }) => symbols.map((sym) => cloneSymbol(sym)))
      const promises: Promise<void>[] = outcome.shifts.map(({ symbols, tx, ty }) =>
        this.manager.translator.translate(symbols, tx, ty, false)
      )
      if (outcome.replaced.newSymbols.length) {
        promises.push(this.canvas.replaceSymbols(outcome.replaced.oldSymbols, outcome.replaced.newSymbols, false))
      }
      await Promise.all(promises)
      appendUpdated(
        changes,
        snapshots.flat().flatMap((before) => {
          const after = this.canvas.model.getSymbol(before.id)
          return after ? [{ before, after }] : []
        })
      )
      this.history.push(changes)
    }
  }
}
