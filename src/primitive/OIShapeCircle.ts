import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { computeDistance, findIntersectBetweenSegmentAndCircle, rotatePoint } from "../utils"
import { TPoint, TSegment } from "./Point"
import { TOISymbol } from "./Symbol"
import { AbstracOIShape, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"
import { MatrixTransform } from "../transform"

/**
 * @group Primitive
 */
export class OIShapeCircle extends AbstracOIShape implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  center: TPoint
  radius: number

  constructor(style: TStyle, center: TPoint, radius: number)
  {
    super(ShapeKind.Circle, style)
    this.#logger.debug("constructor", { style, center, radius })
    this.center = center
    this.radius = radius
  }

  get vertices(): TPoint[]
  {
    const firstPoint: TPoint = {
      x: this.center.x,
      y: this.radius + this.center.y
    }
    const perimeter = 2 * Math.PI * this.radius
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const points: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const rad = 2 * Math.PI * (i / nbPoint)
      points.push(rotatePoint(this.center, firstPoint, rad))
    }
    return points.map(p => MatrixTransform.applyToPoint(this.transform, p))
  }

  get boundingBox(): Box
  {
    return new Box(this.center.x - this.radius, this.center.y - this.radius, this.radius * 2, this.radius * 2)
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return Math.abs(computeDistance(point, this.center) - this.radius) < SELECTION_MARGIN
  }

  isOverlapping(box: TBoundingBox): boolean
  {
    const boxEdges: TSegment[] = [
      { p1: { x: box.x, y: box.y }, p2: { x: box.x + box.width, y: box.y } },
      { p1: { x: box.x + box.width, y: box.y }, p2: { x: box.x + box.width, y: box.y + box.height } },
      { p1: { x: box.x + box.width, y: box.y + box.height }, p2: { x: box.x, y: box.y + box.height } },
      { p1: { x: box.x, y: box.y + box.height }, p2: { x: box.x, y: box.y } },
    ]
    return this.boundingBox.isWrap(box) ||
      boxEdges.some(seg => findIntersectBetweenSegmentAndCircle(seg, this.center, this.radius).length)
  }

  getClone(): OIShapeCircle
  {
    const clone = new OIShapeCircle(structuredClone(this.style), structuredClone(this.center), this.radius)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.transform = this.transform.getClone()
    return clone
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeCircle
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }

    const radius = computeDistance(origin, target) / 2
    return new OIShapeCircle(style, center, radius)
  }

  static updateFromLine(circle: OIShapeCircle, origin: TPoint, target: TPoint): OIShapeCircle
  {
    circle.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    circle.radius = computeDistance(origin, target) / 2
    return circle
  }
}
