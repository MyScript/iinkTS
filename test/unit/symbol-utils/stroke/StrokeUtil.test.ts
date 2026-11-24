import { describe, test, expect, beforeEach } from "@jest/globals"
import { buildIIStroke } from "../../helpers"
import { MatrixTransform, OBBOps, PointSet2d, registerBuiltinSymbolUtils, StrokeUtil, SymbolType } from "@/iink"

describe("StrokeUtil", () => {
  let util: StrokeUtil

  beforeEach(() => {
    // `overlaps` and `getSnapPoints` read through `SymbolGeometry`, which asks the registry for the
    // symbol's util — that is what buys them the per-symbol geometry cache, and it means a bare
    // `new StrokeUtil()` is not enough to exercise them.
    registerBuiltinSymbolUtils()
    util = new StrokeUtil()
  })

  test("should have type stroke", () => {
    expect(util.type).toBe(SymbolType.Stroke)
  })

  describe("create", () => {
    test("should create a stroke from partial with pointers and pointerType", () => {
      const partial = {
        pointerType: "touch",
        pointers: [
          { p: 1, t: 0, x: 1, y: 1 },
          { p: 1, t: 1, x: 2, y: 2 },
        ],
      }
      const stroke = util.create(partial)
      expect(stroke.type).toBe(SymbolType.Stroke)
      expect(stroke.pointerType).toBe("touch")
    })

    test("should throw when pointers are empty", () => {
      expect(() => util.create({ pointers: [] })).toThrow()
    })

    test("should generate a unique id each call", () => {
      const pointers = [
        { p: 1, t: 0, x: 1, y: 1 },
        { p: 1, t: 1, x: 2, y: 2 },
      ]
      const s1 = util.create({ pointers })
      const s2 = util.create({ pointers })
      expect(s1.id).not.toBe(s2.id)
    })
  })

  describe("getGeometry", () => {
    test("should compute bounds from pointers", () => {
      const stroke = buildIIStroke({ box: { x: 10, y: 20, width: 30, height: 40 } })
      const bounds = OBBOps.toBox(util.getGeometry(stroke).bounds)
      expect(bounds.x).toBeCloseTo(10, 0)
      expect(bounds.y).toBeCloseTo(20, 0)
    })

    test("should compute snapPoints", () => {
      const stroke = buildIIStroke()
      // Snap points belong to the util, not to the shape: a stroke offers its box's handles, which
      // is a decision about the symbol rather than a property of the ink.
      expect(util.getSnapPoints(stroke).length).toBeGreaterThan(0)
    })

    test("matches hand-written oracles, not merely itself", () => {
      // Oracles below are hand-written from these three pointers, not borrowed from the
      // computation under test.
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 0, dt: 1, p: 1 },
          { x: 10, y: 5, dt: 2, p: 1 },
        ],
      })

      const geometry = util.getGeometry(stroke)

      // 0,0 → 10,0 → 10,5: a 10-by-5 box at the origin, written out rather than recomputed.
      expect(OBBOps.toBox(geometry.bounds)).toEqual({ x: 0, y: 0, width: 10, height: 5 })
      expect(geometry.vertices).toBe(stroke.pointers)
      expect(util.getSnapPoints(stroke)).toEqual(OBBOps.getSnapPoints(new PointSet2d(stroke.pointers).bounds))
      expect(geometry.edges).toEqual(new PointSet2d(stroke.pointers).edges)
      // 0,0 → 10,0 → 10,5: 10 + 5, a literal independent of computeLength's own formula.
      expect(geometry.length).toBe(15)
    })
  })

  describe("getSVGElement", () => {
    test("emits the symbol's matrix as the element transform", () => {
      const stroke = StrokeUtil.createFromPartial({ pointers: [{ x: 0, y: 0, dt: 0, p: 1 }] })
      stroke.transform = MatrixTransform.identity().translate(3, 4)

      const el = new StrokeUtil().getSVGElement(stroke)

      expect(el.getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 3, 4)")
    })

    test("emits no transform attribute for a symbol that was never moved", () => {
      const stroke = StrokeUtil.createFromPartial({ pointers: [{ x: 0, y: 0, dt: 0, p: 1 }] })

      expect(new StrokeUtil().getSVGElement(stroke).getAttribute("transform")).toBeNull()
    })
  })

  describe("overlaps", () => {
    test("should return true when stroke overlaps box", () => {
      const stroke = buildIIStroke({ box: { x: 5, y: 5, width: 10, height: 10 } })
      expect(util.overlaps(stroke, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when stroke is outside box", () => {
      const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
      expect(util.overlaps(stroke, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })

    /**
     * The regression this closes: a surround-select box that only covers where a moved stroke now
     * sits used to miss it entirely, because `overlaps` tested the query against the stroke's raw
     * (pre-move) pointers.
     */
    test("a translated stroke is selected at its new position, not its raw one", () => {
      // Raw pointers sit at [0,10]x[0,10]; translate(50, 60) puts the stroke at [50,60]x[60,70].
      const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 10, height: 10 } })
      stroke.transform = MatrixTransform.identity().translate(50, 60)

      expect(util.overlaps(stroke, { x: 45, y: 55, width: 20, height: 20 })).toBe(true)
      // The raw position is where the stroke used to be — a query still drawn there must miss it.
      expect(util.overlaps(stroke, { x: 0, y: 0, width: 10, height: 10 })).toBe(false)
    })

    /**
     * A rotated stroke must not widen to "the drawn line crosses the box": a stroke's real overlap
     * test is per-pointer, and the generic bounds/edges fallback other types use would count a query
     * side crossing the segment *between* two raw pointers as an overlap even with no pointer inside
     * it — over-approximating exactly the case a surround-select box that just grazes a straight
     * stretch of a rotated stroke would trigger.
     *
     * Hand-derived with a clean (no trig rounding) rotation matrix — cos=0.6, sin=0.8, the 3-4-5
     * triangle — so the inverse is its exact transpose: {xx:0.6, yx:-0.8, xy:0.8, yy:0.6}, mapping
     * (x,y) to (0.6x+0.8y, -0.8x+0.6y). Two raw pointers at (0,0) and (10,0); the query box
     * {x:2,y:3,width:2,height:2} maps back to the raw-frame quad (3.6,0.2), (4.8,-1.4), (6.4,-0.2),
     * (5.2,1.4) — straddling the segment near its midpoint (crossing it at (3.75,0), verified by
     * intersecting the query's first mapped side with the raw segment) while containing neither
     * raw pointer (both (0,0) and (10,0) fall on the far side of that quad's boundary — verified by
     * the same cross-product sign test `pointInConvexPolygon` uses).
     */
    test("a rotated stroke is not selected merely because a query crosses the segment between two pointers", () => {
      const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 10, height: 0 }, nbPoint: 2 })
      stroke.transform = { xx: 0.6, yx: 0.8, xy: -0.8, yy: 0.6, tx: 0, ty: 0 }

      expect(util.overlaps(stroke, { x: 2, y: 3, width: 2, height: 2 })).toBe(false)
    })
  })

  describe("getSnapPoints", () => {
    test("should return the stroke snapPoints reference", () => {
      const stroke = buildIIStroke()
      const result = util.getSnapPoints(stroke)
      expect(result).toStrictEqual(OBBOps.getSnapPoints(new PointSet2d(stroke.pointers).bounds))
    })

    test("a translated stroke's snap points are the raw ones shifted by the same translate", () => {
      const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 10, height: 10 } })
      stroke.transform = MatrixTransform.identity().translate(3, 4)

      // Hand-computed from OBBOps.getSnapPoints' own order (4 corners, then the 4 side midpoints,
      // then the center) over the raw [0,10]x[0,10] box this stroke's pointers describe, each
      // shifted by the translate — not by calling getSnapPoints with an identity transform first.
      expect(util.getSnapPoints(stroke)).toEqual([
        { x: 3, y: 4 },
        { x: 13, y: 4 },
        { x: 13, y: 14 },
        { x: 3, y: 14 },
        { x: 8, y: 4 },
        { x: 13, y: 9 },
        { x: 8, y: 14 },
        { x: 3, y: 9 },
        { x: 8, y: 9 },
      ])
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      const stroke = buildIIStroke()
      expect(util.canSelect(stroke)).toBe(true)
    })

    test("canTransform should return true", () => {
      const stroke = buildIIStroke()
      expect(util.canTransform(stroke)).toBe(true)
    })

    test("canResize should return true", () => {
      const stroke = buildIIStroke()
      expect(util.canResize(stroke)).toBe(true)
    })

    test("canRotate should return true", () => {
      const stroke = buildIIStroke()
      expect(util.canRotate(stroke)).toBe(true)
    })
  })

  describe("no group", () => {
    test("should be the path itself, with nothing wrapping it", () => {
      const element = new StrokeUtil().getSVGElement(buildIIStroke())
      expect(element.tagName).toBe("path")
      expect(element.getAttribute("d")).toBeTruthy()
    })

    test("should carry vector-effect on the drawn element, where it actually applies", () => {
      // It used to sit on the wrapping group. `vector-effect` is not an inherited property, so there
      // it applied to a group that draws nothing and never reached the path — it was inert. On the
      // path it takes effect, and stroke width stops growing with the zoom.
      expect(new StrokeUtil().getSVGElement(buildIIStroke()).getAttribute("vector-effect")).toBe(
        "non-scaling-stroke"
      )
    })
  })
})
