import { describe, test, expect } from "@jest/globals"
import { Geometry2d, MatrixTransform, OBBOps, TBox, TGeometry2dOptions, TMatrixTransform, TPoint } from "@/iink"

/**
 * A concrete shape whose vertices are handed to it, so the base class can be exercised without
 * waiting on the real primitives. `transform` maps the vertices forward, which is the trivially
 * correct thing for a straight-edged shape and exactly what a real `Polygon2d` will do.
 */
class TestGeometry extends Geometry2d {
  readonly #points: TPoint[]
  #computeCount = 0

  constructor(points: TPoint[], options: TGeometry2dOptions) {
    super(options)
    this.#points = points
  }

  get computeCount(): number {
    return this.#computeCount
  }

  protected computeVertices(): TPoint[] {
    this.#computeCount++
    return this.#points
  }

  transform(matrix: TMatrixTransform): TestGeometry {
    return new TestGeometry(
      this.#points.map((p) => MatrixTransform.applyToPoint(matrix, p)),
      { isClosed: this.isClosed, isFilled: this.isFilled, frameAngle: this.rotatedFrameAngle(matrix) }
    )
  }
}

/** A 10x10 square with its corners on the axes, used as both a shape and a query. */
const SQUARE: TPoint[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]

const filledSquare = (): TestGeometry => new TestGeometry(SQUARE, { isClosed: true, isFilled: true })
const hollowSquare = (): TestGeometry => new TestGeometry(SQUARE, { isClosed: true, isFilled: false })
const openPath = (): TestGeometry => new TestGeometry(SQUARE, { isClosed: false, isFilled: false })

