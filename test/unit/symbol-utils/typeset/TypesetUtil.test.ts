import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIIMath, buildIIText } from "../../helpers"

import { MathUtil, MatrixTransform, TextUtil, TypesetUtil } from "@/iink"

/**
 * `TText` and `TMath` are the same shape but for the list they hold — `chars` against `elements` —
 * so before IIC-2013 their utils were the same code twice. `translate`, `rotate` and `resize` used
 * to be where that showed most: one method on `IIResizeManager` that branched on `isText(symbol)`
 * twice, once to reach the right list and once to reach the right derive.
 *
 * Task 11 removed that branching for good: the three operations are `SymbolUtil`'s now, composing
 * the matrix the same way for every registered type. `TypesetUtil` no longer overrides any of
 * them — these tests check that `TextUtil`/`MathUtil` inherit exactly that, and that nothing left
 * in `TypesetUtil` still reaches for a coordinate the matrix is responsible for from here on.
 */
describe("TypesetUtil", () => {
  let text: TextUtil
  let math: MathUtil

  beforeEach(() => {
    text = new TextUtil()
    math = new MathUtil()
  })

  const quarterTurn = () => MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })

  test("both built-in typeset utils should share the base", () => {
    // Guards the guard: every assertion below is about inherited behaviour, and would pass
    // vacuously over two independent implementations.
    expect(text).toBeInstanceOf(TypesetUtil)
    expect(math).toBeInstanceOf(TypesetUtil)
  })

  describe("translate/rotate/resize, inherited from SymbolUtil, written once", () => {
    test.each([
      ["text", () => buildIIText({ point: { x: 3, y: 4 } })],
      ["math", () => buildIIMath("y=3x+2", { point: { x: 3, y: 4 } })],
    ])("%s translate should compose the matrix rather than move its point", (name, build) => {
      const symbol = build()
      const util = name === "text" ? text : math
      const before = structuredClone({ point: symbol.point, bounds: symbol.bounds })

      util.translate(symbol as never, { matrix: MatrixTransform.identity().translate(3, 4) })

      // The matrix composed onto an until-now identity transform is the matrix itself.
      expect(symbol.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 3, ty: 4 })
      // Untouched: a translate no longer moves a single stored coordinate.
      expect(symbol.point).toEqual(before.point)
      expect(symbol.bounds).toEqual(before.bounds)
    })

    test.each([
      ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
      ["math", () => buildIIMath()],
    ])("%s rotate should compose the matrix rather than record an angle", (name, build) => {
      const symbol = build()
      const util = name === "text" ? text : math
      const before = structuredClone(symbol.bounds)

      util.rotate(symbol as never, { matrix: quarterTurn() })

      // A quarter turn about the origin, from an until-now identity transform: cos(90°) rounds to
      // 0 and sin(90°) to 1 inside `MatrixTransform.rotate`, so this is exact, not approximate.
      expect(symbol.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
      // Untouched: no `.rotation` field is left to write, and the raw (pre-matrix) bounds this
      // symbol was measured at do not change just because it turned.
      expect(symbol.bounds).toEqual(before)
    })

    test.each([
      ["text", () => buildIIText()],
      ["math", () => buildIIMath()],
    ])("%s rotate should accumulate across two turns rather than replace", (name, build) => {
      const symbol = build()
      const util = name === "text" ? text : math

      util.rotate(symbol as never, { matrix: quarterTurn() })
      util.rotate(symbol as never, { matrix: quarterTurn() })

      // Two quarter turns compose to a half turn: cos(180°) rounds to -1, sin(180°) to 0 — `xy`
      // lands on negative zero (0 * -1 followed by -1 * 0, both IEEE754 negative-zero products),
      // which `toEqual` distinguishes from positive zero.
      expect(symbol.transform).toEqual({ xx: -1, yx: 0, xy: -0, yy: -1, tx: 0, ty: 0 })
    })

    test.each([
      ["text", () => buildIIText({ chars: [{ id: "c", label: "a", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 0, y: 0, width: 1, height: 1 } }] })],
      ["math", () => buildIIMath()],
    ])("%s resize should compose the matrix rather than rebuild bounds or scale glyphs", (name, build) => {
      const symbol = build()
      const util = name === "text" ? text : math
      const before = structuredClone({ bounds: symbol.bounds, fontSizes: glyphFontSizes(symbol) })

      util.resize(symbol as never, { matrix: MatrixTransform.identity().scale(2, 4, { x: 0, y: 0 }) })

      expect(symbol.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 4, tx: 0, ty: 0 })
      // Untouched: the matrix scales the glyphs at render time now, so nothing here rewrites a
      // stored font size, and the raw bounds stay exactly what they were measured at.
      expect(symbol.bounds).toEqual(before.bounds)
      expect(glyphFontSizes(symbol)).toEqual(before.fontSizes)
    })
  })

  describe("aspect ratio", () => {
    test.each([["text"], ["math"]])("%s should always lock it", (name) => {
      // A typeset symbol is drawn from glyphs at a font size, and a font size is one number:
      // scaling the axes unequally would ask for glyphs that do not exist.
      const util = name === "text" ? text : math
      const symbol = name === "text" ? buildIIText() : buildIIMath()
      expect(util.keepsAspectRatio(symbol as never)).toBe(true)
    })
  })
})

function glyphFontSizes(symbol: { chars?: { fontSize: number }[]; elements?: { fontSize: number }[] }): number[] {
  return (symbol.chars ?? symbol.elements ?? []).map((g) => g.fontSize)
}
