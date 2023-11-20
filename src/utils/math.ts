import { TPoint, TPointer } from "./types"

/**
 * @group Utils
 */
export function computeDistance(p1: TPoint, p2: TPoint): number
{
  const distance = Math.hypot(p2.y - p1.y, p2.x - p1.x)
  return isNaN(distance) ? 0 : distance
}

/**
 * @group Utils
 */
export function computeAngleAxeRadian(begin: TPoint, end: TPoint): number
{
  return Math.atan2(end.y - begin.y, end.x - begin.x)
}

/**
 * @group Utils
 */
export function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[]
{
  const radius = point.p * width
  return [
    {
      x: (point.x - (Math.sin(angle) * radius)),
      y: (point.y + (Math.cos(angle) * radius))
    },
    {
      x: (point.x + (Math.sin(angle) * radius)),
      y: (point.y - (Math.cos(angle) * radius))
    }
  ]
}

/**
 * @group Utils
 */
export function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer
{
  return {
    x: ((point2.x + point1.x) / 2),
    y: ((point2.y + point1.y) / 2),
    p: ((point2.p + point1.p) / 2),
    t: ((point2.t + point1.t) / 2)
  }
}
