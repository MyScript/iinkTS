
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
export type TBoundingBox = {
  x: number,
  y: number,
  width: number,
  height: number
}
