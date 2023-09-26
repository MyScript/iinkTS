export * from "./configuration"
export * from "./grabber"
export * from "./model"
export * from "./recognizer"
export * from "./renderer"
export * from "./style"
export * from "./undo-redo"
export * from "./math"
export * from "./Behaviors"

export type DeepPartial<T> = T extends string | number | bigint | boolean | null | undefined | symbol | Date
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
  : {
    [K in keyof T]?: PartialDeep<T[K]>
  }
