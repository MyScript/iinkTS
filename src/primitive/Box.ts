import { SELECTION_MARGIN } from "../Constants"
import { isBetween } from "../utils"
import { TPoint, TSegment } from "./Point"

/**
 * @group Primitive
 */
export type TBoundingBox = {
  x: number,
  y: number,
  width: number,
  height: number
}

/**
 * @group Primitive
 */
export class Box implements TBoundingBox
{
  x: number
  y: number
  width: number
  height: number

  constructor(x: number, y: number, width: number, height: number)
  {
    if (width < 0) throw new Error("width must be positive")
    if (height < 0) throw new Error("height must be positive")
    this.height = height
    this.width = width
    this.x = x
    this.y = y
  }

  static createFromBoxes(boxes: TBoundingBox[]): Box
  {
    if (!boxes?.length) {
      return new Box(0, 0, 0, 0)
    }
    const xMin = Math.min(...boxes.map(b => b.x))
    const width = Math.max(...boxes.map(b => b.x + b.width)) - xMin
    const yMin = Math.min(...boxes.map(b => b.y))
    const height = Math.max(...boxes.map(b => b.y + b.height)) - yMin
    return new Box(xMin, yMin, width, height)
  }

  static createFromPoints(points: TPoint[]): Box
  {
    if (!points?.length) {
      return new Box(0, 0, 0, 0)
    }
    const x = Math.min(...points.map(p => p.x))
    const width = Math.max(...points.map(p => p.x)) - x
    const y = Math.min(...points.map(p => p.y))
    const height = Math.max(...points.map(p => p.y)) - y
    return new Box(x, y, width, height)
  }

  static getEdges(box: TBoundingBox): TSegment[]
  {
    return [
      { p1: { x: box.x, y: box.y }, p2: { x: box.x + box.width, y: box.y }},
      { p1: { x: box.x + box.width, y: box.y }, p2: { x: box.x + box.width, y: box.y + box.height }},
      { p1: { x: box.x + box.width, y: box.y + box.height }, p2: { x: box.x, y: box.y + box.height }},
      { p1: { x: box.x, y: box.y + box.height }, p2: { x: box.x, y: box.y }},
    ]
  }

  get xMin(): number
  {
    return this.x
  }

  get yMin(): number
  {
    return this.y
  }

  get xMax(): number
  {
    return this.x + this.width
  }

  get yMax(): number
  {
    return this.y + this.height
  }

  isWrap(boundaries: TBoundingBox): boolean
  {
    return isBetween(this.xMin, boundaries.x, boundaries.x + boundaries.width) &&
      isBetween(this.xMax, boundaries.x, boundaries.x + boundaries.width) &&
      isBetween(this.yMin, boundaries.y, boundaries.y + boundaries.height) &&
      isBetween(this.yMax, boundaries.y, boundaries.y + boundaries.height)
  }

  isOverlapping(boundaries: TBoundingBox) : boolean
  {
    if (this.xMin > boundaries.x + boundaries.width + SELECTION_MARGIN) return false
    if (this.xMax < boundaries.x - SELECTION_MARGIN) return false
    if (this.yMin > boundaries.y + boundaries.height + SELECTION_MARGIN) return false
    if (this.yMax < boundaries.y - SELECTION_MARGIN) return false

    return true
  }
}
