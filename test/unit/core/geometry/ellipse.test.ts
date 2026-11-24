import { computeAngleFromPointOnEllipse, computePointOnEllipse } from "@/iink"

describe("computePointOnEllipse", () => {
  const testDatas = [
    {
      center: { x: 0, y: 0 },
      radiusX: 5,
      radiusY: 10,
      phi: 0,
      radian: Math.PI / 4,
      expected: { x: 3.536, y: 7.071 },
    },
    {
      center: { x: 0, y: 0 },
      radiusX: 10,
      radiusY: 5,
      phi: 0,
      radian: Math.PI / 4,
      expected: { x: 7.071, y: 3.536 },
    },
    {
      center: { x: 0, y: 0 },
      radiusX: 10,
      radiusY: 5,
      phi: 0,
      radian: -Math.PI / 4,
      expected: { x: 7.071, y: -3.536 },
    },
    {
      center: { x: 0, y: 0 },
      radiusX: 50,
      radiusY: 5,
      phi: 0,
      radian: Math.PI / 4,
      expected: { x: 35.355, y: 3.536 },
    },
    { center: { x: 0, y: 0 }, radiusX: 50, radiusY: 5, phi: 0, radian: Math.PI / 2, expected: { x: 0, y: 5 } },
    { center: { x: 0, y: 0 }, radiusX: 50, radiusY: 5, phi: 0, radian: -Math.PI / 2, expected: { x: 0, y: -5 } },
  ]
  testDatas.forEach((d) => {
    test(`shoud compute P[${JSON.stringify(d.expected)}]° for arc ith center C[${JSON.stringify(d.center)}] & radiusX=${d.radiusX} & radiusY=${d.radiusY} & ${d.radian}rad`, () => {
      const result = computePointOnEllipse(d.center, d.radiusX, d.radiusY, d.phi, d.radian)
      expect(result).toEqual(d.expected)
    })
  })
})

describe("computeAngleFromPointOnEllipse", () => {
  test("recovers the angle used to generate the point (no rotation)", () => {
    const center = { x: 0, y: 0 }
    const originalAngle = Math.PI / 3
    const point = computePointOnEllipse(center, 10, 5, 0, originalAngle)
    const recoveredAngle = computeAngleFromPointOnEllipse(center, 10, 5, 0, point)
    expect(recoveredAngle).toBeCloseTo(originalAngle, 2)
  })

  test("handles zero radius gracefully (falls back to 1)", () => {
    const center = { x: 0, y: 0 }
    const originalAngle = Math.PI / 4
    const point = computePointOnEllipse(center, 0, 5, 0, originalAngle)
    // Should not throw, even with radiusX=0
    expect(() => computeAngleFromPointOnEllipse(center, 0, 5, 0, point)).not.toThrow()
    const recoveredAngle = computeAngleFromPointOnEllipse(center, 0, 5, 0, point)
    expect(recoveredAngle).toBeDefined()
  })
})
