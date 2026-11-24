import type { TPoint } from "./Point"

/**
 * @group Core/Geometry
 */
export function computePointOnEllipse(
  center: TPoint,
  radiusX: number,
  radiusY: number,
  phi: number,
  theta: number
): TPoint {
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)

  const M = Math.abs(radiusX) * Math.cos(theta)
  const N = Math.abs(radiusY) * Math.sin(theta)

  return {
    x: +(center.x + cosPhi * M - sinPhi * N).toFixed(3),
    y: +(center.y + sinPhi * M + cosPhi * N).toFixed(3),
  }
}

/**
 * Inverse of computePointOnEllipse: compute angle θ such that the point on the ellipse
 * nearest to the given position corresponds to that angle. Projects the point onto the ellipse.
 * @group Core/Geometry
 */
export function computeAngleFromPointOnEllipse(
  center: TPoint,
  radiusX: number,
  radiusY: number,
  phi: number,
  point: TPoint
): number {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)
  const rotatedX = cosPhi * dx + sinPhi * dy
  const rotatedY = -sinPhi * dx + cosPhi * dy
  const rx = radiusX || 1
  const ry = radiusY || 1
  return Math.atan2(rotatedY / ry, rotatedX / rx)
}

/**
 * @group Core/Geometry
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
export function computeEllipseArcPoints(
  centerPoint: TPoint,
  maxRadius: number,
  minRadius: number,
  orientation: number,
  startAngle: number,
  sweepAngle: number,
  angleStep: number = 0.02
): TPoint[] {
  const z1 = Math.cos(orientation) * maxRadius
  const z2 = Math.cos(orientation) * minRadius
  const z3 = Math.sin(orientation) * maxRadius
  const z4 = Math.sin(orientation) * minRadius
  const n = Math.floor(Math.abs(sweepAngle) / angleStep)
  const points: TPoint[] = []

  for (let i = 0; i <= n; i++) {
    const angle = startAngle + (i / n) * sweepAngle
    const alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius)
    const cosAlpha = Math.cos(alpha)
    const sinAlpha = Math.sin(alpha)
    const x = centerPoint.x + z1 * cosAlpha - z4 * sinAlpha
    const y = centerPoint.y + z2 * sinAlpha + z3 * cosAlpha
    points.push({ x, y })
  }

  return points
}
