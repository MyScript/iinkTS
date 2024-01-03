import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, findIntersectionBetween2Segment } from "../utils"
import { TPoint, TSegment } from "./Point"
import { TOISymbol } from "./Symbol"
import { AbstracOIShape, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"
import { MatrixTransform } from "../transform"

/**
 * @group Primitive
 */
export class OIShapePolygon extends AbstracOIShape implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  points: TPoint[]

  constructor(style: TStyle, points: TPoint[], shapekind: ShapeKind)
  {
    super(shapekind, style)
    this.#logger.debug("constructor", { style, points, shapekind })
    this.points = points
  }

  get vertices(): TPoint[]
  {
    return this.points.map(p => MatrixTransform.applyToPoint(this.transform, p))
  }

  get edges(): TSegment[]
  {
    return this.vertices.map((p, i) => {
      if (i === this.vertices.length - 1) {
        return { p1: this.vertices[0], p2: p }
      }
      else {
        return { p1: p, p2: this.vertices[i + 1] }
      }
    })
  }

  get boundingBox(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  isOverlapping(box: TBoundingBox): boolean
  {
    return this.boundingBox.isWrap(box) ||
      this.edges.some(e1 => Box.getEdges(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  getClone(): OIShapePolygon
  {
    const clone = new OIShapePolygon(structuredClone(this.style), structuredClone(this.points), this.kind)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.transform = this.transform.getClone()
    return clone
  }
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
    parallelogram.modificationDate = Date.now()
    return parallelogram
  }
}

/**
 * @group Primitive
 */
export class OIShapeRectangle extends OIShapePolygon implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)

  constructor(style: TStyle, points: TPoint[])
  {
    super(style, points, ShapeKind.Rectangle)
    this.#logger.debug("constructor", { style, points })
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeRectangle
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMin, y: box.yMin },
      { x: box.xMax, y: box.yMin },
      { x: box.xMax, y: box.yMax },
      { x: box.xMin, y: box.yMax },
    ]
    return new OIShapeRectangle(style, points)
  }

  static updateFromLine(rect: OIShapeRectangle, origin: TPoint, target: TPoint): OIShapeRectangle
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMin, y: box.yMin },
      { x: box.xMax, y: box.yMin },
      { x: box.xMax, y: box.yMax },
      { x: box.xMin, y: box.yMax },
    ]
    rect.points = points
    rect.modificationDate = Date.now()
    return rect
  }
}
