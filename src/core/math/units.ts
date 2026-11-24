const MM_TO_PX_RATIO = 96 / 25.4

/**
 * @group Core/Math
 * @summary Millimeters in one CSS pixel (96 per inch)
 */
export const PX_TO_MM_RATIO = 25.4 / 96

/**
 * @group Core/Math
 */
export function convertMillimeterToPixel(mm: number): number {
  return +(mm * MM_TO_PX_RATIO).toFixed(3)
}

/**
 * @group Core/Math
 */
export function convertPixelToMillimeter(px: number): number {
  return +(px * PX_TO_MM_RATIO).toFixed(3)
}
