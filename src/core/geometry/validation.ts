/**
 * Check if two numbers are valid and finite
 * @group Core/Geometry
 */
export function areValidCoordinates(x: number, y: number): boolean {
  return !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)
}
