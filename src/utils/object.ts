
/**
 * @group Utils
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeDeep = (target: any, ...sources: any[]): any =>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isObject = (item: any) =>
  {
    return (item && typeof item === "object" && !Array.isArray(item))
  }
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} })
        }
        mergeDeep(target[key], source[key])
      }
      else if (Array.isArray(target[key]) && Array.isArray(source[key])) {
        target[key] = target[key].concat(source[key])
      }
      else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  else if (Array.isArray(target) && Array.isArray(source)) {
    target = target.concat(source)
  }
  else if (source) {
    target = source
  }

  return mergeDeep(target, ...sources)
}

/**
 * @group Utils
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isDeepEqual = (object1: any, object2: any) =>
{
  const objKeys1 = Object.keys(object1)
  const objKeys2 = Object.keys(object2)

  if (objKeys1.length !== objKeys2.length) return false

  for (const key of objKeys1) {
    const value1 = object1[key]
    const value2 = object2[key]

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObject = (object: any) =>
{
  return object && typeof object === "object"
}
