import type { TInteractiveInkCanvas } from "@/canvas"
import { BoxOps, MatrixTransform, OBBOps, roundTo } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import type { TStroke, TText } from "@/symbol"
import { cloneSymbol, isText, type TSymbol } from "@/symbol"
import { SymbolGeometry, symbolRegistry, TextUtil } from "@/symbol-utils"

import { GestureHandler } from "../GestureHandler"
import type { GestureHelpers } from "../GestureHelpers"
import type { TGesture } from "../GestureTypes"
import { JoinAction } from "../GestureTypes"
/**
 * Handler for JOIN gesture type
 * Joins rows of text together by removing line breaks
 * Supports two actions: Join (glue words, pull rows up) and CloseGap (one word space, rows stay)
 * @group Manager
 */
export class JoinGestureHandler extends GestureHandler {
  readonly gestureType = "JOIN" as const

  constructor(canvas: TInteractiveInkCanvas, helpers: GestureHelpers) {
    super(canvas, helpers)
  }

  /**
   * The right edge of what precedes the gesture in its row and the left edge of what follows it.
   */
  protected getGapEdges(before: TSymbol[], after: TSymbol[]): { lastXBefore: number; firstXAfter: number } {
    const rightEdge = (s: TSymbol) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x + b.width / 2
    }
    const leftEdge = (s: TSymbol) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x - b.width / 2
    }
    return {
      lastXBefore: Math.max(...before.map(rightEdge)),
      firstXAfter: Math.min(...after.map(leftEdge)),
    }
  }

  async apply(gestureStroke: TStroke, gesture: TGesture): Promise<void> {
    this.logger.debug("applyJoinGesture", {
      gestureStroke,
      gesture,
    })

    // Scans every symbol in the document regardless of type, so an integrator's custom symbol type
    // missing its util must not abort the gesture — skip it like a non-candidate instead of
    // throwing. Every set derived below is a subset of these three, so gating here keeps every
    // later geometry read in this method safe without repeating the check on each of them.
    const isRegistered = (s: TSymbol) => symbolRegistry.has(s.type)
    const gestureBounds = SymbolGeometry.boundsOf(gestureStroke)

    const symbolsAbove = this.model.symbols.filter((s) => isRegistered(s) && this.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(
      (s) => isRegistered(s) && gestureStroke.id !== s.id && this.isSymbolInRow(gestureStroke, s)
    )

    const symbolsBeforeGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x + b.width / 2 <= gestureBounds.center.x
    })
    const symbolsAfterGestureInRow = symbolsRow.filter((s) => {
      const b = SymbolGeometry.boundsOf(s)
      return b.center.x - b.width / 2 > gestureBounds.center.x
    })
    const symbolsBelow = this.model.symbols.filter((s) => isRegistered(s) && this.isSymbolBelow(gestureStroke, s))

    const changes: TIIHistoryChanges = {}
    // Instructions, not a history form: history records before/after pairs, taken around the
    // shift below.
    const shifts: { symbols: TSymbol[]; tx: number; ty: number }[] = []

    if (
      this.manager.joinAction === JoinAction.CloseGap &&
      symbolsBeforeGestureInRow.length &&
      symbolsAfterGestureInRow.length
    ) {
      const { lastXBefore, firstXAfter } = this.getGapEdges(symbolsBeforeGestureInRow, symbolsAfterGestureInRow)
      shifts.push({
        symbols: symbolsAfterGestureInRow,
        tx: lastXBefore + this.strokeSpaceWidth - firstXAfter,
        ty: 0,
      })
    } else if (this.manager.joinAction === JoinAction.CloseGap) {
      // Rows stay in place: with nothing on one side of the gesture, there is no gap to close.
    } else if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = this.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfter = this.getFirstSymbol(symbolsAfterGestureInRow)!
      const { lastXBefore, firstXAfter } = this.getGapEdges(symbolsBeforeGestureInRow, symbolsAfterGestureInRow)
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = cloneSymbol(lastSymbBefore)
      const firstSymbolAfterClone = cloneSymbol(firstSymbolAfter)
      this.manager.translator.applyToSymbol(firstSymbolAfterClone, MatrixTransform.identity().translate(translateX, 0))

      if (isText(lastSymbBefore) && isText(firstSymbolAfter)) {
        const texts = [lastSymbBeforeClone as TText, firstSymbolAfterClone as TText]
        const text = TextUtil.createText(
          texts.flatMap((s) => s.chars),
          texts[0].point,
          BoxOps.createFromBoxes(texts.map((t) => OBBOps.toBox(SymbolGeometry.boundsOf(t))))
        )
        this.canvas.typeset.setBounds(text)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [text],
        }
      }

      // Merged texts already carry `firstSymbolAfter` to its new place. Anything else must move with
      // the rest of the row, or the symbols behind it would be shifted over it.
      const rest = changes.replaced
        ? symbolsAfterGestureInRow.filter((s) => s.id !== firstSymbolAfter.id)
        : symbolsAfterGestureInRow
      if (rest.length) {
        shifts.push({
          symbols: rest,
          tx: translateX,
          ty: 0,
        })
      }
    } else if (symbolsBeforeGestureInRow.length) {
      const lastSymbolBeforeGesture = this.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsBelow)
      if (firstSymbolAfterGesture) {
        const lastBeforeBounds = SymbolGeometry.boundsOf(lastSymbolBeforeGesture)
        const firstAfterBounds = SymbolGeometry.boundsOf(firstSymbolAfterGesture)
        if (
          roundTo(lastBeforeBounds.center.y, this.rowHeight) >=
          roundTo(firstAfterBounds.center.y - this.rowHeight, this.rowHeight)
        ) {
          const symbolInNextRow = symbolsBelow.filter((s) => this.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX =
              lastBeforeBounds.center.x +
              lastBeforeBounds.width / 2 +
              this.strokeSpaceWidth -
              (firstAfterBounds.center.x - firstAfterBounds.width / 2)
            shifts.push({
              symbols: symbolInNextRow,
              tx: translateX,
              ty: -this.rowHeight,
            })
          }
          const symbolsAfterNextRow = symbolsBelow.filter((s) => this.isSymbolBelow(firstSymbolAfterGesture, s))
          if (symbolsAfterNextRow.length) {
            shifts.push({
              symbols: symbolsAfterNextRow,
              tx: 0,
              ty: -this.rowHeight,
            })
          }
        }
      } else {
        shifts.push({
          symbols: symbolsBelow,
          tx: 0,
          ty: -this.rowHeight,
        })
      }
    } else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        const lastAboveBounds = SymbolGeometry.boundsOf(lastSymbolAbove)
        const firstAfterBounds = SymbolGeometry.boundsOf(firstSymbolAfterGesture)
        if (
          roundTo(lastAboveBounds.center.y, this.rowHeight) >=
          roundTo(firstAfterBounds.center.y - this.rowHeight, this.rowHeight)
        ) {
          const translateX =
            lastAboveBounds.center.x +
            lastAboveBounds.width / 2 +
            this.strokeSpaceWidth -
            (firstAfterBounds.center.x - firstAfterBounds.width / 2)
          shifts.push({
            symbols: symbolsAfterGestureInRow,
            tx: translateX,
            ty: -this.rowHeight,
          })
        } else {
          shifts.push({
            symbols: symbolsAfterGestureInRow,
            tx: 0,
            ty: -this.rowHeight,
          })
        }

        if (symbolsBelow.length) {
          shifts.push({
            symbols: symbolsBelow,
            tx: 0,
            ty: -this.rowHeight,
          })
        }
      } else {
        shifts.push({
          symbols: symbolsAfterGestureInRow.concat(...symbolsBelow),
          tx: 0,
          ty: -this.rowHeight,
        })
      }
    }

    if (changes.replaced?.oldSymbols.length) {
      await this.canvas.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (shifts.length) {
      // Snapshotted before, paired after. The translations run with `addToHistory` false — the join
      // is one undoable unit — so nothing else records them. `translator.translate` and not
      // `applyMatrix`: only the former also moves the connected edges and tells the server.
      const snapshots = shifts.flatMap(({ symbols }) => symbols.map((sym) => cloneSymbol(sym)))
      await Promise.all(shifts.map(({ symbols, tx, ty }) => this.manager.translator.translate(symbols, tx, ty, false)))
      appendUpdated(
        changes,
        snapshots.flatMap((before) => {
          const after = this.canvas.model.getSymbol(before.id)
          return after ? [{ before, after }] : []
        })
      )
    }
    this.history.push(changes)
  }
}
