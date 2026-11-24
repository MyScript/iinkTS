import { computeOutlinePointers, computeWidthProfile, PEN_NIBS, type TPointer } from "@/iink"

describe("computeWidthProfile", () => {
  /** A straight run of `n` points, `step` apart, one sample every `ms`. */
  const run = (n: number, step: number, ms: number): TPointer[] =>
    Array.from({ length: n }, (_, i) => ({ x: i * step, y: 0, dt: i * ms, p: 0.5 }))

  test("should draw a fast stroke thinner than a slow one covering the same path", () => {
    // The whole point of deriving width from speed: same geometry, different pen speed.
    const slow = computeWidthProfile(run(40, 4, 40), "mouse")
    const fast = computeWidthProfile(run(40, 4, 4), "mouse")
    const middle = Math.floor(40 / 2)
    expect(fast[middle]).toBeLessThan(slow[middle])
  })

  test("should not change width when the same motion is sampled twice as densely", () => {
    // The old estimator read the gap to the previous pointer, so coalescing or decimating the
    // samples silently changed the drawn thickness. Speed is distance over elapsed time, so the
    // same gesture must come out the same however it was sampled.
    const sparse = computeWidthProfile(run(21, 8, 20), "mouse")
    const dense = computeWidthProfile(run(41, 4, 10), "mouse")
    expect(dense[20]).toBeCloseTo(sparse[10], 2)
  })

  test("should taper both ends", () => {
    const profile = computeWidthProfile(run(40, 4, 20), "mouse")
    expect(profile[0]).toBeLessThan(profile[20])
    expect(profile[39]).toBeLessThan(profile[20])
  })

  test("should stay within the nib's bounds even at absurd speed", () => {
    Object.entries(PEN_NIBS).forEach(([nib, spec]) => {
      computeWidthProfile(run(30, 400, 1), "mouse", nib as keyof typeof PEN_NIBS).forEach((w) => {
        expect(w).toBeGreaterThanOrEqual(spec.min)
        expect(w).toBeLessThanOrEqual(spec.max)
      })
    })
  })

  test("should let a speed-driven nib reach at least full width on a deliberate stroke", () => {
    // Picking an expressive nib must not simply draw everything thinner: it decides how quickly
    // width is lost with speed, and a slow stroke has lost none of it yet. A broad edge is excluded
    // because speed is not what decides its width.
    const slow = run(40, 2, 40)
    ;(["ballpoint", "pencil", "brush"] as const).forEach((nib) => {
      expect(computeWidthProfile(slow, "mouse", nib)[20]).toBeGreaterThanOrEqual(1)
    })
  })

  test("should let a loaded brush draw wider than its nominal width", () => {
    // A nib that can only subtract cannot look like a brush. Where the hand slows, the brush has to
    // swell past the width the style asks for.
    expect(computeWidthProfile(run(40, 2, 40), "mouse", "brush")[20]).toBeGreaterThan(1)
    expect(computeWidthProfile(run(40, 2, 40), "mouse", "pencil")[20]).toEqual(1)
  })

  test("should reach full width on a stroke as short as real handwriting", () => {
    // Real strokes run about 55 units. With the taper measured in absolute units only, the broadest
    // nib spent 44 of them tapering and never opened up — it drew a limp even line.
    const handwriting = run(14, 4, 25)
    expect(Math.max(...computeWidthProfile(handwriting, "mouse", "brush"))).toBeGreaterThan(1)
  })

  describe("a broad edge", () => {
    /** A straight stroke at `deg`, all at the same speed. */
    const straight = (deg: number): TPointer[] => {
      const a = (deg * Math.PI) / 180
      return Array.from({ length: 30 }, (_, i) => ({
        x: 100 + Math.cos(a) * i * 4,
        y: 100 + Math.sin(a) * i * 4,
        dt: i * 20,
        p: 0.5,
      }))
    }
    const at = (deg: number) => computeWidthProfile(straight(deg), "mouse", "fountain")[15]

    test("should decide width by direction of travel, at one unchanging speed", () => {
      // The property that makes a stroke look written rather than extruded: with the edge held at
      // 45°, pulling along it lays down a hairline and pulling across it lays down the full width.
      expect(at(45)).toBeLessThan(0.2)
      expect(at(135)).toBeGreaterThan(1)
      expect(at(135) / at(45)).toBeGreaterThan(5)
    })

    test("should draw the same width in a direction and its opposite", () => {
      // A nib has an edge, not a front: pulling one way or the other across the same edge lays down
      // the same line.
      expect(at(135)).toBeCloseTo(at(315), 3)
      expect(at(45)).toBeCloseTo(at(225), 3)
    })

    test("should work on a document that carries no timing at all", () => {
      // Direction is geometry, so unlike speed it survives a stroke whose dt came from the index.
      const invented: TPointer[] = Array.from({ length: 30 }, (_, i) => ({
        x: 100 - i * 3,
        y: 100 + i * 3,
        dt: i,
        p: 0.5,
      }))
      const profile = computeWidthProfile(invented, "mouse", "fountain")
      expect(Math.max(...profile)).toBeGreaterThan(1)
    })
  })

  test("should widen the spread from ballpoint through pencil and fountain to brush", () => {
    // The nibs are ordered by expressiveness, and that order has to show up in the numbers.
    const gesture = Array.from({ length: 60 }, (_, i) => {
      const u = i / 59
      return { x: 20 + u * 420, y: 60 + Math.sin(u * Math.PI * 3) * 30, dt: i * 12 * (1 + 3 * Math.sin(u * Math.PI)), p: 0.5 }
    })
    const spread = (nib: keyof typeof PEN_NIBS) => {
      const mid = computeWidthProfile(gesture, "mouse", nib).slice(6, -6)
      return Math.max(...mid) - Math.min(...mid)
    }
    expect(spread("ballpoint")).toEqual(0)
    expect(spread("pencil")).toBeGreaterThan(spread("ballpoint"))
    expect(spread("fountain")).toBeGreaterThan(spread("pencil"))
    expect(spread("brush")).toBeGreaterThan(spread("fountain"))
  })

  test("should follow a pen's own pressure rather than its speed", () => {
    const pointers = run(30, 4, 20).map((pointer, i) => ({ ...pointer, p: i < 15 ? 0.9 : 0.4 }))
    const profile = computeWidthProfile(pointers, "pen")
    expect(profile[10]).toBeGreaterThan(profile[20])
  })

  test("should ignore a constant pressure, which is what a mouse reports", () => {
    // Chrome reports 0.5 for a held mouse button. Trusting it would flatten every mouse stroke to
    // one width, so a constant is read as "no measurement" and speed decides instead.
    const slow = computeWidthProfile(run(40, 2, 40), "mouse")
    const fast = computeWidthProfile(run(40, 20, 40), "mouse")
    expect(fast[20]).toBeLessThan(slow[20])
  })

  test("should leave a stroke with no measured timing unshaded by speed", () => {
    // `resolvePointerDelta` fills `dt` from the pointer index when a document carries no timing.
    // That is an invention, and shading it would render the invention.
    const invented: TPointer[] = Array.from({ length: 30 }, (_, i) => ({ x: i * 4, y: 0, dt: i, p: 0.5 }))
    const profile = computeWidthProfile(invented, "mouse")
    const middle = profile.slice(10, 20)
    expect(new Set(middle).size).toBe(1)
  })
})

describe("computeOutlinePointers", () => {
  test("should replace p with the drawn width and leave the stored pointers untouched", () => {
    const pointers: TPointer[] = [
      { x: 0, y: 0, dt: 0, p: 0.5 },
      { x: 20, y: 0, dt: 20, p: 0.5 },
      { x: 40, y: 0, dt: 40, p: 0.5 },
    ]
    const outline = computeOutlinePointers(pointers, "mouse")

    expect(outline.map((o) => o.p)).toEqual(computeWidthProfile(pointers, "mouse"))
    expect(outline.map((o) => ({ x: o.x, y: o.y, dt: o.dt }))).toEqual(
      pointers.map((o) => ({ x: o.x, y: o.y, dt: o.dt }))
    )
    expect(pointers.map((o) => o.p)).toEqual([0.5, 0.5, 0.5])
  })
})
