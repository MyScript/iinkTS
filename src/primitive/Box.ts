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
export type TBox = {
  x: number
  y: number
  width: number
  height: number
  xMin: number
  xMid: number
  xMax: number
  yMin: number
  yMid: number
  yMax: number
}

/**
 * @group Primitive
 */
export class Box implements TBox
{
  x: number
  y: number
  width: number
  height: number

  constructor(boundindBox: TBoundingBox)
  {
    if (boundindBox.width < 0) throw new Error("width must be positive")
    if (boundindBox.height < 0) throw new Error("height must be positive")
    this.height = boundindBox.height
    this.width = boundindBox.width
    this.x = boundindBox.x
    this.y = boundindBox.y
  }

  static createFromBoxes(boxes: TBoundingBox[]): Box
  {
    if (!boxes?.length) {
      return new Box({ height: 0, width: 0, x: 0, y: 0 })
    }
    const x = Math.min(...boxes.map(b => b.x))
    const width = Math.max(...boxes.map(b => b.x + b.width)) - x
    const y = Math.min(...boxes.map(b => b.y))
    const height = Math.max(...boxes.map(b => b.y + b.height)) - y
    return new Box({ x, y, width, height })
  }

  static createFromPoints(points: TPoint[]): Box
  {
    if (!points?.length) {
      return new Box({ height: 0, width: 0, x: 0, y: 0 })
    }
    const x = Math.min(...points.map(p => p.x))
    const width = Math.max(...points.map(p => p.x)) - x
    const y = Math.min(...points.map(p => p.y))
    const height = Math.max(...points.map(p => p.y)) - y
    return new Box({ x, y, width, height })
  }

  static getCorners(box: TBoundingBox): TPoint[]
  {
    return [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      { x: box.x + box.width, y: box.y + box.height },
      { x: box.x, y: box.y + box.height }
    ]
  }

  static getCenter(box: TBoundingBox): TPoint
  {
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  static getSides(box: TBoundingBox): TSegment[]
  {
    const vertices = Box.getCorners(box)
    return vertices.map((p, i) =>
    {
      if (i === 3) {
        return { p1: vertices[0], p2: p }
      }
      else {
        return { p1: p, p2: vertices[i + 1] }
      }
    })
  }

  static isContained(box: TBoundingBox, wrapper: TBoundingBox): boolean
  {
    return isBetween(box.x, wrapper.x, wrapper.x + wrapper.width) &&
      isBetween(box.x + box.width, wrapper.x, wrapper.x + wrapper.width) &&
      isBetween(box.y, wrapper.y, wrapper.y + wrapper.height) &&
      isBetween(box.y + box.height, wrapper.y, wrapper.y + wrapper.height)
  }

  static containsPoint(box: TBoundingBox, point: TPoint): boolean
  {
    return isBetween(point.x, box.x, box.x + box.width) &&
      isBetween(point.y, box.y, box.y + box.height)
  }

  static contains(box: TBoundingBox, child: TBoundingBox): boolean
  {
    return isBetween(child.x, box.x, box.x + box.width) &&
      isBetween(child.x + child.width, box.x, box.x + box.width) &&
      isBetween(child.y, box.y, box.y + box.height) &&
      isBetween(child.y + child.height, box.y, box.y + box.height)
  }

  static overlaps(box1: TBoundingBox, box2: TBoundingBox): boolean
  {
    if (box1.x > box2.x + box2.width) return false
    if (box1.x + box1.width < box2.x) return false
    if (box1.y > box2.y + box2.height) return false
    if (box1.y + box1.height < box2.y) return false

    return true
  }

  get xMin(): number
  {
    return this.x
  }

  get xMid(): number
  {
    return this.x + this.width / 2
  }

  get xMax(): number
  {
    return this.x + this.width
  }

  get yMin(): number
  {
    return this.y
  }

  get yMid(): number
  {
    return this.y + this.height / 2
  }

  get yMax(): number
  {
    return this.y + this.height
  }

  get corners(): TPoint[]
  {
    return Box.getCorners(this)
  }

  get center(): TPoint
  {
    return Box.getCenter(this)
  }

  get snapPoints(): TPoint[]
  {
    return [
      ...this.corners,
      this.center
    ]
  }

  isContained(wrapper: TBoundingBox): boolean
  {
    return Box.isContained(this, wrapper)
  }

  contains(child: TBoundingBox): boolean
  {
    return Box.contains(this, child)
  }

  containsPoint(point: TPoint): boolean
  {
    return Box.containsPoint(this, point)
  }

  overlaps(boundaries: TBoundingBox): boolean
  {
    return Box.overlaps(this, boundaries)
  }
}
