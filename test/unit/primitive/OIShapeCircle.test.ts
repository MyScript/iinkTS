import { round } from "../helpers"
import
{
  OIShapeCircle,
  TPoint,
  DefaultStyle,
  TStyle,
  SELECTION_MARGIN,
  TBoundingBox
} from "../../../src/iink"

describe("OIShapeCircle.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = new OIShapeCircle(style, center, radius)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(expect.objectContaining(style))
      expect(circle.selected).toEqual(false)
      expect(circle.center).toEqual(center)
      expect(circle.radius).toEqual(radius)
      expect(circle.boundingBox.x).toEqual(0)
      expect(circle.boundingBox.y).toEqual(-5)
      expect(circle.boundingBox.width).toEqual(10)
      expect(circle.boundingBox.height).toEqual(10)
      expect(circle.vertices).toHaveLength(8)
    })
    test("should create with default style", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const circle = new OIShapeCircle({}, center, radius)
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create and have many vertices", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 50
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = new OIShapeCircle(style, center, radius)
      expect(circle.vertices).toHaveLength(31)
    })
  })

  describe("createFromLine", () =>
  {
    test("should create", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(expect.objectContaining(style))
      expect(circle.selected).toEqual(false)
    })
    test("should create with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const circle = OIShapeCircle.createFromLine({}, origin, target)
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 1, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle.center).toEqual(origin)
      expect(circle.radius).toEqual(0)
      expect(circle.boundingBox.height).toEqual(0)
      expect(circle.boundingBox.width).toEqual(0)
      expect(circle.boundingBox.x).toEqual(1)
      expect(circle.boundingBox.y).toEqual(2)
      expect(circle.vertices).toHaveLength(8)
    })
    test("should create when origin is at the top left", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 11, y: 22 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle.center).toEqual({ x: 6, y: 12 })
      expect(round(circle.radius, 0)).toEqual(5)
      expect(round(circle.boundingBox.width, 0)).toEqual(10)
      expect(round(circle.boundingBox.height, 0)).toEqual(10)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(7)
    })
    test("should create when origin is at the top right", () =>
    {
      const origin: TPoint = { x: 11, y: 2 }
      const target: TPoint = { x: 1, y: 22 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle.center).toEqual({ x: 6, y: 12 })
      expect(round(circle.radius, 0)).toEqual(5)
      expect(round(circle.boundingBox.width, 0)).toEqual(10)
      expect(round(circle.boundingBox.height, 0)).toEqual(10)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(7)
    })
    test("should create when origin is at the bottom right", () =>
    {
      const origin: TPoint = { x: 11, y: 22 }
      const target: TPoint = { x: 1, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle.center).toEqual({ x: 6, y: 12 })
      expect(round(circle.radius, 0)).toEqual(5)
      expect(round(circle.boundingBox.width, 0)).toEqual(10)
      expect(round(circle.boundingBox.height, 0)).toEqual(10)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(7)
    })
    test("should create when origin is at the bottom left", () =>
    {
      const origin: TPoint = { x: 1, y: 22 }
      const target: TPoint = { x: 11, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      expect(circle.center).toEqual({ x: 6, y: 12 })
      expect(round(circle.radius, 0)).toEqual(5)
      expect(round(circle.boundingBox.width, 0)).toEqual(10)
      expect(round(circle.boundingBox.height, 0)).toEqual(10)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(7)
    })
  })

  describe("updateFromLine", () =>
  {
    const origin: TPoint = { x: 1, y: 2 }
    const target: TPoint = { x: 4, y: 6 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const circle = OIShapeCircle.createFromLine(style, origin, target)
    test("should updateFromLine when target x increas", () =>
    {
      expect(circle.center).toEqual({ x: 2.5, y: 4 })
      expect(round(circle.radius, 0)).toEqual(2)
      expect(round(circle.boundingBox.width, 0)).toEqual(3)
      expect(round(circle.boundingBox.height, 0)).toEqual(3)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(3)
      OIShapeCircle.updateFromLine(circle, origin, { x: target.x + 6, y: target.y })
      expect(circle.center).toEqual({ x: 5.5, y: 4 })
      expect(round(circle.radius, 0)).toEqual(2)
      expect(round(circle.boundingBox.width, 0)).toEqual(4)
      expect(round(circle.boundingBox.height, 0)).toEqual(4)
      expect(round(circle.boundingBox.x, 0)).toEqual(4)
      expect(round(circle.boundingBox.y, 0)).toEqual(2)
    })
    test("should updateFromLine when target y increase", () =>
    {
      OIShapeCircle.updateFromLine(circle, origin, { x: target.x, y: target.y + 4 })
      expect(circle.center).toEqual({ x: 2.5, y: 6 })
      expect(round(circle.radius, 0)).toEqual(2)
      expect(round(circle.boundingBox.width, 0)).toEqual(3)
      expect(round(circle.boundingBox.height, 0)).toEqual(3)
      expect(round(circle.boundingBox.x, 0)).toEqual(1)
      expect(round(circle.boundingBox.y, 0)).toEqual(5)
    })
  })

  describe("isCloseToPoint", () =>
  {
    const center: TPoint = { x: 5, y: 0 }
    const radius = 50
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const circle = new OIShapeCircle(style, center, radius)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
    {
      const closePoint: TPoint = { x: center.x, y: center.y + radius + SELECTION_MARGIN / 2 }
      expect(circle.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: center.x, y: center.y + radius + SELECTION_MARGIN * 2 }
      expect(circle.isCloseToPoint(closePoint)).toEqual(false)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      expect(circle.isCloseToPoint(circle.center)).toEqual(false)
    })
  })

  describe("overlaps", () =>
  {
    const center: TPoint = { x: 10, y: 10 }
    const radius = 10
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const circle = new OIShapeCircle(style, center, radius)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(circle.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(circle.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(circle.overlaps(boundaries)).toEqual(false)
    })
    test(`should return false if box is inside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(circle.overlaps(boundaries)).toEqual(false)
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const center: TPoint = { x: 10, y: 10 }
      const radius = 10
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = new OIShapeCircle(style, center, radius)
      const clone = circle.clone()
      expect(clone).toEqual(circle)
      expect(clone).not.toBe(circle)
    })
  })
})
