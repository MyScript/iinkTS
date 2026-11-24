import { describe, test, expect, beforeAll, beforeEach } from "@jest/globals"
import { buildIIDecorator } from "../../helpers"
import type { TDecorator } from "@/iink"
import { DecoratorUtil, DecoratorKind, OBBOps, SymbolType, MatrixTransform, registerBuiltinSymbolUtils } from "@/iink"

describe("DecoratorUtil", () => {
  let util: DecoratorUtil

  beforeAll(() => registerBuiltinSymbolUtils())

  beforeEach(() => {
    util = new DecoratorUtil()
  })

  test("should have type decorator", () => {
    expect(util.type).toBe(SymbolType.Decorator)
  })

  describe("create", () => {
    test("should create a decorator from partial with kind", () => {
      const decorator = util.create({ kind: DecoratorKind.Underline })
      expect(decorator.type).toBe(SymbolType.Decorator)
      expect(decorator.kind).toBe(DecoratorKind.Underline)
    })

    test("should create with provided targetIds", () => {
      const decorator = util.create({ kind: DecoratorKind.Highlight, targetIds: ["id1", "id2"] })
      expect(decorator.targetIds).toEqual(["id1", "id2"])
    })

    test("should throw when kind is missing", () => {
      expect(() => util.create({})).toThrow("TDecorator requires kind")
    })

    test("should generate unique ids each call", () => {
      const d1 = util.create({ kind: DecoratorKind.Surround })
      const d2 = util.create({ kind: DecoratorKind.Surround })
      expect(d1.id).not.toBe(d2.id)
    })

    test("should carry a given transform through, merged onto identity", () => {
      const decorator = util.create({ kind: DecoratorKind.Underline, transform: { tx: 5, ty: 6 } })
      expect(decorator.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })

    test("should default transform to identity when absent", () => {
      const decorator = util.create({ kind: DecoratorKind.Underline })
      expect(decorator.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 })
    })
  })

  describe("getGeometry", () => {
    test("reads targetBounds rather than deriving anything, since a decorator owns no coordinates", () => {
      const decorator = util.create({ kind: DecoratorKind.Highlight })
      // Oracle is `DecoratorUtil.setTargetBounds`, reached directly: `getGeometry` is the one util method that
      // reports a stored box, so what it must be checked against is the writer, not a derivation.
      DecoratorUtil.setTargetBounds(decorator, OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }))

      const geometry = util.getGeometry(decorator)

      expect(geometry.bounds).toEqual(decorator.targetBounds)
      // The box's own corners: a decorator is *found* wherever its target is. The two points
      // `DecoratorUtil.computeVertices` gives are what it *draws*, and those are its snap points.
      expect(geometry.vertices).toEqual(OBBOps.toCorners(decorator.targetBounds!))
      // A decorator's snap points are its two vertices — that is what the removed field copied.
      expect(util.getSnapPoints(decorator)).toEqual(DecoratorUtil.computeVertices(decorator.targetBounds!))
      // A closed ring round the target's box: four sides, and a perimeter to match.
      expect(geometry.edges).toHaveLength(4)
      expect(geometry.isClosed).toBe(true)
      expect(geometry.length).toBe(40)
    })

    test("reports empty geometry for a decorator with no targetBounds, not two points at the origin", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline) // targetBounds stays unset
      const geometry = util.getGeometry(decorator)

      expect(geometry.vertices).toEqual([])
      expect(geometry.edges).toEqual([])
      expect(util.getSnapPoints(decorator)).toEqual([])
      // And it is found by nothing: a decorator with no target has no place on the page.
      expect(geometry.overlapsBox({ x: -1e6, y: -1e6, width: 2e6, height: 2e6 })).toBe(false)
    })

    test("takes targetBounds through create as the TOBB the field declares, centre intact", () => {
      // `create` used to read this partial as a `TBox` behind a cast, so a decorator serialised by
      // iinkTS itself — a `TOBB`, carrying `center` and no `x` — came back with a NaN centre.
      const decorator = util.create({
        kind: DecoratorKind.Highlight,
        targetBounds: { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 },
      })
      expect(decorator.targetBounds).toEqual(OBBOps.create({ x: 5, y: 5 }, 10, 10))
      // The line it draws still runs across the middle of that box — its snap points say so, where
      // its geometry now describes the box itself.
      expect(util.getSnapPoints(decorator)).toEqual([
        { x: 0, y: 5 },
        { x: 10, y: 5 },
      ])
    })
  })

  describe("overlaps", () => {
    test("should return false when a decorator with no targetBounds is tested against a box", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      expect(util.overlaps(decorator, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })

    test("should overlap a box that meets its targetBounds", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline)
      DecoratorUtil.setTargetBounds(decorator, OBBOps.fromBox({ x: 10, y: 10, width: 50, height: 20 }))
      expect(util.overlaps(decorator, { x: 0, y: 0, width: 30, height: 30 })).toBe(true)
      expect(util.overlaps(decorator, { x: 200, y: 200, width: 30, height: 30 })).toBe(false)
    })
  })

  describe("getSnapPoints", () => {
    test("should return the decorator's snap points once targetBounds are set", () => {
      const decorator = util.create({ kind: DecoratorKind.Strikethrough })
      DecoratorUtil.setTargetBounds(decorator, OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }))
      // Independent oracle: computed straight from `targetBounds`, so a `getSnapPoints` stubbed to
      // return `[]` fails this against a non-empty expectation.
      const expected = DecoratorUtil.computeVertices(decorator.targetBounds!)
      expect(expected.length).toBeGreaterThan(0)
      expect(util.getSnapPoints(decorator)).toStrictEqual(expected)
    })

    test("should return an empty array when the decorator has no targetBounds", () => {
      const decorator = buildIIDecorator(DecoratorKind.Strikethrough)
      expect(util.getSnapPoints(decorator)).toStrictEqual([])
    })
  })

  describe("capability flags", () => {
    test("canSelect should return true (default)", () => {
      expect(util.canSelect(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canTransform should return true (default)", () => {
      expect(util.canTransform(buildIIDecorator(DecoratorKind.Underline))).toBe(true)
    })

    test("canResize should return false", () => {
      expect(util.canResize(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })

    test("canRotate should return false", () => {
      expect(util.canRotate(buildIIDecorator(DecoratorKind.Underline))).toBe(false)
    })
  })

  describe("getSVGElement", () => {
    const buildUnderline = () => DecoratorUtil.createDecorator(DecoratorKind.Underline, {}, [], { x: 0, y: 0, width: 20, height: 10 })

    test("emits no transform attribute for a decorator that was never moved", () => {
      expect(util.getSVGElement(buildUnderline())?.getAttribute("transform")).toBeNull()
    })

    test("emits the decorator's matrix as the element transform once moved, without also shifting the geometry", () => {
      // Guards the interaction with SymbolGeometry now baking the matrix into `boundsOf`: this
      // element must draw from the decorator's *raw*, stored bounds and let the `transform`
      // attribute alone account for the move — using the transformed bounds here would shift the
      // line twice (once in its own x1/x2, once via the attribute).
      const decorator = buildUnderline()
      decorator.transform = MatrixTransform.identity().translate(5, 5)

      const element = util.getSVGElement(decorator)

      expect(element?.getAttribute("transform")).toBe("matrix(1, 0, 0, 1, 5, 5)")
      expect(element?.getAttribute("x1")).toBe("0")
      expect(element?.getAttribute("x2")).toBe("20")
    })
  })

  /**
   * `renderFromBounds` carried the only kind `switch` left in this class, and nothing covered it.
   * These tests were written against that switch and must hold identically after IIC-2003 replaced
   * it with a table — they are what says the refactor changed no pixel.
   */
  describe("renderFromBounds", () => {
    const bounds = OBBOps.fromBox({ x: 10, y: 20, width: 100, height: 40 })
    /** `symbolStyle.width` drives geometry; `decorator.style.width` drives the stroke attribute. */
    const symbolStyle = { width: 2, color: "#111111" }

    const render = (kind: DecoratorKind, baseline?: number, xHeight?: number) =>
      DecoratorUtil.renderFromBounds(buildIIDecorator(kind, { color: "#ff0000", width: 4 }), bounds, baseline, xHeight, symbolStyle)

    describe.each([DecoratorKind.Highlight, DecoratorKind.Surround])("%s, drawn as a rect", (kind) => {
      test("should inflate the bounds by one symbol stroke width on every side", () => {
        const element = render(kind)
        expect(element?.tagName).toBe("rect")
        // x - 2, y - 2, and both dimensions grown twice over.
        expect(element?.getAttribute("x")).toBe("8")
        expect(element?.getAttribute("y")).toBe("18")
        expect(element?.getAttribute("width")).toBe("104")
        expect(element?.getAttribute("height")).toBe("44")
      })

      test("should carry the shared identity attributes", () => {
        const element = render(kind)
        expect(element?.getAttribute("type")).toBe("decorator")
        expect(element?.getAttribute("kind")).toBe(kind)
        expect(element?.getAttribute("vector-effect")).toBe("non-scaling-stroke")
      })
    })

    test("highlight should be a translucent fill with no stroke", () => {
      const element = render(DecoratorKind.Highlight)
      expect(element?.getAttribute("fill")).toBe("#ff0000")
      expect(element?.getAttribute("stroke")).toBe("transparent")
      expect(element?.getAttribute("opacity")).toBe("0.5")
    })

    test("highlight opacity should win over the decorator's own", () => {
      // The switch set the shared opacity first and let Highlight overwrite it. Preserved on
      // purpose: a highlight is a wash, and its own opacity is what makes it readable.
      const decorator = buildIIDecorator(DecoratorKind.Highlight, { color: "#ff0000", opacity: 0.9 })
      const element = DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, symbolStyle)
      expect(element?.getAttribute("opacity")).toBe("0.5")
    })

    test("surround should be an outline, and stroke-width should come from the decorator not the symbol", () => {
      const element = render(DecoratorKind.Surround)
      expect(element?.getAttribute("fill")).toBe("transparent")
      expect(element?.getAttribute("stroke")).toBe("#ff0000")
      expect(element?.getAttribute("stroke-width")).toBe("4")
    })

    describe.each([
      [DecoratorKind.Strikethrough, "40", 100 - 8],
      [DecoratorKind.Underline, "62", 100 + 8],
    ])("%s, drawn as a line", (kind, fallbackY, baselineY) => {
      test("should span the bounds horizontally at its own height", () => {
        const element = render(kind)
        expect(element?.tagName).toBe("line")
        expect(element?.getAttribute("x1")).toBe("10")
        expect(element?.getAttribute("x2")).toBe("110")
        expect(element?.getAttribute("y1")).toBe(fallbackY)
        expect(element?.getAttribute("y2")).toBe(fallbackY)
      })

      test("should follow the text baseline when metrics are supplied", () => {
        // What keeps an underline under the glyphs rather than under their bounding box.
        const element = render(kind, 100, 8)
        expect(element?.getAttribute("y1")).toBe(baselineY.toString())
        expect(element?.getAttribute("y2")).toBe(baselineY.toString())
      })

      test("should ignore the baseline unless both metrics are supplied", () => {
        expect(render(kind, 100, undefined)?.getAttribute("y1")).toBe(fallbackY)
        expect(render(kind, undefined, 8)?.getAttribute("y1")).toBe(fallbackY)
      })

      test("should carry the outline attributes", () => {
        const element = render(kind)
        expect(element?.getAttribute("fill")).toBe("transparent")
        expect(element?.getAttribute("stroke")).toBe("#ff0000")
        expect(element?.getAttribute("stroke-width")).toBe("4")
      })
    })

    test("should draw every kind the enum declares", () => {
      // Guards the guard: a new DecoratorKind with no table entry would silently render nothing,
      // and every test above would still pass over the four kinds that do work.
      Object.values(DecoratorKind).forEach((kind) => {
        expect(render(kind)).toBeDefined()
      })
    })

    test("should return undefined for a kind it does not own, rather than throwing", () => {
      // Unlike the shape and edge utils, this runs over every symbol on every redraw, so an
      // unknown kind must be skipped and not abort the frame.
      const unknown = { ...buildIIDecorator(DecoratorKind.Underline), kind: "glow" } as unknown as TDecorator
      expect(DecoratorUtil.renderFromBounds(unknown, bounds, undefined, undefined, symbolStyle)).toBeUndefined()
    })

    test("should apply the decorator's own opacity to the kinds that do not override it", () => {
      const decorator = buildIIDecorator(DecoratorKind.Underline, { color: "#ff0000", opacity: 0.25 })
      const element = DecoratorUtil.renderFromBounds(decorator, bounds, undefined, undefined, symbolStyle)
      expect(element?.getAttribute("opacity")).toBe("0.25")
    })
  })
})
