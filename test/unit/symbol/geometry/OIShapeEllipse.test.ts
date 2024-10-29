import
{
  OIShapeEllipse,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox
} from "../../../../src/iink"

describe("OIShapeEllipse.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const phi = 0
      const ellipse = new OIShapeEllipse(center, radiusX, radiusY, phi, style)
      expect(ellipse).toBeDefined()
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
      expect(ellipse.creationTime).toEqual(ellipse.modificationDate)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
      expect(ellipse.selected).toEqual(false)
      expect(ellipse.center).toEqual(center)
      expect(ellipse.radiusX).toEqual(radiusX)
      expect(ellipse.radiusY).toEqual(radiusY)
      expect(ellipse.bounds.x).toEqual(0)
      expect(ellipse.bounds.y).toEqual(-10)
      expect(ellipse.bounds.width).toEqual(10)
      expect(ellipse.bounds.height).toEqual(20)
      expect(ellipse.vertices).toHaveLength(8)
    })
    test("should create with default style", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const phi = 0
      const ellipse = new OIShapeEllipse(center, radiusX, radiusY, phi)
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create and have many vertices", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 50
      const radiusY = 100
      const phi = 0
      const ellipse = new OIShapeEllipse(center, radiusX, radiusY, phi)
      expect(ellipse.vertices).toHaveLength(50)
    })
  })

  describe("createBetweenPoints", () =>
  {
    test("should create", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target, style)
      expect(ellipse).toBeDefined()
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
      expect(ellipse.creationTime).toEqual(ellipse.modificationDate)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
      expect(ellipse.selected).toEqual(false)
      expect(ellipse.center).toEqual({ x: 2.5, y: 4 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(2)
    })
    test("should create with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 4, y: 6 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 1, y: 2 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual(origin)
      expect(ellipse.radiusX).toEqual(0)
      expect(ellipse.radiusY).toEqual(0)
      expect(ellipse.bounds.height).toEqual(0)
      expect(ellipse.bounds.width).toEqual(0)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
      expect(ellipse.vertices).toHaveLength(8)
    })
    test("should create when origin is at the top left", () =>
    {
      const origin: TPoint = { x: 1, y: 2 }
      const target: TPoint = { x: 11, y: 22 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.bounds.width).toEqual(10)
      expect(ellipse.bounds.height).toEqual(20)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
    test("should create when origin is at the top right", () =>
    {
      const origin: TPoint = { x: 11, y: 2 }
      const target: TPoint = { x: 1, y: 22 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.bounds.width).toEqual(10)
      expect(ellipse.bounds.height).toEqual(20)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
    test("should create when origin is at the bottom right", () =>
    {
      const origin: TPoint = { x: 11, y: 22 }
      const target: TPoint = { x: 1, y: 2 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.bounds.width).toEqual(10)
      expect(ellipse.bounds.height).toEqual(20)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
    test("should create when origin is at the bottom left", () =>
    {
      const origin: TPoint = { x: 1, y: 22 }
      const target: TPoint = { x: 11, y: 2 }
      const ellipse = OIShapeEllipse.createBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 6, y: 12 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
      expect(ellipse.bounds.width).toEqual(10)
      expect(ellipse.bounds.height).toEqual(20)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
  })

  describe("updateFrupdateBetweenPointsomLine", () =>
  {
    const origin: TPoint = { x: 1, y: 2 }
    const target: TPoint = { x: 4, y: 6 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const ellipse = OIShapeEllipse.createBetweenPoints(origin, target, style)
    test("should updateBetweenPoints when target x increas", () =>
    {
      expect(ellipse.center).toEqual({ x: 2.5, y: 4 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(2)
      expect(ellipse.bounds.width).toEqual(3)
      expect(ellipse.bounds.height).toEqual(4)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
      OIShapeEllipse.updateBetweenPoints(ellipse, origin, { x: target.x + 6, y: target.y })
      expect(ellipse.center).toEqual({ x: 5.5, y: 4 })
      expect(ellipse.radiusX).toEqual(4.5)
      expect(ellipse.radiusY).toEqual(2)
      expect(ellipse.bounds.width).toEqual(9)
      expect(ellipse.bounds.height).toEqual(4)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
    test("should updateBetweenPoints when target y increase", () =>
    {
      OIShapeEllipse.updateBetweenPoints(ellipse, origin, { x: target.x, y: target.y + 4 })
      expect(ellipse.center).toEqual({ x: 2.5, y: 6 })
      expect(ellipse.radiusX).toEqual(1.5)
      expect(ellipse.radiusY).toEqual(4)
      expect(ellipse.bounds.width).toEqual(3)
      expect(ellipse.bounds.height).toEqual(8)
      expect(ellipse.bounds.x).toEqual(1)
      expect(ellipse.bounds.y).toEqual(2)
    })
  })

  describe("overlaps", () =>
  {
    const center: TPoint = { x: 5, y: 0 }
    const radiusX = 5
    const radiusY = 10
    const phi = 0
    const ellipse = new OIShapeEllipse(center, radiusX, radiusY, phi)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(ellipse.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(ellipse.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(ellipse.overlaps(boundaries)).toEqual(false)
    })
    test(`should return false if box is inside`, () =>
    {
      const boundaries: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(ellipse.overlaps(boundaries)).toEqual(false)
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const center: TPoint = { x: 5, y: 0 }
      const radiusX = 5
      const radiusY = 10
      const phi = Math.PI
      const ellipse = new OIShapeEllipse(center, radiusX, radiusY, phi)
      const clone = ellipse.clone()
      expect(clone).toEqual(ellipse)
      expect(clone).not.toBe(ellipse)
    })
  })
})
