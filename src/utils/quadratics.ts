import { TPoint, TPointer } from "../primitive"

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
