import type { TPartialDeep } from "./types"

/**
 * @group Core/Std
 */
export type TMergeable = Record<string, unknown> | unknown[] | unknown

/**
 * Keys that must never be copied by {@link mergeDeep}. `hasOwnProperty` is not enough on its own:
 * `JSON.parse('{"__proto__": {...}}')` yields `__proto__` as an *own* enumerable property, so it
 * passes that guard — and reading `target["__proto__"]` then hits the getter and returns
 * `Object.prototype`, which the recursion would happily write into.
 */
const FORBIDDEN_MERGE_KEYS = new Set(["__proto__", "constructor", "prototype"])

/**
 * Deep-merges `sources` (left to right) onto `target`, mutating and returning it. `target` is
 * typically an empty object/array so the caller's own default-configuration object isn't
 * mutated in place; the explicit type parameter `T` should be given at the call site (e.g.
 * `mergeDeep<TServerHTTPConfiguration>({}, DefaultServerHTTPConfiguration, override)`) since an
 * empty `target` carries no type information of its own to infer `T` from.
 * @group Core/Std
 */
export const mergeDeep = <T extends TMergeable>(target: TPartialDeep<T>, ...sources: TMergeable[]): T => {
  const isObject = (item: unknown): item is Record<string, unknown> => {
    return typeof item === "object" && item !== null && !Array.isArray(item)
  }
  if (!sources.length) {
    return target as T
  }
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (FORBIDDEN_MERGE_KEYS.has(key)) {
        continue
      }
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = (target as Record<string, unknown>)[key]

        if (isObject(sourceValue)) {
          if (!isObject(targetValue)) {
            ;(target as Record<string, unknown>)[key] = {}
          }
          mergeDeep((target as Record<string, unknown>)[key], sourceValue)
        } else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          ;(target as Record<string, unknown>)[key] = (targetValue as unknown[]).concat(sourceValue as unknown[])
        } else {
          ;(target as Record<string, unknown>)[key] = sourceValue
        }
      }
    }
  } else if (Array.isArray(target) && Array.isArray(source)) {
    return target.concat(source) as T
  } else if (source) {
    return source as T
  }

  return mergeDeep(target, ...sources)
}

/**
 * Deep-assigns `override` onto `target`, mutating and returning it. Unlike {@link mergeDeep},
 * an array in `override` replaces the one in `target` instead of being appended to it, and an
 * explicit `undefined` clears the key — what updating a live configuration needs.
 * @group Core/Std
 */
export const overrideDeep = <T extends object>(target: T, override: TPartialDeep<T>): T => {
  const isObject = (item: unknown): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item)
  const record = target as Record<string, unknown>
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    if (FORBIDDEN_MERGE_KEYS.has(key)) {
      continue
    }
    if (isObject(value)) {
      if (!isObject(record[key])) {
        record[key] = {}
      }
      overrideDeep(record[key] as object, value)
    } else {
      record[key] = Array.isArray(value) ? structuredClone(value) : value
    }
  }
  return target
}

/**
 * @group Core/Std
 */
export const isDeepEqual = (object1: unknown, object2: unknown): boolean => {
  if (!isObject(object1) || !isObject(object2)) {
    return object1 === object2
  }

  const objKeys1 = Object.keys(object1)
  const objKeys2 = Object.keys(object2)

  if (objKeys1.length !== objKeys2.length) {
    return false
  }

  for (const key of objKeys1) {
    const value1 = object1[key as keyof typeof object1]
    const value2 = object2[key as keyof typeof object2]

    const isObjects = isObject(value1) && isObject(value2)

    if ((isObjects && !isDeepEqual(value1, value2)) || (!isObjects && value1 !== value2)) {
      return false
    }
  }
  return true
}

/**
 * @group Core/Std
 */
export const isDeepEqualIgnoring = (object1: unknown, object2: unknown, ignoredKeys: string[]): boolean => {
  if (!isObject(object1) || !isObject(object2)) {
    return object1 === object2
  }

  const keys1 = Object.keys(object1).filter((k) => !ignoredKeys.includes(k))
  const keys2 = Object.keys(object2).filter((k) => !ignoredKeys.includes(k))

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    const value1 = object1[key as keyof typeof object1]
    const value2 = object2[key as keyof typeof object2]

    const isObjects = isObject(value1) && isObject(value2)

    if (isObjects && !isDeepEqualIgnoring(value1, value2, ignoredKeys)) {
      return false
    }
    if (!isObjects && value1 !== value2) {
      return false
    }
  }
  return true
}

/**
 * @group Core/Std
 */
const isObject = (object: unknown): object is Record<string, unknown> => {
  return typeof object === "object" && object !== null && !Array.isArray(object)
}

/**
 * @group Core/Std
 * @summary `Object.keys` typed with the keys of `T`
 * @remarks Sound only for an object built from a literal of `T`: a subtype carrying extra keys would list them too.
 */
export const typedKeys = <T extends object>(object: T): (keyof T)[] => Object.keys(object) as (keyof T)[]

/**
 * @group Core/Std
 */
export const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const seenIds = new Set<string>()
  return items.filter((item) => {
    if (seenIds.has(item.id)) {
      return false
    }
    seenIds.add(item.id)
    return true
  })
}

/**
 * Merges an incoming export payload into the current one, mutating and returning it when
 * present, or adopting `incoming` as-is when there was nothing to merge into yet.
 * @group Core/Std
 */
export const mergeExports = <T extends object>(current: T | undefined, incoming: T): T => {
  if (current) {
    Object.assign(current, incoming)
    return current
  }
  return incoming
}
