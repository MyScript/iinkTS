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
  return +((radian % (2 * Math.PI)) / Math.PI * 180).toFixed(4)
}

/**
 * @group Utils
 */
export function convertDegreeToRadian(degree: number): number
{
  return +((degree % 360) / 180 * Math.PI).toFixed(4)
}

/**
 * @group Utils
 */
export function computeRotatedPoint(point: TPoint, center: TPoint, radian: number): TPoint
{
  const xM = point.x - center.x
  const yM = point.y - center.y
  const x = Math.cos(radian) * xM + Math.sin(radian) * yM + center.x
  const y = Math.cos(radian) * yM - Math.sin(radian) * xM + center.y
  return { x, y }
}

/**
 * @group Utils
 */
export function computePointOnEllipse(center: TPoint, radiusX: number, radiusY: number, phi: number, radian: number): TPoint
{
  const cosPhi = Math.cos(phi)
  const sinPhi = Math.sin(phi)

  return  {
    x: +(center.x + cosPhi * Math.cos(radian) * radiusX - sinPhi * Math.sin(radian) * radiusY).toFixed(3),
    y: +(center.y + sinPhi * Math.cos(radian) * radiusY + cosPhi * Math.sin(radian) * radiusX).toFixed(3)
  }
}

/**
 * @group Utils
 */
export function computeArcLength(center: TPoint, radiusX: number, radiusY: number, startAngle: number, sweepAngle: number, phi: number): number
{
  let length = 0
  let previousPoint: TPoint = computePointOnEllipse(center, radiusX, radiusY, phi, startAngle)

  for (let angle = startAngle; angle <= startAngle + sweepAngle; angle += sweepAngle / 5) {
    const currentPoint = computePointOnEllipse(center, radiusX, radiusY, phi, angle)
    length += computeDistance(previousPoint, currentPoint)
    previousPoint = currentPoint
  }

  return length
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
export function computeAngleRadian(p1: TPoint, center: TPoint, p2: TPoint): number
{
  const p1c = Math.sqrt(Math.pow(center.x - p1.x, 2) + Math.pow(center.y - p1.y, 2))
  const p2c = Math.sqrt(Math.pow(center.x - p2.x, 2) + Math.pow(center.y - p2.y, 2))
  const p1p2 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  return Math.acos((p2c * p2c + p1c * p1c - p1p2 * p1p2) / (2 * p2c * p1c))
}

/**
 * @group Utils
 */
export function getClosestPoints(points1: TPoint[], points2: TPoint[]): { p1: TPoint, p2: TPoint }
{
  let p1 = points1[0]
  let p2 = points2[0]
  let minDistance = Number.MAX_SAFE_INTEGER
  points1.forEach(_p1 =>
  {
    points2.forEach(_p2 =>
    {
      const d = computeDistance(_p1, _p2)
      if (minDistance > d) {
        minDistance = d
        p1 = _p1
        p2 = _p2
      }
    })
  })
  return { p1, p2 }
}

/**
 * @group Utils
 */
export function getClosestPoint(points: TPoint[], point: TPoint): { point?: TPoint, index: number }
{
  let minDistance = Number.MAX_SAFE_INTEGER
  let closest: TPoint | undefined
  let index = -1
  points.forEach((p, i) =>
  {
    const d = computeDistance(p, point)
    if (minDistance > d) {
      minDistance = d
      closest = p
      index = i
    }
  })
  return {
    point: closest,
    index
  }
}

/**
 * @group Utils
 */
export function isPointInsidePolygon(point: TPoint, points: TPoint[])
{
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p1 = points[i]
    const p2 = points[j]
    const intersect = ((p1.y > point.y) != (p2.y > point.y))
      && (point.x < (p2.x - p1.x) * (point.y - p1.y) / (p2.y - p1.y) + p1.x)
    if (intersect) inside = !inside
  }

  return inside
}
