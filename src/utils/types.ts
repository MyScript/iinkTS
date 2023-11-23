
/**
 * @group Utils
 */
export type PartialDeep<T> = T extends object ? {
  [P in keyof T]?: PartialDeep<T[P]>;
} : T;

/**
 * @group Utils
 */
export type TPoint = {
  x: number
  y: number
}

/**
 * @group Utils
 */
export type TPointer = TPoint & {
  t: number
  p: number
}

/**
 * @group Utils
 */
export type TBoundingBox = {
  x: number,
  y: number,
  width: number,
  height: number
}

/**
 * @group Utils
 */
export type TBoxLimit = {
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number
}