describe("Geometry2d", () => {
  describe("edges", () => {
    test("should close the ring when isClosed, so the last side is testable", () => {
      const edges = filledSquare().edges
      expect(edges).toHaveLength(4)
      expect(edges[3]).toEqual({ p1: { x: 0, y: 10 }, p2: { x: 0, y: 0 } })
    })

    test("should leave the ring open when not isClosed", () => {
      expect(openPath().edges).toHaveLength(3)
    })

    test("should have no edges with fewer than two vertices", () => {
      expect(new TestGeometry([{ x: 1, y: 2 }], { isClosed: true, isFilled: true }).edges).toEqual([])
    })
  })

  describe("length", () => {
    test("should be the perimeter when closed", () => {
      expect(filledSquare().length).toBe(40)
    })

    test("should drop the closing side when open", () => {
      expect(openPath().length).toBe(30)
    })
  })

  describe("bounds", () => {
    test("should be the box around every vertex", () => {
      expect(OBBOps.toBox(filledSquare().bounds)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    })
  })

  describe("derived values", () => {
    test("should compute the vertices once however many derived reads follow", () => {
      const geometry = filledSquare()
      // Every one of these is derived from the vertices.
      void geometry.bounds
      void geometry.edges
      void geometry.length
      void geometry.vertices
      expect(geometry.computeCount).toBe(1)
    })
  })

  describe("overlapsBox", () => {
    test("should overlap a query the shape sits inside", () => {
      expect(filledSquare().overlapsBox({ x: -5, y: -5, width: 30, height: 30 })).toBe(true)
    })

    test("should overlap a query one edge crosses", () => {
      expect(filledSquare().overlapsBox({ x: 5, y: 5, width: 30, height: 30 })).toBe(true)
    })

    test("should not overlap a query that misses the shape entirely", () => {
      expect(filledSquare().overlapsBox({ x: 100, y: 100, width: 5, height: 5 })).toBe(false)
    })

    // The hole `polygonOverlapsBox` left: both halves of that test are about the boundary, so a
    // query wholly inside the shape, crossing nothing, was missed.
    test("should overlap a query lying wholly inside a filled shape, touching no edge", () => {
      const query: TBox = { x: 3, y: 3, width: 4, height: 4 }
      expect(filledSquare().overlapsBox(query)).toBe(true)
    })

    test("should not overlap that same query when the shape is unfilled", () => {
      const query: TBox = { x: 3, y: 3, width: 4, height: 4 }
      expect(hollowSquare().overlapsBox(query)).toBe(false)
    })
  })

  describe("containsPoint", () => {
    test("should contain a point inside a filled closed shape", () => {
      expect(filledSquare().containsPoint({ x: 5, y: 5 })).toBe(true)
    })

    test("should contain nothing when unfilled", () => {
      expect(hollowSquare().containsPoint({ x: 5, y: 5 })).toBe(false)
    })

    test("should contain nothing when open, filled or not", () => {
      expect(new TestGeometry(SQUARE, { isClosed: false, isFilled: true }).containsPoint({ x: 5, y: 5 })).toBe(false)
    })

    test("should not contain a point outside", () => {
      expect(filledSquare().containsPoint({ x: -1, y: 5 })).toBe(false)
    })
  })

  describe("nearestPoint and distanceToPoint", () => {
    test("should find the closest point on the outline", () => {
      expect(filledSquare().nearestPoint({ x: -4, y: 5 })).toEqual({ x: 0, y: 5 })
    })

    test("should measure to the outline, not to the centre", () => {
      expect(filledSquare().distanceToPoint({ x: -4, y: 5 })).toBe(4)
    })

    test("should measure to the outline from inside too", () => {
      expect(filledSquare().distanceToPoint({ x: 2, y: 5 })).toBe(2)
    })

    test("should fall back to the single vertex when there are no edges", () => {
      const point = { x: 1, y: 2 }
      expect(new TestGeometry([point], { isClosed: true, isFilled: true }).nearestPoint({ x: 9, y: 9 })).toEqual(point)
    })
  })

  describe("hitTestPoint", () => {
    test("should hit a point on the outline with no margin", () => {
      expect(hollowSquare().hitTestPoint({ x: 0, y: 5 })).toBe(true)
    })

    test("should miss a point off the outline of an unfilled shape", () => {
      expect(hollowSquare().hitTestPoint({ x: 5, y: 5 })).toBe(false)
    })

    test("should hit anywhere inside a filled shape, however far from the outline", () => {
      expect(filledSquare().hitTestPoint({ x: 5, y: 5 })).toBe(true)
    })

    test("should hit within the margin of the outline", () => {
      expect(hollowSquare().hitTestPoint({ x: -2, y: 5 }, 3)).toBe(true)
      expect(hollowSquare().hitTestPoint({ x: -4, y: 5 }, 3)).toBe(false)
    })
  })

  describe("transform", () => {
    test("should return a new geometry carrying the matrix, leaving the original alone", () => {
      const original = filledSquare()
      const moved = original.transform(MatrixTransform.identity().translate(100, 0))
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: 100, y: 0, width: 10, height: 10 })
      expect(OBBOps.toBox(original.bounds)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    })

    test("should keep a rotated shape's box tight instead of widening it to the axes", () => {
      // A flat 10-wide strip turned by 45 degrees. Measured in its own frame it is still 10 by 0;
      // measured against the axes it would come out about 7.07 on each side, containing far more
      // than the shape does.
      const strip = new TestGeometry(
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        { isClosed: false, isFilled: false }
      )
      const turned = strip.transform(MatrixTransform.identity().rotate(Math.PI / 4))

      // Three decimals: `MatrixTransform.rotation` recovers the angle through `acos`, so 45 degrees
      // comes back to about 1e-5. Pre-existing, and far below anything visible.
      expect(turned.frameAngle).toBeCloseTo(Math.PI / 4, 3)
      expect(turned.bounds.width).toBeCloseTo(10, 3)
      expect(turned.bounds.height).toBeCloseTo(0, 3)
    })

    test("should accumulate the frame angle across successive transforms", () => {
      const once = filledSquare().transform(MatrixTransform.identity().rotate(Math.PI / 6))
      const twice = once.transform(MatrixTransform.identity().rotate(Math.PI / 6))
      expect(twice.frameAngle).toBeCloseTo(once.frameAngle * 2, 3)
    })

    test("should keep the closed and filled flags", () => {
      const moved = hollowSquare().transform(MatrixTransform.identity())
      expect(moved.isClosed).toBe(true)
      expect(moved.isFilled).toBe(false)
    })
  })
})
