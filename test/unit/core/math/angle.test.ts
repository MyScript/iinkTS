import { round } from "../../helpers"

import { convertDegreeToRadian, convertRadianToDegree } from "@/iink"

describe("convert angle", () => {
  const degreToRad = [
    { degree: 0, radian: 0 },
    { degree: 10, radian: 0.1745 },
    { degree: 30, radian: 0.5236 },
    { degree: 45, radian: 0.7854 },
    { degree: 60, radian: 1.0472 },
    { degree: 90, radian: 1.5708 },
    { degree: 135, radian: 2.3562 },
    { degree: 180, radian: 3.1416 },
    { degree: 270, radian: 4.7124 },
    { degree: 360, radian: 0 },
    { degree: 370, radian: 0.1745 },
    { degree: 390, radian: 0.5236 },
    { degree: 450, radian: 1.5708 },
  ]
  degreToRad.forEach((d) => {
    test(`shoud couvert ${d.degree}° to ${d.radian} rad`, () => {
      // Compared to four decimals rather than for equality: the conversion no longer rounds its
      // result. It used to, and that made 90° convert to 1.5708 instead of PI/2 — a cosine of
      // -3.7e-6 instead of zero, so a rotation matrix built from it was not orthonormal and
      // composing a rotation with its own inverse left a residue the symbol's stored matrix kept.
      // The table above still reads in four decimals because that is what a human checks against;
      // the assertion is what stopped demanding the rounding.
      expect(convertDegreeToRadian(d.degree)).toBeCloseTo(d.radian, 4)
    })
  })

  test("converts a right angle to exactly PI/2, not to a rounded 1.5708", () => {
    // The specific value the old rounding broke, pinned on its own: `Math.cos` of the rounded 1.5708
    // is -3.673e-6, and `MatrixTransform.rotate` snaps a cosine to zero only within 1e-9 of it.
    expect(convertDegreeToRadian(90)).toBe(Math.PI / 2)
    expect(Math.cos(convertDegreeToRadian(90))).toBeCloseTo(0, 15)
  })

  test("a degree round trip returns the angle it started from", () => {
    // What the rounding cost in practice. At four decimals of a radian, 37° came back as 37.0001°.
    for (const degree of [7, 13, 37, 90, 137, 359]) {
      expect(convertRadianToDegree(convertDegreeToRadian(degree))).toBe(degree)
    }
  })

  const radToDegree = [
    { radian: 0, degree: 0 },
    { radian: Math.PI / 6, degree: 30 },
    { radian: Math.PI / 4, degree: 45 },
    { radian: Math.PI / 3, degree: 60 },
    { radian: Math.PI / 2, degree: 90 },
    { radian: Math.PI, degree: 180 },
    { radian: (Math.PI * 4) / 3, degree: 240 },
    { radian: (Math.PI * 3) / 2, degree: 270 },
    { radian: Math.PI * 2, degree: 0 },
    { radian: (Math.PI * 5) / 2, degree: 90 },
    { radian: (Math.PI * 2) / 3, degree: 120 },
    { radian: (Math.PI * 8) / 3, degree: 120 },
  ]
  radToDegree.forEach((d) => {
    test(`shoud couvert ${d.radian} rad to ${d.degree}°`, () => {
      expect(round(convertRadianToDegree(d.radian))).toEqual(d.degree)
    })
  })
})
