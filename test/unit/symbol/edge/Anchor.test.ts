import { describe, test, expect } from "@jest/globals"
import { resolveAnchorPoint, computeNormalizedAnchor, resolveConnectionAnchors } from "@/iink"

const bounds = { x: 10, y: 20, width: 100, height: 80 }

describe("resolveAnchorPoint", () => {
  test("normalizedX=0, normalizedY=0 → top-left corner", () => {
    const anchor = { symbolId: "s1", normalizedX: 0, normalizedY: 0 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 10, y: 20 })
  })

  test("normalizedX=1, normalizedY=1 → bottom-right corner", () => {
    const anchor = { symbolId: "s1", normalizedX: 1, normalizedY: 1 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 110, y: 100 })
  })

  test("normalizedX=0.5, normalizedY=0.5 → center", () => {
    const anchor = { symbolId: "s1", normalizedX: 0.5, normalizedY: 0.5 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 60, y: 60 })
  })

  test("arbitrary values", () => {
    const anchor = { symbolId: "s1", normalizedX: 0.25, normalizedY: 0.75 }
    expect(resolveAnchorPoint(anchor, bounds)).toEqual({ x: 35, y: 80 })
  })
})

describe("computeNormalizedAnchor", () => {
  test("point at top-left → {0, 0}", () => {
    const point = { x: 10, y: 20 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 0, normalizedY: 0 })
  })

  test("point at bottom-right → {1, 1}", () => {
    const point = { x: 110, y: 100 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 1, normalizedY: 1 })
  })

  test("point at center → {0.5, 0.5}", () => {
    const point = { x: 60, y: 60 }
    expect(computeNormalizedAnchor(point, bounds)).toEqual({ normalizedX: 0.5, normalizedY: 0.5 })
  })

  test("point outside left → normalizedX clamped to 0", () => {
    const point = { x: -50, y: 20 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedX).toBe(0)
  })

  test("point outside right → normalizedX clamped to 1", () => {
    const point = { x: 200, y: 20 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedX).toBe(1)
  })

  test("point outside top → normalizedY clamped to 0", () => {
    const point = { x: 60, y: -10 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedY).toBe(0)
  })

  test("point outside bottom → normalizedY clamped to 1", () => {
    const point = { x: 60, y: 200 }
    const result = computeNormalizedAnchor(point, bounds)
    expect(result.normalizedY).toBe(1)
  })

  test("zero-width bounds → divides by 1, no division by zero", () => {
    const zeroBounds = { x: 10, y: 20, width: 0, height: 0 }
    const point = { x: 10, y: 20 }
    const result = computeNormalizedAnchor(point, zeroBounds)
    expect(result.normalizedX).toBe(0)
    expect(result.normalizedY).toBe(0)
  })
})

describe("resolveConnectionAnchors", () => {
  test("resolveConnectionAnchors: no connections → both anchors undefined", () => {
    const result = resolveConnectionAnchors({ x: 0, y: 0 }, { x: 100, y: 0 }, [])
    expect(result).toEqual({})
  })

  test("resolveConnectionAnchors: one connection nearest to end → only endAnchor set, anchored at the target's center", () => {
    const box = { x: 90, y: -10, width: 20, height: 20 }
    const result = resolveConnectionAnchors(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      [{ targetId: "block-A", box }]
    )
    // Global nearest-pair: box center (100,0) is distance 0 from end, distance 100 from start
    expect(result.startAnchor).toBeUndefined()
    expect(result.endAnchor?.symbolId).toBe("block-A")
    // Anchors are always at the target's center, regardless of the box's shape/position —
    // matches applyEndpointAnchor's existing manual-drag convention.
    expect(result.endAnchor).toEqual({ symbolId: "block-A", normalizedX: 0.5, normalizedY: 0.5 })
  })

  test("resolveConnectionAnchors: one connection nearest to start → only startAnchor set", () => {
    const box = { x: -10, y: -10, width: 20, height: 20 }
    const result = resolveConnectionAnchors(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      [{ targetId: "block-A", box }]
    )
    // Connection at (0,0) is nearer to start (0,0) than to end (100,0)
    expect(result.startAnchor?.symbolId).toBe("block-A")
    expect(result.endAnchor).toBeUndefined()
  })

  test("resolveConnectionAnchors: two connections → nearest-first assignment gives distinct anchors", () => {
    const boxNearEnd = { x: 90, y: -10, width: 20, height: 20 }
    const boxNearStart = { x: -10, y: -10, width: 20, height: 20 }
    const result = resolveConnectionAnchors(
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      [
        { targetId: "block-end", box: boxNearEnd },
        { targetId: "block-start", box: boxNearStart },
      ]
    )
    expect(result.startAnchor?.symbolId).toBe("block-start")
    expect(result.endAnchor?.symbolId).toBe("block-end")
  })

  test("resolveConnectionAnchors: regression—both connections favor same endpoint, global nearest-pair preserves both", () => {
    // Critical: both A and B are closer to ownEnd than to ownStart.
    // Global nearest-pair finds the closest (endpoint, connection) pair globally across all 4 combinations.
    // Round 1: (end, B) is the global minimum with distance 78, so end gets B.
    // Round 2: A is the only connection left, start is the only slot left, so A goes to start.
    const boxA = { x: 95, y: 10, width: 10, height: 0 } // center (100, 10)
    const boxB = { x: 85, y: 10, width: 10, height: 0 } // center (90, 10)
    const result = resolveConnectionAnchors(
      { x: 10, y: 10 },
      { x: 12, y: 10 },
      [
        { targetId: "A", box: boxA },
        { targetId: "B", box: boxB },
      ]
    )
    // Distances:
    // A: to start (10,10) = 90, to end (12,10) = 88
    // B: to start (10,10) = 80, to end (12,10) = 78
    // Global best pair: (end, B) = 78
    // Round 2: A to start
    expect(result.startAnchor?.symbolId).toBe("A")
    expect(result.endAnchor?.symbolId).toBe("B")
  })
})
