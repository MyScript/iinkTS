import { applyInverseMatrixToPoint, applyMatrixToPoint, applyMatrixToPoints, convertDegreeToRadian, MatrixTransform, TPoint } from "@/iink"

describe("MatrixTransform.ts", () => {
  test("should create", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, 0, 0)")
  })

  test("should get identity", () => {
    const matrix = MatrixTransform.identity()
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
  })

  test("should scale to 0.5", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.scale(0.5, 0.5)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0.5)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(0.5)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0.5, 0, 0, 0.5, 0, 0)")
  })

  test("should rotate to 90°", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-1)
    expect(matrix.yx).toBe(1)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 1, -1, 0, 0, 0)")
  })

  test("should translate to x:20 & y: 25", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.translate(20, 25)
    expect(matrix.tx).toBe(20)
    expect(matrix.ty).toBe(25)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, 20, 25)")
  })

  test("should invert matrix translate to x:20 & y: 25", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 20, 25)
    matrix.invert()
    expect(matrix.tx).toBe(-20)
    expect(matrix.ty).toBe(-25)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(-0)
    expect(matrix.yx).toBe(-0)
    expect(matrix.yy).toBe(1)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(1, 0, 0, 1, -20, -25)")
  })

  test("should scale to 0.5 & rotate to 90°", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.scale(0.5, 0.5)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-0.5)
    expect(matrix.yx).toBe(0.5)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 0.5, -0.5, 0, 0, 0)")
  })

  test("should rotate to 90° & scale to 0.5", () => {
    const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
    matrix.rotate(Math.PI / 2, { x: 0, y: 0 })
    matrix.scale(0.5, 0.5)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(-0.5)
    expect(matrix.yx).toBe(0.5)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, 0.5, -0.5, 0, 0, 0)")
  })

  test("should invert matrix rotate to 90° & scale to 0.5", () => {
    const matrix = new MatrixTransform(0, 0.5, -0.5, 0, 0, 0)
    matrix.invert()
    expect(matrix.tx).toBe(-0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(0)
    expect(matrix.xy).toBe(2)
    expect(matrix.yx).toBe(-2)
    expect(matrix.yy).toBe(0)
    expect(MatrixTransform.toCssString(matrix)).toBe("matrix(0, -2, 2, 0, 0, 0)")
  })

  test("should get identity when multiply matrix with inverse", () => {
    const matrix = new MatrixTransform(0, -2, 2, 0, 0, 0)
    const inverse = new MatrixTransform(0, 0.5, -0.5, 0, 0, 0)
    matrix.multiply(inverse)
    expect(matrix.tx).toBe(0)
    expect(matrix.ty).toBe(0)
    expect(matrix.xx).toBe(1)
    expect(matrix.xy).toBe(0)
    expect(matrix.yx).toBe(0)
    expect(matrix.yy).toBe(1)
  })

  describe("applyToPoint", () => {
    test("should transform point by translation", () => {
      const tx = 2,
        ty = 4
      const matrix = new MatrixTransform(1, 0, 0, 1, tx, ty)
      const point: TPoint = {
        x: 10,
        y: 20,
      }
      const translatedPoint = MatrixTransform.applyToPoint(matrix, point)
      expect(translatedPoint.x).toBe(point.x + tx)
      expect(translatedPoint.y).toBe(point.y + ty)
    })

    const rotationTestData = [
      // Written as exact expressions rather than decimals. Turning (2, 3) by -45° about the origin
      // puts it at (5/sqrt(2), 1/sqrt(2)) = (3.53553…, 0.70711…), and the second row is that same
      // offset taken from the centre (4, 6). The decimals these replace read 3.535 and 0.465, which
      // were not the true values but the artefact of `MatrixTransform.rotate` rounding its cosine to
      // 0.707: at full precision the first coordinate rounds to 3.536, not 3.535.
      {
        point: { x: 2, y: 3 },
        center: { x: 0, y: 0 },
        radian: -Math.PI / 4,
        expected: { x: 5 * Math.SQRT1_2, y: Math.SQRT1_2 },
      },
      {
        point: { x: 2, y: 3 },
        center: { x: 4, y: 6 },
        radian: -Math.PI / 4,
        expected: { x: 4 - 5 * Math.SQRT1_2, y: 6 - Math.SQRT1_2 },
      },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI / 3, expected: { x: 3.598, y: -0.232 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI / 3, expected: { x: 0.402, y: 6.232 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI / 2, expected: { x: 3, y: -2 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI / 2, expected: { x: 1, y: 8 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: -Math.PI, expected: { x: -2, y: -3 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: -Math.PI, expected: { x: 6, y: 9 } },
    ]
    rotationTestData.forEach((d) => {
      test(`should transform the point by rotating ${d.radian}rad from the center [${d.center.x}, ${d.center.y}]`, () => {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.rotate(d.radian, d.center)
        const rotatedPoint = MatrixTransform.applyToPoint(matrix, d.point)
        expect(rotatedPoint.x.toFixed(3)).toBe(d.expected.x.toFixed(3))
        expect(rotatedPoint.y.toFixed(3)).toBe(d.expected.y.toFixed(3))
      })
    })

    const scaleTestData = [
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 1, scaleY: 1, expected: { x: 2, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 1, scaleY: 1, expected: { x: 2, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 2, scaleY: 1, expected: { x: 4, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 2, scaleY: 1, expected: { x: 0, y: 3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 1, scaleY: 3, expected: { x: 2, y: 9 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 1, scaleY: 3, expected: { x: 2, y: -3 } },
      { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, scaleX: 4, scaleY: 5, expected: { x: 8, y: 15 } },
      { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, scaleX: 4, scaleY: 5, expected: { x: -4, y: -9 } },
    ]
    scaleTestData.forEach((d) => {
      test(`should transform the point by scaleX: ${d.scaleX} & scaleY: ${d.scaleY} from the center [${d.center.x}, ${d.center.y}]`, () => {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.scale(d.scaleX, d.scaleY, d.center)
        const scaleedPoint = MatrixTransform.applyToPoint(matrix, d.point)
        expect(scaleedPoint.x.toFixed(3)).toBe(d.expected.x.toFixed(3))
        expect(scaleedPoint.y.toFixed(3)).toBe(d.expected.y.toFixed(3))
      })
    })
  })

  describe("rotation", () => {
    const testData = [
      { center: { x: 0, y: 0 }, radian: Math.PI / 4, expected: Math.PI / 4 },
      { center: { x: 0, y: 0 }, radian: Math.PI / 3, expected: Math.PI / 3 },
      { center: { x: 0, y: 0 }, radian: Math.PI / 2, expected: Math.PI / 2 },
      { center: { x: 0, y: 0 }, radian: Math.PI, expected: Math.PI },
      { center: { x: 0, y: 0 }, radian: Math.PI * 1.5, expected: -Math.PI / 2 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 4, expected: Math.PI / 4 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 3, expected: Math.PI / 3 },
      { center: { x: 3, y: 4 }, radian: Math.PI / 2, expected: Math.PI / 2 },
      { center: { x: 3, y: 4 }, radian: Math.PI, expected: Math.PI },
      { center: { x: 3, y: 4 }, radian: Math.PI * 1.5, expected: -Math.PI / 2 },
    ]

    testData.forEach((d) => {
      test(`should get rotation angle from MatrixTransform for ${d.radian}rad with center ${JSON.stringify(d.center)} to equal ${d.expected}`, () => {
        const matrix = new MatrixTransform(1, 0, 0, 1, 0, 0)
        matrix.rotate(d.radian, d.center)
        expect(MatrixTransform.rotation(matrix).toFixed(4)).toEqual(d.expected.toFixed(4))
      })
    })
  })
})

/**
 * The invariant undo now rests on. A transform is a matrix the symbol keeps, and the history
 * reverses a rotation by replaying it with a negated angle — so composing a rotation with that
 * negation has to come back to the identity, or every undo/redo cycle leaves a residue on the
 * symbol's own matrix instead of being flattened away by the next redraw.
 *
 * Two roundings used to make that false. `MatrixTransform.rotate` rounded its sine and cosine to
 * three decimals, so cos(37°)² + sin(37°)² came out 1.000805 and a round trip left a 0.08% scale
 * behind; and `convertDegreeToRadian` rounded a radian to four decimals, which turned a right angle
 * into 1.5708 whose cosine is -3.7e-6 rather than zero. The coarser of the two hid the finer.
 */
describe("a rotation composed with its own inverse", () => {
  // Angles chosen for their rounding behaviour: 90 and 45 were exact before, 37, 7 and 13 were the
  // worst offenders (+0.081%, +0.093%, -0.070%), and 137 crosses a quadrant.
  const angles = [7, 13, 37, 45, 90, 137]

  angles.forEach((degree) => {
    test(`returns the identity for ${degree}°, to floating-point precision`, () => {
      const center: TPoint = { x: 5, y: 5 }
      const matrix = MatrixTransform.identity()
        .rotate(convertDegreeToRadian(degree), center)
        .rotate(convertDegreeToRadian(-degree), center)

      // 1e-12 rather than exact equality: one ULP of accumulated float error is expected and
      // harmless. What is not is the 1e-3 the roundings used to leave, which this margin rejects by
      // nine orders of magnitude.
      expect(matrix.xx).toBeCloseTo(1, 12)
      expect(matrix.yy).toBeCloseTo(1, 12)
      expect(matrix.yx).toBeCloseTo(0, 12)
      expect(matrix.xy).toBeCloseTo(0, 12)
      expect(matrix.tx).toBeCloseTo(0, 12)
      expect(matrix.ty).toBeCloseTo(0, 12)
    })
  })

  test("leaves no scale residue, which is what a compounding undo/redo cycle would grow", () => {
    const center: TPoint = { x: 5, y: 5 }
    const matrix = MatrixTransform.identity()
    // Ten full cycles: with the old rounding, 37° left +0.0805% each time and ten of them compounded
    // to about +0.8%, which is visible on screen. Any residue at all compounds, so this asserts
    // there is none rather than that it is small.
    for (let i = 0; i < 10; i++) {
      matrix.rotate(convertDegreeToRadian(37), center).rotate(convertDegreeToRadian(-37), center)
    }
    const scale = Math.hypot(matrix.xx, matrix.yx)
    expect(scale).toBeCloseTo(1, 12)
  })
})

/**
 * IIC-2010 added these so a symbol util can round a transformed point the same way the transform
 * managers always did — `applyMatrixToPoints` was a `protected` method on the manager base, out of
 * reach, which is half of why some branches rounded and others did not.
 */
describe("applyMatrixToPoint", () => {
  /** A third of a pixel: seventeen decimals raw, three once stored. */
  const third = MatrixTransform.identity().translate(1 / 3, 1 / 3)

  test("should round to the three decimals the document stores", () => {
    expect(applyMatrixToPoint({ x: 0, y: 0 }, third)).toEqual({ x: 0.333, y: 0.333 })
  })

  test("should not round what the raw form returns, which is what it exists to differ from", () => {
    // Pins the distinction rather than the helper alone: if `applyToPoint` started rounding, this
    // helper would be pointless and this test says so.
    expect(third.applyToPoint({ x: 0, y: 0 }).x).toBeCloseTo(0.3333333333333333, 15)
  })

  test("should leave its argument untouched", () => {
    const point = { x: 0, y: 0 }
    applyMatrixToPoint(point, third)
    expect(point).toEqual({ x: 0, y: 0 })
  })

  test("should round half away from zero, as toFixed does", () => {
    expect(applyMatrixToPoint({ x: 0, y: 0 }, MatrixTransform.identity().translate(0.0005, -0.0015))).toEqual({
      x: 0.001,
      y: -0.002,
    })
  })
})

describe("applyMatrixToPoints", () => {
  const third = MatrixTransform.identity().translate(1 / 3, 1 / 3)

  test("should round every point in the list", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]
    applyMatrixToPoints(points, third)
    expect(points).toEqual([
      { x: 0.333, y: 0.333 },
      { x: 1.333, y: 1.333 },
    ])
  })

  test("should move each point rather than replace it", () => {
    // Relied on throughout the managers: a symbol's `vertices` and `points` can be the same objects,
    // so replacing them would leave one of the two stale.
    const point: TPoint = { x: 0, y: 0 }
    const points = [point]
    applyMatrixToPoints(points, third)
    expect(points[0]).toBe(point)
    expect(point.x).toBe(0.333)
  })
})

/**
 * The mirror of `applyMatrixToPoint`, needed wherever a value that came from the document — a
 * pointer position, or a point computed from another symbol's geometry — is written *into* a
 * symbol's stored coordinates. Those are raw; the symbol's matrix is what places it. Writing a
 * document point straight into them lands it off by exactly that matrix, which is why dragging one
 * vertex of an already-moved edge made it jump.
 */
describe("applyInverseMatrixToPoint", () => {
  test("returns the point a forward mapping started from", () => {
    // The round-trip property, on a matrix that turns AND moves AND scales — the three together,
    // since a translate alone would pass under almost any wrong implementation.
    const matrix = MatrixTransform.identity()
      .translate(100, -40)
      .rotate(convertDegreeToRadian(37), { x: 5, y: 5 })
      .scale(2, 3, { x: 0, y: 0 })
    const raw: TPoint = { x: 12.5, y: -7.25 }

    const world = applyMatrixToPoint(raw, matrix)
    const back = applyInverseMatrixToPoint(world, matrix)

    expect(back?.x).toBeCloseTo(raw.x, 3)
    expect(back?.y).toBeCloseTo(raw.y, 3)
  })

  test("undoes a translate by hand-computed arithmetic, not by round trip", () => {
    // A round trip can pass against an implementation that applies the same wrong matrix twice, so
    // one case is pinned against numbers derived on paper: the inverse of a translate by (100, -40)
    // maps (130, -10) back to (30, 30).
    const matrix = MatrixTransform.identity().translate(100, -40)
    expect(applyInverseMatrixToPoint({ x: 130, y: -10 }, matrix)).toEqual({ x: 30, y: 30 })
  })

  test("undoes a quarter turn about the origin by hand-computed arithmetic", () => {
    // Turning (3, 0) by 90° about the origin puts it at (0, 3); the inverse must bring it back.
    const matrix = MatrixTransform.identity().rotate(convertDegreeToRadian(90), { x: 0, y: 0 })
    expect(applyInverseMatrixToPoint({ x: 0, y: 3 }, matrix)).toEqual({ x: 3, y: 0 })
  })

  test("returns the point itself for the identity, without paying for an inversion", () => {
    expect(applyInverseMatrixToPoint({ x: 4, y: 9 }, MatrixTransform.identity())).toEqual({ x: 4, y: 9 })
  })

  test("rounds to the three decimals the document stores, like its forward twin", () => {
    // The result is written back into a symbol, so it follows the same convention rather than
    // carrying seventeen decimals into stored coordinates.
    const matrix = MatrixTransform.identity().scale(3, 3, { x: 0, y: 0 })
    expect(applyInverseMatrixToPoint({ x: 1, y: 1 }, matrix)).toEqual({ x: 0.333, y: 0.333 })
  })

  test("returns undefined rather than a fabricated point when the matrix cannot be inverted", () => {
    // A symbol flattened to nothing on an axis has no raw coordinate corresponding to a document
    // one. `invert()` divides by the determinant unconditionally, so without this guard a caller
    // would store Infinity or NaN — worse than storing nothing.
    const flattened = MatrixTransform.identity().scale(1, 0, { x: 0, y: 0 })
    expect(applyInverseMatrixToPoint({ x: 5, y: 5 }, flattened)).toBeUndefined()
  })

  test("returns undefined for a NaN determinant, which passes an absolute-value guard", () => {
    // `Math.abs(NaN) < 1e-9` is false, so a threshold test alone lets NaN through — the same trap
    // `SymbolUtil.overlapsQuery` had to close.
    const corrupt = new MatrixTransform(Number.NaN, 0, 0, 1, 0, 0)
    expect(applyInverseMatrixToPoint({ x: 5, y: 5 }, corrupt)).toBeUndefined()
  })
})
