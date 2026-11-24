import { describe, test, expect } from "@jest/globals"
import { OBBOps, TBox, TOBB, TPoint, TSegment } from "@/iink"

describe("OBBOps", () => {
  describe("polygonOverlapsBox", () => {
    const box: TBox = { x: 0, y: 0, width: 10, height: 10 }

    test("should return true when the bounds are fully contained in the box", () => {
      const bounds: TOBB = { center: { x: 5, y: 5 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.polygonOverlapsBox(bounds, [], box)).toBe(true)
    })

    test("should return true when an edge crosses a side of the box, even if bounds aren't contained", () => {
      const bounds: TOBB = { center: { x: 20, y: 5 }, width: 30, height: 2, angle: 0 }
      const edges: TSegment[] = [{ p1: { x: -5, y: 5 }, p2: { x: 25, y: 5 } }]
      expect(OBBOps.polygonOverlapsBox(bounds, edges, box)).toBe(true)
    })

    test("should return false when neither the bounds nor any edge intersects the box", () => {
      const bounds: TOBB = { center: { x: 100, y: 100 }, width: 2, height: 2, angle: 0 }
      const edges: TSegment[] = [{ p1: { x: 95, y: 100 }, p2: { x: 105, y: 100 } }]
      expect(OBBOps.polygonOverlapsBox(bounds, edges, box)).toBe(false)
    })
  })

  /**
   * `query` here is not restricted to a rectangle at some angle the way `polygonOverlapsBox`'s `box`
   * is — it is the plain 4 corners `SymbolUtil.overlapsQuery` gets from mapping an axis-aligned query
   * through the inverse of a symbol's matrix, which is a rotated rectangle only when that matrix has
   * no shear, and a genuine (non-rectangular) parallelogram otherwise.
   */
  describe("polygonOverlapsQuad", () => {
    // The square [0,10]x[0,10]'s own corners — the symbol's actual vertices, not its (identical, in
    // this one case) axis-aligned bounds. `overlapsBoxVsVertices` below is what tells the two apart.
    const vertices: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]

    test("should return true when the vertices are fully contained in a rotated quad", () => {
      // The square rotated 45° around its own center (5,5): vertex distance 14 from the center along
      // each axis is the L1 ball {|dx|+|dy|<=14}, and every one of `vertices` sits at L1 distance
      // exactly 10 from (5,5) - inside with margin to spare.
      const query: TPoint[] = [
        { x: 5, y: -9 },
        { x: 19, y: 5 },
        { x: 5, y: 19 },
        { x: -9, y: 5 },
      ]
      expect(OBBOps.polygonOverlapsQuad(vertices, [], query)).toBe(true)
    })

    test("should return true when an edge crosses a side of a sheared (non-rectangular) quad", () => {
      const edges: TSegment[] = [{ p1: { x: 10, y: 0 }, p2: { x: 10, y: 10 } }]
      // (9,8)-(13,8)-(12,9)-(8,9): opposite sides are parallel and equal (a parallelogram) but no
      // angle is 90° - not a shape `TOBB`/`polygonOverlapsBox` could describe. Its bottom side runs
      // from (9,8) to (13,8), crossing the edge above (x=10, y in [0,10]) at (10,8).
      const query: TPoint[] = [
        { x: 9, y: 8 },
        { x: 13, y: 8 },
        { x: 12, y: 9 },
        { x: 8, y: 9 },
      ]
      expect(OBBOps.polygonOverlapsQuad(vertices, edges, query)).toBe(true)
    })

    test("should return false when neither the vertices nor any edge intersects the quad", () => {
      const farVertices: TPoint[] = [
        { x: 99, y: 99 },
        { x: 101, y: 99 },
        { x: 101, y: 101 },
        { x: 99, y: 101 },
      ]
      const edges: TSegment[] = [{ p1: { x: 95, y: 100 }, p2: { x: 105, y: 100 } }]
      const query: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]
      expect(OBBOps.polygonOverlapsQuad(farVertices, edges, query)).toBe(false)
    })

    test("should return false for an empty vertex list rather than vacuously true", () => {
      // `[].every(...)` is `true` for any predicate - a symbol reporting no vertices at all (a
      // decorator with no bounds yet) must not short-circuit to "contained" on that account.
      const edges: TSegment[] = [{ p1: { x: 95, y: 100 }, p2: { x: 105, y: 100 } }]
      const query: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ]
      expect(OBBOps.polygonOverlapsQuad([], edges, query)).toBe(false)
    })

    /**
     * The regression the containment check itself introduced (found in review): the axis-aligned
     * `bounds` box around a non-rectangular shape reaches further out on the diagonal than the shape
     * does (a circle of radius r has AABB corners at r·√2), so testing `bounds`' corners for
     * containment - instead of the shape's own vertices - can make a query that truly surrounds the
     * shape fail containment. This pins the fix: an octagon inscribed in a radius-5 circle (a coarse
     * stand-in for the real tessellated vertex list a circle's geometry builds) is fully
     * contained in a query whose own AABB corners (from a squarer `bounds`-shaped stand-in) would not
     * be.
     */
    test("hand-computed: an inscribed octagon is contained where its bounding square's corners are not", () => {
      const r = 5
      const octagon: TPoint[] = Array.from({ length: 8 }, (_, i) => {
        const theta = (Math.PI / 4) * i
        return { x: r * Math.cos(theta), y: r * Math.sin(theta) }
      })
      const squareCorners: TPoint[] = [
        { x: -r, y: -r },
        { x: r, y: -r },
        { x: r, y: r },
        { x: -r, y: r },
      ]
      // A square query of half-size 5.1: contains every octagon vertex (max |x|,|y| = 5, or
      // 5·cos(45°)≈3.54 on the diagonal ones) but not the bounding square's own corners (at (±5,±5),
      // L∞ distance 5 - inside 5.1 too on this axis-aligned query; use a rotated one to separate them).
      const query: TPoint[] = [
        { x: 0, y: -7.3 },
        { x: 7.3, y: 0 },
        { x: 0, y: 7.3 },
        { x: -7.3, y: 0 },
      ]
      // Diamond of "radius" 7.3 = the L1 ball {|x|+|y|<=7.3}. Octagon vertices: axis ones at L1
      // distance 5 (inside); diagonal ones at L1 distance 5·(cos45°+sin45°)=5·√2≈7.07 (inside, margin
      // 0.23). Square corners at L1 distance 10 (outside): this is the case the old, bounds-based
      // check would have missed.
      expect(OBBOps.polygonOverlapsQuad(octagon, [], query)).toBe(true)
      expect(OBBOps.polygonOverlapsQuad(squareCorners, [], query)).toBe(false)
    })
  })

  describe("quadContainsPoint", () => {
    const query: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]

    test("should return true for a point inside the quad", () => {
      expect(OBBOps.quadContainsPoint(query, { x: 5, y: 5 })).toBe(true)
    })

    test("should return false for a point outside the quad", () => {
      expect(OBBOps.quadContainsPoint(query, { x: 20, y: 20 })).toBe(false)
    })

    test("should return true for a point on the quad's boundary", () => {
      expect(OBBOps.quadContainsPoint(query, { x: 0, y: 5 })).toBe(true)
    })

    test("should handle a quad whose winding is reversed (the image of a reflection)", () => {
      const reversed = [...query].reverse()
      expect(OBBOps.quadContainsPoint(reversed, { x: 5, y: 5 })).toBe(true)
      expect(OBBOps.quadContainsPoint(reversed, { x: 20, y: 20 })).toBe(false)
    })
  })

  describe("create", () => {
    test("should default angle to 0", () => {
      expect(OBBOps.create({ x: 1, y: 2 }, 10, 20)).toEqual({ center: { x: 1, y: 2 }, width: 10, height: 20, angle: 0 })
    })

    test("should keep the given angle and clone the center point", () => {
      const center = { x: 1, y: 2 }
      const obb = OBBOps.create(center, 10, 20, Math.PI / 4)
      expect(obb).toEqual({ center: { x: 1, y: 2 }, width: 10, height: 20, angle: Math.PI / 4 })
      expect(obb.center).not.toBe(center)
    })
  })

  describe("fromBox", () => {
    test("should center the OBB on the box and keep angle 0", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 4 }
      expect(OBBOps.fromBox(box)).toEqual({ center: { x: 5, y: 2 }, width: 10, height: 4, angle: 0 })
    })
  })

  describe("toBox", () => {
    test("should return the axis-aligned bounding box unchanged when angle is 0", () => {
      const obb: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.toBox(obb)).toEqual({ x: 0, y: 3, width: 10, height: 4 })
    })

    test("should return the corners' bounding box when rotated", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: Math.PI / 4 }
      const box = OBBOps.toBox(obb)
      const diagonal = Math.sqrt(2)
      expect(box.x).toBeCloseTo(-diagonal)
      expect(box.y).toBeCloseTo(-diagonal)
      expect(box.width).toBeCloseTo(2 * diagonal)
      expect(box.height).toBeCloseTo(2 * diagonal)
    })
  })

  describe("createFromPoints", () => {
    test("should build the axis-aligned OBB of the bounding box of the points", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 4 },
      ]
      expect(OBBOps.createFromPoints(points)).toEqual({ center: { x: 5, y: 2 }, width: 10, height: 4, angle: 0 })
    })
  })

  describe("createFromOBBs", () => {
    test("should return a zero-sized OBB at the origin when given an empty array", () => {
      expect(OBBOps.createFromOBBs([])).toEqual({ center: { x: 0, y: 0 }, width: 0, height: 0, angle: 0 })
    })

    test("should return the bounding OBB of the given OBBs' boxes", () => {
      const a: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const b: TOBB = { center: { x: 25, y: 5 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.createFromOBBs([a, b])).toEqual({ center: { x: 15, y: 5 }, width: 30, height: 10, angle: 0 })
    })
  })

  describe("getCorners", () => {
    test("should return the 4 axis-aligned corners in clockwise order starting top-left", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.getCorners(obb)).toEqual([
        { x: -5, y: -2 },
        { x: 5, y: -2 },
        { x: 5, y: 2 },
        { x: -5, y: 2 },
      ])
    })

    test("should rotate the corners around the center for a non-zero angle", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: Math.PI / 2 }
      const corners = OBBOps.getCorners(obb)
      expect(corners[0].x).toBeCloseTo(1)
      expect(corners[0].y).toBeCloseTo(-1)
      expect(corners[1].x).toBeCloseTo(1)
      expect(corners[1].y).toBeCloseTo(1)
    })
  })

  describe("toCorners", () => {
    test("should return the same 4 corners as getCorners", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: Math.PI / 4 }
      expect(OBBOps.toCorners(obb)).toEqual(OBBOps.getCorners(obb))
    })
  })

  describe("fromCorners", () => {
    test("hand-computed: fits an axis-aligned box translated to x:[10,20], y:[0,10]", () => {
      // Corners of a 10x10 box centred on (15, 5); average of the 4 corners is that centre.
      const corners: TPoint[] = [
        { x: 10, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 10, y: 10 },
      ]
      expect(OBBOps.fromCorners(corners, 0)).toEqual({ center: { x: 15, y: 5 }, width: 10, height: 10, angle: 0 })
    })

    test("hand-computed: fits a square rotated 90 degrees around the origin", () => {
      // getCorners({center:(0,0), width:2, height:2, angle: PI/2}) rotates (-1,-1),(1,-1),(1,1),(-1,1)
      // by 90°, landing on (1,-1),(1,1),(-1,1),(-1,-1) — hand-derived from cos(90°)=0, sin(90°)=1.
      const corners: TPoint[] = [
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
        { x: -1, y: -1 },
      ]
      const result = OBBOps.fromCorners(corners, Math.PI / 2)
      expect(result.center.x).toBeCloseTo(0)
      expect(result.center.y).toBeCloseTo(0)
      expect(result.width).toBeCloseTo(2)
      expect(result.height).toBeCloseTo(2)
      expect(result.angle).toBe(Math.PI / 2)
    })

    test("should round-trip through toCorners for an axis-aligned OBB", () => {
      const obb: TOBB = { center: { x: 5, y: 2 }, width: 10, height: 4, angle: 0 }
      const result = OBBOps.fromCorners(OBBOps.toCorners(obb), obb.angle)
      expect(result.center.x).toBeCloseTo(obb.center.x)
      expect(result.center.y).toBeCloseTo(obb.center.y)
      expect(result.width).toBeCloseTo(obb.width)
      expect(result.height).toBeCloseTo(obb.height)
    })

    test("should round-trip through toCorners for a rotated OBB", () => {
      const obb: TOBB = { center: { x: 3, y: -4 }, width: 6, height: 2, angle: Math.PI / 2 }
      const result = OBBOps.fromCorners(OBBOps.toCorners(obb), obb.angle)
      expect(result.center.x).toBeCloseTo(obb.center.x)
      expect(result.center.y).toBeCloseTo(obb.center.y)
      expect(result.width).toBeCloseTo(obb.width)
      expect(result.height).toBeCloseTo(obb.height)
    })
  })

  describe("getSides", () => {
    test("should return 4 segments connecting consecutive corners, wrapping around", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      const corners = OBBOps.getCorners(obb)
      const sides = OBBOps.getSides(obb)
      expect(sides).toHaveLength(4)
      expect(sides[3]).toEqual({ p1: corners[3], p2: corners[0] })
    })
  })

  describe("getSnapPoints", () => {
    test("should return the 4 corners, 4 side midpoints and the center", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      const snapPoints = OBBOps.getSnapPoints(obb)
      expect(snapPoints).toHaveLength(9)
      expect(snapPoints).toEqual(
        expect.arrayContaining([
          { x: 0, y: -2 },
          { x: 5, y: 0 },
          { x: 0, y: 2 },
          { x: -5, y: 0 },
          { x: 0, y: 0 },
        ])
      )
    })
  })

  describe("containsPoint", () => {
    test("should return true/false for a point inside/outside an axis-aligned OBB", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 4, angle: 0 }
      expect(OBBOps.containsPoint(obb, { x: 1, y: 1 })).toBe(true)
      expect(OBBOps.containsPoint(obb, { x: 100, y: 1 })).toBe(false)
    })

    test("should account for rotation", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 2, angle: Math.PI / 2 }
      expect(OBBOps.containsPoint(obb, { x: 0, y: 4 })).toBe(true)
      expect(OBBOps.containsPoint(obb, { x: 4, y: 0 })).toBe(false)
    })
  })

  describe("overlaps", () => {
    test("should use the fast axis-aligned box path when both angles are 0", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: 0 }
      const b: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const c: TOBB = { center: { x: 100, y: 100 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.overlaps(a, b)).toBe(true)
      expect(OBBOps.overlaps(a, c)).toBe(false)
    })

    test("should use SAT when either OBB is rotated", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: Math.PI / 4 }
      const b: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: 0 }
      const c: TOBB = { center: { x: 100, y: 100 }, width: 10, height: 10, angle: Math.PI / 4 }
      expect(OBBOps.overlaps(a, b)).toBe(true)
      expect(OBBOps.overlaps(a, c)).toBe(false)
    })
  })

  describe("overlapsBox", () => {
    test("should delegate to overlaps() against the box converted to an OBB", () => {
      const obb: TOBB = { center: { x: 0, y: 0 }, width: 10, height: 10, angle: 0 }
      expect(OBBOps.overlapsBox(obb, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
      expect(OBBOps.overlapsBox(obb, { x: 100, y: 100, width: 10, height: 10 })).toBe(false)
    })
  })

  describe("isContained", () => {
    test("should check the axis-aligned box when angle is 0", () => {
      const obb: TOBB = { center: { x: 5, y: 5 }, width: 2, height: 2, angle: 0 }
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      expect(OBBOps.isContained(obb, box)).toBe(true)
      expect(OBBOps.isContained({ ...obb, center: { x: 100, y: 100 } }, box)).toBe(false)
    })

    test("should check every rotated corner is inside the box when angle is non-zero", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      const insideRotated: TOBB = { center: { x: 5, y: 5 }, width: 4, height: 4, angle: Math.PI / 4 }
      const outsideRotated: TOBB = { center: { x: 5, y: 5 }, width: 10, height: 10, angle: Math.PI / 4 }
      expect(OBBOps.isContained(insideRotated, box)).toBe(true)
      expect(OBBOps.isContained(outsideRotated, box)).toBe(false)
    })
  })

  describe("contains", () => {
    test("should return true when every corner of b is inside a", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 20, height: 20, angle: 0 }
      const b: TOBB = { center: { x: 0, y: 0 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.contains(a, b)).toBe(true)
    })

    test("should return false when a corner of b is outside a", () => {
      const a: TOBB = { center: { x: 0, y: 0 }, width: 20, height: 20, angle: 0 }
      const b: TOBB = { center: { x: 15, y: 0 }, width: 2, height: 2, angle: 0 }
      expect(OBBOps.contains(a, b)).toBe(false)
    })
  })

  describe("createFromPointsAtAngle", () => {
    test("should match createFromPoints at angle 0", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 4 },
        { x: 3, y: -2 },
      ]
      expect(OBBOps.createFromPointsAtAngle(points, 0)).toEqual(OBBOps.createFromPoints(points))
    })

    test("should hug a shape lying along the frame's own axis", () => {
      // A flat strip turned 45 degrees. Measured in its own frame it is 10 by 0; against the axes it
      // would read about 7.07 on each side, a box holding far more than the strip.
      const diagonal: TPoint[] = [
        { x: 0, y: 0 },
        { x: 10 * Math.SQRT1_2, y: 10 * Math.SQRT1_2 },
      ]
      const obb = OBBOps.createFromPointsAtAngle(diagonal, Math.PI / 4)
      expect(obb.width).toBeCloseTo(10, 8)
      expect(obb.height).toBeCloseTo(0, 8)
      expect(obb.angle).toBe(Math.PI / 4)
    })

    test("should centre on the extents, not on the crowd of points", () => {
      // Nine points bunched at the left end and one alone at the right. The centre of the box is 5;
      // the centroid of the points is 0.5, which is where `fromCorners` would put it.
      const lopsided: TPoint[] = [...Array.from({ length: 9 }, () => ({ x: 0, y: 0 })), { x: 10, y: 0 }]
      expect(OBBOps.createFromPointsAtAngle(lopsided, 0).center).toEqual({ x: 5, y: 0 })
    })

    test("should keep the angle on an empty list rather than invent a shape", () => {
      expect(OBBOps.createFromPointsAtAngle([], Math.PI / 3)).toEqual({
        center: { x: 0, y: 0 },
        width: 0,
        height: 0,
        angle: Math.PI / 3,
      })
    })
  })
})
