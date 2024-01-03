import { TBoundingBox, TPoint, TSegment } from "../primitive"
import { isBetween } from "./math"

/**
 * @group Utils
 */
export function computeDistance(p1: TPoint, p2: TPoint): number
{
  const distance = Math.hypot(p2.y - p1.y, p2.x - p1.x)
  return isNaN(distance) ? 0 : distance
}

/**
 * @group Utils
 */
export function computeAngleAxeRadian(begin: TPoint, end: TPoint): number
{
  return Math.atan2(end.y - begin.y, end.x - begin.x)
}

/**
 * @group Utils
 */
export function createPointsOnSegment(p1: TPoint, p2: TPoint, spaceBetweenPoint = 1): TPoint[]
{
  const points: TPoint[] = []
  const globalDistance = computeDistance(p1, p2)
  let spaceWithP1 = spaceBetweenPoint
  while (spaceWithP1 < globalDistance) {
    const p = {
      x: p1.x + (spaceWithP1 * (p2.x - p1.x)) / globalDistance,
      y: p1.y + (spaceWithP1 * (p2.y - p1.y)) / globalDistance
    }
    points.push(p)
    spaceWithP1 += spaceBetweenPoint
  }
  return points
}

/**
 * @group Utils
 */
export function scalaire(v1: TPoint, v2: TPoint): number
{
  return v1.x * v2.x + v1.y * v2.y
}

/**
 * @group Utils
 */
export function computeNearestPointOnSegment(p: TPoint, seg: TSegment): TPoint
{
  const vectP1P = { x: p.x - seg.p1.x, y: p.y - seg.p1.y }
  const vectP1P2 = { x: seg.p2.x - seg.p1.x, y: seg.p2.y - seg.p1.y }
  const scalaireP1P_P1P2 = scalaire(vectP1P, vectP1P2)
  const scalaireP1P2_P1P2 = scalaire(vectP1P2, vectP1P2)

  const t = Math.min(1, Math.max(0, scalaireP1P_P1P2 / scalaireP1P2_P1P2))
  return { x: seg.p1.x + (vectP1P2.x * t), y: seg.p1.y + (vectP1P2.y * t) }
}

/**
 * @group Utils
 */
export function isPointInsideBox(point: TPoint, box: TBoundingBox): boolean
{
  return isBetween(point.x, box.x, box.x + box.width) && isBetween(point.y, box.y, box.y + box.height)
}

/**
 * @group Utils
 */
export function convertRadianToDegree(radian: number): number
{
  return radian * 180 / Math.PI
}

/**
 * @group Utils
 */
export function converDegreeToRadian(degree: number): number
{
  return degree * Math.PI / 180
}

/**
 * @group Utils
 */
export function rotatePoint(center: TPoint, point: TPoint, radian: number): TPoint
{
  const x = (Math.cos(radian) * (point.x - center.x)) + (Math.sin(radian) * (point.y - center.y)) + center.x
  const y = (Math.cos(radian) * (point.y - center.y)) - (Math.sin(radian) * (point.x - center.x)) + center.y
  return { x, y }
}

/**
 * @group Utils
 */
export function computeDistanceBetweenPointAndSegment(p: TPoint, seg: TSegment): number
{
  return computeDistance(p, computeNearestPointOnSegment(p, seg))
}

/**
 * @group Utils
 */
export function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined
{

  if (seg1.p1.x === seg2.p1.x && seg1.p1.y === seg2.p1.y) return seg1.p1
  if (seg1.p1.x === seg2.p2.x && seg1.p1.y === seg2.p2.y) return seg1.p1

  if (seg1.p2.x === seg2.p1.x && seg1.p2.y === seg2.p1.y) return seg1.p2
  if (seg1.p2.x === seg2.p2.x && seg1.p2.y === seg2.p2.y) return seg1.p2

  const S1dx = seg1.p2.x - seg1.p1.x
  const S1dy = seg1.p2.y - seg1.p1.y

  const S2dx = seg2.p2.x - seg2.p1.x
  const S2dy = seg2.p2.y - seg2.p1.y

  const S1S2dx = seg1.p1.x - seg2.p1.x
  const S1S2dy = seg1.p1.y - seg2.p1.y

  const ua_t = S2dx * S1S2dy - S2dy * S1S2dx
  const ub_t = S1dx * S1S2dy - S1dy * S1S2dx
  const u_b = S2dy * S1dx - S2dx * S1dy

  if (ua_t === 0 || ub_t === 0 || u_b === 0) return

  const ua = ua_t / u_b
  const ub = ub_t / u_b
  if (isBetween(ua, 0, 1) && isBetween(ub, 0, 1)) {
    return {
      x: seg1.p1.x + ua * S1dx,
      y: seg1.p1.y + ua * S1dy
    }
  }
  return
}

/**
 * @group Utils
 */
export function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[]
{
  const result: TPoint[] = []

  const a = Math.pow(seg.p2.x - seg.p1.x, 2) + Math.pow(seg.p2.y - seg.p1.y, 2)
  const b = 2 * ((seg.p2.x - seg.p1.x) * (seg.p1.x - c.x) + (seg.p2.y - seg.p1.y) * (seg.p1.y - c.y))
  const cc = Math.pow(c.x, 2) + Math.pow(c.y, 2) + Math.pow(seg.p1.x, 2) + Math.pow(seg.p1.y, 2) - 2 * (c.x * seg.p1.x + c.y * seg.p1.y) - Math.pow(r, 2)
  const deter = Math.pow(b, 2) - 4 * a * cc

  if (deter <= 0) return []

  const e = Math.sqrt(deter)
  const u1 = (-b + e) / (2 * a)
  const u2 = (-b - e) / (2 * a)

  if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
    return result
  }

  if (isBetween(u1, 0, 1)) {
    result.push({
      x: (seg.p2.x - seg.p1.x) * u1 + seg.p1.x,
      y: (seg.p2.y - seg.p1.y) * u1 + seg.p1.y
    })
  }

  if (isBetween(u2, 0, 1)) {
    result.push({
      x: (seg.p2.x - seg.p1.x) * u2 + seg.p1.x,
      y: (seg.p2.y - seg.p1.y) * u2 + seg.p1.y
    })
  }

  return result
}

/**
 * @group Utils
 */
export function computeAngleRadian(p1: TPoint, p2: TPoint, c: TPoint): number
{
  const p1c = Math.sqrt(Math.pow(c.x - p1.x, 2) + Math.pow(c.y - p1.y, 2))
  const p2c = Math.sqrt(Math.pow(c.x - p2.x, 2) + Math.pow(c.y - p2.y, 2))
  const p1p2 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  return Math.acos((p2c * p2c + p1c * p1c - p1p2 * p1p2) / (2 * p2c * p1c))
}
