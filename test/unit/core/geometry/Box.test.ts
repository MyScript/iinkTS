import { BoxOps, TBox } from "@/iink"

test("TBox is a plain object", () => {
  const box: TBox = { x: 1, y: 2, width: 3, height: 4 }
  expect(box.x).toBe(1)
})

describe("BoxOps.nearestBoundaryPoint", () => {
  const box = { x: 0, y: 0, width: 100, height: 50 }

  test("point outside to the left → clamps to left edge", () => {
    const result = BoxOps.nearestBoundaryPoint(box, { x: -50, y: 25 })
    expect(result).toEqual({ x: 0, y: 25 })
  })

  test("point outside above-right → clamps to top-right corner", () => {
    const result = BoxOps.nearestBoundaryPoint(box, { x: 200, y: -100 })
    expect(result).toEqual({ x: 100, y: 0 })
  })

  test("point inside, closer to top → snaps to top edge", () => {
    const result = BoxOps.nearestBoundaryPoint(box, { x: 50, y: 5 })
    expect(result).toEqual({ x: 50, y: 0 })
  })

  test("point inside, closer to right → snaps to right edge", () => {
    const result = BoxOps.nearestBoundaryPoint(box, { x: 90, y: 25 })
    expect(result).toEqual({ x: 100, y: 25 })
  })
})
