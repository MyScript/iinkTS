import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { TPoint } from "./Point"
import { OIShape, ShapeKind } from "./OIShape"
import { Box } from "./Box"

/**
 * @group Primitive
 */
export class OIShapePolygon extends OIShape
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
    return this.points
  }

  clone(): OIShapePolygon
  {
    const clone = new OIShapePolygon(structuredClone(this.style), structuredClone(this.points), this.kind)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}

/**
 * @group Primitive
 */
export class OIShapeTriangle extends OIShapePolygon
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
export class OIShapeParallelogram extends OIShapePolygon
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
export class OIShapeRectangle extends OIShapePolygon
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
