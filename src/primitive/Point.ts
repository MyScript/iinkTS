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

/**
 * @group Primitive
 */
export function isValidPoint(p?: PartialDeep<TPoint>): boolean
{
  if (!p) return false
  if (!isValidNumber(p.x)) return false
  if (!isValidNumber(p.y)) return false
  return true
}
