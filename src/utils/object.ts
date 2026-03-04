
/**
 * @group Utils
 */
type Mergeable = Record<string, unknown> | unknown[] | unknown

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeDeep = (target: any, ...sources: Mergeable[]): any =>
{
  const isObject = (item: unknown): item is Record<string, unknown> =>
  {
    return typeof item === "object" && item !== null && !Array.isArray(item)
  }
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key]
        const targetValue = (target as Record<string, unknown>)[key]

        if (isObject(sourceValue)) {
          if (!isObject(targetValue)) {
            (target as Record<string, unknown>)[key] = {}
          }
          mergeDeep((target as Record<string, unknown>)[key], sourceValue)
        }
        else if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
          (target as Record<string, unknown>)[key] = (targetValue as unknown[]).concat(sourceValue as unknown[])
        }
        else {
          (target as Record<string, unknown>)[key] = sourceValue
        }
      }
    }
  }
  else if (Array.isArray(target) && Array.isArray(source)) {
    return target.concat(source)
  }
  else if (source) {
    return source
  }

  return mergeDeep(target, ...sources)
}

/**
 * @group Utils
 */
export const isDeepEqual = (object1: unknown, object2: unknown): boolean =>
{
  if (!isObject(object1) || !isObject(object2)) {
    return object1 === object2
  }

  const objKeys1 = Object.keys(object1)
  const objKeys2 = Object.keys(object2)

  if (objKeys1.length !== objKeys2.length) return false

  for (const key of objKeys1) {
    const value1 = object1[key as keyof typeof object1]
    const value2 = object2[key as keyof typeof object2]

    const isObjects = isObject(value1) && isObject(value2)

    if (
      (isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false
    }
  }
  return true
}

/**
 * @group Utils
 */
const isObject = (object: unknown): object is Record<string, unknown> =>
{
  return typeof object === "object" && object !== null
}
