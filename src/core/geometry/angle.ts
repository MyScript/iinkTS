import type { TPoint } from "./Point"

/**
 * @group Core/Geometry
 */
export function computeAngleAxeRadian(begin: TPoint, end: TPoint): number {
  return Math.atan2(end.y - begin.y, end.x - begin.x)
}

/**
 * @group Core/Geometry
 */
export function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number {
  const p1c = Math.hypot(center.x - p1.x, center.y - p1.y)
  const p2c = Math.hypot(center.x - p2.x, center.y - p2.y)
  const p1p2 = Math.hypot(p2.x - p1.x, p2.y - p1.y)
  return Math.acos((p2c * p2c + p1c * p1c - p1p2 * p1p2) / (2 * p2c * p1c))
}

/**
 * @group Core/Geometry
 */
export function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const cos = Math.cos(radian)
  const sin = Math.sin(radian)
  return {
    x: +(center.x + cos * dx - sin * dy).toFixed(3),
    y: +(center.y + sin * dx + cos * dy).toFixed(3),
  }
}
