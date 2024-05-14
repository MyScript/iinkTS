/**
 * @group Utils
 */
export function isValidNumber(x: unknown): boolean
{
  if (x === undefined || x === null) return false
  return !isNaN(parseFloat(x.toString())) && isFinite(+x)
}
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
