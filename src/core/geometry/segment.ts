import { computeDistance } from "./distance"
import type { TPoint, TSegment } from "./Point"

/**
 * @group Core/Geometry
 */
export function scalaire(v1: TPoint, v2: TPoint): number {
  return v1.x * v2.x + v1.y * v2.y
}

/**
 * @group Core/Geometry
 */
export function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint = 1): TPoint[] {
  const points: TPoint[] = []
  const globalDistance = computeDistance(p1, p2)
  let spaceWithP1 = spaceBetweenPoint
  while (spaceWithP1 < globalDistance) {
    const p = {
      x: p1.x + (spaceWithP1 * (p2.x - p1.x)) / globalDistance,
      y: p1.y + (spaceWithP1 * (p2.y - p1.y)) / globalDistance,
    }
    points.push(p)
    spaceWithP1 += spaceBetweenPoint
  }
  return points
}

/**
 * @group Core/Geometry
 */
export function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint {
  const vectP1P = {
    x: p.x - seg.p1.x,
    y: p.y - seg.p1.y,
  }
  const vectP1P2 = {
    x: seg.p2.x - seg.p1.x,
    y: seg.p2.y - seg.p1.y,
  }
  if (vectP1P2.x === 0 && vectP1P2.y === 0) {
    return seg.p1
  }
  const scalaireP1P_P1P2 = scalaire(vectP1P, vectP1P2)
  const scalaireP1P2_P1P2 = scalaire(vectP1P2, vectP1P2)

  const t = Math.min(1, Math.max(0, scalaireP1P_P1P2 / scalaireP1P2_P1P2))
  return {
    x: seg.p1.x + vectP1P2.x * t,
    y: seg.p1.y + vectP1P2.y * t,
  }
}

/**
 * @group Core/Geometry
 */
export function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number {
  return computeDistance(p, computeNearestPointOnSegment(p, seg))
}
