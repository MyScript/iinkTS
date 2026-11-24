/**
 * @group Core/Math
 */
export const TWO_PI = 2 * Math.PI

/**
 * @group Core/Math
 */
export function convertRadianToDegree(radian: number): number {
  return +(((radian % TWO_PI) / Math.PI) * 180).toFixed(4)
}

/**
 * @group Core/Math
 */
export function convertDegreeToRadian(degree: number): number {
  // Not rounded. Four decimals of a radian is 0.0057 of a degree, which sounds harmless until it
  // reaches a right angle: it turned PI/2 into 1.5708, whose cosine is -3.7e-6 instead of zero. A
  // rotation matrix built from that is not orthonormal, so composing a rotation with its own inverse
  // — which is what undo does now that a transform is a matrix the symbol keeps — left a residue
  // behind. `MatrixTransform.rotate` used to round its own sine and cosine to three decimals, which
  // hid this one by being coarser still.
  return ((degree % 360) / 180) * Math.PI
}

/**
 * Calculate rotation angle for ellipse arc
 * @group Core/Math
 * @param angle - The angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  let returnedAngle = ((angle + Math.PI) % TWO_PI) - Math.PI
  if (returnedAngle < -Math.PI) {
    returnedAngle += TWO_PI
  }
  return returnedAngle
}
