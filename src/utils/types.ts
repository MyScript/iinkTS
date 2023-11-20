
/**
 * @group Utils
 */
export type PartialDeep<T> = T extends string | number | bigint | boolean | null | undefined | symbol | Date
  ? T | undefined
  : T extends Array<infer ArrayType>
  ? Array<PartialDeep<ArrayType>>
  : T extends ReadonlyArray<infer ArrayType>
  ? ReadonlyArray<ArrayType>
  : T extends Set<infer SetType>
  ? Set<PartialDeep<SetType>>
  : T extends ReadonlySet<infer SetType>
  ? ReadonlySet<SetType>
  : T extends Map<infer KeyType, infer ValueType>
  ? Map<PartialDeep<KeyType>, PartialDeep<ValueType>>
  : T extends ReadonlyMap<infer KeyType, infer ValueType>
  ? ReadonlyMap<PartialDeep<KeyType>, PartialDeep<ValueType>>
  : { [K in keyof T]?: PartialDeep<T[K]> }

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
