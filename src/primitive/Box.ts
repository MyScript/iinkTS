import { TPoint } from "./Point"

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
export type TBoxLimit = {
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number
}

export class Box implements TBoundingBox, TBoxLimit
{
  x: number
  y: number
  width: number
  height: number

  constructor(x: number, y: number, width: number, height: number)
  {
    this.height = height
    this.width = width
    this.x = x
    this.y = y
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
}
