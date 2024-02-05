import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, findIntersectionBetween2Segment, } from "../utils"
import { TPoint } from "./Point"
import { OIShape, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"

/**
 * @group Primitive
 */
export class OIShapeEllipse extends OIShape
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  center: TPoint
  radiusX: number
  radiusY: number

  constructor(style: TStyle, center: TPoint, radiusX: number, radiusY: number)
  {
    super(ShapeKind.Ellipse, style)
    this.#logger.debug("constructor", { style, center, radiusX, radiusY })
    this.center = center
    this.radiusX = radiusX
    this.radiusY = radiusY
  }

  get vertices(): TPoint[]
  {
    const points: TPoint[] = []
    const perimeter = 2 * Math.PI * Math.sqrt((Math.pow(this.radiusX, 2) + Math.pow(this.radiusY, 2)) / 2)
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    for (let i = 0; i < nbPoint; i++) {
      const rad = 2 * Math.PI * (i / nbPoint)
      const x = this.center.x + Math.cos(rad) * this.radiusX
      const y = this.center.y + Math.sin(rad) * this.radiusY
      points.push({ x, y })
    }

    return points
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(e => computeDistanceBetweenPointAndSegment(point, e) < SELECTION_MARGIN)
  }

  overlaps(box: TBoundingBox): boolean
  {

    return this.boundingBox.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  clone(): OIShapeEllipse
  {
    const clone = new OIShapeEllipse(structuredClone(this.style), structuredClone(this.center), this.radiusX, this.radiusY)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeEllipse
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    const radiusX = Math.abs(origin.x - target.x) / 2
    const radiusY = Math.abs(origin.y - target.y) / 2
    return new OIShapeEllipse(style, center, radiusX, radiusY)
  }

  static updateFromLine(ellipse: OIShapeEllipse, origin: TPoint, target: TPoint): OIShapeEllipse
  {
    ellipse.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    ellipse.radiusX = Math.abs(origin.x - target.x) / 2
    ellipse.radiusY = Math.abs(origin.y - target.y) / 2
    return ellipse
  }
}
