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
        target[key].concat(source[key])
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
