import { describe, test, expect, beforeEach } from "@jest/globals"
import { buildIIMath } from "../../helpers"
import { MathUtil, MatrixTransform, OBBOps, SymbolType, computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices, registerBuiltinSymbolUtils, type TMathElement } from "@/iink"

const makeMathElement = (label: string, bounds = { x: 0, y: 0, width: 50, height: 30 }): TMathElement => ({
  id: "e1",
  label,
  fontSize: 14,
  fontWeight: "normal",
  fontFamily: "Arial",
  color: "#000000",
  bounds,
})

// `overlaps` reads through `SymbolGeometry`, which resolves the util from the registry — that is
// what buys it the per-symbol geometry cache.
registerBuiltinSymbolUtils()

describe("MathUtil", () => {
  let util: MathUtil

  beforeEach(() => {
    util = new MathUtil()
  })

  test("should have type math", () => {
    expect(util.type).toBe(SymbolType.Math)
  })

  describe("create", () => {
    test("should create a math from partial", () => {
      const point = { x: 5, y: 10 }
      const boundsBox = { x: 5, y: 10, width: 80, height: 40 }
      const elements = [makeMathElement("x=1", boundsBox)]
      const math = util.create({ elements, point, bounds: OBBOps.fromBox(boundsBox) })
      expect(math.type).toBe(SymbolType.Math)
      expect(math.point).toEqual(point)
    })

    test("should generate a unique id each call", () => {
      const boundsBox2 = { x: 0, y: 0, width: 50, height: 30 }
      const elements = [makeMathElement("x=1", boundsBox2)]
      const m1 = util.create({ elements, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      const m2 = util.create({ elements, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      expect(m1.id).not.toBe(m2.id)
    })
  })


  describe("getGeometry", () => {
    test("matches the legacy MathOps geometry already computed by create, not merely itself", () => {
      const math = buildIIMath()

      const geometry = util.getGeometry(math)

      expect(geometry.bounds).toEqual(math.bounds)
      expect(geometry.vertices).toEqual(computeTypesetVertices(OBBOps.toUnrotatedBox(math.bounds)))
      // Oracle is the shared typeset helper, not the stored field it replaced.
      expect(util.getSnapPoints(math)).toEqual(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(math.bounds), math.point))
      expect(geometry.edges).toEqual(computeClosedEdges(geometry.vertices))
      // A closed shape's length is its perimeter. The record it replaced reported 0 for a typeset
      // symbol, which was a placeholder rather than a measurement — nothing read it.
      expect(geometry.length).toBe(geometry.edges.reduce((sum, e) => sum + Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y), 0))
    })
  })

  describe("overlaps", () => {
    test("should return true when math overlaps given box", () => {
      const math = buildIIMath("y=x", { boundingBox: { x: 5, y: 5, width: 20, height: 10 } })
      expect(util.overlaps(math, { x: 0, y: 0, width: 30, height: 30 })).toBe(true)
    })

    test("should return false when math is outside given box", () => {
      const math = buildIIMath("y=x", { boundingBox: { x: 100, y: 100, width: 20, height: 10 } })
      expect(util.overlaps(math, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSVGElement", () => {
    test("emits no transform attribute for a symbol that was never moved", () => {
      const math = buildIIMath()
      expect(util.getSVGElement(math).getAttribute("transform")).toBeNull()
    })

    test("emits the symbol's matrix as the element transform once moved", () => {
      const math = buildIIMath()
      math.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(math).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })
  })

  describe("getSnapPoints", () => {
    test("should return the math's snap points, computed from its measured box", () => {
      const math = buildIIMath()
      const result = util.getSnapPoints(math)
      expect(result).toStrictEqual(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(math.bounds), math.point))
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIIMath())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIIMath())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIIMath())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIIMath())).toBe(true)
    })
  })
})
