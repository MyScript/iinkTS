import { computeAngleAxeRadian } from "./angle"
import type { TPoint, TPointer } from "./Point"

/**
 * @group Core/Geometry
 */
export function computeLinksPointers(point: TPointer, angle: number, width: number): TPoint[] {
  const radius = point.p * width
  return [
    {
      x: +(point.x - Math.sin(angle) * radius).toFixed(3),
      y: +(point.y + Math.cos(angle) * radius).toFixed(3),
    },
    {
      x: +(point.x + Math.sin(angle) * radius).toFixed(3),
      y: +(point.y - Math.cos(angle) * radius).toFixed(3),
    },
  ]
}

/**
 * @group Core/Geometry
 */
export function computeMiddlePointer(point1: TPointer, point2: TPointer): TPointer {
  return {
    x: +((point2.x + point1.x) / 2).toFixed(3),
    y: +((point2.y + point1.y) / 2).toFixed(3),
    p: +((point2.p + point1.p) / 2).toFixed(3),
    dt: +((point2.dt + point1.dt) / 2).toFixed(3),
  }
}

/**
 * Outline points on either side of a straight segment, used to build both the
 * Canvas2D and SVG stroke-outline paths for a line segment.
 * @group Core/Geometry
 */
export function computeLineOutlinePoints(
  begin: TPointer,
  end: TPointer,
  width: number
): { linkPoints1: TPoint[]; linkPoints2: TPoint[] } {
  const angle = computeAngleAxeRadian(begin, end)
  return {
    linkPoints1: computeLinksPointers(begin, angle, width),
    linkPoints2: computeLinksPointers(end, angle, width),
  }
}

/**
 * Outline points on either side of a quadratic segment, used to build both the
 * Canvas2D and SVG stroke-outline paths for a quadratic curve.
 * @group Core/Geometry
 */
export function computeQuadraticOutlinePoints(
  begin: TPointer,
  end: TPointer,
  ctrl: TPointer,
  width: number
): { linkPoints1: TPoint[]; linkPoints2: TPoint[]; linkPoints3: TPoint[] } {
  return {
    linkPoints1: computeLinksPointers(begin, computeAngleAxeRadian(begin, ctrl), width),
    linkPoints2: computeLinksPointers(end, computeAngleAxeRadian(ctrl, end), width),
    linkPoints3: computeLinksPointers(ctrl, computeAngleAxeRadian(begin, end), width),
  }
}

/**
 * Fan of points closing a stroke's final end cap, used to build both the
 * Canvas2D and SVG stroke-outline paths for a stroke's last segment.
 * @group Core/Geometry
 */
export function computeFinalOutlinePoints(begin: TPointer, end: TPointer, width: number): TPoint[] {
  const ARCSPLIT = 6
  const angle = computeAngleAxeRadian(begin, end)
  const linkPoints = computeLinksPointers(end, angle, width)
  const points: TPoint[] = [linkPoints[0]]
  for (let i = 1; i <= ARCSPLIT; i++) {
    const newAngle = angle - (i * Math.PI) / ARCSPLIT
    points.push({
      x: end.x - end.p * width * Math.sin(newAngle),
      y: end.y + end.p * width * Math.cos(newAngle),
    })
  }
  return points
}
