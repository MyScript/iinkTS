import { beforeEach, describe, expect, test } from "@jest/globals"

import { buildIICircle } from "../../helpers"

import type { TPartialDeep, TShape } from "@/iink"
import { MatrixTransform, OBBOps, registerBuiltinSymbolUtils, ShapeKind, ShapeUtil, SymbolType } from "@/iink"

/**
 * `ShapeUtil` used to resolve a kind with a `switch` in each of four methods, which meant a kind
 * could be added to `create` and forgotten in `overlaps`. IIC-2002 replaced them with one table.
 *
 * These tests assert the property that made the table worth it: a kind is either wired everywhere
 * or nowhere. A partially handled kind fails here even though it would have typechecked before.
 */
/**
 * Each kind's own edge computation, the oracle now that the stored `edges` field is gone. A
 * dispatch oracle like {@link SHAPE_BOUNDS_ORACLE}: it reaches the same `*Ops` calls `computeGeometry`
 * makes, so it pins the routing, not the arithmetic.
 */

/**
 * Each kind's own bounds computation. This is a *dispatch* oracle: it proves `ShapeUtil` routes an
 * ellipse to the ellipse kind and not to the polygon one, and nothing more — it cannot fail if a
 * kind's own `computeBounds` is wrong, because it is that same call. The value coverage lives in
 * each kind's own test file, against hand-written boxes.
 */
// `overlaps` and `getSnapPoints` read through `SymbolGeometry`, which asks the registry for the
// symbol's util — that is what buys them the per-symbol geometry cache, and it means a bare
// `new ShapeUtil()` is not enough to exercise them.
registerBuiltinSymbolUtils()


/** Each kind's own vertex computation, the oracle now that the stored `vertices` field is gone. */

const PARTIALS: Record<string, TPartialDeep<TShape>> = {
  [ShapeKind.Circle]: { type: SymbolType.Shape, kind: ShapeKind.Circle, center: { x: 50, y: 50 }, radius: 25 },
  [ShapeKind.Ellipse]: {
    type: SymbolType.Shape,
    kind: ShapeKind.Ellipse,
    center: { x: 50, y: 50 },
    radiusX: 30,
    radiusY: 20,
    orientation: Math.PI / 4,
  },
  [ShapeKind.Polygon]: {
    type: SymbolType.Shape,
    kind: ShapeKind.Polygon,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
  },
}

/**
 * `TPartialDeep<TShape>` narrows `kind` per union member, so a kind the union has no member for
 * cannot be written directly — the compiler already refuses it. The runtime guard being tested here
 * exists for the other door: kinds arriving as data, from an import or the recognition service.
 */
function asPartial(partial: { type: SymbolType; kind: string }): TPartialDeep<TShape> {
  return partial as unknown as TPartialDeep<TShape>
}

/** Declared in `ShapeKind` with nothing behind it. Kept in the enum by product decision. */
const UNIMPLEMENTED = [ShapeKind.Table]
const IMPLEMENTED = Object.values(ShapeKind).filter((kind) => !UNIMPLEMENTED.includes(kind))

