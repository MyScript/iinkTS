/**
 * @group Utils
 */
export function isBetween(val: number, min: number, max: number): boolean
{
  return val >= min && val <= max
}

/**
 * @group Utils
 */
export function computeAverage(arr: number[]): number | typeof NaN
{
  return arr.reduce((p, c) => p + c, 0) / arr.length
}
