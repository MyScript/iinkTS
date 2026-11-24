import { describe, test, expect } from "@jest/globals"
import { MatrixTransform, OBBOps, PointSet2d, Polygon2d, Polyline2d, TPoint } from "@/iink"

/** An open path: two sides of a square, without the two that would close it. */
const PATH: TPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
]

describe("Polyline2d", () => {
  describe("shape", () => {
    test("should be open, with one edge fewer than a polygon on the same points", () => {
      const line = new Polyline2d(PATH)
      expect(line.isClosed).toBe(false)
      expect(line.edges).toHaveLength(2)
      expect(new Polygon2d(PATH).edges).toHaveLength(3)
    })

    test("should measure a path length, not a perimeter", () => {
      expect(new Polyline2d(PATH).length).toBe(20)
      // The closing side back to the start is what a polygon adds, and it is 10√2 long.
      expect(new Polygon2d(PATH).length).toBeCloseTo(20 + 10 * Math.SQRT2, 10)
    })

    test("should never be filled, having no inside", () => {
      const line = new Polyline2d(PATH)
      expect(line.isFilled).toBe(false)
      expect(line.containsPoint({ x: 8, y: 2 })).toBe(false)
    })

    test("should bound its vertices", () => {
      expect(OBBOps.toBox(new Polyline2d(PATH).bounds)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    })
  })

  describe("overlapsBox", () => {
    test("should be caught by a query its path crosses", () => {
      expect(new Polyline2d(PATH).overlapsBox({ x: 4, y: -2, width: 2, height: 4 })).toBe(true)
    })

    // The difference from PointSet2d, on the same points: a drawn line is caught where it passes, a
    // run of samples only where a sample lands.
    test("should be caught between two vertices, where a PointSet2d on the same points is not", () => {
      const between = { x: 4, y: -1, width: 2, height: 2 }
      expect(new Polyline2d(PATH).overlapsBox(between)).toBe(true)
      expect(new PointSet2d(PATH).overlapsBox(between)).toBe(false)
    })

    test("should miss a query it never reaches", () => {
      expect(new Polyline2d(PATH).overlapsBox({ x: 100, y: 100, width: 5, height: 5 })).toBe(false)
    })

    // No closing edge means no phantom side: a query sitting where a polygon's closing side would run
    // touches nothing here.
    test("should miss a query that only the closing side would have caught", () => {
      const onTheClosingSide = { x: 4, y: 5, width: 2, height: 2 }
      expect(new Polygon2d(PATH).overlapsBox(onTheClosingSide)).toBe(true)
      expect(new Polyline2d(PATH).overlapsBox(onTheClosingSide)).toBe(false)
    })
  })

  describe("transform", () => {
    test("should move its vertices and stay a Polyline2d", () => {
      const moved = new Polyline2d(PATH).transform(MatrixTransform.identity().translate(5, 5))
      expect(moved).toBeInstanceOf(Polyline2d)
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: 5, y: 5, width: 10, height: 10 })
    })

    test("should keep a turned path's box tight", () => {
      const flat = new Polyline2d([
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ])
      const turned = flat.transform(MatrixTransform.identity().rotate(Math.PI / 4))
      expect(turned.bounds.width).toBeCloseTo(10, 2)
      expect(turned.bounds.height).toBeCloseTo(0, 2)
    })
  })
})