describe("ShapeUtil", () => {
  const util = new ShapeUtil()

  test("should cover every implemented kind, so the fixtures below are not a subset of the enum", () => {
    // Guards the guard: a new ShapeKind with no fixture would otherwise skip every test here.
    expect(Object.keys(PARTIALS).sort()).toEqual([...IMPLEMENTED].sort())
  })

  describe.each(IMPLEMENTED)("%s", (kind) => {
    const shape = () => util.create(PARTIALS[kind])

    test("should create through the table", () => {
      expect(shape().kind).toBe(kind)
      expect(shape().type).toBe(SymbolType.Shape)
    })

    test("computeGeometry should read every field off the kind's own geometry", () => {
      const created = shape()

      const geometry = util.getGeometry(created)
      const shapeGeometry = util.getGeometry(created)

      // The record is now a view of the geometry, so the only thing worth asserting is that it does
      // not drift from it. The geometry's own correctness is `Circle2d`/`Ellipse2d`/`Polygon2d`'s to
      // prove, kind by kind, where it can be stated exactly instead of as a list of sampled points.
      expect(geometry.bounds).toEqual(shapeGeometry.bounds)
      expect(geometry.vertices).toEqual(shapeGeometry.vertices)
      expect(geometry.edges).toEqual(shapeGeometry.edges)
      expect(geometry.length).toBe(shapeGeometry.length)
      // A shape snaps on its box — corners, mid-sides and centre — whatever its outline is.
      expect(util.getSnapPoints(created)).toEqual(OBBOps.getSnapPoints(geometry.bounds))
    })

    // The old oracle was each kind's own `computeBounds`, which measures the *sampled* outline for a
    // curve and so reads a little small — 50.02 against a true 50.99 for the ellipse here. The
    // relationship, not the number, is what holds for every kind: the box contains the outline, and
    // it does not contain much more than it.
    test("getGeometry should bound the shape it describes, no looser than its own outline", () => {
      const geometry = util.getGeometry(shape())
      const sampled = OBBOps.toBox(OBBOps.createFromPoints(geometry.vertices))
      const exact = OBBOps.toBox(geometry.bounds)

      expect(exact.width).toBeGreaterThanOrEqual(sampled.width - 1e-9)
      expect(exact.height).toBeGreaterThanOrEqual(sampled.height - 1e-9)
      expect(exact.width).toBeLessThan(sampled.width + 2)
      expect(exact.height).toBeLessThan(sampled.height + 2)
    })

    test("should answer overlaps", () => {
      expect(typeof util.overlaps(shape(), { x: 0, y: 0, width: 200, height: 200 })).toBe("boolean")
    })

    test("should produce an svg path", () => {
      expect(ShapeUtil.getSVGPath(shape())).toBeTruthy()
    })

    test("should produce an svg element carrying that path", () => {
      const element = util.getSVGElement(shape())
      const path = element
      expect(element.getAttribute("kind")).toBe(kind)
      expect(path?.getAttribute("d")).toBe(ShapeUtil.getSVGPath(shape()))
    })

    // The ellipse is the only kind that turns its own path, so it is the only one where the symbol's
    // matrix and the kind's rotation meet on the same element. They have to compose: a plain merge
    // would let one replace the other, and a turned ellipse that was also moved would lose the move.
    const ownRotation = kind === ShapeKind.Ellipse ? " rotate(45, 50, 50)" : ""

    test("should emit no matrix for a shape that was never moved", () => {
      expect(util.getSVGElement(shape()).getAttribute("transform")).toBe(ownRotation.trim() || null)
    })

    test("should compose the shape's matrix with whatever the kind turns its path by", () => {
      const moved = shape()
      moved.transform = MatrixTransform.identity().translate(3, 4)
      // Right to left, the nesting order the group and path used to give for free: the kind's own
      // rotation first, the symbol's matrix after it.
      expect(util.getSVGElement(moved).getAttribute("transform")).toBe(`matrix(1, 0, 0, 1, 3, 4)${ownRotation}`)
    })
  })

  describe.each(UNIMPLEMENTED)("%s, a kind the enum declares and the table does not", (kind) => {
    // The point is consistency: before the table, nothing stopped `create` from handling a kind
    // that `getSVGPath` then threw on, which surfaces as a broken symbol rather than a clear error.
    test.each([
      ["create", () => util.create(asPartial({ type: SymbolType.Shape, kind }))],
      ["getSVGPath", () => ShapeUtil.getSVGPath({ kind } as TShape)],
      ["getSVGElement", () => util.getSVGElement({ kind } as TShape)],
    ])("should refuse %s", (_name, call) => {
      expect(call).toThrow(`shape, kind: "${kind}" is unknown`)
    })

    test("should stay tolerant where it always was", () => {
      // These two never threw on an unknown kind and still must not: they run over whole models.
      // A shape of an unknown *kind*, not an object of an unknown type: `overlaps` reads through
      // `SymbolGeometry`, which resolves the util from `symbol.type`, so the type has to be there for
      // the test to be about the kind at all.
      const unknown = { type: SymbolType.Shape, kind, transform: MatrixTransform.identity() } as unknown as TShape
      expect(util.overlaps(unknown, { x: 0, y: 0, width: 1, height: 1 })).toBe(false)
    })

    test("getGeometry should stay tolerant too, describing nothing rather than throwing", () => {
      const unknown = { type: SymbolType.Shape, kind, transform: MatrixTransform.identity() } as unknown as TShape
      const geometry = util.getGeometry(unknown)

      expect(geometry.vertices).toEqual([])
      expect(geometry.edges).toEqual([])
      // And it is found by nothing, rather than by anything that happens to cover the origin.
      expect(geometry.overlapsBox({ x: -1e6, y: -1e6, width: 2e6, height: 2e6 })).toBe(false)
    })
  })

  describe("an unknown kind", () => {
    test("should name the kind it could not resolve", () => {
      expect(() => util.create(asPartial({ type: SymbolType.Shape, kind: "sticky-note" }))).toThrow(
        'Unable to create shape, kind: "sticky-note" is unknown'
      )
    })
  })

  describe("aspect ratio", () => {
    /**
     * `IIResizeManager` decided this from outside the symbol, with
     * `isText(s) || isMath(s) || (isShape(s) && isCircleShape(s))`. IIC-2015 moved it onto the
     * contract, and for shapes it is a flag on the kind table.
     */
    test("should lock only the circle, which has one radius to describe two axes", () => {
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Circle]))).toBe(true)
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Ellipse]))).toBe(false)
      expect(util.keepsAspectRatio(util.create(PARTIALS[ShapeKind.Polygon]))).toBe(false)
    })
  })

  describe("path attributes", () => {
    test("should orient the ellipse, the one kind that needs it", () => {
      const path = util.getSVGElement(util.create(PARTIALS[ShapeKind.Ellipse]))
      expect(path?.getAttribute("transform")).toContain("rotate(45")
    })

    test("should leave the other kinds untransformed", () => {
      // Before IIC-2002 this lived as an `if (shape.kind === ShapeKind.Ellipse)` in the shared
      // method; the table must not have leaked it onto every kind.
      IMPLEMENTED.filter((kind) => kind !== ShapeKind.Ellipse).forEach((kind) => {
        const path = util.getSVGElement(util.create(PARTIALS[kind]))
        expect(path?.getAttribute("transform")).toBeNull()
      })
    })

    test("should keep opacity alongside the extra attributes", () => {
      const shape = util.create({ ...PARTIALS[ShapeKind.Ellipse], style: { opacity: 0.5 } } as TPartialDeep<TShape>)
      const path = util.getSVGElement(shape)
      expect(path?.getAttribute("opacity")).toBe("0.5")
      expect(path?.getAttribute("transform")).toBeTruthy()
    })
  })
})

