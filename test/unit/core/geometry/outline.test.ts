import { TPointer, computeAngleAxeRadian, computeFinalOutlinePoints, computeLineOutlinePoints, computeLinksPointers, computeMiddlePointer, computeQuadraticOutlinePoints } from "@/iink"

describe("quadratics", () => {
  const p1: TPointer = {
    p: 1,
    dt: 1,
    x: 1,
    y: 1,
  }
  const p2: TPointer = {
    p: 1,
    dt: 1,
    x: 2,
    y: 5,
  }
  const p3: TPointer = {
    p: 1,
    dt: 1,
    x: 4,
    y: 2,
  }

  test("should computeLinksPointers", () => {
    const points = computeLinksPointers(p1, 90, 1)
    expect(points).toStrictEqual([
      {
        x: 0.106,
        y: 0.552,
      },
      {
        x: 1.894,
        y: 1.448,
      },
    ])
  })

  test("should computeMiddlePointer", () => {
    const point = computeMiddlePointer(p1, p2)
    expect(point).toStrictEqual({ x: 1.5, y: 3, p: 1, dt: 1 })
  })

  test("should computeLineOutlinePoints link both endpoints along the segment angle", () => {
    const width = 2
    const angle = computeAngleAxeRadian(p1, p2)
    expect(computeLineOutlinePoints(p1, p2, width)).toStrictEqual({
      linkPoints1: computeLinksPointers(p1, angle, width),
      linkPoints2: computeLinksPointers(p2, angle, width),
    })
  })

  test("should computeQuadraticOutlinePoints link begin/end/ctrl each along their own segment angle", () => {
    const width = 2
    expect(computeQuadraticOutlinePoints(p1, p2, p3, width)).toStrictEqual({
      linkPoints1: computeLinksPointers(p1, computeAngleAxeRadian(p1, p3), width),
      linkPoints2: computeLinksPointers(p2, computeAngleAxeRadian(p3, p2), width),
      linkPoints3: computeLinksPointers(p3, computeAngleAxeRadian(p1, p2), width),
    })
  })

  test("should computeFinalOutlinePoints return a 7-point fan starting from computeLinksPointers", () => {
    const width = 2
    const angle = computeAngleAxeRadian(p1, p2)
    const [firstPoint] = computeLinksPointers(p2, angle, width)
    const points = computeFinalOutlinePoints(p1, p2, width)
    expect(points).toHaveLength(7)
    expect(points[0]).toStrictEqual(firstPoint)
    const lastAngle = angle - Math.PI
    expect(points[6]).toStrictEqual({
      x: p2.x - p2.p * width * Math.sin(lastAngle),
      y: p2.y + p2.p * width * Math.cos(lastAngle),
    })
  })
})
