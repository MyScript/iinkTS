

import { MatrixTransform, TBoundingBox, TPoint } from "../../../src/iink"

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

  describe("applyToPoint", () => {
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
  })

  describe("applyToBox", () => {
    test("should transform box by translation", () =>
    {
      const tx = 2, ty = 4
      const matrix = new MatrixTransform(1, 0, 0, 1, tx, ty)
      const bb: TBoundingBox = {
        x: 10,
        y: 20,
        height: 42,
        width: 5
      }
      const bbTranslated = MatrixTransform.applyToBox(matrix, bb)
      expect(bbTranslated.x).toBe(bb.x + tx)
      expect(bbTranslated.y).toBe(bb.y + ty)
      expect(bbTranslated.height).toBe(bb.height)
      expect(bbTranslated.width).toBe(bb.width)
    })
  })


})
