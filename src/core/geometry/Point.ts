import { isValidNumber } from "../math"
import type { TPartialDeep } from "../std"

/**
 * @group Core/Geometry
 */
export type TPoint = {
  x: number
  y: number
}

/**
 * @group Core/Geometry
 */
export type TPointer = TPoint & {
  /**
   * Milliseconds since the gesture that captured this pointer began, so the first pointer of a
   * stroke is at 0. Fractional: a pen samples faster than once per millisecond, and rounding the
   * gap between two samples to zero would tell the recognizer they were captured at the same
   * instant.
   *
   * Relative rather than absolute so it stays a two- or three-digit number. The absolute instant
   * is `stroke.creationTime + dt`, which is what goes on the wire — the recognizer needs absolute
   * times to order strokes against each other.
   */
  dt: number
  p: number
}

/**
 * @group Core/Geometry
 */
export type TSegment = {
  p1: TPoint
  p2: TPoint
}

/**
 * A pointer as written before pointers stored a delta: `t` held an absolute epoch timestamp.
 * Only ever read, never produced — it exists so documents saved by an earlier version still open.
 * @group Core/Geometry
 */
export type TTimedPointerLike = {
  dt?: number
  t?: number
}

/** Narrows to a usable time. `isValidNumber` answers the same question but does not narrow. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

/**
 * A pointer as read from a document: it may carry `dt`, or the absolute `t` an earlier version
 * wrote, or neither. This is the shape every import path accepts — without it the compatibility
 * read below would be unreachable, because a document in the old format would not typecheck.
 * @group Core/Geometry
 */
export type TPointerImport = TPartialDeep<TPointer> & TTimedPointerLike

/**
 * The `dt` field of the {@link TPointer} at `index`, accepting documents that predate `dt`.
 *
 * A pointer that already carries `dt` is taken as is. One that only carries the old absolute `t`
 * is rebased onto the first timed pointer of the same stroke, which reproduces the deltas the
 * capture originally had. With neither, the index stands in — a stroke with no timing at all still
 * has to come out strictly increasing, because the recognizer reads the order from it.
 * @group Core/Geometry
 */
export function resolvePointerDelta(pointers: ReadonlyArray<TTimedPointerLike | undefined>, index: number): number {
  const pointer = pointers[index]
  if (isFiniteNumber(pointer?.dt)) {
    return pointer.dt
  }
  const absolute = pointer?.t
  if (!isFiniteNumber(absolute)) {
    return index
  }
  const origin = pointers.find((p) => isFiniteNumber(p?.t))?.t
  return isFiniteNumber(origin) ? +(absolute - origin).toFixed(3) : index
}

/**
 * The epoch instant a stroke began, for a stroke read from a document.
 *
 * Its own `creationTime` when it has one. Otherwise the absolute `t` of its first pointer, which
 * is what a pre-`dt` document carries — losing it would collapse the intervals *between* strokes,
 * and those are what tell the recognizer the order they were written in.
 * @group Core/Geometry
 */
export function resolveStrokeOrigin(
  pointers: ReadonlyArray<TTimedPointerLike | undefined>,
  creationTime?: number
): number | undefined {
  if (isFiniteNumber(creationTime)) {
    return creationTime
  }
  return pointers.find((p) => isFiniteNumber(p?.t))?.t
}

/**
 * @group Core/Geometry
 */
export function isValidPoint(p?: TPartialDeep<TPoint>): boolean {
  if (!p) {
    return false
  }
  if (!isValidNumber(p.x)) {
    return false
  }
  if (!isValidNumber(p.y)) {
    return false
  }
  return true
}
