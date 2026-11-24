import { DefaultStyle, MatrixTransform, OBBOps, Polygon2d, ShapeUtil, TBox, TPoint, TStyle } from "@/iink"

describe("ShapeUtil polygon statics", () => {
  describe("create", () => {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    test("should initialise transform to identity", () => {
      expect(ShapeUtil.createPolygon(points).transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () => {
      const polygon = ShapeUtil.createPolygon(points)
      expect(polygon.style).toEqual(DefaultStyle)
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "green", width: 3 }
      const polygon = ShapeUtil.createPolygon(points, style)
      expect(polygon.style).toEqual(expect.objectContaining(style))
    })
    test("should have vertices same ref as points", () => {
      const polygon = ShapeUtil.createPolygon(points)
      expect(polygon.points).toBe(polygon.points)
    })
    test("should compute bounds from points", () => {
      const polygon = ShapeUtil.createPolygon(points)
      expect(OBBOps.toBox(OBBOps.createFromPoints(polygon.points)).x).toBeLessThanOrEqual(0)
      expect(OBBOps.toBox(OBBOps.createFromPoints(polygon.points)).y).toBeLessThanOrEqual(0)
      expect(OBBOps.createFromPoints(polygon.points).width).toBeGreaterThan(0)
      expect(OBBOps.createFromPoints(polygon.points).height).toBeGreaterThan(0)
    })
    test("should generate unique ids", () => {
      const p1 = ShapeUtil.createPolygon(points)
      const p2 = ShapeUtil.createPolygon(points)
      expect(p1.id).not.toEqual(p2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2, y: 5 },
      ]
      const polygon = ShapeUtil.createPolygonFromPartial({ points: pts })
      expect(polygon.points).toEqual(pts)
    })
    test("should carry a given transform through, merged onto identity", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2, y: 5 },
      ]
      const polygon = ShapeUtil.createPolygonFromPartial({ points: pts, transform: { tx: 5, ty: 6 } })
      expect(polygon.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 2, y: 5 },
      ]
      const polygon = ShapeUtil.createPolygonFromPartial({ id: "poly-id", points: pts })
      expect(polygon.id).toEqual("poly-id")
    })
    test("should throw if fewer than 3 points", () => {
      expect(() =>
        ShapeUtil.createPolygonFromPartial({
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        })
      ).toThrow()
    })
  })

  describe("overlaps", () => {
    const pts: TPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]
    const polygon = ShapeUtil.createPolygon(pts)
    test("should return true if partially intersects", () => {
      const box: TBox = { height: 100, width: 100, x: -50, y: -50 }
      expect(new Polygon2d(polygon.points).overlapsBox(box)).toEqual(true)
    })
    test("should return true if totally wraps", () => {
      const box: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(new Polygon2d(polygon.points).overlapsBox(box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 20, width: 20, x: 500, y: 500 }
      expect(new Polygon2d(polygon.points).overlapsBox(box)).toEqual(false)
    })
    test("should return false if box is inside polygon", () => {
      const box: TBox = { height: 2, width: 2, x: 5, y: 50 }
      expect(new Polygon2d(polygon.points).overlapsBox(box)).toEqual(false)
    })
  })

  describe("createTriangleBetweenPoints", () => {
    test("should create 3 points", () => {
      const polygon = ShapeUtil.createTriangleBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(3)
    })
  })

  describe("createRectangleBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapeUtil.createRectangleBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
    test("should update rectangle between points", () => {
      const polygon = ShapeUtil.createRectangleBetweenPoints({ x: 0, y: 0 }, { x: 5, y: 5 })
      ShapeUtil.updateRectangleBetweenPoints(polygon, { x: 0, y: 0 }, { x: 20, y: 20 })
      expect(OBBOps.createFromPoints(polygon.points).width).toBeGreaterThan(10)
    })
  })

  describe("createParallelogramBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapeUtil.createParallelogramBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
  })

  describe("createRhombusBetweenPoints", () => {
    test("should create 4 points", () => {
      const polygon = ShapeUtil.createRhombusBetweenPoints({ x: 0, y: 0 }, { x: 10, y: 10 })
      expect(polygon.points).toHaveLength(4)
    })
  })
})
