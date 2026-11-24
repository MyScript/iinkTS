import { describe, test, expect } from "@jest/globals"
import { MatrixTransform, OBBOps, PointSet2d, StrokeUtil, TBox, TPoint, TStroke } from "@/iink"

/** Points far enough apart that a query box can sit between two of them without touching either. */
const SAMPLES: TPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 200, y: 0 },
]

const strokeOf = (points: TPoint[]): TStroke =>
  StrokeUtil.createFromPartial({ pointers: points.map((p, i) => ({ ...p, dt: i, p: 1 })) })

describe("PointSet2d", () => {
  describe("parity with the stroke's own derivations", () => {
    // The oracle is what the stroke already derived for itself before this class existed, and the
    // util over to this class on the strength of them matching.
    const stroke = strokeOf(SAMPLES)
    const geometry = new PointSet2d(stroke.pointers)

    test("should derive the same bounds", () => {
      expect(geometry.bounds).toEqual(new PointSet2d(stroke.pointers).bounds)
    })

    test("should derive the same edges, with no closing one", () => {
      expect(geometry.edges).toEqual(new PointSet2d(stroke.pointers).edges)
    })

    test("should derive the same length", () => {
      expect(geometry.length).toBe(new PointSet2d(stroke.pointers).length)
    })

    test("should derive the same vertices", () => {
      expect(geometry.vertices).toEqual(new PointSet2d(stroke.pointers).vertices)
    })

    test.each<[string, TBox]>([
      ["a box around every sample", { x: -10, y: -10, width: 300, height: 20 }],
      ["a box around one sample", { x: 90, y: -5, width: 20, height: 10 }],
      ["a box between two samples, crossing the segment", { x: 40, y: -5, width: 20, height: 10 }],
      ["a box nowhere near the stroke", { x: 1000, y: 1000, width: 10, height: 10 }],
      ["a box whose edge lands exactly on a sample", { x: 100, y: 0, width: 10, height: 10 }],
      ["a zero-sized box on a sample", { x: 0, y: 0, width: 0, height: 0 }],
    ])("should answer overlaps as the stroke always did for %s", (_label, box) => {
      expect(geometry.overlapsBox(box)).toBe(new PointSet2d(stroke.pointers).overlapsBox(box))
    })
  })

  describe("overlapsBox", () => {
    const geometry = new PointSet2d(SAMPLES)

    test("should catch a query holding a sample", () => {
      expect(geometry.overlapsBox({ x: 90, y: -5, width: 20, height: 10 })).toBe(true)
    })

    // The behaviour this class exists to keep: an edge-crossing test would call this an overlap.
    test("should miss a query that crosses the path between two samples", () => {
      const between: TBox = { x: 40, y: -5, width: 20, height: 10 }
      expect(geometry.overlapsBox(between)).toBe(false)
    })

    test("should include a sample lying exactly on the query's boundary", () => {
      expect(geometry.overlapsBox({ x: 100, y: 0, width: 10, height: 10 })).toBe(true)
    })

    test("should miss when nothing is near", () => {
      expect(geometry.overlapsBox({ x: 1000, y: 1000, width: 10, height: 10 })).toBe(false)
    })

    test("should never overlap with no samples at all", () => {
      expect(new PointSet2d([]).overlapsBox({ x: -1e6, y: -1e6, width: 2e6, height: 2e6 })).toBe(false)
    })
  })

  describe("shape flags", () => {
    test("should be neither closed nor filled", () => {
      const geometry = new PointSet2d(SAMPLES)
      expect(geometry.isClosed).toBe(false)
      expect(geometry.isFilled).toBe(false)
    })

    test("should not invent a closing edge across the stroke", () => {
      // Three samples make two segments, not three: a closing edge would run straight back from the
      // last sample to the first, lengthening the stroke and adding something to hit that was never
      // drawn.
      expect(new PointSet2d(SAMPLES).edges).toHaveLength(2)
      expect(new PointSet2d(SAMPLES).length).toBe(200)
    })

    test("should contain no point, having no inside", () => {
      expect(new PointSet2d(SAMPLES).containsPoint({ x: 100, y: 0 })).toBe(false)
    })
  })

  describe("transform", () => {
    test("should carry the samples through the matrix, leaving the original alone", () => {
      const original = new PointSet2d(SAMPLES)
      const moved = original.transform(MatrixTransform.identity().translate(10, 5))

      expect(moved.vertices).toEqual([
        { x: 10, y: 5 },
        { x: 110, y: 5 },
        { x: 210, y: 5 },
      ])
      expect(original.vertices).toEqual(SAMPLES)
    })

    test("should still be a PointSet2d, so a moved stroke keeps the sample test", () => {
      const moved = new PointSet2d(SAMPLES).transform(MatrixTransform.identity().translate(10, 5))
      expect(moved).toBeInstanceOf(PointSet2d)
      expect(moved.overlapsBox({ x: 50, y: 0, width: 20, height: 10 })).toBe(false)
    })

    test("should keep a turned stroke's box tight", () => {
      const turned = new PointSet2d(SAMPLES).transform(MatrixTransform.identity().rotate(Math.PI / 4))
      // 200 long and flat, whichever way it is turned. Against the axes it would read about 141 on
      // each side instead, a box containing far more than the stroke.
      //
      // Two decimals, not float precision: `MatrixTransform.rotation` recovers the angle through
      // `acos`, and comes back about 2e-3 radians off. Pre-existing — the facade's own `applyMatrix`
      // recovered the angle the same way — and over a 200-unit stroke that is 5e-4 of a unit, some
      // four orders of magnitude below a pixel. It is the recovery that is imprecise, not this box.
      expect(turned.bounds.width).toBeCloseTo(200, 2)
      expect(turned.bounds.height).toBeCloseTo(0, 2)
    })

    test("should scale the length with the matrix", () => {
      const moved = new PointSet2d(SAMPLES).transform(MatrixTransform.identity().scale(2, 2))
      expect(moved.length).toBe(400)
      expect(OBBOps.toBox(moved.bounds)).toEqual({ x: 0, y: 0, width: 400, height: 0 })
    })
  })
})
