import type { TInteractiveInkCanvas } from "@/canvas"
import type { TBox, TPoint } from "@/core"
import { BoxOps, MatrixTransform, type TOBB } from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { IIAbstractTransformManager } from "./AbstractTransformManager"
import { ResizeDirection } from "./ResizeDirection"

const isEasternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast].includes(direction)

const isWesternResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest].includes(direction)

const isNorthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest].includes(direction)

const isSouthernResize = (direction: ResizeDirection): boolean =>
  [ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest].includes(direction)

/**
 * @group Manager
 */
export class IIResizeManager extends IIAbstractTransformManager {
  protected managerName = "IIResizeManager"
  direction!: ResizeDirection
  boundingBox!: TBox
  transformOrigin!: TPoint
  keepRatio = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * One hook, like the other two managers'. `transformOrigin` is passed here, which is
   * what lets the ellipse and the arc scale their centre about it from inside their own util.
   */
  protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void {
    this.logger.debug("applyToSymbol", { symbol })
    symbolRegistry.getUtilFor(symbol).resize(symbol, { matrix })
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Resizing")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    // selectAll() populates symbolsSelected with no registry check ahead of it (see
    // IISelectionManager.createInteractElementsGroup) — a symbol type missing its util must not
    // abort starting the resize. One filtered list feeds both the ratio question and the bounding
    // box below: a symbol excluded from one must be excluded from the other, or the two disagree
    // about what "the selection" even is.
    const registeredSymbols = this.model.symbolsSelected.filter((s) => symbolRegistry.has(s.type))

    // One symbol that needs its ratio locked locks it for the whole selection, which is what the
    // three type tests here used to say. Asked of each symbol's util now, so a custom symbol can
    // require it too.
    this.keepRatio = registeredSymbols.some((s) => symbolRegistry.getUtilFor(s).keepsAspectRatio(s))

    this.transformOrigin = origin
    this.boundingBox = BoxOps.createFromPoints(registeredSymbols.flatMap((s) => SymbolGeometry.verticesOf(s)))
  }

  continue(point: TPoint): {
    scaleX: number
    scaleY: number
  } {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't resize, you must call start before")
    }
    const localPoint = point
    const horizontalResize = [
      ResizeDirection.East,
      ResizeDirection.NorthEast,
      ResizeDirection.SouthEast,
      ResizeDirection.West,
      ResizeDirection.NorthWest,
      ResizeDirection.SouthWest,
    ].includes(this.direction)
    const verticalResize = [
      ResizeDirection.North,
      ResizeDirection.NorthEast,
      ResizeDirection.NorthWest,
      ResizeDirection.South,
      ResizeDirection.SouthEast,
      ResizeDirection.SouthWest,
    ].includes(this.direction)
    const { x, y } = this.canvas.snaps.snapResize(point, horizontalResize, verticalResize)
    localPoint.x = x
    localPoint.y = y

    let deltaX = 0,
      deltaY = 0
    if (isEasternResize(this.direction)) {
      deltaX = localPoint.x - (this.boundingBox.x + this.boundingBox.width)
    } else if (isWesternResize(this.direction)) {
      deltaX = this.boundingBox.x - localPoint.x
    }
    if (isNorthernResize(this.direction)) {
      deltaY = this.boundingBox.y - localPoint.y
    } else if (isSouthernResize(this.direction)) {
      deltaY = localPoint.y - (this.boundingBox.y + this.boundingBox.height)
    }

    let scaleX = this.boundingBox.width ? 1 + deltaX / this.boundingBox.width : 1
    let scaleY = this.boundingBox.height ? 1 + deltaY / this.boundingBox.height : 1

    if (this.keepRatio) {
      if ([ResizeDirection.North, ResizeDirection.South].includes(this.direction)) {
        scaleX = scaleY
      } else if ([ResizeDirection.East, ResizeDirection.West].includes(this.direction)) {
        scaleY = scaleX
      } else {
        scaleX = Math.max(scaleX, scaleY)
        scaleY = scaleX
      }
    }
    // Built before the preview, and carrying `transformOrigin` explicitly, so one matrix serves both
    // the preview and the connector below — and so the preview needs no `transform-origin`.
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)

    this.previewElementTransform(this.interactElementsGroup.id, matrix)
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
    return { scaleX, scaleY }
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Resizing")
    const { scaleX, scaleY } = this.continue(point)
    this.canvas.snaps.clearSnapToElementLines()
    // Queried before anything is mutated: the pre-convert edge strokes that will rigidly follow
    // this resize need a pre-transform snapshot in history, like the selection itself. Gradient-
    // followed strokes are excluded — their shift isn't a uniform scale, so they get their own
    // pre-mutation snapshot via `updated` below instead, like the anchored converted edges.
    const followedStrokeIds = this.canvas.connector.getRigidFollowedStrokeIds(
      this.model.symbolsSelected.map((s) => s.id)
    )
    const oldSymbols = [
      ...this.model.symbolsSelected,
      ...this.resolveFollowedSymbols(followedStrokeIds, this.model.symbolsSelected),
    ].map((s) => cloneSymbol(s))
    // Snapshotted before applyAndDraw mutates the selection below: gradient-follow needs the
    // moving target's PRE-transform center (same reference point the drag preview used), not
    // its already-resized bounds, or the committed shape would snap to a different form than
    // what was just shown while dragging.
    const preTransformBoundsById = new Map<string, TOBB>()
    this.model.symbolsSelected.forEach((s) => {
      // Same selectAll() gap as start()'s bounding box — an unregistered symbol has no snapshot
      // taken, so updateAnchoredEdges below leaves it untouched rather than throwing.
      if (!symbolRegistry.has(s.type)) {
        return
      }
      const bounds = SymbolGeometry.boundsOf(s)
      preTransformBoundsById.set(s.id, { ...bounds, center: { ...bounds.center } })
    })
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
    const movedDecorators = this.applyAndDraw(this.model.symbolsSelected, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(this.model.symbolsSelected, matrix)
    const { oldSymbols: anchoredOldSymbols, newSymbols: anchoredNewSymbols } =
      this.canvas.connector.updateAnchoredEdges(
        this.model.symbolsSelected.map((s) => s.id),
        matrix,
        preTransformBoundsById
      )
    const strokesFromSymbols = this.canvas.extractStrokesFromSymbols(this.model.symbolsSelected)
    await Promise.all([
      this.canvas.client.transformScale(
        [...new Set([...strokesFromSymbols.map((s) => s.id), ...followedStrokeIds])],
        scaleX,
        scaleY,
        this.transformOrigin.x,
        this.transformOrigin.y
      ),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ])
    const changes: TIIHistoryChanges = {}
    this.recordTransformed(changes, [...oldSymbols, ...movedDecorators])
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, and
    // gradient-followed raw strokes are reshaped non-uniformly. They join the same `updated` pair
    // as the resized selection — appended, not assigned, or one of the two sets would be lost.
    appendUpdated(
      changes,
      anchoredOldSymbols.map((before, index) => ({ before, after: anchoredNewSymbols[index] }))
    )
    this.canvas.history.push(changes)
    this.finalizeTransform()
  }
}
