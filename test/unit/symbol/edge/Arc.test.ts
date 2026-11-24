import { edgeGeometry } from "../../helpers"
import { EdgeUtil, computeDistance, computePointOnEllipse, reprojectArcEndpoint, reprojectArcMidpoint, stretchArcEndpoint, OBBOps, TPoint, DefaultStyle, TStyle, TBox } from "@/iink"

describe("Arc.ts", () => {
  describe("constructor", () => {
    test("should create", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0

      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = EdgeUtil.createArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      expect(arc).toBeDefined()
      expect(arc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(arc.creationTime).toEqual(arc.modificationDate)
      expect(arc.style).toEqual(expect.objectContaining(style))
      expect(arc.center).toEqual(center)
      expect(OBBOps.toBox(edgeGeometry(EdgeUtil.getArcVertices(arc), arc).bounds).x).toEqual(-15)
      expect(OBBOps.toBox(edgeGeometry(EdgeUtil.getArcVertices(arc), arc).bounds).y).toEqual(-5)
      expect(+edgeGeometry(EdgeUtil.getArcVertices(arc), arc).bounds.width.toFixed(0)).toEqual(27)
      expect(+edgeGeometry(EdgeUtil.getArcVertices(arc), arc).bounds.height.toFixed(0)).toEqual(60)
    })
    test("should create with default style", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const arc = EdgeUtil.createArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      expect(arc.style).toEqual(DefaultStyle)
    })
  })

  describe("properties", () => {
    const center: TPoint = { x: 0, y: 0 }
    const smallClockwiseArc = EdgeUtil.createArc(center, Math.PI / 4, Math.PI / 4, 5, 5, 0)
    const largeClockwiseArc = EdgeUtil.createArc(center, Math.PI / 4, (3 * Math.PI) / 4, 50, 50, 0)
    const smallCounterClockwiseArc = EdgeUtil.createArc(center, Math.PI / 4, -Math.PI / 4, 5, 5, 0)
    const largeCounterClockwiseArc = EdgeUtil.createArc(center, Math.PI / 4, (-3 * Math.PI) / 4, 50, 50, 0)

    test(`should get vertices for small clockwise arc`, () => {
      expect(EdgeUtil.getArcVertices(smallClockwiseArc)).toHaveLength(9)
      expect(EdgeUtil.getArcVertices(smallClockwiseArc)).toEqual(
        expect.arrayContaining([
          { x: 3.536, y: 3.536 },
          { x: 2.357, y: 4.41 },
          { x: 0, y: 5 },
        ])
      )
    })
    test(`should get vertices for large clockwise arc`, () => {
      expect(EdgeUtil.getArcVertices(largeClockwiseArc)).toHaveLength(13)
      expect(EdgeUtil.getArcVertices(largeClockwiseArc)).toEqual(
        expect.arrayContaining([
          { x: 35.355, y: 35.355 },
          { x: 0, y: 50 },
          { x: -49.039, y: 9.755 },
        ])
      )
    })
    test(`should get vertices for small counter-clockwise arc`, () => {
      expect(EdgeUtil.getArcVertices(smallCounterClockwiseArc)).toHaveLength(9)
      expect(EdgeUtil.getArcVertices(smallCounterClockwiseArc)).toEqual(
        expect.arrayContaining([
          { x: 3.536, y: 3.536 },
          { x: 4.41, y: 2.357 },
          { x: 5, y: 0 },
        ])
      )
    })
    test(`should get vertices for large counter-clockwise arc`, () => {
      expect(EdgeUtil.getArcVertices(largeCounterClockwiseArc)).toHaveLength(13)
      expect(EdgeUtil.getArcVertices(largeCounterClockwiseArc)).toEqual(
        expect.arrayContaining([
          { x: 35.355, y: 35.355 },
          { x: 50, y: 0 },
          { x: 0, y: -50 },
        ])
      )
    })
    test(`should get snap points for small clockwise arc`, () => {
      // Snap points are no longer stored on the arc; `EdgeArcOps` computes them from its vertices.
      const snapPoints = EdgeUtil.getArcSnapPoints(EdgeUtil.getArcVertices(smallClockwiseArc))
      expect(snapPoints).toHaveLength(2)
      expect(snapPoints).toEqual([
        { x: 3.536, y: 3.536 },
        { x: 0, y: 5 },
      ])
    })
  })

  describe("overlaps", () => {
    const center: TPoint = { x: 0, y: 0 }
    const startAngle = Math.PI / 4
    const sweepAngle = Math.PI / 2
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = EdgeUtil.createArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 20, width: 20, x: 0, y: 45 }
      expect(edgeGeometry(EdgeUtil.getArcVertices(arc), arc).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 200, width: 100, x: -50, y: -5 }
      expect(edgeGeometry(EdgeUtil.getArcVertices(arc), arc).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(edgeGeometry(EdgeUtil.getArcVertices(arc), arc).overlapsBox(boundaries)).toEqual(false)
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = (3 * Math.PI) / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = EdgeUtil.createArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      const clone = structuredClone(arc)
      expect(clone).toEqual(arc)
      expect(clone).not.toBe(arc)
    })
  })

  describe("anchors", () => {
    test("arc has no anchors by default, accepts optional startAnchor/endAnchor", () => {
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      expect(arc.startAnchor).toBeUndefined()
      arc.endAnchor = { symbolId: "shape-1", normalizedX: 0.1, normalizedY: 0.9 }
      expect(arc.endAnchor.symbolId).toBe("shape-1")
    })
  })

  describe("reprojectArcEndpoint", () => {
    const arc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: 0, sweepAngle: Math.PI }

    test("moving the start endpoint keeps the end angle fixed", () => {
      const oldEndAngle = arc.startAngle + arc.sweepAngle
      const targetPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, Math.PI / 4)
      const result = reprojectArcEndpoint(arc, "start", targetPoint)
      expect(result.startAngle).toBeCloseTo(Math.PI / 4, 2)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(oldEndAngle, 2)
    })

    test("moving the end endpoint keeps the start angle fixed", () => {
      const targetPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, (3 * Math.PI) / 4)
      const result = reprojectArcEndpoint(arc, "end", targetPoint)
      expect(result.startAngle).toBeCloseTo(arc.startAngle, 2)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo((3 * Math.PI) / 4, 2)
    })

    test("moving the end endpoint wraps around 0/2π boundary (rawSweep < 0 -> +TWO_PI)", () => {
      // Arc from 0 to 2π/3 (sweepAngle = 2π/3, positive)
      const testArc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: 0, sweepAngle: (2 * Math.PI) / 3 }
      // Move end to -π/6 (before start, crosses the 0 boundary)
      const targetAngle = -Math.PI / 6
      const targetPoint = computePointOnEllipse(testArc.center, testArc.radiusX, testArc.radiusY, testArc.phi, targetAngle)
      const result = reprojectArcEndpoint(testArc, "end", targetPoint)
      expect(result.startAngle).toBeCloseTo(0, 2)
      // End angle should be -π/6, which normalizes to 11π/6 in positive range
      const TWO_PI = Math.PI * 2
      const expectedEndAngle = targetAngle < 0 ? targetAngle + TWO_PI : targetAngle
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(expectedEndAngle, 1)
    })

    test("moving start endpoint with negative sweepAngle (clockwise arc) wraps (rawSweep > 0 -> -TWO_PI)", () => {
      // Arc from 3π/2 to π (sweepAngle = -π/2, clockwise/backwards)
      const testArc = { center: { x: 0, y: 0 }, radiusX: 10, radiusY: 10, phi: 0, startAngle: (3 * Math.PI) / 2, sweepAngle: -Math.PI / 2 }
      // Old end angle: 3π/2 + (-π/2) = π
      // Move start to 0, crossing the 0 boundary
      const targetAngle = 0
      const targetPoint = computePointOnEllipse(testArc.center, testArc.radiusX, testArc.radiusY, testArc.phi, targetAngle)
      const result = reprojectArcEndpoint(testArc, "start", targetPoint)
      expect(result.startAngle).toBeCloseTo(0, 2)
      // Old end was at π. With startAngle=0 and original negative sweep,
      // the result should maintain the negative sweep direction: sweepAngle = -π
      // so 0 + (-π) = -π, which equals π modulo the circle (both are on the negative real axis)
      expect(result.sweepAngle).toBeCloseTo(-Math.PI, 1)
      expect(result.startAngle + result.sweepAngle).toBeCloseTo(-Math.PI, 1)
    })
  })

  describe("reprojectArcMidpoint", () => {
    // Regression: dragging the midpoint handle past the chord to the OPPOSITE side used to
    // make the search chase an ever-larger, near-degenerate ellipse (radius exploding towards
    // hundreds of times the original) instead of finding the much simpler answer — flip to the
    // complementary arc on essentially the SAME ellipse. Reported as "goes into an infinite
    // loop and the result is wrong" (the runaway radius growth, not a literal hang).
    test("dragging to the opposite side of the chord flips to the complementary arc instead of blowing up the radius", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      // start=(-5,0), end=(5,0), original bulge at (0,5). Target is the exact mirror image
      // across the chord — reachable by the SAME circle, just tracing the other semicircle.
      const result = reprojectArcMidpoint(arc, { x: 0, y: -5 })

      expect(result.radiusY).toBeLessThan(10)
      const midAngle = result.startAngle + result.sweepAngle / 2
      const midPoint = computePointOnEllipse(result.center, result.radiusX, result.radiusY, arc.phi, midAngle)
      expect(midPoint.x).toBeCloseTo(0, 1)
      expect(midPoint.y).toBeCloseTo(-5, 1)
    })

    // Recomputes both endpoints' world positions from a reprojectArcMidpoint result, using the
    // ORIGINAL phi (the function never touches it) — the core contract this function must
    // uphold no matter what target point is given: neither endpoint may move.
    function recomputeEndpoints(
      arc: { phi: number },
      result: { center: TPoint; radiusX: number; radiusY: number; startAngle: number; sweepAngle: number }
    ) {
      return {
        start: computePointOnEllipse(result.center, result.radiusX, result.radiusY, arc.phi, result.startAngle),
        end: computePointOnEllipse(
          result.center,
          result.radiusX,
          result.radiusY,
          arc.phi,
          result.startAngle + result.sweepAngle
        ),
      }
    }

    test("circular arc: both endpoints stay exactly fixed for an arbitrary (unreachable) target", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endBefore = computePointOnEllipse(
        arc.center,
        arc.radiusX,
        arc.radiusY,
        arc.phi,
        arc.startAngle + arc.sweepAngle
      )

      // Nothing about this target is engineered to be exactly reachable by a ratio=1, phi=0
      // family through startBefore/endBefore — it just has to not move the endpoints.
      const result = reprojectArcMidpoint(arc, { x: 3, y: 17 })

      const { start, end } = recomputeEndpoints(arc, result)
      expect(start.x).toBeCloseTo(startBefore.x, 2)
      expect(start.y).toBeCloseTo(startBefore.y, 2)
      expect(end.x).toBeCloseTo(endBefore.x, 2)
      expect(end.y).toBeCloseTo(endBefore.y, 2)
      expect(result.radiusX).toBeCloseTo(result.radiusY, 2)
    })

    test("elliptical, rotated arc: both endpoints stay exactly fixed and the radiusX:radiusY ratio is preserved", () => {
      const arc = { center: { x: 20, y: -10 }, radiusX: 30, radiusY: 12, phi: Math.PI / 6, startAngle: 0.3, sweepAngle: 2 }
      const originalRatio = arc.radiusX / arc.radiusY
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endBefore = computePointOnEllipse(
        arc.center,
        arc.radiusX,
        arc.radiusY,
        arc.phi,
        arc.startAngle + arc.sweepAngle
      )

      const result = reprojectArcMidpoint(arc, { x: -40, y: 60 })

      const { start, end } = recomputeEndpoints(arc, result)
      expect(start.x).toBeCloseTo(startBefore.x, 1)
      expect(start.y).toBeCloseTo(startBefore.y, 1)
      expect(end.x).toBeCloseTo(endBefore.x, 1)
      expect(end.y).toBeCloseTo(endBefore.y, 1)
      expect(result.radiusX / result.radiusY).toBeCloseTo(originalRatio, 2)
    })

    test("target already at the current midpoint → reconstructs essentially the same arc (search converges to the existing solution)", () => {
      const arc = { center: { x: 5, y: 5 }, radiusX: 20, radiusY: 8, phi: 0.4, startAngle: -0.5, sweepAngle: 1.8 }
      const midAngle = arc.startAngle + arc.sweepAngle / 2
      const currentMid = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, midAngle)

      const result = reprojectArcMidpoint(arc, currentMid)

      expect(result.center.x).toBeCloseTo(arc.center.x, 1)
      expect(result.center.y).toBeCloseTo(arc.center.y, 1)
      expect(result.radiusX).toBeCloseTo(arc.radiusX, 1)
      expect(result.radiusY).toBeCloseTo(arc.radiusY, 1)
    })

    test("target is an exactly reachable point on a DIFFERENT family member → converges to that member (not just to the closest-effort clamp)", () => {
      // Circular case (ratio=1): the family of circles through two fixed points is exactly
      // "centers on their perpendicular bisector" — independent of reprojectArcMidpoint's own
      // line-parametrization, so this is a genuine external check, not a tautology.
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      // start=(-5,0), end=(5,0). An alternate circle through both: center (0,-5), radius
      // sqrt(5²+5²) ≈ 7.0711 (also on the perpendicular bisector x=0).
      const altCenter = { x: 0, y: -5 }
      const altRadius = Math.sqrt(50)
      // Matching the original arc's clockwise (negative sweep) direction: start angle (from
      // altCenter to (-5,0)) is 3π/4, end angle (to (5,0)) is π/4, sweep = π/4 - 3π/4 = -π/2.
      const altStartAngle = (3 * Math.PI) / 4
      const altSweepAngle = -Math.PI / 2
      const altMidAngle = altStartAngle + altSweepAngle / 2
      const target = computePointOnEllipse(altCenter, altRadius, altRadius, 0, altMidAngle)

      const result = reprojectArcMidpoint(arc, target)

      expect(result.center.x).toBeCloseTo(altCenter.x, 1)
      expect(result.center.y).toBeCloseTo(altCenter.y, 1)
      expect(result.radiusY).toBeCloseTo(altRadius, 1)
      const midAngle = result.startAngle + result.sweepAngle / 2
      const midPoint = computePointOnEllipse(result.center, result.radiusX, result.radiusY, arc.phi, midAngle)
      expect(computeDistance(midPoint, target)).toBeLessThan(0.05)
    })
  })

  describe("stretchArcEndpoint", () => {
    function recomputeEndpoints(
      arc: { phi: number },
      result: { center: TPoint; radiusX: number; radiusY: number; startAngle: number; sweepAngle: number }
    ) {
      return {
        start: computePointOnEllipse(result.center, result.radiusX, result.radiusY, arc.phi, result.startAngle),
        end: computePointOnEllipse(
          result.center,
          result.radiusX,
          result.radiusY,
          arc.phi,
          result.startAngle + result.sweepAngle
        ),
      }
    }

    test("circle: dragging the end handle further out stretches the radius, keeps start exactly fixed, lands exactly on the target", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)

      const result = stretchArcEndpoint(arc, "end", { x: 10, y: 0 })

      expect(result.radiusY).not.toBeCloseTo(arc.radiusY, 1)
      const { start, end } = recomputeEndpoints(arc, result)
      expect(start.x).toBeCloseTo(startBefore.x, 2)
      expect(start.y).toBeCloseTo(startBefore.y, 2)
      expect(end.x).toBeCloseTo(10, 2)
      expect(end.y).toBeCloseTo(0, 2)
      // Center equidistant from both endpoints (the chosen tie-break criterion).
      expect(computeDistance(result.center, start)).toBeCloseTo(computeDistance(result.center, end), 2)
    })

    test("circle: dragging the start handle inward shrinks the radius, keeps end exactly fixed, lands exactly on the target", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)

      const result = stretchArcEndpoint(arc, "start", { x: -2, y: 1 })

      const { start, end } = recomputeEndpoints(arc, result)
      expect(end.x).toBeCloseTo(endBefore.x, 2)
      expect(end.y).toBeCloseTo(endBefore.y, 2)
      expect(start.x).toBeCloseTo(-2, 2)
      expect(start.y).toBeCloseTo(1, 2)
    })

    test("elliptical, rotated arc: dragging start keeps end fixed and preserves the radiusX:radiusY ratio", () => {
      const arc = { center: { x: 20, y: -10 }, radiusX: 30, radiusY: 12, phi: Math.PI / 6, startAngle: 0.3, sweepAngle: 2 }
      const originalRatio = arc.radiusX / arc.radiusY
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)

      const result = stretchArcEndpoint(arc, "start", { x: 10, y: -5 })

      const { start, end } = recomputeEndpoints(arc, result)
      expect(start.x).toBeCloseTo(10, 1)
      expect(start.y).toBeCloseTo(-5, 1)
      expect(end.x).toBeCloseTo(endBefore.x, 1)
      expect(end.y).toBeCloseTo(endBefore.y, 1)
      expect(result.radiusX / result.radiusY).toBeCloseTo(originalRatio, 2)
    })

    test("dragging the end handle past the start handle (crossover) still lands exactly on target and keeps start fixed, no NaN", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)

      // start is at x=-5; drag end to x=-15, well past start on the same side.
      const result = stretchArcEndpoint(arc, "end", { x: -15, y: 2 })

      expect(Number.isFinite(result.center.x)).toBe(true)
      expect(Number.isFinite(result.center.y)).toBe(true)
      expect(Number.isFinite(result.radiusX)).toBe(true)
      expect(Number.isFinite(result.radiusY)).toBe(true)
      const { start, end } = recomputeEndpoints(arc, result)
      expect(start.x).toBeCloseTo(startBefore.x, 2)
      expect(start.y).toBeCloseTo(startBefore.y, 2)
      expect(end.x).toBeCloseTo(-15, 2)
      expect(end.y).toBeCloseTo(2, 2)
    })

    test("dragging an endpoint onto the other endpoint's exact position is a no-op (degenerate, can't divide by zero)", () => {
      const arc = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5, phi: 0, startAngle: Math.PI, sweepAngle: -Math.PI }
      const startPoint = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)

      const result = stretchArcEndpoint(arc, "end", startPoint)

      expect(result).toEqual({
        center: arc.center,
        radiusX: arc.radiusX,
        radiusY: arc.radiusY,
        startAngle: arc.startAngle,
        sweepAngle: arc.sweepAngle,
      })
    })
  })

  describe("getSVGPath", () => {
    // Parses "M x y Q x y x y ..." into actual points, so containment checks compare points
    // (not substrings — e.g. "10 0" is a substring of "-10 0", a real false-positive risk).
    function parsePathPoints(path: string): TPoint[] {
      const numbers = path
        .split(/\s+/)
        .filter((t) => t !== "M" && t !== "Q")
        .map(Number)
      const points: TPoint[] = []
      for (let i = 0; i < numbers.length; i += 2) {
        points.push({ x: numbers[i], y: numbers[i + 1] })
      }
      return points
    }
    function containsPoint(points: TPoint[], p: TPoint): boolean {
      return points.some((q) => q.x === p.x && q.y === p.y)
    }

    test("without anchors, draws through the true first/last vertices", () => {
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      const path = EdgeUtil.getArcPath(arc)
      const first = EdgeUtil.getArcVertices(arc)[0]
      const last = EdgeUtil.getArcVertices(arc).at(-1)!
      expect(path.startsWith(`M ${first.x} ${first.y} Q`)).toBe(true)
      expect(path.endsWith(`${last.x} ${last.y}`)).toBe(true)
    })

    test("startAnchor.entryPoint drops every leading vertex still closer to the true start than the entry point, not just the first one", () => {
      // Regression: substituting ONLY vertices[0] left the next few (densely-tessellated,
      // still near the true start) vertices in place, drawing a spike from the entry point
      // back to them before the visible curve even began.
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      const trueStart = EdgeUtil.getArcVertices(arc)[0]
      const v1 = EdgeUtil.getArcVertices(arc)[1]
      const v2 = EdgeUtil.getArcVertices(arc)[2]
      // Entry point sits farther from the true start than v1 but closer than v2 — both v0 and
      // v1 (still "inside" the shape along the curve) must be dropped, not just v0.
      expect(computeDistance(v1, trueStart)).toBeLessThan(5)
      expect(computeDistance(v2, trueStart)).toBeGreaterThan(5)
      const entryPoint = { x: 10, y: 5 }
      arc.startAnchor = { symbolId: "shape-1", normalizedX: 0.5, normalizedY: 0.5, entryPoint }

      const path = EdgeUtil.getArcPath(arc)
      const points = parsePathPoints(path)

      expect(path.startsWith(`M ${entryPoint.x} ${entryPoint.y} Q ${entryPoint.x} ${entryPoint.y}`)).toBe(true)
      expect(containsPoint(points, trueStart)).toBe(false)
      expect(containsPoint(points, v1)).toBe(false)
      expect(containsPoint(points, v2)).toBe(true)
      const last = EdgeUtil.getArcVertices(arc).at(-1)!
      expect(path.endsWith(`${last.x} ${last.y}`)).toBe(true)
    })

    test("endAnchor.entryPoint drops every trailing vertex still closer to the true end than the entry point", () => {
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, 0, Math.PI, 10, 10, 0)
      const trueEnd = EdgeUtil.getArcVertices(arc).at(-1)!
      const vLast1 = EdgeUtil.getArcVertices(arc).at(-2)!
      const vLast2 = EdgeUtil.getArcVertices(arc).at(-3)!
      expect(computeDistance(vLast1, trueEnd)).toBeLessThan(5)
      expect(computeDistance(vLast2, trueEnd)).toBeGreaterThan(5)
      const entryPoint = { x: -10, y: 5 }
      arc.endAnchor = { symbolId: "shape-2", normalizedX: 0.5, normalizedY: 0.5, entryPoint }

      const path = EdgeUtil.getArcPath(arc)
      const points = parsePathPoints(path)

      const first = EdgeUtil.getArcVertices(arc)[0]
      expect(path.startsWith(`M ${first.x} ${first.y} Q`)).toBe(true)
      expect(path.endsWith(`${entryPoint.x} ${entryPoint.y}`)).toBe(true)
      expect(containsPoint(points, trueEnd)).toBe(false)
      expect(containsPoint(points, vLast1)).toBe(false)
      expect(containsPoint(points, vLast2)).toBe(true)
    })
  })
})