/**
 * Moved here from `test/unit/symbol/shape/` by IIC-2013, mirroring where the source lives. Both
 * files described the same subject, so each half was being maintained without reference to the
 * other.
 */
describe("ShapeUtil, the contract members", () => {
  let util: ShapeUtil

  beforeEach(() => {
    util = new ShapeUtil()
  })

  test("should have type shape", () => {
    expect(util.type).toBe(SymbolType.Shape)
  })

  describe("create", () => {
    test("should create a circle when kind is Circle", () => {
      const shape = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      expect(shape.type).toBe(SymbolType.Shape)
      expect(shape.kind).toBe(ShapeKind.Circle)
    })

    test("should create an ellipse when kind is Ellipse", () => {
      const shape = util.create({ kind: ShapeKind.Ellipse, center: { x: 0, y: 0 }, radiusX: 10, radiusY: 5 })
      expect(shape.kind).toBe(ShapeKind.Ellipse)
    })

    test("should create a polygon when kind is Polygon", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 },
      ]
      const shape = util.create({ kind: ShapeKind.Polygon, points })
      expect(shape.kind).toBe(ShapeKind.Polygon)
    })

    test("should throw when kind is unknown", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => util.create({ kind: "unknown" } as any)).toThrow()
    })

    test("should generate unique ids for each creation", () => {
      const s1 = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      const s2 = util.create({ kind: ShapeKind.Circle, center: { x: 0, y: 0 }, radius: 5 })
      expect(s1.id).not.toBe(s2.id)
    })
  })

  describe("overlaps", () => {
    test("should return true when circle overlaps box", () => {
      const circle = buildIICircle({ center: { x: 5, y: 5 }, radius: 3 })
      expect(util.overlaps(circle, { x: 0, y: 0, width: 20, height: 20 })).toBe(true)
    })

    test("should return false when circle is outside box", () => {
      const circle = buildIICircle({ center: { x: 100, y: 100 }, radius: 3 })
      expect(util.overlaps(circle, { x: 0, y: 0, width: 5, height: 5 })).toBe(false)
    })

    test("should return false for unknown shape kind (default branch)", () => {
      const circle = buildIICircle()
      // Force unknown kind to exercise the default branch in the switch
      const unknownShape = { ...circle, kind: "unknown" } as unknown as TShape
      expect(util.overlaps(unknownShape, { x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })

    /**
     * Regression found in review: the containment early-out tested the circle's raw *bounding box*
     * corners (at distance radius·√2 from center) rather than the circle's own vertices (at distance
     * radius) — so once the query was rotated relative to the raw frame, a query that trivially
     * surrounds the actual circle (half-size just over the radius) could still miss the (larger,
     * fictional) box-corner distance, for every half-size up to radius·√2.
     *
     * A circle centered at the origin is unmoved by a rotation about that same origin — only the
     * matrix (and so the query's own inverse mapping) changes, not where the circle actually sits —
     * so a query box centered at the origin is exactly "does this query surround the circle" for
     * every half-size, with no world-space translation to additionally account for.
     */
    test.each([5.1, 7.0])(
      "a rotated circle (radius 5) is selected by a surrounding query of half-size %s",
      (halfSize) => {
        const circle = buildIICircle({ center: { x: 0, y: 0 }, radius: 5 })
        circle.transform = MatrixTransform.identity().rotate(Math.PI / 4)

        expect(
          util.overlaps(circle, { x: -halfSize, y: -halfSize, width: 2 * halfSize, height: 2 * halfSize })
        ).toBe(true)
      }
    )
  })

  describe("getSnapPoints", () => {
    test("should return the shape's snap points, computed from its bounds", () => {
      const circle = buildIICircle()
      const result = util.getSnapPoints(circle)
      expect(result).toStrictEqual(OBBOps.getSnapPoints(util.getGeometry(circle).bounds))
    })
  })

  describe("capability flags (defaults)", () => {
    test("canSelect should return true", () => {
      expect(util.canSelect(buildIICircle())).toBe(true)
    })

    test("canTransform should return true", () => {
      expect(util.canTransform(buildIICircle())).toBe(true)
    })

    test("canResize should return true", () => {
      expect(util.canResize(buildIICircle())).toBe(true)
    })

    test("canRotate should return true", () => {
      expect(util.canRotate(buildIICircle())).toBe(true)
    })
  })
})
