import type { TInteractiveInkCanvas } from "@/canvas"
import type { TPoint } from "@/core"
import {
  BoxOps,
  computeAngleRadian,
  convertDegreeToRadian,
  convertRadianToDegree,
  MatrixTransform,
  type TOBB,
  TWO_PI,
} from "@/core"
import type { TIIHistoryChanges } from "@/history"
import { appendUpdated } from "@/history"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"
import { SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

/**
 * @group Manager
 */
export class IIRotationManager extends IIAbstractTransformManager {
  protected managerName = "IIRotationManager"
  center!: TPoint
  origin!: TPoint

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  /**
   * One hook, like the other two managers'. `center` is passed here rather than read
   * off `this` inside the util, which is what retired its definite-assignment assertion.
   */
  protected applyThroughUtil(symbol: TSymbol, matrix: MatrixTransform): void {
    symbolRegistry.getUtilFor(symbol).rotate(symbol, { matrix })
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Rotating")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    // selectAll() populates symbolsSelected with no registry check ahead of it (see
    // IISelectionManager.createInteractElementsGroup) — a symbol type missing its util must not
    // abort starting the rotation, so it's excluded from the bounding box, same silent-skip
    // precedent as that file.
    const registeredSymbols = this.model.symbolsSelected.filter((s) => symbolRegistry.has(s.type))
    const boundingBox = BoxOps.createFromPoints(registeredSymbols.flatMap((s) => SymbolGeometry.verticesOf(s)))

    this.center = {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2,
    }
    this.origin = origin
  }

  continue(point: TPoint): number {
    this.logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = Math.round(convertRadianToDegree(computeAngleRadian(this.origin, this.center, point)))

    angleDegree = this.canvas.snaps.snapRotation(angleDegree)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }

    const angleRad = convertDegreeToRadian(angleDegree)
    // Built before the preview, and carrying `center` explicitly, so one matrix serves both the
    // preview and the connector below — and so the preview needs no `transform-origin`.
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)

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
    return angleDegree
  }

  async end(point: TPoint): Promise<void> {
    this.logger.info("end", { point })
    // Gesture is over now, synchronously - IISynchronizerManager's write-idle gate polls this
    // same flag, so leaving it set until the backend round-trip below resolves would delay
    // (or, if a sync is already waiting on it, deadlock) the debounced synchronize().
    this.canvas.endOperation("Rotating")
    const angleDegree = this.continue(point)
    const angleRad = convertDegreeToRadian(angleDegree) % TWO_PI
    // Queried before anything is mutated: the pre-convert edge strokes that will rigidly follow
    // this rotation need a pre-transform snapshot in history, like the selection itself. Gradient-
    // followed strokes are excluded — their shift isn't a uniform rotation, so they get their own
    // pre-mutation snapshot via `updated` below instead, like the anchored converted edges.
    const followedStrokeIds = this.canvas.connector.getRigidFollowedStrokeIds(
      this.model.symbolsSelected.map((s) => s.id)
    )
    const oldSymbols = [
      ...this.model.symbolsSelected,
      ...this.resolveFollowedSymbols(followedStrokeIds, this.model.symbolsSelected),
    ].map((s) => cloneSymbol(s))
    const matrix = MatrixTransform.identity().rotate(angleRad, this.center)
    const preTransformBoundsById = new Map<string, TOBB>()
    this.model.symbolsSelected.forEach((s) => {
      // Same selectAll() gap as start()'s bounding box — an unregistered symbol has no snapshot
      // taken, so updateAnchoredEdges below leaves it untouched rather than throwing.
      if (!symbolRegistry.has(s.type)) {
        return
      }
      const bounds = SymbolGeometry.boundsOf(s)
      preTransformBoundsById.set(s.id, {
        ...bounds,
        center: { ...bounds.center },
      })
    })
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
      this.canvas.client.transformRotate(
        [...new Set([...strokesFromSymbols.map((s) => s.id), ...followedStrokeIds])],
        angleRad,
        this.center.x,
        this.center.y
      ),
      ...this.replaceGradientFollowedStrokes(anchoredOldSymbols, anchoredNewSymbols),
    ])
    const changes: TIIHistoryChanges = {}
    this.recordTransformed(changes, [...oldSymbols, ...movedDecorators])
    // Converted Line/PolyEdge/Arc anchors are recomputed from the target's new bounds, and
    // gradient-followed raw strokes are reshaped non-uniformly. They join the same `updated` pair
    // as the rotated selection — appended, not assigned, or one of the two sets would be lost.
    appendUpdated(
      changes,
      anchoredOldSymbols.map((before, index) => ({ before, after: anchoredNewSymbols[index] }))
    )
    this.canvas.history.push(changes)
    this.finalizeTransform()
  }
}
