import { MatrixTransform, TPoint } from "../../../src/iink"

describe("MatrixTransform.ts", () =>
{

  test("should create", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, 0, 0)")
  })

  test("should get identity", () =>
  {
    const matrix = MatrixTransform.identity()
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
  })

  test("should scale to 0.5", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.scale(0.5, 0.5)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0.5)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(0.5)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0.5, 0, 0, 0.5, 0, 0)")
  })

  test("should rotate to 90°", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-1)
    expect(matrix.yx).toBe(1)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 1, -1, 0, 0, 0)")
  })

  test("should translate to x:20 & y: 25", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.translate(20, 25)
    expect(matrix.tx).toBe(20)
    expect(matrix.ty).toBe(25)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, 20, 25)")
  })

  test("should invert matrix translate to x:20 & y: 25", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 20, 25)
    matrix.invert()
    expect(matrix.tx).toBe(-20)
    expect(matrix.ty).toBe(-25)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(-0)
    expect(matrix.yx).toBe(-0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, -20, -25)")
  })

  test("should scale to 0.5 & rotate to 90°", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.scale(0.5, 0.5)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-0.5)
    expect(matrix.yx).toBe(0.5)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 0.5, -0.5, 0, 0, 0)")
  })

  test("should rotate to 90° & scale to 0.5", () =>
  {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    matrix.scale(0.5, 0.5)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-0.5)
    expect(matrix.yx).toBe(0.5)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 0.5, -0.5, 0, 0, 0)")
  })

  test("should invert matrix rotate to 90° & scale to 0.5", () =>
  {
    const matrix = new MatrixTransform(0, 0.5, -0.5, 0, 0, 0)
    matrix.invert()
    expect(matrix.tx).toBe(-0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(2)
    expect(matrix.yx).toBe(-2)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, -2, 2, 0, 0, 0)")
  })

  test("should get identity when multiply matrix with inverse", () =>
  {
    const matrix = new MatrixTransform(0, -2, 2, 0, 0, 0)
    const inverse = new MatrixTransform(0, 0.5, -0.5, 0, 0, 0)
    matrix.multiply(inverse)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
  })

  describe("applyToPoint", () =>
  {
    test("should transform point by translation", () =>
    {
      const tx = 2, ty = 4
      const matrix = new MatrixTransform(1, 0, 0, 1, tx, ty)
      const point: TPoint = {
        x: 10,
        y: 20
      }
      const translatedPoint = MatrixTransform.applyToPoint(matrix, point)
      expect(translatedPoint.x).toBe(point.x + tx)
      expect(translatedPoint.y).toBe(point.y + ty)
    })

    const rotationTestData = [
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI / 4, expected: { x: 3.535, y: 0.707 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI / 4, expected: { x: 0.465, y: 5.293 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI / 3, expected: { x: 3.598, y: -0.232 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI / 3, expected: { x: 0.402, y: 6.232 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI / 2, expected: { x: 3, y: -2 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI / 2, expected: { x: 1, y: 8 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI, expected: { x: -2, y: -3 }, },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI, expected: { x: 6, y: 9 }, },
    ]
    rotationTestData.forEach(d =>
    {
      test(`should transform the point by rotating ${ d.radian }rad from the center [${ d.center.x }, ${ d.center.y }]`, () =>
      {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.rotate(d.radian, d.center)
        const rotatedPoint = MatrixTransform.applyToPoint(matrix, d.point)
        expect(rotatedPoint.x.toFixed(3)).toBe(d.expected.x.toFixed(3))
        expect(rotatedPoint.y.toFixed(3)).toBe(d.expected.y.toFixed(3))
      })
    })

    const scaleTestData = [
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, expected: { x: 2, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 1, scaleY: 1, expected: { x: 2, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 2, scaleY: 1, expected: { x: 4, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 2, scaleY: 1, expected: { x: 0, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 1, scaleY: 3, expected: { x: 2, y: 9 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 1, scaleY: 3, expected: { x: 2, y: -3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 4, scaleY: 5, expected: { x: 8, y: 15 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 4, scaleY: 5, expected: { x: -4, y: -9 } },
    ]
    scaleTestData.forEach(d =>
    {
      test(`should transform the point by scaleX: ${ d.scaleX } & scaleY: ${ d.scaleY } from the center [${ d.center.x }, ${ d.center.y }]`, () =>
      {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.scale(d.scaleX, d.scaleY, d.center)
        const scaleedPoint = MatrixTransform.applyToPoint(matrix, d.point)
        expect(scaleedPoint.x.toFixed(3)).toBe(d.expected.x.toFixed(3))
        expect(scaleedPoint.y.toFixed(3)).toBe(d.expected.y.toFixed(3))
      })
    })

  })

  describe("rotation", () =>
  {

    const testData = [
      { center: { x: 0, y: 0 }, radian: Math.PI / 4, expected: Math.PI / 4 },
      { center: { x: 0, y: 0 }, radian: Math.PI / 3, expected: Math.PI / 3 },
      { center: { x: 0, y: 0 }, radian: Math.PI / 2, expected: Math.PI / 2 },
      { center: { x: 0, y: 0 }, radian: Math.PI, expected: Math.PI },
      { center: { x: 0, y: 0 }, radian: Math.PI * 1.5, expected: -Math.PI / 2 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 4, expected: Math.PI / 4 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 3, expected: Math.PI / 3 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 2, expected: Math.PI / 2 },
      { center: { x: 3, y: 4 }, radian: Math.PI, expected: Math.PI },
      { center: { x: 3, y: 4 }, radian: Math.PI * 1.5, expected: -Math.PI / 2 },
    ]

    testData.forEach(d =>
    {
      test(`should get rotation angle from MatrixTransform for ${ d.radian }rad with center ${ JSON.stringify(d.center) } to equal ${ d.expected }`, () =>
      {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.rotate(d.radian, d.center)
        expect(MatrixTransform.rotation(matrix).toFixed(4)).toEqual(d.expected.toFixed(4))
      })
    })

  })
})
