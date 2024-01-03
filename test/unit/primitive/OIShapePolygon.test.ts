import
{
  OIShapeTriangle,
  OIShapeParallelogram,
  TPoint,
  DefaultStyle,
  TStyle,
  MatrixTransform,
  SELECTION_MARGIN,
  TBoundingBox,
  OIShapeRectangle,
} from "../../../src/iink"

describe("OIShapePolygon.ts", () =>
{
  describe("OIShapeRectangle", () =>
  {
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
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        expect(rect).toBeDefined()
        expect(rect.creationTime).toBeLessThanOrEqual(Date.now())
        expect(rect.creationTime).toEqual(rect.modificationDate)
        expect(rect.style).toEqual(expect.objectContaining(style))
        expect(rect.selected).toEqual(false)
        expect(rect.transform).toEqual(MatrixTransform.identity())
      })
      test("should create with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 4, y: 6 }
        const triangle = OIShapeRectangle.createFromLine({}, origin, target)
        expect(triangle.style).toEqual(DefaultStyle)
      })
      test("should create when origin is equal to target", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 1, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeRectangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, origin, origin, origin])
        expect(triangle.boundingBox.height).toEqual(0)
        expect(triangle.boundingBox.width).toEqual(0)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
        expect(triangle.vertices).toHaveLength(4)
      })
      test("should create when origin is at the top left", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 11, y: 22 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 22 }, { x: 1, y: 22 }])
        expect(rect.boundingBox.width).toEqual(10)
        expect(rect.boundingBox.height).toEqual(20)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the top right", () =>
      {
        const origin: TPoint = { x: 11, y: 2 }
        const target: TPoint = { x: 1, y: 22 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 22 }, { x: 1, y: 22 }])
        expect(rect.boundingBox.width).toEqual(10)
        expect(rect.boundingBox.height).toEqual(20)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the bottom right", () =>
      {
        const origin: TPoint = { x: 11, y: 22 }
        const target: TPoint = { x: 1, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 22 }, { x: 1, y: 22 }])
        expect(rect.boundingBox.width).toEqual(10)
        expect(rect.boundingBox.height).toEqual(20)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the bottom left", () =>
      {
        const origin: TPoint = { x: 1, y: 22 }
        const target: TPoint = { x: 11, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const rect = OIShapeRectangle.createFromLine(style, origin, target)
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 11, y: 2 }, { x: 11, y: 22 }, { x: 1, y: 22 }])
        expect(rect.boundingBox.width).toEqual(10)
        expect(rect.boundingBox.height).toEqual(20)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
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
      const rect = OIShapeRectangle.createFromLine(style, origin, target)
      test("should updateFromLine when target x increase", () =>
      {
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 6 }, { x: 1, y: 6 }])
        expect(rect.boundingBox.width).toEqual(3)
        expect(rect.boundingBox.height).toEqual(4)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
        OIShapeRectangle.updateFromLine(rect, origin, { x: target.x + 6, y: target.y })
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 10, y: 2 }, { x: 10, y: 6 }, { x: 1, y: 6 }])
        expect(rect.boundingBox.width).toEqual(9)
        expect(rect.boundingBox.height).toEqual(4)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
      })
      test("should updateFromLine when target y increase", () =>
      {
        OIShapeRectangle.updateFromLine(rect, origin, { x: target.x, y: target.y + 4 })
        expect(rect.points).toEqual([{ x: 1, y: 2 }, { x: 4, y: 2 }, { x: 4, y: 10 }, { x: 1, y: 10 }])
        expect(rect.boundingBox.width).toEqual(3)
        expect(rect.boundingBox.height).toEqual(8)
        expect(rect.boundingBox.x).toEqual(1)
        expect(rect.boundingBox.y).toEqual(2)
      })
    })

    describe("isCloseToPoint", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 0, y: 100 }
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const triangle = new OIShapeRectangle(style, points)
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of a vertice`, () =>
      {
        const closePoint: TPoint = { x: points[0].x, y: points[0].y + SELECTION_MARGIN / 2 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
      {
        const closePoint: TPoint = { x: 20, y: 5 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
      {
        const closePoint: TPoint = { x: 100, y: 100 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(false)
      })
    })

    describe("isOverlapping", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const triangle = new OIShapeRectangle(style, points)
      test(`should return true if partially wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 100, width: 100, x: -50, y: -50 }
        expect(triangle.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return true if totally wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 500, width: 500, x: -25, y: -25 }
        expect(triangle.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return false if box is outside`, () =>
      {
        const boundaries: TBoundingBox = { height: 20, width: 20, x: 500, y: 500 }
        expect(triangle.isOverlapping(boundaries)).toEqual(false)
      })
      test(`should return false if box is inside`, () =>
      {
        const boundaries: TBoundingBox = { height: 2, width: 2, x: 5, y: 50 }
        expect(triangle.isOverlapping(boundaries)).toEqual(false)
      })
    })

    describe("getClone", () =>
    {
      test("should return clone", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 }
        ]
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = new OIShapeRectangle(style, points)
        const clone = triangle.getClone()
        expect(clone).toEqual(triangle)
        expect(clone).not.toBe(triangle)
      })
    })
  })

  describe("OIShapeTriangle", () =>
  {
    describe("constructor", () =>
    {
      test("should create ", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 3, y: 3 }
        ]
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = new OIShapeTriangle(style, points)
        expect(triangle).toBeDefined()
        expect(triangle.creationTime).toBeLessThanOrEqual(Date.now())
        expect(triangle.creationTime).toEqual(triangle.modificationDate)
        expect(triangle.style).toEqual(expect.objectContaining(style))
        expect(triangle.selected).toEqual(false)
        expect(triangle.transform).toEqual(MatrixTransform.identity())
        expect(triangle.points).toEqual(points)
        expect(triangle.boundingBox.x).toEqual(0)
        expect(triangle.boundingBox.y).toEqual(0)
        expect(triangle.boundingBox.width).toEqual(5)
        expect(triangle.boundingBox.height).toEqual(3)
        expect(triangle.vertices).toHaveLength(3)
      })
      test("should create with default style", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 3, y: 3 }
        ]
        const triangle = new OIShapeTriangle({}, points)
        expect(triangle.style).toEqual(DefaultStyle)
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
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle).toBeDefined()
        expect(triangle.creationTime).toBeLessThanOrEqual(Date.now())
        expect(triangle.creationTime).toEqual(triangle.modificationDate)
        expect(triangle.style).toEqual(expect.objectContaining(style))
        expect(triangle.selected).toEqual(false)
        expect(triangle.transform).toEqual(MatrixTransform.identity())
      })
      test("should create with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 4, y: 6 }
        const triangle = OIShapeTriangle.createFromLine({}, origin, target)
        expect(triangle.style).toEqual(DefaultStyle)
      })
      test("should create when origin is equal to target", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 1, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, origin, origin])
        expect(triangle.boundingBox.height).toEqual(0)
        expect(triangle.boundingBox.width).toEqual(0)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
        expect(triangle.vertices).toHaveLength(3)
      })
      test("should create when origin is at the top left", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 11, y: 22 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(10)
        expect(triangle.boundingBox.height).toEqual(20)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the top right", () =>
      {
        const origin: TPoint = { x: 11, y: 2 }
        const target: TPoint = { x: 1, y: 22 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(10)
        expect(triangle.boundingBox.height).toEqual(20)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the bottom right", () =>
      {
        const origin: TPoint = { x: 11, y: 22 }
        const target: TPoint = { x: 1, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(10)
        expect(triangle.boundingBox.height).toEqual(20)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
      })
      test("should create when origin is at the bottom left", () =>
      {
        const origin: TPoint = { x: 1, y: 22 }
        const target: TPoint = { x: 11, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = OIShapeTriangle.createFromLine(style, origin, target)
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(10)
        expect(triangle.boundingBox.height).toEqual(20)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
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
      const triangle = OIShapeTriangle.createFromLine(style, origin, target)
      test("should updateFromLine when target x increas", () =>
      {
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(3)
        expect(triangle.boundingBox.height).toEqual(4)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
        OIShapeTriangle.updateFromLine(triangle, origin, { x: target.x + 6, y: target.y })
        expect(triangle.points).toEqual([origin, { x: target.x + 6, y: origin.y }, { x: (origin.x + target.x) / 2 + 3, y: target.y }])
        expect(triangle.boundingBox.width).toEqual(9)
        expect(triangle.boundingBox.height).toEqual(4)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
      })
      test("should updateFromLine when target y increase", () =>
      {
        OIShapeTriangle.updateFromLine(triangle, origin, { x: target.x, y: target.y + 4 })
        expect(triangle.points).toEqual([origin, { x: target.x, y: origin.y }, { x: (origin.x + target.x) / 2, y: target.y + 4 }])
        expect(triangle.boundingBox.width).toEqual(3)
        expect(triangle.boundingBox.height).toEqual(8)
        expect(triangle.boundingBox.x).toEqual(1)
        expect(triangle.boundingBox.y).toEqual(2)
      })
    })

    describe("isCloseToPoint", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const triangle = new OIShapeTriangle(style, points)
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of a vertice`, () =>
      {
        const closePoint: TPoint = { x: points[0].x, y: points[0].y + SELECTION_MARGIN / 2 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
      {
        const closePoint: TPoint = { x: 80, y: 40 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
      {
        const closePoint: TPoint = { x: 100, y: 100 }
        expect(triangle.isCloseToPoint(closePoint)).toEqual(false)
      })
    })

    describe("isOverlapping", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const triangle = new OIShapeTriangle(style, points)
      test(`should return true if partially wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 100, width: 100, x: -50, y: -50 }
        expect(triangle.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return true if totally wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 500, width: 500, x: -25, y: -25 }
        expect(triangle.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return false if box is outside`, () =>
      {
        const boundaries: TBoundingBox = { height: 20, width: 20, x: 500, y: 500 }
        expect(triangle.isOverlapping(boundaries)).toEqual(false)
      })
      test(`should return false if box is inside`, () =>
      {
        const boundaries: TBoundingBox = { height: 2, width: 2, x: 5, y: 50 }
        expect(triangle.isOverlapping(boundaries)).toEqual(false)
      })
    })

    describe("getClone", () =>
    {
      test("should return clone", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 3, y: 3 }
        ]
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const triangle = new OIShapeTriangle(style, points)
        const clone = triangle.getClone()
        expect(clone).toEqual(triangle)
        expect(clone).not.toBe(triangle)
      })
    })
  })
  describe("OIShapeParallelogram", () =>
  {
    describe("constructor", () =>
    {
      test("should create ", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 4 },
          { x: 1, y: 5 },
        ]
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = new OIShapeParallelogram(style, points)
        expect(parallelogram).toBeDefined()
        expect(parallelogram.creationTime).toBeLessThanOrEqual(Date.now())
        expect(parallelogram.creationTime).toEqual(parallelogram.modificationDate)
        expect(parallelogram.style).toEqual(expect.objectContaining(style))
        expect(parallelogram.selected).toEqual(false)
        expect(parallelogram.transform).toEqual(MatrixTransform.identity())
        expect(parallelogram.points).toEqual(points)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
        expect(parallelogram.boundingBox.width).toEqual(5)
        expect(parallelogram.boundingBox.height).toEqual(5)
        expect(parallelogram.vertices).toHaveLength(4)
      })
      test("should create with default style", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 4 },
          { x: 1, y: 5 },
        ]
        const parallelogram = new OIShapeParallelogram({}, points)
        expect(parallelogram.style).toEqual(DefaultStyle)
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
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram).toBeDefined()
        expect(parallelogram.creationTime).toBeLessThanOrEqual(Date.now())
        expect(parallelogram.creationTime).toEqual(parallelogram.modificationDate)
        expect(parallelogram.style).toEqual(expect.objectContaining(style))
        expect(parallelogram.selected).toEqual(false)
        expect(parallelogram.transform).toEqual(MatrixTransform.identity())
      })
      test("should create with default style", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 4, y: 6 }
        const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
        expect(parallelogram.style).toEqual(DefaultStyle)
      })
      test("should create when origin is equal to target", () =>
      {
        const origin: TPoint = { x: 1, y: 2 }
        const target: TPoint = { x: 1, y: 2 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram.points).toEqual([origin, origin, origin, origin])
        expect(parallelogram.boundingBox.height).toEqual(0)
        expect(parallelogram.boundingBox.width).toEqual(0)
        expect(parallelogram.boundingBox.x).toEqual(1)
        expect(parallelogram.boundingBox.y).toEqual(2)
        expect(parallelogram.vertices).toHaveLength(4)
      })
      test("should create when origin is at the top left", () =>
      {
        const origin: TPoint = { x: 0, y: 0 }
        const target: TPoint = { x: 10, y: 20 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram.points).toEqual([origin, { x: 7.5, y: 0 }, target, { x: 2.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
      test("should create when origin is at the top right", () =>
      {
        const origin: TPoint = { x: 10, y: 0 }
        const target: TPoint = { x: 0, y: 20 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram.points).toEqual([origin, { x: 2.5, y: 0 }, target, { x: 7.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
      test("should create when origin is at the bottom right", () =>
      {
        const origin: TPoint = { x: 10, y: 20 }
        const target: TPoint = { x: 0, y: 0 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram.points).toEqual([origin, { x: 2.5, y: 20 }, target, { x: 7.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
      test("should create when origin is at the bottom left", () =>
      {
        const origin: TPoint = { x: 0, y: 20 }
        const target: TPoint = { x: 10, y: 0 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
        expect(parallelogram.points).toEqual([origin, { x: 7.5, y: 20 }, target, { x: 2.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
    })

    describe("updateFromLine", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
      test("should updateFromLine when target x increas", () =>
      {
        expect(parallelogram.points).toEqual([origin, { x: 7.5, y: 0 }, target, { x: 2.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)

        OIShapeParallelogram.updateFromLine(parallelogram, origin, { x: target.x + 8, y: target.y })
        expect(parallelogram.points).toEqual([origin, { x: 13.5, y: 0 }, { x: target.x + 8, y: target.y }, { x: 4.5, y: target.y }])
        expect(parallelogram.boundingBox.width).toEqual(18)
        expect(parallelogram.boundingBox.height).toEqual(20)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
      test("should updateFromLine when target y increase", () =>
      {
        OIShapeParallelogram.updateFromLine(parallelogram, origin, { x: target.x, y: target.y + 4 })
        expect(parallelogram.points).toEqual([origin, { x: 7.5, y: 0 }, { x: target.x, y: target.y + 4 }, { x: 2.5, y: target.y + 4 }])
        expect(parallelogram.boundingBox.width).toEqual(10)
        expect(parallelogram.boundingBox.height).toEqual(24)
        expect(parallelogram.boundingBox.x).toEqual(0)
        expect(parallelogram.boundingBox.y).toEqual(0)
      })
    })

    describe("isCloseToPoint", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 75, y: 0 },
        { x: 100, y: 100 },
        { x: 25, y: 100 },
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const parallelogram = new OIShapeParallelogram(style, points)
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of a vertice`, () =>
      {
        const closePoint: TPoint = { x: points[0].x, y: points[0].y + SELECTION_MARGIN / 2 }
        expect(parallelogram.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
      {
        const closePoint: TPoint = { x: 87, y: 50 }
        expect(parallelogram.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
      {
        const closePoint: TPoint = { x: 150, y: 100 }
        expect(parallelogram.isCloseToPoint(closePoint)).toEqual(false)
      })
    })

    describe("isOverlapping", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 }
      ]
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const parallelogram = new OIShapeParallelogram(style, points)
      test(`should return true if partially wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 100, width: 100, x: -50, y: -50 }
        expect(parallelogram.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return true if totally wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 500, width: 500, x: -25, y: -25 }
        expect(parallelogram.isOverlapping(boundaries)).toEqual(true)
      })
      test(`should return false if box is outside`, () =>
      {
        const boundaries: TBoundingBox = { height: 20, width: 20, x: 500, y: 500 }
        expect(parallelogram.isOverlapping(boundaries)).toEqual(false)
      })
      test(`should return false if box is inside`, () =>
      {
        const boundaries: TBoundingBox = { height: 2, width: 2, x: 5, y: 50 }
        expect(parallelogram.isOverlapping(boundaries)).toEqual(false)
      })
    })

    describe("getClone", () =>
    {
      test("should return clone", () =>
      {
        const points: TPoint[] = [
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          { x: 3, y: 3 }
        ]
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const parallelogram = new OIShapeParallelogram(style, points)
        const clone = parallelogram.getClone()
        expect(clone).toEqual(parallelogram)
        expect(clone).not.toBe(parallelogram)
      })
    })
  })
})
