import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { ResizeDirection } from "@/Constants"
import type { TBox, TEdge, TMath, TPoint, TShape, TStroke, TText } from "@/symbol"
import { cloneSymbol, EdgeKind, isMath, isText, ShapeKind } from "@/symbol"
import { EdgeOps } from "@/symbol/edge/Edge"
import { MathOps } from "@/symbol/math/Math"
import { BoxOps } from "@/symbol/primitives/Box"
import { ShapeOps } from "@/symbol/shape/Shape"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import { TextOps } from "@/symbol/text/Text"
import { MatrixTransform } from "@/transform"

import { IIAbstractTransformManager } from "./AbstractTransformManager"

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
  protected transformName = "resize"
  direction!: ResizeDirection
  boundingBox!: TBox
  transformOrigin!: TPoint
  keepRatio = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
  }

  protected applyToStroke(stroke: TStroke, matrix: MatrixTransform): TStroke {
    this.logger.debug("applyToStroke", { stroke })
    this.applyMatrixToPoints(stroke.pointers, matrix)
    StrokeOps.updateBounds(stroke)
    return stroke
  }

  protected applyToShape(shape: TShape, matrix: MatrixTransform): TShape {
    this.logger.debug("applyToShape", { shape })
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        const cosPhi = Math.cos(shape.orientation)
        const sinPhi = Math.sin(shape.orientation)
        const scaleX = matrix.xx
        const scaleY = matrix.yy
        const ox = this.transformOrigin.x
        const oy = this.transformOrigin.y
        shape.center.x = +(
          shape.center.x +
          ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (shape.center.x - ox)
        ).toFixed(3)
        shape.center.y = +(
          shape.center.y +
          ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (shape.center.y - oy)
        ).toFixed(3)
        shape.radiusX = +Math.abs(shape.radiusX * (scaleX * cosPhi - scaleY * sinPhi)).toFixed(3)
        shape.radiusY = +Math.abs(shape.radiusY * (scaleX * sinPhi + scaleY * cosPhi)).toFixed(3)
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
      case ShapeKind.Circle: {
        shape.radius = +((shape.radius * (matrix.xx + matrix.yy)) / 2).toFixed(3)
        shape.center = matrix.applyToPoint(shape.center)
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
      case ShapeKind.Polygon: {
        this.applyMatrixToPoints(shape.points, matrix)
        ShapeOps.updateShapeDerivedFields(shape)
        return shape
      }
      default:
        throw new Error(`Can't apply resize on shape, kind unknown: ${JSON.stringify(shape)}`)
    }
  }

  protected applyToEdge(edge: TEdge, matrix: MatrixTransform): TEdge {
    this.logger.debug("applyToEdge", { edge })
    switch (edge.kind) {
      case EdgeKind.Arc: {
        const cosPhi = Math.cos(edge.phi)
        const sinPhi = Math.sin(edge.phi)
        const scaleX = matrix.xx
        const scaleY = matrix.yy
        const ox = this.transformOrigin.x
        const oy = this.transformOrigin.y
        edge.center.x = +(
          edge.center.x +
          ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (edge.center.x - ox)
        ).toFixed(3)
        edge.center.y = +(
          edge.center.y +
          ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (edge.center.y - oy)
        ).toFixed(3)
        edge.radiusX = +(edge.radiusX * Math.abs(scaleX * cosPhi + scaleY * sinPhi)).toFixed(3)
        edge.radiusY = +(edge.radiusY * Math.abs(scaleX * sinPhi + scaleY * cosPhi)).toFixed(3)
        if (scaleX < 0) {
          edge.startAngle = +(Math.PI - edge.startAngle).toFixed(3)
          edge.sweepAngle *= -1
        } else if (scaleY < 0) {
          edge.sweepAngle *= -1
        }
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.Line: {
        this.applyMatrixToPoints([edge.start, edge.end], matrix)
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      case EdgeKind.PolyEdge: {
        this.applyMatrixToPoints(edge.points, matrix)
        EdgeOps.updateEdgeDerivedFields(edge)
        return edge
      }
      default:
        throw new Error(`Can't apply resize on edge, kind unknown: ${JSON.stringify(edge)}`)
    }
  }

  private applyOnTypeset(symbol: TText | TMath, matrix: MatrixTransform): TText | TMath {
    const np = matrix.applyToPoint(symbol.point)
    symbol.point.x = +np.x.toFixed(3)
    symbol.point.y = +np.y.toFixed(3)
    const scale = (matrix.xx + matrix.yy) / 2
    if (isText(symbol)) {
      symbol.chars.forEach((c) => (c.fontSize = +(c.fontSize * scale).toFixed(3)))
    } else {
      symbol.elements.forEach((e) => (e.fontSize = +(e.fontSize * scale).toFixed(3)))
    }
    const newCenter = matrix.applyToPoint(symbol.bounds.center)
    symbol.bounds = {
      center: {
        x: +newCenter.x.toFixed(3),
        y: +newCenter.y.toFixed(3),
      },
      width: +(symbol.bounds.width * Math.abs(matrix.xx)).toFixed(3),
      height: +(symbol.bounds.height * Math.abs(matrix.yy)).toFixed(3),
      angle: 0,
    }
    if (isText(symbol)) {
      TextOps.updateDerivedFields(symbol)
    } else {
      MathOps.updateDerivedFields(symbol)
    }
    return symbol
  }

  protected applyOnText(text: TText, matrix: MatrixTransform): TText {
    return this.applyOnTypeset(text, matrix) as TText
  }

  protected applyOnMath(math: TMath, matrix: MatrixTransform): TMath {
    return this.applyOnTypeset(math, matrix) as TMath
  }

  scaleElement(id: string, sx: number, sy: number): void {
    this.logger.info("scaleElement", {
      id,
      sx,
      sy,
    })
    this.canvas.renderer.setAttribute(id, "transform", `scale(${sx},${sy})`)
  }

  start(target: Element, origin: TPoint): void {
    this.logger.info("start", { target })
    // Reflects "working" on the state badge as soon as the drag starts. Also the signal
    // IISynchronizerManager's write-idle gate polls to avoid contending with an in-progress
    // gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Resizing")
    this.interactElementsGroup = this.resolveInteractGroup(target)
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    this.keepRatio = this.model.symbolsSelected.some(
      (s) => isText(s) || isMath(s) || (ShapeOps.isShape(s) && ShapeOps.isCircleShape(s))
    )

    this.transformOrigin = origin
    this.boundingBox = BoxOps.createFromPoints(this.model.symbolsSelected.flatMap((s) => s.vertices))
    this.setTransformOrigin(this.interactElementsGroup!.id, this.transformOrigin.x, this.transformOrigin.y)
    this.model.symbolsSelected.forEach((s) => {
      this.setTransformOrigin(s.id, this.transformOrigin.x, this.transformOrigin.y)
    })
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
    this.scaleElement(this.interactElementsGroup.id, scaleX, scaleY)
    this.model.symbolsSelected.forEach((s) => {
      this.scaleElement(s.id, scaleX, scaleY)
    })
    this.getGhostStrokeIdsForSelectedMath(this.model.symbolsSelected).forEach((id) => {
      this.scaleElement(id, scaleX, scaleY)
    })
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
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
    const oldSymbols = this.model.symbolsSelected.map((s) => cloneSymbol(s))
    const matrix = MatrixTransform.identity().scale(scaleX, scaleY, this.transformOrigin)
    this.applyAndDraw(this.model.symbolsSelected, matrix)
    this.applyTransformToGhostStrokesForSelectedMath(this.model.symbolsSelected, matrix)
    this.canvas.connector.updateAnchoredEdges(this.model.symbolsSelected.map((s) => s.id))
    const strokesFromSymbols = this.canvas.extractStrokesFromSymbols(this.model.symbolsSelected)
    await this.canvas.client.transformScale(
      strokesFromSymbols.map((s) => s.id),
      scaleX,
      scaleY,
      this.transformOrigin.x,
      this.transformOrigin.y
    )
    this.canvas.history.push(this.model, {
      scale: [
        {
          symbols: oldSymbols,
          origin: { ...this.transformOrigin },
          scaleX,
          scaleY,
        },
      ],
    })
    this.finalizeTransform()
  }
}
