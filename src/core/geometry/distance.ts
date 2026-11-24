import type { TPoint } from "./Point"

/**
 * @group Core/Geometry
 */
export function computeDistance(p1: TPoint, p2: TPoint): number {
  const distance = Math.hypot(p2.y - p1.y, p2.x - p1.x)
  return isNaN(distance) ? 0 : distance
}

/**
 * @group Core/Geometry
 * @remarks Faster than computeDistance when comparing distances (avoids sqrt)
 */
export function computeDistanceSquared(p1: TPoint, p2: TPoint): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return dx * dx + dy * dy
}

/**
 * @group Core/Geometry
 */
export function getClosestPoints(points1: TPoint[], points2: TPoint[]): { p1: TPoint; p2: TPoint } {
  let minDistanceSquared = Number.MAX_SAFE_INTEGER
  let result = { p1: points1[0], p2: points2[0] }

  for (const _p1 of points1) {
    for (const _p2 of points2) {
      const dSquared = computeDistanceSquared(_p1, _p2)
      if (dSquared < minDistanceSquared) {
        minDistanceSquared = dSquared
        result = { p1: _p1, p2: _p2 }
      }
    }
  }
  return result
}

/**
 * @group Core/Geometry
 */
export function getClosestPoint(points: TPoint[], point: TPoint): { point?: TPoint; index: number } {
  let minDistanceSquared = Number.MAX_SAFE_INTEGER
  let closest: TPoint | undefined
  let index = -1

  for (let i = 0; i < points.length; i++) {
    const dSquared = computeDistanceSquared(points[i], point)
    if (dSquared < minDistanceSquared) {
      minDistanceSquared = dSquared
      closest = points[i]
      index = i
    }
  }
  return { point: closest, index }
}
