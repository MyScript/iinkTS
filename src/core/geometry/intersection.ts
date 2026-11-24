import { isBetween } from "../math"
import type { TBox } from "./Box"
import type { TPoint, TSegment } from "./Point"

/**
 * @group Core/Geometry
 */
export function findIntersectionBetween2Segment(seg1: TSegment, seg2: TSegment): TPoint | undefined {
  if (seg1.p1.x === seg2.p1.x && seg1.p1.y === seg2.p1.y) {
    return seg1.p1
  }
  if (seg1.p1.x === seg2.p2.x && seg1.p1.y === seg2.p2.y) {
    return seg1.p1
  }

  if (seg1.p2.x === seg2.p1.x && seg1.p2.y === seg2.p1.y) {
    return seg1.p2
  }
  if (seg1.p2.x === seg2.p2.x && seg1.p2.y === seg2.p2.y) {
    return seg1.p2
  }

  const S1dx = seg1.p2.x - seg1.p1.x
  const S1dy = seg1.p2.y - seg1.p1.y

  const S2dx = seg2.p2.x - seg2.p1.x
  const S2dy = seg2.p2.y - seg2.p1.y

  const S1S2dx = seg1.p1.x - seg2.p1.x
  const S1S2dy = seg1.p1.y - seg2.p1.y

  const ua_t = S2dx * S1S2dy - S2dy * S1S2dx
  const ub_t = S1dx * S1S2dy - S1dy * S1S2dx
  const u_b = S2dy * S1dx - S2dx * S1dy

  if (u_b === 0) {
    return
  }

  const ua = ua_t / u_b
  const ub = ub_t / u_b
  if (isBetween(ua, 0, 1) && isBetween(ub, 0, 1)) {
    return {
      x: seg1.p1.x + ua * S1dx,
      y: seg1.p1.y + ua * S1dy,
    }
  }
  return
}

/**
 * @group Core/Geometry
 */
export function findIntersectBetweenSegmentAndCircle(seg: TSegment, c: TPoint, r: number): TPoint[] {
  const result: TPoint[] = []

  const dx = seg.p2.x - seg.p1.x
  const dy = seg.p2.y - seg.p1.y
  const fx = seg.p1.x - c.x
  const fy = seg.p1.y - c.y

  const a = dx * dx + dy * dy
  const b = 2 * (dx * fx + dy * fy)
  const cc = fx * fx + fy * fy - r * r
  const deter = Math.pow(b, 2) - 4 * a * cc

  if (deter <= 0) {
    return []
  }

  const e = Math.sqrt(deter)
  const u1 = (-b + e) / (2 * a)
  const u2 = (-b - e) / (2 * a)

  if ((u1 < 0 || u1 > 1) && (u2 < 0 || u2 > 1)) {
    return result
  }

  if (isBetween(u1, 0, 1)) {
    result.push({
      x: (seg.p2.x - seg.p1.x) * u1 + seg.p1.x,
      y: (seg.p2.y - seg.p1.y) * u1 + seg.p1.y,
    })
  }

  if (isBetween(u2, 0, 1)) {
    result.push({
      x: (seg.p2.x - seg.p1.x) * u2 + seg.p1.x,
      y: (seg.p2.y - seg.p1.y) * u2 + seg.p1.y,
    })
  }

  return result
}

/**
 * Returns the point on the box perimeter where a ray from the box center toward `target` exits.
 * Used to find natural arrow connection points between two boxes.
 * @group Core/Geometry
 */
export function getBoxConnectionPoint(box: TBox, target: TPoint): TPoint {
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const dx = target.x - cx
  const dy = target.y - cy
  if (dx === 0 && dy === 0) {
    return { x: cx, y: cy }
  }
  const hw = box.width / 2
  const hh = box.height / 2
  const t =
    Math.abs(dx) === 0
      ? hh / Math.abs(dy)
      : Math.abs(dy) === 0
        ? hw / Math.abs(dx)
        : Math.min(hw / Math.abs(dx), hh / Math.abs(dy))
  return { x: cx + t * dx, y: cy + t * dy }
}
