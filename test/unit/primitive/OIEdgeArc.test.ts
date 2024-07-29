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
      expect(arc.bounds.x).toEqual(-15)
      expect(arc.bounds.y).toEqual(-5)
      expect(+arc.bounds.width.toFixed(0)).toEqual(27)
      expect(+arc.bounds.height.toFixed(0)).toEqual(20)
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

  describe("properties", () =>
  {
    const center: TPoint = { x: 0, y: 0 }
    const smallClockwiseArc = new OIEdgeArc(center, Math.PI / 4, Math.PI / 4, 5, 5, 0)
    const largeClockwiseArc = new OIEdgeArc(center, Math.PI / 4, 3 * Math.PI / 4, 50, 50, 0)
    const smallCounterClockwiseArc = new OIEdgeArc(center, Math.PI / 4, -Math.PI / 4, 5, 5, 0)
    const largeCounterClockwiseArc = new OIEdgeArc(center, Math.PI / 4, -3 * Math.PI / 4, 50, 50, 0)

    test(`should get vertices for small clockwise arc`, () =>
    {
      expect(smallClockwiseArc.vertices).toHaveLength(8)
      expect(smallClockwiseArc.vertices).toEqual(expect.arrayContaining(
        [
          { x: 3.536, y: 3.536 },
          { x: 2.357, y: 4.41 },
          { x: 0.49, y: 4.976 }
        ]
      ))
    })
    test(`should get vertices for large clockwise arc`, () =>
    {
      expect(largeClockwiseArc.vertices).toHaveLength(24)
      expect(largeClockwiseArc.vertices).toEqual(expect.arrayContaining(
        [
          { x: 35.355, y: 35.355 },
          { x: -0, y: 50 },
          { x: -49.759, y: 4.901 }
        ]
      ))
    })
    test(`should get vertices for small counter-clockwise arc`, () =>
    {
      expect(smallCounterClockwiseArc.vertices).toHaveLength(9)
      expect(smallCounterClockwiseArc.vertices).toEqual(expect.arrayContaining(
        [
          { x: 3.536, y: 3.536 },
          { x: 4.41, y: 2.357 },
          { x: 5, y: 0 }
        ]
      ))
    })
    test(`should get vertices for large counter-clockwise arc`, () =>
    {
      expect(largeCounterClockwiseArc.vertices).toHaveLength(24)
      expect(largeCounterClockwiseArc.vertices).toEqual(expect.arrayContaining(
        [
          { x: 35.355, y: 35.355 },
          { x: 50, y: 0 },
          { x: 4.901, y: -49.759 }
        ]
      ))
    })

    test(`should get snap points for small clockwise arc`, () =>
    {
      expect(smallClockwiseArc.snapPoints).toHaveLength(2)
      expect(smallClockwiseArc.snapPoints).toEqual([
        { x: 3.536, y: 3.536 },
        { x: 0.49, y: 4.976 }
      ])
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
