import { Polygon2d, ShapeUtil, TBox, TPoint, TStyle } from "@/iink"

describe("Polygon.ts", () => {
  describe("overlaps", () => {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const polygon = ShapeUtil.createPolygon(points)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 100, width: 100, x: -50, y: -50 }
      expect(new Polygon2d(polygon.points).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(new Polygon2d(polygon.points).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 20, width: 20, x: 500, y: 500 }
      expect(new Polygon2d(polygon.points).overlapsBox(boundaries)).toEqual(false)
    })
    test(`should return false if box is inside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 5, y: 50 }
      expect(new Polygon2d(polygon.points).overlapsBox(boundaries)).toEqual(false)
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ]
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const polygon = ShapeUtil.createPolygon(points, style)
      const clone = structuredClone(polygon)
      expect(clone).toEqual(polygon)
      expect(clone).not.toBe(polygon)
    })
  })
})
