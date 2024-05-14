import { TPoint, TPointer } from "../primitive"

/**
 * @group Utils
 */
export function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[]
{
  const radius = point.p * width
  return [
    {
      x: +(point.x - (Math.sin(angle) * radius)).toFixed(3),
      y: +(point.y + (Math.cos(angle) * radius)).toFixed(3)
    },
    {
      x: +(point.x + (Math.sin(angle) * radius)).toFixed(3),
      y: +(point.y - (Math.cos(angle) * radius)).toFixed(3),
    }
  ]
}

/**
 * @group Utils
 */
export function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer
{
  return {
    x: +((point2.x + point1.x) / 2).toFixed(3),
    y: +((point2.y + point1.y) / 2).toFixed(3),
    p: +((point2.p + point1.p) / 2).toFixed(3),
    t: +((point2.t + point1.t) / 2).toFixed(3),
  }
}
