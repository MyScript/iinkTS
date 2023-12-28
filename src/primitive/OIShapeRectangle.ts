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
export class OIShapeRectangle extends AbstracOIShape implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  x: number
  y: number
  height: number
  width: number

  constructor(style: TStyle, x: number, y: number, width: number, height: number)
  {
    super(ShapeKind.Rectangle, style)
    this.#logger.debug("constructor", { style, x, y, width, height })
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  get boundingBox(): Box
  {
    return new Box(this.x, this.y, this.width, this.height)
  }

  get vertices(): TPoint[]
  {
    return [
      { x: this.x, y: this.y },
      { x: this.x + this.width, y: this.y },
      { x: this.x + this.width, y: this.y + this.height },
      { x: this.x, y: this.y + this.height },
    ]
  }

  isCloseToPoint(point: TPoint): boolean
  {
    const segments: TSegment[] = [
      { p1: this.vertices[0], p2: this.vertices[1] },
      { p1: this.vertices[1], p2: this.vertices[2] },
      { p1: this.vertices[2], p2: this.vertices[3] },
      { p1: this.vertices[3], p2: this.vertices[0] },
    ]

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

  getClone(): OIShapeRectangle
  {
    const clone = new OIShapeRectangle(structuredClone(this.style), this.x, this.y, this.width, this.height)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  static createFromLine(style: TStyle, origin: TPoint, target: TPoint): OIShapeRectangle
  {
    const box = Box.createFromPoints([origin, target])
    return new OIShapeRectangle(style, box.x, box.y, box.width, box.height)
  }

  static updateFromLine(rect: OIShapeRectangle, origin: TPoint, target: TPoint): OIShapeRectangle
  {
    const box = Box.createFromPoints([origin, target])
    rect.x = box.x
    rect.y = box.y
    rect.width = box.width
    rect.height = box.height
    return rect
  }
}
