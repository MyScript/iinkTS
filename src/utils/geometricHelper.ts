import { TPoint } from "../@types/geometry"

export function computeDistance(p1: TPoint, p2: TPoint): number
{
  const distance = Math.hypot(p2.y - p1.y, p2.x - p1.x)
  return isNaN(distance) ? 0 : distance
}
