import { describe, test, expect } from "@jest/globals"
import { Circle2d, Ellipse2d, MatrixTransform, OBBOps, Polygon2d } from "@/iink"

const CENTER = { x: 100, y: 100 }
const RADIUS = 50

describe("Circle2d", () => {
  describe("bounds", () => {
    test("should be the radius doubled, without sampling the curve", () => {
      expect(OBBOps.toBox(new Circle2d(CENTER, RADIUS).bounds)).toEqual({ x: 50, y: 50, width: 100, height: 100 })
    })

    // The sampled outline is a chord inside the true curve, so a box measured from it is short on
    // every side. Exactness here is what keeps the box from shrinking as the curve is sampled.
    test("should be wider than the box around its own sampled outline", () => {
      const circle = new Circle2d(CENTER, RADIUS)
      const sampled = OBBOps.createFromPoints(circle.vertices)
      expect(circle.bounds.width).toBeGreaterThan(sampled.width)
      expect(circle.bounds.width - sampled.width).toBeLessThan(1)
    })
  })

  describe("overlapsBox", () => {
    test("should be caught by a query the circle sits inside", () => {
      expect(new Circle2d(CENTER, RADIUS).overlapsBox({ x: 0, y: 0, width: 300, height: 300 })).toBe(true)
    })

    test("should be caught by a query crossing its curve", () => {
      expect(new Circle2d(CENTER, RADIUS).overlapsBox({ x: 140, y: 90, width: 40, height: 20 })).toBe(true)
    })

    test("should miss a query in the corner its bounding box covers but the curve does not", () => {
      // A 4x4 query at the top-left corner of the bounds: inside the box, outside the circle, which a
      // box-based test would have called an overlap.
      expect(new Circle2d(CENTER, RADIUS).overlapsBox({ x: 51, y: 51, width: 4, height: 4 })).toBe(false)
    })

    test("should catch a query inside it only when filled", () => {
      const inside = { x: 95, y: 95, width: 10, height: 10 }
      expect(new Circle2d(CENTER, RADIUS, true).overlapsBox(inside)).toBe(true)
      expect(new Circle2d(CENTER, RADIUS).overlapsBox(inside)).toBe(false)
    })

    // The point of testing by radius rather than by the sampled outline: the sampled polygon dips
    // inside the curve between vertices, so a query grazing the circle there would be missed.
    test("should catch a graze the sampled outline would miss", () => {
      const circle = new Circle2d({ x: 0, y: 0 }, 100)
      const sampled = new Polygon2d(circle.vertices)
      // On the true curve, halfway between two samples: that is where the chord dips furthest inside
      // the circle, so a query sitting on the curve there is outside the sampled polygon entirely.
      const half = Math.PI / circle.vertices.length
      const onCurve = { x: -100 * Math.sin(half), y: 100 * Math.cos(half) }
      const graze = { x: onCurve.x - 0.05, y: onCurve.y - 0.05, width: 0.1, height: 0.1 }

      expect(sampled.overlapsBox(graze)).toBe(false)
      expect(circle.overlapsBox(graze)).toBe(true)
    })
  })

  describe("containsPoint", () => {
    test("should measure by distance, not by a polygon", () => {
      const filled = new Circle2d(CENTER, RADIUS, true)
      expect(filled.containsPoint({ x: 100, y: 149 })).toBe(true)
      expect(filled.containsPoint({ x: 100, y: 151 })).toBe(false)
    })

    test("should contain nothing when it is an outline", () => {
      expect(new Circle2d(CENTER, RADIUS).containsPoint(CENTER)).toBe(false)
    })
  })

  describe("transform", () => {
    test("should stay a circle under a uniform scale", () => {
      const moved = new Circle2d(CENTER, RADIUS).transform(MatrixTransform.identity().scale(2, 2))
      expect(moved).toBeInstanceOf(Circle2d)
      expect((moved as Circle2d).radius).toBeCloseTo(100, 10)
    })

    test("should stay a circle under a rotation", () => {
      const moved = new Circle2d(CENTER, RADIUS).transform(MatrixTransform.identity().rotate(Math.PI / 3))
      expect(moved).toBeInstanceOf(Circle2d)
      expect((moved as Circle2d).radius).toBeCloseTo(RADIUS, 6)
    })

    // The gain this class and Ellipse2d exist for: a circle stretched unevenly is an ellipse, given
    // exactly, not a polygon standing in for one.
    test("should become an exact ellipse under a non-uniform scale", () => {
      const moved = new Circle2d({ x: 0, y: 0 }, 10).transform(MatrixTransform.identity().scale(3, 0.5))

      expect(moved).toBeInstanceOf(Ellipse2d)
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: -30, y: -5, width: 60, height: 10 })
    })

    test("should keep the fill through either outcome", () => {
      expect(new Circle2d(CENTER, RADIUS, true).transform(MatrixTransform.identity().scale(2, 2)).isFilled).toBe(true)
      expect(new Circle2d(CENTER, RADIUS, true).transform(MatrixTransform.identity().scale(3, 1)).isFilled).toBe(true)
    })
  })
})
