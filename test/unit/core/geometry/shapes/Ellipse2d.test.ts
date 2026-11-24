import { describe, test, expect } from "@jest/globals"
import { Ellipse2d, MatrixTransform, OBBOps, Polygon2d } from "@/iink"

const CENTER = { x: 0, y: 0 }

describe("Ellipse2d", () => {
  describe("bounds", () => {
    test("should be the radii doubled when unturned", () => {
      const ellipse = Ellipse2d.fromRadii(CENTER, 30, 10)
      expect(OBBOps.toBox(ellipse.bounds)).toEqual({ x: -30, y: -10, width: 60, height: 20 })
    })

    // Closed form, not sampled. Turned deliberately: an unturned ellipse is sampled at angles 0 and
    // pi/2, which land exactly on its extremes, so its sampled box happens to be exact and would
    // prove nothing. Turned, no vertex lands there and the chords fall inside the curve.
    test("should be wider than the box around its own sampled outline", () => {
      const ellipse = Ellipse2d.fromRadii(CENTER, 30, 10, Math.PI / 5)
      const sampled = OBBOps.createFromPoints(ellipse.vertices)
      expect(ellipse.bounds.width).toBeGreaterThan(sampled.width)
      expect(ellipse.bounds.height).toBeGreaterThan(sampled.height)
    })

    test("should widen correctly when the ellipse is turned against the axes", () => {
      // A 30x10 ellipse turned a quarter turn is 10 wide and 30 tall.
      const turned = Ellipse2d.fromRadii(CENTER, 30, 10, Math.PI / 2)
      expect(turned.bounds.width).toBeCloseTo(20, 8)
      expect(turned.bounds.height).toBeCloseTo(60, 8)
    })
  })

  describe("pointAt", () => {
    test("should walk the ellipse from its own axes", () => {
      const ellipse = Ellipse2d.fromRadii(CENTER, 30, 10)
      expect(ellipse.pointAt(0).x).toBeCloseTo(30, 10)
      expect(ellipse.pointAt(0).y).toBeCloseTo(0, 10)
      expect(ellipse.pointAt(Math.PI / 2).x).toBeCloseTo(0, 10)
      expect(ellipse.pointAt(Math.PI / 2).y).toBeCloseTo(10, 10)
    })

    test("should follow the orientation it was built with", () => {
      const turned = Ellipse2d.fromRadii(CENTER, 30, 10, Math.PI / 2)
      expect(turned.pointAt(0).x).toBeCloseTo(0, 10)
      expect(turned.pointAt(0).y).toBeCloseTo(30, 10)
    })
  })

  describe("shape", () => {
    test("should be closed, and filled only when asked", () => {
      expect(Ellipse2d.fromRadii(CENTER, 30, 10).isClosed).toBe(true)
      expect(Ellipse2d.fromRadii(CENTER, 30, 10).isFilled).toBe(false)
      expect(Ellipse2d.fromRadii(CENTER, 30, 10, 0, true).isFilled).toBe(true)
    })

    test("should catch a query inside it only when filled", () => {
      const inside = { x: -2, y: -2, width: 4, height: 4 }
      expect(Ellipse2d.fromRadii(CENTER, 30, 10, 0, true).overlapsBox(inside)).toBe(true)
      expect(Ellipse2d.fromRadii(CENTER, 30, 10).overlapsBox(inside)).toBe(false)
    })

    test("should miss a query in the corner its box covers but the curve does not", () => {
      expect(Ellipse2d.fromRadii(CENTER, 30, 10, 0, true).overlapsBox({ x: 28, y: 8, width: 1, height: 1 })).toBe(false)
    })
  })

  describe("transform", () => {
    test("should compose exactly under a non-uniform scale", () => {
      const stretched = Ellipse2d.fromRadii(CENTER, 10, 10).transform(MatrixTransform.identity().scale(3, 0.5))
      expect(OBBOps.toBox(stretched.bounds)).toEqual({ x: -30, y: -5, width: 60, height: 10 })
    })

    // Composition, not resampling: the axes are multiplied into the matrix each time, so a shape
    // stretched and squeezed back is the shape it started as, to the last decimal.
    test("should return to itself exactly after a transform and its inverse", () => {
      const once = Ellipse2d.fromRadii(CENTER, 10, 10).transform(MatrixTransform.identity().scale(4, 4))
      const twice = once.transform(MatrixTransform.identity().scale(0.25, 0.25))
      expect(OBBOps.toBox(twice.bounds)).toEqual({ x: -10, y: -10, width: 20, height: 20 })
    })

    // A sampled outline cannot say this: its box is the box of the chords, short of the curve by the
    // sagitta on any side where no vertex lands on the extreme.
    test("should keep a turned ellipse's box exact where a sampled one falls short", () => {
      const turned = Ellipse2d.fromRadii(CENTER, 30, 10, Math.PI / 5)
      const sampled = new Polygon2d(turned.vertices)
      expect(turned.bounds.width).toBeGreaterThan(sampled.bounds.width)
    })

    test("should move the centre with the matrix", () => {
      const moved = Ellipse2d.fromRadii(CENTER, 30, 10).transform(MatrixTransform.identity().translate(5, 7))
      expect(moved.center).toEqual({ x: 5, y: 7 })
    })

    test("should stay an Ellipse2d and keep the fill", () => {
      const moved = Ellipse2d.fromRadii(CENTER, 30, 10, 0, true).transform(MatrixTransform.identity().rotate(1))
      expect(moved).toBeInstanceOf(Ellipse2d)
      expect(moved.isFilled).toBe(true)
    })
  })
})
