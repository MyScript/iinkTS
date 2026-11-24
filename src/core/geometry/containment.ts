import { isBetween } from "../math"
import type { TBox } from "./Box"
import type { TPoint } from "./Point"

/**
 * @group Core/Geometry
 */
export function isPointInsideBox(point: TPoint, box: TBox): boolean {
  return isBetween(point.x, box.x, box.x + box.width) && isBetween(point.y, box.y, box.y + box.height)
}

/**
 * @group Core/Geometry
 */
export function isPointInsidePolygon(point: TPoint, points: TPoint[]) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p1 = points[i]
    const p2 = points[j]
    const intersect =
      p1.y > point.y != p2.y > point.y && point.x < ((p2.x - p1.x) * (point.y - p1.y)) / (p2.y - p1.y) + p1.x
    if (intersect) {
      inside = !inside
    }
  }

  return inside
}
