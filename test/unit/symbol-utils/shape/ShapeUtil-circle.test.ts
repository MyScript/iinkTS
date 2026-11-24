import { Circle2d, DefaultStyle, MatrixTransform, OBBOps, ShapeUtil, TBox, TPoint, TStyle } from "@/iink"

describe("ShapeUtil circle statics", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(ShapeUtil.createCircle({ x: 0, y: 0 }, 5).transform).toEqual(MatrixTransform.identity())
    })
    test("should create with center and radius", () => {
      const center: TPoint = { x: 5, y: 0 }
      const radius = 5
      const circle = ShapeUtil.createCircle(center, radius)
      expect(circle).toBeDefined()
      expect(circle.creationTime).toBeLessThanOrEqual(Date.now())
      expect(circle.creationTime).toEqual(circle.modificationDate)
      expect(circle.style).toEqual(DefaultStyle)
      expect(circle.center).toEqual(center)
      expect(circle.radius).toEqual(radius)
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "blue", width: 20 }
      const circle = ShapeUtil.createCircle({ x: 0, y: 0 }, 10, style)
      expect(circle.style).toEqual(expect.objectContaining(style))
    })
    test("should compute bounds as center±radius", () => {
      const circle = ShapeUtil.createCircle({ x: 5, y: 0 }, 5)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).x).toEqual(0)
      expect(OBBOps.toBox(new Circle2d(circle.center, circle.radius).bounds).y).toEqual(-5)
      expect(new Circle2d(circle.center, circle.radius).bounds.width).toEqual(10)
      expect(new Circle2d(circle.center, circle.radius).bounds.height).toEqual(10)
    })
    test("should compute minimum 8 vertices for small circle", () => {
      const circle = ShapeUtil.createCircle({ x: 0, y: 0 }, 5)
      expect(new Circle2d(circle.center, circle.radius).vertices).toHaveLength(8)
    })
    test("should compute more vertices for large circle", () => {
      const circle = ShapeUtil.createCircle({ x: 0, y: 0 }, 50)
      expect(new Circle2d(circle.center, circle.radius).vertices).toHaveLength(31)
    })
    // Counts alone let the tessellation drift: a phase shift or a wrong radius keeps the length
    // and moves every point. The oracle here is the circle's own definition, written out rather
    // than borrowed from the implementation, so these values pin where the points actually land.
    test("should tessellate from the bottom of the circle, counter-clockwise, on the radius", () => {
      const circle = ShapeUtil.createCircle({ x: 0, y: 0 }, 5)
      const vertices = new Circle2d(circle.center, circle.radius).vertices
      expect(vertices).toHaveLength(8)
      const expected = [
        { x: 0, y: 5 },
        { x: -3.536, y: 3.536 },
        { x: -5, y: 0 },
        { x: -3.536, y: -3.536 },
        { x: 0, y: -5 },
        { x: 3.536, y: -3.536 },
        { x: 5, y: 0 },
        { x: 3.536, y: 3.536 },
      ]
      vertices.forEach((vertex, index) => {
        expect(vertex.x).toBeCloseTo(expected[index].x, 3)
        expect(vertex.y).toBeCloseTo(expected[index].y, 3)
        // Precision 2, not 3: each coordinate is quantised to 3 decimals by `computeRotatedPoint`,
        // so a diagonal point's radius carries two roundings and lands ~6.6e-4 off.
        expect(Math.hypot(vertex.x, vertex.y)).toBeCloseTo(5, 2)
      })
    })
    test("should generate unique ids", () => {
      const c1 = ShapeUtil.createCircle({ x: 0, y: 0 }, 5)
      const c2 = ShapeUtil.createCircle({ x: 0, y: 0 }, 5)
      expect(c1.id).not.toEqual(c2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const partial = { center: { x: 10, y: 10 }, radius: 5 }
      const circle = ShapeUtil.createCircleFromPartial(partial)
      expect(circle.center).toEqual(partial.center)
      expect(circle.radius).toEqual(partial.radius)
    })
    test("should carry a given transform through, merged onto identity", () => {
      const partial = { center: { x: 10, y: 10 }, radius: 5, transform: { tx: 5, ty: 6 } }
      const circle = ShapeUtil.createCircleFromPartial(partial)
      expect(circle.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id from partial", () => {
      const partial = { id: "test-id", center: { x: 0, y: 0 }, radius: 5 }
      const circle = ShapeUtil.createCircleFromPartial(partial)
      expect(circle.id).toEqual("test-id")
    })
    test("should throw if center missing", () => {
      expect(() => ShapeUtil.createCircleFromPartial({ radius: 5 })).toThrow()
    })
    test("should throw if radius missing", () => {
      expect(() => ShapeUtil.createCircleFromPartial({ center: { x: 0, y: 0 } })).toThrow()
    })
  })

  describe("overlaps", () => {
    const circle = ShapeUtil.createCircle({ x: 10, y: 10 }, 10)
    test("should return true if box partially intersects", () => {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(box)).toEqual(true)
    })
    test("should return true if box fully wraps circle", () => {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(box)).toEqual(false)
    })
    test("should return false if box is fully inside circle", () => {
      const box: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(new Circle2d(circle.center, circle.radius).overlapsBox(box)).toEqual(false)
    })
  })

  describe("createBetweenPoints", () => {
    test("should create with center at origin", () => {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 3, y: 4 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, target)
      expect(circle.center).toEqual(origin)
      expect(circle.radius).toEqual(5)
    })
    test("should create with default style", () => {
      const circle = ShapeUtil.createCircleBetweenPoints({ x: 0, y: 0 }, { x: 1, y: 0 })
      expect(circle.style).toEqual(DefaultStyle)
    })
    test("should create with zero radius when origin equals target", () => {
      const pt: TPoint = { x: 5, y: 5 }
      const circle = ShapeUtil.createCircleBetweenPoints(pt, pt)
      expect(circle.radius).toEqual(0)
    })
  })

  describe("updateBetweenPoints", () => {
    test("should update radius based on new target", () => {
      const origin: TPoint = { x: 0, y: 0 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, { x: 3, y: 4 })
      expect(circle.radius).toEqual(5)
      ShapeUtil.updateCircleBetweenPoints(circle, origin, { x: 6, y: 8 })
      expect(circle.radius).toEqual(10)
    })
    test("should keep center at origin", () => {
      const origin: TPoint = { x: 2, y: 3 }
      const circle = ShapeUtil.createCircleBetweenPoints(origin, { x: 5, y: 7 })
      ShapeUtil.updateCircleBetweenPoints(circle, origin, { x: 10, y: 3 })
      expect(circle.center).toEqual(origin)
    })
  })
})
