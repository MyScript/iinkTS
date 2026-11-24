import { round } from "../../helpers"
import { Circle2d, DefaultStyle, OBBOps, ShapeUtil, TBox, TPoint, TStyle } from "@/iink"

describe("Circle.ts", () => {
  describe("constructor", () => {
    test("should create ", () => {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const circle = ShapeUtil.createCircle(center, radius, style)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(expect.objectContaining(style))
      expect(circle.center).toEqual(center)
      expect(circle.radius).toEqual(radius)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x).toEqual(0)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y).toEqual(-5)
      expect(new Circle2d(circle.center, circle.radius).bounds.width).toEqual(10)
      expect(new Circle2d(circle.center, circle.radius).bounds.height).toEqual(10)
      expect(new Circle2d(circle.center, circle.radius).vertices).toHaveLength(8)
    })
    test("should create with default style", () => {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const circle = ShapeUtil.createCircle(center, radius)
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create and have many vertices", () => {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 50
      const circle = ShapeUtil.createCircle(center, radius)
      expect(new Circle2d(circle.center, circle.radius).vertices).toHaveLength(31)
    })
  })

  describe("overlaps", () => {
    const center: TPoint = { x: 10, y: 10 }
    const radius = 10
    const circle = ShapeUtil.createCircle(center, radius)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(boundaries)).toEqual(false)
    })
    test(`should return false if box is inside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(boundaries)).toEqual(false)
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const center: TPoint = { x: 10, y: 10 }
      const radius = 10
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const circle = ShapeUtil.createCircle(center, radius, style)
      const clone = structuredClone(circle)
      expect(clone).toEqual(circle)
      expect(clone).not.toBe(circle)
    })
  })

  describe("createBetweenPoints", () => {
    test("should create", () => {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target, style)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(expect.objectContaining(style))
    })
    test("should create with default style", () => {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create when origin is equal to target", () => {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 1, y: 2 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(circle.radius).toEqual(0)
      expect(new Circle2d(circle.center, circle.radius).bounds.height).toEqual(0)
      expect(new Circle2d(circle.center, circle.radius).bounds.width).toEqual(0)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x).toEqual(1)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y).toEqual(2)
      expect(new Circle2d(circle.center, circle.radius).vertices).toHaveLength(8)
    })
    test("should create when origin is at the top left", () => {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 11, y: 22 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(22)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(45)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(45)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-21)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-20)
    })
    test("should create when origin is at the top right", () => {
      const origin: TPoint = { x: 11, y: 2 }
      const target: TPoint = { x: 1, y: 22 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(22)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(45)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(45)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-11)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-20)
    })
    test("should create when origin is at the bottom right", () => {
      const origin: TPoint = { x: 11, y: 22 }
      const target: TPoint = { x: 1, y: 2 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(22)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(45)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(45)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-11)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-0)
    })
    test("should create when origin is at the bottom left", () => {
      const origin: TPoint = { x: 1, y: 22 }
      const target: TPoint = { x: 11, y: 2 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(22)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(45)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(45)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-21)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-0)
    })
  })

  describe("updateBetweenPoints", () => {
    const origin: TPoint = { x: 1, y: 2 }
    const target: TPoint = { x: 4, y: 6 }
    const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
    test("should updateBetweenPoints when target x increas", () => {
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(5)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(10)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(10)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-4)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-3)
      ShapeUtil.updateCircleBetweenPoints(circle, origin, { x: target.x + 6, y: target.y })
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(10)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(20)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(20)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-9)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-8)
    })
    test("should updateBetweenPoints when target y increase", () => {
      ShapeUtil.updateCircleBetweenPoints(circle, origin, { x: target.x, y: target.y + 4 })
      expect(circle.center).toEqual(origin)
      expect(round(circle.radius, 0)).toEqual(9)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.width, 0)).toEqual(17)
      expect(round(new Circle2d(circle.center, circle.radius).bounds.height, 0)).toEqual(17)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x, 0)).toEqual(-8)
      expect(round(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y, 0)).toEqual(-7)
    })
  })
})
