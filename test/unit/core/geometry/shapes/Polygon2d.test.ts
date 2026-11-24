import { describe, test, expect } from "@jest/globals"
import { MatrixTransform, OBBOps, Polygon2d, TBox, TPoint } from "@/iink"

/** A 10x10 square, corners on the axes. */
const SQUARE: TPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]

describe("Polygon2d", () => {
  describe("shape", () => {
    test("should be closed, so the last side is testable", () => {
      const polygon = new Polygon2d(SQUARE)
      expect(polygon.isClosed).toBe(true)
      expect(polygon.edges).toHaveLength(4)
      expect(polygon.length).toBe(40)
    })

    test("should be an outline unless told otherwise", () => {
      expect(new Polygon2d(SQUARE).isFilled).toBe(false)
      expect(new Polygon2d(SQUARE, true).isFilled).toBe(true)
    })

    test("should bound its vertices", () => {
      expect(OBBOps.toBox(new Polygon2d(SQUARE).bounds)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    })
  })

  describe("overlapsBox", () => {
    const inside: TBox = { x: 3, y: 3, width: 4, height: 4 }

    test.each<[string, TBox]>([
      ["a query the polygon sits inside", { x: -5, y: -5, width: 30, height: 30 }],
      ["a query one side crosses", { x: 5, y: 5, width: 30, height: 30 }],
    ])("should overlap %s, filled or not", (_label, box) => {
      expect(new Polygon2d(SQUARE).overlapsBox(box)).toBe(true)
      expect(new Polygon2d(SQUARE, true).overlapsBox(box)).toBe(true)
    })

    test("should miss a query nowhere near it", () => {
      expect(new Polygon2d(SQUARE, true).overlapsBox({ x: 100, y: 100, width: 5, height: 5 })).toBe(false)
    })

    // The gap `polygonOverlapsBox` left, asserted against that function directly so the difference is
    // the test rather than a claim about it. Both of its halves are about the boundary, so a query
    // lying wholly within the shape and crossing nothing was missed — wrongly for a filled shape.
    test("should overlap a query lying wholly inside it when filled, where polygonOverlapsBox does not", () => {
      const filled = new Polygon2d(SQUARE, true)
      const edges = filled.edges

      expect(OBBOps.polygonOverlapsBox(filled.bounds, edges, inside)).toBe(false)
      expect(filled.overlapsBox(inside)).toBe(true)
    })

    test("should miss that same query when it is an outline, agreeing with polygonOverlapsBox", () => {
      const outline = new Polygon2d(SQUARE)

      expect(OBBOps.polygonOverlapsBox(outline.bounds, outline.edges, inside)).toBe(false)
      expect(outline.overlapsBox(inside)).toBe(false)
    })
  })

  describe("containsPoint", () => {
    test("should contain an interior point only when filled", () => {
      expect(new Polygon2d(SQUARE, true).containsPoint({ x: 5, y: 5 })).toBe(true)
      expect(new Polygon2d(SQUARE).containsPoint({ x: 5, y: 5 })).toBe(false)
    })
  })

  describe("transform", () => {
    test("should move the vertices and keep the fill", () => {
      const moved = new Polygon2d(SQUARE, true).transform(MatrixTransform.identity().translate(100, 0))
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: 100, y: 0, width: 10, height: 10 })
      expect(moved.isFilled).toBe(true)
      expect(moved).toBeInstanceOf(Polygon2d)
    })

    test("should keep a turned polygon's box tight", () => {
      const turned = new Polygon2d(SQUARE).transform(MatrixTransform.identity().rotate(Math.PI / 4))
      // Still 10 by 10 in its own frame; measured against the axes it would read about 14.1 a side.
      expect(turned.bounds.width).toBeCloseTo(10, 2)
      expect(turned.bounds.height).toBeCloseTo(10, 2)
    })

    test("should stay exact under a non-uniform scale, where a tessellation would not", () => {
      const moved = new Polygon2d(SQUARE).transform(MatrixTransform.identity().scale(3, 0.5))
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: 0, y: 0, width: 30, height: 5 })
    })
  })
})
