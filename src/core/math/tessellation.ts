/**
 * @group Core/Math
 * @summary Compute approximate average radius of an ellipse
 * @remarks Computes sqrt((radiusX^2 + radiusY^2) / 2) - a geometric average
 * used for ellipse perimeter and arc length approximations
 * @param radiusX - Horizontal radius
 * @param radiusY - Vertical radius
 * @returns Approximate average radius
 */
export function computeEllipseRadiusAverage(radiusX: number, radiusY: number): number {
  return Math.sqrt((radiusX ** 2 + radiusY ** 2) / 2)
}

/**
 * @group Core/Math
 * @summary Target length of one segment when a curve is approximated by a polyline
 */
export const TESSELLATION_SEGMENT_LENGTH = 10 as const

/**
 * @group Core/Math
 * @summary Compute how many vertices a curve of the given length should tessellate into
 * @param length - Arc/perimeter length to cover
 * @param minSegmentLength - Target length per segment (e.g. {@link TESSELLATION_SEGMENT_LENGTH})
 * @param minPoints - Floor on the returned count, regardless of how short `length` is
 */
export function computeTessellationCount(length: number, minSegmentLength: number, minPoints = 8): number {
  return Math.max(minPoints, Math.round(length / minSegmentLength))
}
