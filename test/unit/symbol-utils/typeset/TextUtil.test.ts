import { describe, test, expect, beforeAll, beforeEach } from "@jest/globals"
import { buildIIText } from "../../helpers"
import { TextUtil, SymbolGeometry, SymbolType, OBBOps, MatrixTransform, registerBuiltinSymbolUtils, type TSymbolChar, type TBox, computeTypesetSnapPoints, computeClosedEdges, computeTypesetVertices } from "@/iink"

const makeChar = (label: string, bounds: TBox): TSymbolChar => ({
  id: `char-${label}`,
  label,
  color: "#000000",
  bounds,
  fontSize: 12,
  fontWeight: "normal",
})

describe("TextUtil", () => {
  let util: TextUtil

  beforeAll(() => registerBuiltinSymbolUtils())

  beforeEach(() => {
    util = new TextUtil()
  })

  test("should have type text", () => {
    expect(util.type).toBe(SymbolType.Text)
  })

  describe("create", () => {
    test("should create a text from partial with required fields", () => {
      const point = { x: 10, y: 20 }
      const boundsBox = { x: 10, y: 20, width: 100, height: 30 }
      const chars = [makeChar("A", boundsBox)]
      const text = util.create({ chars, point, bounds: OBBOps.fromBox(boundsBox) })
      expect(text.type).toBe(SymbolType.Text)
      expect(text.point).toEqual(point)
      expect(text.bounds).toEqual(OBBOps.fromBox(boundsBox))
    })

    test("should throw when bounds are missing", () => {
      const bounds = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", bounds)]
      expect(() => util.create({ chars, point: { x: 0, y: 0 } })).toThrow()
    })

    test("should throw when chars are empty", () => {
      expect(() =>
        util.create({ chars: [], point: { x: 0, y: 0 }, bounds: OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }) })
      ).toThrow()
    })

    test("should generate a unique id each call", () => {
      const boundsBox2 = { x: 0, y: 0, width: 10, height: 10 }
      const chars = [makeChar("A", boundsBox2)]
      const t1 = util.create({ chars, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      const t2 = util.create({ chars, point: { x: 0, y: 0 }, bounds: OBBOps.fromBox(boundsBox2) })
      expect(t1.id).not.toBe(t2.id)
    })
  })

  describe("getGeometry", () => {
    test("matches the legacy TextOps geometry already computed by create, not merely itself", () => {
      const text = buildIIText({ boundingBox: { x: 0, y: 10, width: 20, height: 30 } })

      const geometry = util.getGeometry(text)

      expect(geometry.bounds).toEqual(text.bounds)
      expect(geometry.vertices).toEqual(computeTypesetVertices(OBBOps.toUnrotatedBox(text.bounds)))
      // Oracle is the shared typeset helper, not the stored field it replaced.
      expect(util.getSnapPoints(text)).toEqual(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(text.bounds), text.point))
      expect(geometry.edges).toEqual(computeClosedEdges(geometry.vertices))
      // A closed shape's length is its perimeter. The record it replaced reported 0 for a typeset
      // symbol, which was a placeholder rather than a measurement — nothing read it.
      expect(geometry.length).toBe(geometry.edges.reduce((sum, e) => sum + Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y), 0))
    })
  })

  describe("overlaps", () => {
    test("should return true when text overlaps given box", () => {
      const text = buildIIText({ boundingBox: { x: 5, y: 5, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when text is outside given box", () => {
      const text = buildIIText({ boundingBox: { x: 100, y: 100, width: 10, height: 10 } })
      expect(util.overlaps(text, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })
  })

  describe("getSVGElement", () => {
    test("emits no transform attribute for a symbol that was never moved", () => {
      const text = buildIIText()
      expect(util.getSVGElement(text).getAttribute("transform")).toBeNull()
    })

    test("emits the symbol's matrix as the element transform once moved", () => {
      const text = buildIIText()
      text.transform = MatrixTransform.identity().translate(3, 4)
      expect(util.getSVGElement(text).getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })
  })

  describe("getSnapPoints", () => {
    test("should return the text's snap points, computed from its measured box", () => {
      const text = buildIIText()
      const result = util.getSnapPoints(text)
      expect(result).toStrictEqual(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(text.bounds), text.point))
    })
  })

  describe("rotate/resize, composing the matrix", () => {
    test("a second rotation composes with the first instead of replacing it", () => {
      const text = TextUtil.createFromPartial({
        chars: [{ label: "a", color: "#000", fontSize: 10, fontWeight: "normal", id: "c1" }],
        point: { x: 0, y: 0 },
        bounds: OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }),
      })
      const center = { x: 5, y: 5 }

      util.rotate(text, { matrix: MatrixTransform.identity().rotate(Math.PI / 4, center) })
      util.rotate(text, { matrix: MatrixTransform.identity().rotate(Math.PI / 4, center) })

      // `bounds.angle` is radians (`TOBB`'s own convention, per OBBOps — Task 9 fixed a bug that
      // mixed degrees into it), so two quarter-quarter (45°) turns compose to π/2, not 90.
      expect(SymbolGeometry.boundsOf(text).angle).toBeCloseTo(Math.PI / 2)
    })

    test("a resize of a turned text keeps its angle", () => {
      // The bug this covers: `TypesetUtil.resize` used to set `bounds.angle = 0` while leaving a
      // separate `rotation` field intact, desynchronising the hit box from what was drawn. There is
      // only one matrix to compose now, so the angle a rotate composed into it survives a resize.
      const text = TextUtil.createFromPartial({
        chars: [{ label: "a", color: "#000", fontSize: 10, fontWeight: "normal", id: "c1" }],
        point: { x: 0, y: 0 },
        bounds: OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }),
      })
      const center = { x: 5, y: 5 }
      util.rotate(text, { matrix: MatrixTransform.identity().rotate(Math.PI / 2, center) })

      util.resize(text, { matrix: MatrixTransform.identity().scale(2, 2, { x: 0, y: 0 }) })

      // Radians again, for the same reason as above: a 90° turn is π/2.
      expect(SymbolGeometry.boundsOf(text).angle).toBeCloseTo(Math.PI / 2)
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIIText())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIIText())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIIText())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIIText())).toBe(true)
    })
  })
})
