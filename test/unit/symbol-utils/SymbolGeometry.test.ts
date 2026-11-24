import { MatrixTransform, PointSet2d, StrokeUtil, SymbolGeometry, SymbolStore, registerBuiltinSymbolUtils, symbolRegistry } from "@/iink"
import type { TStroke } from "@/iink"

describe("SymbolGeometry", () => {
  beforeAll(() => registerBuiltinSymbolUtils())

  const buildStroke = () =>
    StrokeUtil.createFromPartial({
      pointers: [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 4, dt: 1, p: 1 },
      ],
    })

  test("computes a frozen symbol's geometry once and serves it from cache after", () => {
    const stroke = Object.freeze(buildStroke())
    const util = symbolRegistry.getUtilFor(stroke)
    const spy = jest.spyOn(util, "getGeometry")

    const first = SymbolGeometry.boundsOf(stroke)
    const second = SymbolGeometry.boundsOf(stroke)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(second).toBe(first)
    spy.mockRestore()
  })

  test("does not cache an unfrozen draft, whose geometry can still change under it", () => {
    const draft = buildStroke()
    const util = symbolRegistry.getUtilFor(draft)
    const spy = jest.spyOn(util, "getGeometry")

    const before = SymbolGeometry.boundsOf(draft)
    draft.pointers.push({ x: 100, y: 100, dt: 2, p: 1 })
    const after = SymbolGeometry.boundsOf(draft)

    expect(spy).toHaveBeenCalledTimes(2)
    expect(after.width).toBeGreaterThan(before.width)
    spy.mockRestore()
  })

  test("gives two distinct symbol objects two distinct cache entries", () => {
    const a = Object.freeze(buildStroke())
    const b = Object.freeze(buildStroke())

    expect(SymbolGeometry.boundsOf(a)).not.toBe(SymbolGeometry.boundsOf(b))
    expect(SymbolGeometry.boundsOf(a)).toEqual(SymbolGeometry.boundsOf(b))
  })

  test("exposes each derived field through its own accessor", () => {
    const stroke = Object.freeze(buildStroke())

    expect(SymbolGeometry.verticesOf(stroke)).toEqual(SymbolGeometry.of(stroke).vertices)
    expect(SymbolGeometry.edgesOf(stroke)).toEqual(SymbolGeometry.of(stroke).edges)
    // Snap points are the util's answer, not the geometry's: a shape describes an outline, where
    // a symbol decides where it offers to snap.
    expect(SymbolGeometry.snapPointsOf(stroke)).toEqual(symbolRegistry.getUtilFor(stroke).getSnapPoints(stroke))
    expect(SymbolGeometry.lengthOf(stroke)).toEqual(SymbolGeometry.of(stroke).length)
  })

  // The tests above only prove the cache is self-consistent (same call returns the same object
  // twice, distinct objects get distinct entries). None of them would catch a cache that faithfully
  // and consistently serves the *wrong* answer. These compare against values computed by hand, or by
  // a code path independent of the cache, so a geometrically wrong result fails here even though it
  // would pass every test above.

  test("computes bounds matching a hand-computed oriented bounding box", () => {
    // Points (0,0) and (10,4): axis-aligned box is x:[0,10], y:[0,4] -> center (5,2), 10x4, angle 0.
    const stroke = Object.freeze(buildStroke())

    expect(SymbolGeometry.boundsOf(stroke)).toEqual({
      center: { x: 5, y: 2 },
      width: 10,
      height: 4,
      angle: 0,
    })
  })

  test("computes bounds matching the stroke's own geometry", () => {
    const stroke = buildStroke()
    const expected = new PointSet2d(stroke.pointers).bounds
    Object.freeze(stroke)

    expect(SymbolGeometry.boundsOf(stroke)).toEqual(expected)
  })

  test("computes length matching the hand-computed distance between the two pointers", () => {
    // sqrt((10-0)^2 + (4-0)^2) = sqrt(116)
    const stroke = Object.freeze(buildStroke())

    expect(SymbolGeometry.lengthOf(stroke)).toBeCloseTo(Math.sqrt(116), 10)
  })

  // A cached entry must be immutable, not merely reused. Some utils hand back a symbol's own
  // already-frozen data (safe as-is), others build fresh, unfrozen arrays — without freezing the
  // cache's own output, a single stray write on one of the latter poisons every later read of that
  // symbol permanently, since a frozen symbol's entry is never recomputed.
  test("freezes cached geometry, so a stray write throws instead of poisoning every later read", () => {
    const stroke = Object.freeze(buildStroke())
    const bounds = SymbolGeometry.boundsOf(stroke)

    expect(Object.isFrozen(bounds)).toBe(true)
    expect(() => {
      bounds.width = 999
    }).toThrow(TypeError)
    expect(SymbolGeometry.boundsOf(stroke).width).toBe(bounds.width)
  })

  test("freezes the arrays inside cached geometry too, not just the geometry object itself", () => {
    const stroke = Object.freeze(buildStroke())
    const geometry = SymbolGeometry.of(stroke)

    expect(Object.isFrozen(geometry.vertices)).toBe(true)
    expect(Object.isFrozen(geometry.edges)).toBe(true)
    expect(Object.isFrozen(geometry.bounds)).toBe(true)
    // The geometry object itself, so nothing can swap a derived field out from under the cache.
    expect(Object.isFrozen(geometry)).toBe(true)
  })

  // The accessors must not rely on `this`: a migration across hundreds of read sites will pass them
  // around detached from the SymbolGeometry object — destructured, or handed to Array#map — and
  // TypeScript cannot catch a `this`-bound method breaking under that shape.
  test("accessors work detached from the object, e.g. destructured or passed to Array#map", () => {
    const stroke = Object.freeze(buildStroke())
    const { boundsOf } = SymbolGeometry

    expect(boundsOf(stroke)).toEqual(SymbolGeometry.of(stroke).bounds)
    expect([stroke].map(SymbolGeometry.boundsOf)).toEqual([SymbolGeometry.of(stroke).bounds])
  })

  // The cache's whole "no invalidation needed" argument rests on SymbolStore deep-freezing what it
  // commits, not on however a test happens to call Object.freeze. This ties the two files together
  // for real, instead of trusting a shallow-frozen fixture to stand in for a store-committed record.
  test("reads correct, cached geometry off a symbol committed through a real SymbolStore", () => {
    const store = new SymbolStore<TStroke>()
    const stroke = buildStroke()
    store.add(stroke)
    const record = store.get(stroke.id)!

    expect(Object.isFrozen(record)).toBe(true)
    expect(Object.isFrozen(record.pointers)).toBe(true)

    const util = symbolRegistry.getUtilFor(record)
    const spy = jest.spyOn(util, "getGeometry")

    expect(SymbolGeometry.boundsOf(record)).toEqual(new PointSet2d(record.pointers).bounds)
    SymbolGeometry.boundsOf(record)

    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  describe("transform", () => {
    test("moves the computed bounds without touching the stored coordinates", () => {
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 0, dt: 1, p: 1 },
        ],
      })
      const before = SymbolGeometry.boundsOf(stroke).center

      stroke.transform = MatrixTransform.identity().translate(100, 50)
      const after = SymbolGeometry.boundsOf(stroke).center

      expect(after.x).toBeCloseTo(before.x + 100)
      expect(after.y).toBeCloseTo(before.y + 50)
      expect(stroke.pointers[0]).toEqual({ x: 0, y: 0, dt: 0, p: 1 })
    })

    test("carries the matrix rotation into the bounds angle, in radians, without corrupting width/height", () => {
      // Hand-computed, not read off the code under test: raw bounds are center (5,0), width 10,
      // height 0, angle 0 (StrokeUtil.computeBounds is always axis-aligned). `rotate(PI/2, {0,0})`
      // rounds cos/sin to exactly 0/1 (MatrixTransform.rotate), giving matrix {xx:0,yx:1,xy:-1,yy:0}.
      // Every raw corner (a degenerate box: (0,0) and (10,0) each twice) maps to (0,0) or (0,10), so
      // the rotated box is still a 10-long, 0-wide segment — center (0,5), width 10, height 0 — just
      // turned 90 degrees, i.e. PI/2 radians, matching TOBB.angle's own convention. A bug that
      // wrapped this in convertRadianToDegree left the angle numerically as "90" (looking plausible
      // in isolation) while corrupting width/height into ~8.94/~4.48 — which is why both are
      // asserted here, not just the angle.
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 0, dt: 1, p: 1 },
        ],
      })
      stroke.transform = MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })

      const bounds = SymbolGeometry.boundsOf(stroke)
      expect(bounds.angle).toBeCloseTo(Math.PI / 2)
      expect(bounds.width).toBeCloseTo(10)
      expect(bounds.height).toBeCloseTo(0)
      expect(bounds.center.x).toBeCloseTo(0)
      expect(bounds.center.y).toBeCloseTo(5)
    })

    test("a symbol starts with the identity matrix", () => {
      const stroke = StrokeUtil.createFromPartial({ pointers: [{ x: 0, y: 0, dt: 0, p: 1 }] })
      expect(stroke.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 })
    })

    test("leaves length unchanged under a pure rotation", () => {
      // Points (0,0) and (10,0): length is 10. A rotation has xx=cos, yx=sin with hypot(xx,yx)=1, so
      // `length * hypot(matrix.xx, matrix.yx)` must leave it exactly where it started.
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 0, dt: 1, p: 1 },
        ],
      })
      stroke.transform = MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })

      expect(SymbolGeometry.lengthOf(stroke)).toBeCloseTo(10)
    })

    test("scales length under a pure scale", () => {
      const stroke = StrokeUtil.createFromPartial({
        pointers: [
          { x: 0, y: 0, dt: 0, p: 1 },
          { x: 10, y: 0, dt: 1, p: 1 },
        ],
      })
      stroke.transform = MatrixTransform.identity().scale(2, 2)

      expect(SymbolGeometry.lengthOf(stroke)).toBeCloseTo(20)
    })

    test("does not cache the raw geometry: two symbols never share a cache entry either way", () => {
      // Guards the design choice the brief calls out explicitly: applyMatrix runs inside compute(),
      // once per (frozen) symbol, not on every read. Two distinct frozen symbols with the same matrix
      // still get two distinct, independently-cached, correctly-transformed results.
      const buildTranslated = () => {
        const stroke = StrokeUtil.createFromPartial({
          pointers: [
            { x: 0, y: 0, dt: 0, p: 1 },
            { x: 10, y: 0, dt: 1, p: 1 },
          ],
        })
        stroke.transform = MatrixTransform.identity().translate(7, 0)
        return Object.freeze(stroke)
      }
      const a = buildTranslated()
      const b = buildTranslated()

      expect(SymbolGeometry.boundsOf(a)).not.toBe(SymbolGeometry.boundsOf(b))
      expect(SymbolGeometry.boundsOf(a).center.x).toBeCloseTo(12)
      expect(SymbolGeometry.boundsOf(b).center.x).toBeCloseTo(12)
    })
  })

  describe("rawOf", () => {
    const buildMoved = () => {
      const stroke = buildStroke()
      stroke.transform = MatrixTransform.identity().translate(100, 50)
      return Object.freeze(stroke)
    }

    test("returns the untransformed geometry even when the symbol has moved", () => {
      const stroke = buildMoved()

      expect(SymbolGeometry.rawOf(stroke).bounds).toEqual(new PointSet2d(stroke.pointers).bounds)
      expect(SymbolGeometry.rawOf(stroke).bounds).not.toEqual(SymbolGeometry.boundsOf(stroke))
    })

    test("computes a frozen symbol's raw geometry once and serves it from cache after", () => {
      const stroke = buildMoved()
      const util = symbolRegistry.getUtilFor(stroke)
      const spy = jest.spyOn(util, "getGeometry")

      const first = SymbolGeometry.rawOf(stroke)
      const second = SymbolGeometry.rawOf(stroke)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(second).toBe(first)
      spy.mockRestore()
    })

    test("shares its cached computation with of()/boundsOf(), so a transformed read costs no extra geometry build", () => {
      const stroke = buildMoved()
      const util = symbolRegistry.getUtilFor(stroke)
      const spy = jest.spyOn(util, "getGeometry")

      SymbolGeometry.rawOf(stroke)
      SymbolGeometry.boundsOf(stroke)

      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
    })
  })

  // The `a util still on computeGeometry` suite that stood here is gone with the record path it
  // covered: every util describes itself with a `Geometry2d` now, so the wrapper it tested has no
  // caller left and no longer exists.
})
