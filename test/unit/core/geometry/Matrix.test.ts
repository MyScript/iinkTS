import { describe, test, expect } from "@jest/globals"
import { isIdentityMatrix, mergeSymbolTransform, MatrixTransform, TMatrixTransform } from "@/iink"

describe("isIdentityMatrix", () => {
  test("should return true for the identity matrix", () => {
    expect(isIdentityMatrix(MatrixTransform.identity())).toBe(true)
  })

  test("should return true for a literal shaped exactly like identity", () => {
    const matrix: TMatrixTransform = { xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 }
    expect(isIdentityMatrix(matrix)).toBe(true)
  })

  test.each([
    ["tx", { xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 0 }],
    ["ty", { xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 5 }],
    ["xx", { xx: 2, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 }],
    ["yy", { xx: 1, yx: 0, xy: 0, yy: 2, tx: 0, ty: 0 }],
    ["xy", { xx: 1, yx: 0, xy: 0.5, yy: 1, tx: 0, ty: 0 }],
    ["yx", { xx: 1, yx: 0.5, xy: 0, yy: 1, tx: 0, ty: 0 }],
  ])("should return false when only %s differs from identity", (_field, matrix: TMatrixTransform) => {
    expect(isIdentityMatrix(matrix)).toBe(false)
  })

  test("should return false for a translated matrix built through MatrixTransform", () => {
    expect(isIdentityMatrix(MatrixTransform.identity().translate(1, 0))).toBe(false)
  })
})

describe("mergeSymbolTransform", () => {
  test("returns the identity when given undefined", () => {
    expect(mergeSymbolTransform(undefined)).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 })
  })

  test("returns the identity when given an empty partial", () => {
    expect(mergeSymbolTransform({})).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 })
  })

  test("fills in only the fields a partial leaves unset", () => {
    expect(mergeSymbolTransform({ tx: 5, ty: 6 })).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
  })

  test("keeps every field of a fully-specified partial", () => {
    const full: TMatrixTransform = { xx: 2, yx: 0.5, xy: -0.5, yy: 2, tx: 10, ty: -10 }
    expect(mergeSymbolTransform(full)).toEqual(full)
  })
})
