/**
 * @group Core/Math
 */
export function isBetween(val: number, min: number, max: number): boolean {
  return val >= min && val <= max
}

/**
 * @group Core/Math
 * @summary Round a value to the nearest multiple of a step
 * @param value - Value to round
 * @param step - Rounding step
 * @returns Value rounded to the nearest multiple of step
 */
export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step
}

/**
 * @group Core/Math
 */
export function computeAverage(arr: number[]): number {
  return arr.reduce((p, c) => p + c, 0) / (arr.length || 1)
}

/**
 * Check if a value is a valid number (not null, not undefined, not NaN, finite)
 * @group Core/Math
 * @param x - Value to check
 * @returns True if value is a valid number
 */
export function isValidNumber(x: unknown): boolean {
  if (x === undefined || x === null) {
    return false
  }
  return !isNaN(parseFloat(x.toString())) && isFinite(+x)
}
