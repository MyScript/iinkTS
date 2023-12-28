import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, isBetween } from "../utils"
import { TPoint, TSegment } from "./Point"
import { TOISymbol } from "./Symbol"
import { AbstracOIShape, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"

/**
 * @group Primitive
 */
export abstract class OIShapePolygon extends AbstracOIShape implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  points: TPoint[]

  constructor(style: TStyle, points: TPoint[], shapekind: ShapeKind)
  {
    super(shapekind, style)
    this.#logger.debug("constructor", { style, points, shapekind })
    this.points = points
  }

  get boundingBox(): Box
  {
    return Box.createFromPoints(this.points)
  }

  get vertices(): TPoint[]
  {
    return this.points
  }

  isCloseToPoint(point: TPoint): boolean
  {
    const segments: TSegment[] = this.points.map((p, i) => {
      if (i === this.points.length - 1) {
        return { p1: this.points[0], p2: p }
      }
      else {
        return { p1: p, p2: this.points[i + 1] }
      }
    })

    return segments.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  isPartiallyOrTotallyWrapped(box: TBoundingBox): boolean
  {
    return this.boundingBox.isWrap(box) ||
      this.vertices.some(v => isBetween(v.x, box.x, box.x + box.width) && isBetween(v.y, box.y, box.y + box.height))
  }

  abstract getClone(): OIShapePolygon
}

/**
 * @group Primitive
 */
export class OIShapeTriangle extends OIShapePolygon implements TOISymbol
{
  constructor(style: TStyle, points: TPoint[])
  {
    super(style, points, ShapeKind.Triangle)
  }

  getClone(): OIShapeTriangle
  {
    const clone = new OIShapeTriangle(structuredClone(this.style), structuredClone(this.points))
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeTriangle
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return new OIShapeTriangle(style, points)
  }

  static updateFromLine(triangle: OIShapeTriangle, origin: TPoint, target: TPoint): OIShapeTriangle
  {
    triangle.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return triangle
  }
}

/**
 * @group Primitive
 */
export class OIShapeParallelogram extends OIShapePolygon implements TOISymbol
{
  constructor(style: TStyle, points: TPoint[])
  {
    super(style, points, ShapeKind.Parallelogram)
  }

  getClone(): OIShapeParallelogram
  {
    const clone = new OIShapeParallelogram(structuredClone(this.style), structuredClone(this.points))
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeParallelogram
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    return new OIShapeParallelogram(style, points)
  }

  static updateFromLine(parallelogram: OIShapeParallelogram, origin: TPoint, target: TPoint): OIShapeParallelogram
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    parallelogram.points = points
    return parallelogram
  }
}
