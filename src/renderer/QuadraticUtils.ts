import { TPartialXYPoint, TPoint } from "../@types/renderer/Point"

export function computeLinksPoints(point: TPoint, angle: number, width: number): TPartialXYPoint[]
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

export function computeMiddlePoint(point1: TPoint, point2: TPoint): TPoint
{
  return {
    x: ((point2.x + point1.x) / 2),
    y: ((point2.y + point1.y) / 2),
    p: ((point2.p + point1.p) / 2),
    t: ((point2.t + point1.t) / 2)
  }
}

export function computeAxeAngle(begin: TPoint, end: TPoint): number
{
  return Math.atan2(end.y - begin.y, end.x - begin.x)
}
