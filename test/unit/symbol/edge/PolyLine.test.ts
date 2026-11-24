import { edgeGeometry } from "../../helpers"
import { DefaultStyle, EdgeUtil, OBBOps, Polyline2d, HIT_TOLERANCE, TBox, TPoint, TStyle } from "@/iink"

describe("PolyLine.ts", () => {
  describe("constructor", () => {
    test("should create", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
      ]
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const line = EdgeUtil.createPolyLine(points, undefined, undefined, style)
      expect(line).toBeDefined()
      expect(line.creationTime).toBeLessThanOrEqual(Date.now())
      expect(line.creationTime).toEqual(line.modificationDate)
      expect(line.style).toEqual(expect.objectContaining(style))
      expect(line.points).toEqual(points)
      expect(OBBOps.toBox(new Polyline2d(line.points, HIT_TOLERANCE).bounds).x).toEqual(-5)
      expect(OBBOps.toBox(new Polyline2d(line.points, HIT_TOLERANCE).bounds).y).toEqual(-5)
      expect(new Polyline2d(line.points, HIT_TOLERANCE).bounds.width).toEqual(15)
      expect(new Polyline2d(line.points, HIT_TOLERANCE).bounds.height).toEqual(15)
      expect(EdgeUtil.getPolyLineVertices(line)).toHaveLength(3)
    })
    test("should create with default style", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
      ]
      const line = EdgeUtil.createPolyLine(points)
      expect(line.style).toEqual(DefaultStyle)
    })
  })
  describe("overlaps", () => {
    const middles: TPoint[] = [
      { x: 0, y: 0 },
      { x: 15, y: 15 },
      { x: 0, y: 25 },
    ]
    const line = EdgeUtil.createPolyLine(middles)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(edgeGeometry(line.points, line).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(edgeGeometry(line.points, line).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(edgeGeometry(line.points, line).overlapsBox(boundaries)).toEqual(false)
    })
  })
  describe("clone", () => {
    test("should return clone", () => {
      const middles: TPoint[] = [
        { x: 0, y: 0 },
        { x: 15, y: 15 },
        { x: 0, y: 25 },
      ]
      const line = EdgeUtil.createPolyLine(middles)
      const clone = structuredClone(line)
      expect(clone).toEqual(line)
      expect(clone).not.toBe(line)
    })
  })
})
