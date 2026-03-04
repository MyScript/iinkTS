import { TPoint } from "../../symbol"

/**
 * @group Renderer
 * @summary Shared geometry utility functions for renderers
 *
 * Common mathematical and geometric helper functions used by both
 * Canvas and SVG renderers for geometric calculations.
 */

/**
 * Calculate rotation angle for ellipse arc
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number
{
  let returnedAngle = ((angle + Math.PI) % (Math.PI * 2)) - Math.PI
  if (returnedAngle < -Math.PI) {
    returnedAngle += Math.PI * 2
  }
  return returnedAngle
}

/**
 * Calculate ellipse arc points
 * @param centerPoint - Center of the ellipse
 * @param maxRadius - Maximum radius (semi-major axis)
 * @param minRadius - Minimum radius (semi-minor axis)
 * @param orientation - Rotation of the ellipse
 * @param startAngle - Starting angle
 * @param sweepAngle - Sweep angle
 * @param angleStep - Step size for calculations
 * @returns Array of points along the ellipse arc
 */
export function calculateEllipseArcPoints(
  centerPoint: TPoint,
  maxRadius: number,
  minRadius: number,
  orientation: number,
  startAngle: number,
  sweepAngle: number,
  angleStep: number = 0.02
): TPoint[]
{
  const z1 = Math.cos(orientation) * maxRadius
  const z2 = Math.cos(orientation) * minRadius
  const z3 = Math.sin(orientation) * maxRadius
  const z4 = Math.sin(orientation) * minRadius
  const n = Math.floor(Math.abs(sweepAngle) / angleStep)
  const points: TPoint[] = []

  for (let i = 0; i <= n; i++) {
    const angle = startAngle + ((i / n) * sweepAngle)
    const alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius)
    const cosAlpha = Math.cos(alpha)
    const sinAlpha = Math.sin(alpha)
    const x = (centerPoint.x + (z1 * cosAlpha)) - (z4 * sinAlpha)
    const y = (centerPoint.y + (z2 * sinAlpha)) + (z3 * cosAlpha)
    points.push({ x, y })
  }

  return points
}

/**
 * Calculate bounding box from points
 */
export function getBoundingBox(points: TPoint[]): { minX: number, minY: number, maxX: number, maxY: number }
{
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  }

  let minX = points[0].x
  let minY = points[0].y
  let maxX = points[0].x
  let maxY = points[0].y

  for (const point of points) {
    if (point.x < minX) minX = point.x
    if (point.y < minY) minY = point.y
    if (point.x > maxX) maxX = point.x
    if (point.y > maxY) maxY = point.y
  }

  return { minX, minY, maxX, maxY }
}

/**
 * Check if point is inside polygon
 */
export function isPointInPolygon(point: TPoint, polygonPoints: TPoint[]): boolean
{
  let inside = false
  for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
    const xi = polygonPoints[i].x
    const yi = polygonPoints[i].y
    const xj = polygonPoints[j].x
    const yj = polygonPoints[j].y

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}
