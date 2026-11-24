import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPoint } from "@/core"
import { MatrixTransform, type TOBB } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IITranslateManager extends IIAbstractTransformManager {
  protected managerName = "IITranslateManager"
  transformOrigin!: TPoint

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * One hook instead of five per-type methods. `IIAbstractTransformManager` used to
   * declare those five so its `switch (symbol.type)` could reach them; IIC-2014 replaced both with
   * this.
   */
  protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void {
    symbolRegistry.getUtilFor(symbol).translate(symbol, { matrix })
  }

  translate(symbols: TSymbol[], tx: number, ty: number, addToHistory = true): Promise<void> {
    this.logger.info("translate", {
      symbols,
      tx,
      ty,
    })
    this.canvas.connector.clearAnchoredEdgesFor(symbols)
    // Snapshotted before applyAndDraw mutates `symbols` below: gradient-follow needs the
    // moving target's PRE-transform center (same reference point the drag preview used), not
    // its already-moved bounds, or the committed shape would snap to a different form than
    // what was just shown while dragging.
    const preTransformBoundsById = new Map<string, TOBB>()
    symbols.forEach((s) => {
      // selectAll() populates symbolsSelected with no registry check ahead of it (see
      // IISelectionManager.createInteractElementsGroup) — an unregistered symbol has no snapshot
      // taken, so updateAnchoredEdges below leaves it untouched rather than throwing.
      if (!symbolRegistry.has(s.type)) {
        return
      }
      const bounds = SymbolGeometry.boundsOf(s)
      preTransformBoundsById.set(s.id, { ...bounds, center: { ...bounds.center } })
    })
    // Snapshotted before the transform, and from `symbols` — the list actually being moved, not
    // `symbolsSelected`. Recording the selection instead produced an entry with no symbols at all
    // whenever a caller moved something that was not selected, and undo then consumed that entry
    // and applied nothing. Only taken when the move is undoable: the gesture handlers translate
    // with `addToHistory` false and would pay for clones nobody reads.
    const preTransformSnapshots = addToHistory ? symbols.map((s) => cloneSymbol(s)) : []
    const matrix = MatrixTransform.identity().translate(tx, ty)
    const movedDecorators = this.applyAndDraw(symbols, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(symbols, matrix)
    // Pre-convert edge strokes and converted Line/PolyEdge/Arc anchors moved by the connector,
    // not by applyAndDraw above. Rigidly-moved raw strokes are recorded alongside the selection;
    // everything else (gradient-moved raw strokes, converted edges recomputed from the target's
    // new bounds) carries its own pre-mutation snapshot — both end up in the same `updated` pair.
    const {
      rigidStrokeIds,
      oldSymbols: anchoredOldSymbols,
      newSymbols: anchoredNewSymbols,
    } = this.canvas.connector.updateAnchoredEdges(
      symbols.map((s) => s.id),
      matrix,
      preTransformBoundsById
    )
    if (addToHistory) {
      const changes: TIIHistoryChanges = {}
      // Excluded against `symbols`, the list actually moved — not against `symbolsSelected`. The
      // two are the same during a drag but not for a programmatic caller, and an exclusion list
      // built from the wrong set records a followed stroke twice.
      this.recordTransformed(changes, [
        ...preTransformSnapshots,
        ...this.resolveFollowedSymbols(rigidStrokeIds, symbols),
        ...movedDecorators,
      ])
      appendUpdated(
        changes,
        anchoredOldSymbols.map((before, index) => ({ before, after: anchoredNewSymbols[index] }))
      )
      this.canvas.history.push(changes)
    }
    const strokes = this.canvas.extractStrokesFromSymbols(symbols)
    return Promise.all([
      this.canvas.client.transformTranslate([...new Set([...strokes.map((s) => s.id), ...rigidStrokeIds])], tx, ty),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ]).then(() => undefined)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { origin })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Translating")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.transformOrigin = origin
  }

  continue(point: TPoint): {
    tx: number
    ty: number
  } {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.canvas.snaps.snapTranslate(tx, ty)
    tx = nudge.x
    ty = nudge.y

    // Built before the preview so one matrix serves both it and the connector below.
    const matrix = MatrixTransform.identity().translate(tx, ty)

    this.previewElementTransform(this.interactElementsGroup.id as string, matrix)
    this.model.symbolsSelected.forEach((s) => {
      this.previewTransform(s, matrix)
    })
    this.previewDecorators(this.model.symbolsSelected, matrix)
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.previewElementTransform(id, matrix)
    })
    this.canvas.connector.drawAnchoredEdgesForMatrix(
      this.model.symbolsSelected.map((s) => s.id),
      matrix
    )
    return { tx, ty }
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Translating")
    const { tx, ty } = this.continue(point)
    this.canvas.snaps.clearSnapToElementLines()
    await this.translate(this.model.symbolsSelected, tx, ty)
    this.finalizeTransform()
  }
}
