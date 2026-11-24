import { describe, test, expect } from "@jest/globals"
import { BoxOps, TBox, TPoint } from "@/iink"

describe("BoxOps", () => {
  describe("createFromPoints", () => {
    test("should return empty box when no points", () => {
      const box = BoxOps.createFromPoints([])
      expect(box).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })

    test("should create bounding box from points", () => {
      const xMin = -5,
        xMax = 5,
        yMin = 20,
        yMax = 25
      const points: TPoint[] = []
      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
          points.push({ x, y })
        }
      }
      const box = BoxOps.createFromPoints(points)
      expect(box.x).toEqual(xMin)
      expect(box.y).toEqual(yMin)
      expect(box.width).toEqual(xMax - xMin)
      expect(box.height).toEqual(yMax - yMin)
    })
  })

  describe("createFromBoxes", () => {
    test("should return empty box when no boxes", () => {
      const box = BoxOps.createFromBoxes([])
      expect(box).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })

    test("should create merged bounding box from boxes", () => {
      const boxes: TBox[] = [
        { height: 1, width: 2, x: 3, y: 4 },
        { height: 5, width: 6, x: 7, y: 8 },
      ]
      const box = BoxOps.createFromBoxes(boxes)
      expect(box.x).toEqual(3)
      expect(box.y).toEqual(4)
      expect(box.width).toEqual(10)
      expect(box.height).toEqual(9)
    })
  })

  describe("getCorners", () => {
    test("should return 4 corners", () => {
      const box: TBox = { x: 1, y: 2, width: 4, height: 6 }
      const corners = BoxOps.getCorners(box)
      expect(corners).toHaveLength(4)
      expect(corners[0]).toEqual({ x: 1, y: 2 })
      expect(corners[1]).toEqual({ x: 5, y: 2 })
      expect(corners[2]).toEqual({ x: 5, y: 8 })
      expect(corners[3]).toEqual({ x: 1, y: 8 })
    })
  })

  describe("getSide", () => {
    test("should return 4 side midpoints", () => {
      const box: TBox = { x: 0, y: 0, width: 4, height: 6 }
      const sides = BoxOps.getSide(box)
      expect(sides).toHaveLength(4)
      expect(sides[0]).toEqual({ x: 2, y: 0 })
      expect(sides[1]).toEqual({ x: 4, y: 3 })
      expect(sides[2]).toEqual({ x: 2, y: 6 })
      expect(sides[3]).toEqual({ x: 0, y: 3 })
    })
  })

  describe("getCenter", () => {
    test("should return center point", () => {
      const box: TBox = { x: 0, y: 0, width: 4, height: 6 }
      expect(BoxOps.getCenter(box)).toEqual({ x: 2, y: 3 })
    })
  })

  describe("getSides", () => {
    test("should return 4 segments forming the box perimeter", () => {
      const box: TBox = { x: 0, y: 0, width: 4, height: 4 }
      const sides = BoxOps.getSides(box)
      expect(sides).toHaveLength(4)
    })
  })

  describe("getSnapPoints", () => {
    test("should return 5 points (4 corners + center)", () => {
      const box: TBox = { x: 0, y: 0, width: 4, height: 4 }
      const snaps = BoxOps.getSnapPoints(box)
      expect(snaps).toHaveLength(5)
      expect(snaps[4]).toEqual(BoxOps.getCenter(box))
    })
  })

  describe("isContained", () => {
    test("should return true when box is inside wrapper", () => {
      const box: TBox = { x: 1, y: 1, width: 2, height: 2 }
      const wrapper: TBox = { x: 0, y: 0, width: 10, height: 10 }
      expect(BoxOps.isContained(box, wrapper)).toBe(true)
    })

    test("should return false when box is outside wrapper", () => {
      const box: TBox = { x: 0, y: 0, width: 20, height: 20 }
      const wrapper: TBox = { x: 1, y: 1, width: 2, height: 2 }
      expect(BoxOps.isContained(box, wrapper)).toBe(false)
    })
  })

  describe("containsPoint", () => {
    test("should return true when point is inside box", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      expect(BoxOps.containsPoint(box, { x: 5, y: 5 })).toBe(true)
    })

    test("should return false when point is outside box", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      expect(BoxOps.containsPoint(box, { x: 15, y: 5 })).toBe(false)
    })
  })

  describe("contains", () => {
    test("should return true when child is inside box", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      const child: TBox = { x: 1, y: 1, width: 2, height: 2 }
      expect(BoxOps.contains(box, child)).toBe(true)
    })

    test("should return false when child is outside box", () => {
      const box: TBox = { x: 0, y: 0, width: 10, height: 10 }
      const child: TBox = { x: 9, y: 9, width: 5, height: 5 }
      expect(BoxOps.contains(box, child)).toBe(false)
    })
  })

  describe("overlaps", () => {
    test("should return true when boxes overlap", () => {
      const box1: TBox = { x: 0, y: 0, width: 10, height: 10 }
      const box2: TBox = { x: 5, y: 5, width: 10, height: 10 }
      expect(BoxOps.overlaps(box1, box2)).toBe(true)
    })

    test("should return false when boxes do not overlap", () => {
      const box1: TBox = { x: 0, y: 0, width: 4, height: 4 }
      const box2: TBox = { x: 5, y: 5, width: 4, height: 4 }
      expect(BoxOps.overlaps(box1, box2)).toBe(false)
    })

    test("should return false when box is to the right", () => {
      const box1: TBox = { x: 0, y: 0, width: 4, height: 10 }
      const box2: TBox = { x: 10, y: 0, width: 4, height: 10 }
      expect(BoxOps.overlaps(box1, box2)).toBe(false)
    })
  })
})
