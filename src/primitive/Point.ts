import { PartialDeep, isValidNumber } from "../utils"

/**
 * @group Primitive
 */
export type TPoint = {
  x: number
  y: number
}

/**
 * @group Primitive
 */
export type TPointer = TPoint & {
  t: number
  p: number
}

/**
 * @group Primitive
 */
export type TSegment = {
  p1: TPoint
  p2: TPoint
}

export function isValidPoint(p?: PartialDeep<TPoint>): boolean
{
  if (!p) return false
  if (!isValidNumber(p.x)) return false
  if (!isValidNumber(p.y)) return false
  return true
}

export function isValidSegment(s?: PartialDeep<TSegment>): boolean
{
  if (!s) return false
  if (!isValidPoint(s.p1)) return false
  if (!isValidPoint(s.p2)) return false
  return true
}
