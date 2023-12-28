import
{
  DefaultStyle,
  MatrixTransform,
  OIShapeRectangle,
  SELECTION_MARGIN,
  TBoundingBox,
  TPoint,
  TStyle
} from "../../../src/iink"

describe("OIShapeRectangle.ts", () =>
{

  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const x = 1, y = 2, width = 3, height = 4
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const rect = new OIShapeRectangle(style, x, y, width, height)
      expect(rect).toBeDefined()
      expect(rect.creationTime).toBeLessThanOrEqual(Date.now())
      expect(rect.creationTime).toEqual(rect.modificationDate)
      expect(rect.style).toEqual(style)
      expect(rect.selected).toEqual(false)
      expect(rect.transform).toEqual(MatrixTransform.identity())
      expect(rect.x).toEqual(x)
      expect(rect.y).toEqual(y)
      expect(rect.width).toEqual(width)
      expect(rect.height).toEqual(height)
      expect(rect.boundingBox.x).toEqual(x)
      expect(rect.boundingBox.y).toEqual(y)
      expect(rect.boundingBox.width).toEqual(width)
      expect(rect.boundingBox.height).toEqual(height)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 4, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 4, y: 6 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 6 })
    })
    test("should create with default style", () =>
    {
      const x = 1, y = 2, width = 3, height = 4
      const rect = new OIShapeRectangle({}, x, y, width, height)
      expect(rect.style).toEqual(DefaultStyle)
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
      const rect = OIShapeRectangle.createFromLine(style, origin, target)
      expect(rect).toBeDefined()
      expect(rect.creationTime).toBeLessThanOrEqual(Date.now())
      expect(rect.creationTime).toEqual(rect.modificationDate)
      expect(rect.style).toEqual(style)
      expect(rect.selected).toEqual(false)
      expect(rect.transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const rect = OIShapeRectangle.createFromLine({}, origin, target)
      expect(rect.style).toEqual(DefaultStyle)
    })
    test("should create when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 1, y: 2 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const rect = OIShapeRectangle.createFromLine(style, origin, target)
      expect(rect.boundingBox.height).toEqual(0)
      expect(rect.boundingBox.width).toEqual(0)
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 2 })
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
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(10)
      expect(rect.boundingBox.height).toEqual(20)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 11, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 11, y: 22 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 22 })
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
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(10)
      expect(rect.boundingBox.height).toEqual(20)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 11, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 11, y: 22 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 22 })
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
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(10)
      expect(rect.boundingBox.height).toEqual(20)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 11, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 11, y: 22 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 22 })
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
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(10)
      expect(rect.boundingBox.height).toEqual(20)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 11, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 11, y: 22 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 22 })
    })
  })

  describe("updateFromLine", () =>
  {
    const origin: TPoint = { x: 1, y: 2 }
    const target: TPoint = { x: 11, y: 22 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const rect = OIShapeRectangle.createFromLine(style, origin, target)
    test("should updateFromLine when target x increas", () =>
    {
      OIShapeRectangle.updateFromLine(rect, origin, { x: target.x + 6, y: target.y })
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(16)
      expect(rect.boundingBox.height).toEqual(20)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 17, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 17, y: 22 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 22 })
    })
    test("should updateFromLine when target y increase", () =>
    {
      OIShapeRectangle.updateFromLine(rect, origin, { x: target.x, y: target.y + 4 })
      expect(rect.boundingBox.x).toEqual(1)
      expect(rect.boundingBox.y).toEqual(2)
      expect(rect.boundingBox.width).toEqual(10)
      expect(rect.boundingBox.height).toEqual(24)
      expect(rect.vertices).toHaveLength(4)
      expect(rect.vertices[0]).toEqual({ x: 1, y: 2 })
      expect(rect.vertices[1]).toEqual({ x: 11, y: 2 })
      expect(rect.vertices[2]).toEqual({ x: 11, y: 26 })
      expect(rect.vertices[3]).toEqual({ x: 1, y: 26 })
    })
  })

  describe("isCloseToPoint", () =>
  {
    const x = 0, y = 0, width = 30, height = 40
    const rect = new OIShapeRectangle(DefaultStyle, x, y, width, height)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel of an edge`, () =>
    {
      const closePoint: TPoint = { x: 15, y: SELECTION_MARGIN / 2 }
      expect(rect.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: 50, y: SELECTION_MARGIN + 10 }
      expect(rect.isCloseToPoint(closePoint)).toEqual(false)
    })
  })

  describe("isPartiallyOrTotallyWrapped", () =>
  {
    const x = 0, y = 0, width = 30, height = 40
    const rect = new OIShapeRectangle(DefaultStyle, x, y, width, height)
    test(`should return true if partially wrap`, () =>
    {
      const bounds: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(rect.isPartiallyOrTotallyWrapped(bounds)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const bounds: TBoundingBox = { height: 100, width: 100, x: -5, y: -5 }
      expect(rect.isPartiallyOrTotallyWrapped(bounds)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const bounds: TBoundingBox = { height: 10, width: 10, x: -20, y: -20 }
      expect(rect.isPartiallyOrTotallyWrapped(bounds)).toEqual(false)
    })
    test(`should return false if box is inside`, () =>
    {
      const bounds: TBoundingBox = { height: 2, width: 3, x: 2, y: 3 }
      expect(rect.isPartiallyOrTotallyWrapped(bounds)).toEqual(false)
    })
  })

  describe("getClone", () =>
  {
    test("should return clone", () =>
    {
      const x = 1, y = 2, width = 3, height = 4
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const rect = new OIShapeRectangle(style, x, y, width, height)

      const clone = rect.getClone()
      expect(clone).toEqual(rect)
      expect(clone).not.toBe(rect)
    })
  })
})
