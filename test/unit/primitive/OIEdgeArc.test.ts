import
{
  OIEdgeArc,
  TPoint,
  DefaultStyle,
  TStyle,
  SELECTION_MARGIN,
  TBoundingBox,
} from "../../../src/iink"

describe("OIEdgeArc.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = 3 * Math.PI / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0

      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      expect(arc).toBeDefined()
      expect(arc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(arc.creationTime).toEqual(arc.modificationDate)
      expect(arc.style).toEqual(expect.objectContaining(style))
      expect(arc.selected).toEqual(false)
      expect(arc.center).toEqual(center)
      expect(arc.bounds.x).toEqual(-14.989)
      expect(arc.bounds.y).toEqual(-4.529)
      expect(+arc.bounds.width.toFixed(0)).toEqual(27)
      expect(+arc.bounds.height.toFixed(0)).toEqual(20)
      expect(arc.vertices).toHaveLength(50)
    })
    test("should create with default style", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = 3 * Math.PI / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      expect(arc.style).toEqual(DefaultStyle)
    })
  })
  describe("isCloseToPoint", () =>
  {
    const center: TPoint = { x: 0, y: 0 }
    const startAngle = Math.PI / 4
    const sweepAngle = 3 * Math.PI / 4
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel vertice`, () =>
    {
      const closePoint: TPoint = { x: 0, y: 0 + SELECTION_MARGIN / 2 }
      expect(arc.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel from arc`, () =>
    {
      const closePoint: TPoint = { x: 5, y: 10 + SELECTION_MARGIN / 2 }
      expect(arc.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: 25, y: 25 }
      expect(arc.isCloseToPoint(closePoint)).toEqual(false)
    })
  })
  describe("overlaps", () =>
  {
    const center: TPoint = { x: 0, y: 0 }
    const startAngle = Math.PI / 4
    const sweepAngle = 3 * Math.PI / 4
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 20, width: 20, x: 5, y: 0 }
      expect(arc.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(arc.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(arc.overlaps(boundaries)).toEqual(false)
    })
  })
  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = Math.PI / 4
      const sweepAngle = 3 * Math.PI / 4
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      const clone = arc.clone()
      expect(clone).toEqual(arc)
      expect(clone).not.toBe(arc)
    })
  })
})
