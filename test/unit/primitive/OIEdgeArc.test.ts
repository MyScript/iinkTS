import
{
  OIEdgeArc,
  TPoint,
  DefaultStyle,
  TStyle,
  SELECTION_MARGIN,
  TBoundingBox,
} from "../../../src/iink"

describe("cle.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const middle: TPoint = { x: 5, y: 10 }
      const end: TPoint = { x: 10, y: 0 }
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const arc = new OIEdgeArc(style, start, middle, end)
      expect(arc).toBeDefined()
      expect(arc.creationTime).toBeLessThanOrEqual(Date.now())
      expect(arc.creationTime).toEqual(arc.modificationDate)
      expect(arc.style).toEqual(expect.objectContaining(style))
      expect(arc.selected).toEqual(false)
      expect(arc.start).toEqual(start)
      expect(arc.middle).toEqual(middle)
      expect(arc.end).toEqual(end)
      expect(arc.boundingBox.x).toEqual(-5)
      expect(arc.boundingBox.y).toEqual(-5)
      expect(arc.boundingBox.width).toEqual(20)
      expect(arc.boundingBox.height).toEqual(20)
      expect(arc.vertices).toHaveLength(3)
    })
    test("should create with default style", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const middle: TPoint = { x: 5, y: 10 }
      const end: TPoint = { x: 10, y: 0 }
      const arc = new OIEdgeArc({}, start, middle, end)
      expect(arc.style).toEqual(DefaultStyle)
    })
  })
  describe("isCloseToPoint", () =>
  {
    const start: TPoint = { x: 0, y: 0 }
    const middle: TPoint = { x: 5, y: 10 }
    const end: TPoint = { x: 10, y: 0 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const arc = new OIEdgeArc(style, start, middle, end)
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
    const start: TPoint = { x: 0, y: 0 }
    const middle: TPoint = { x: 5, y: 10 }
    const end: TPoint = { x: 10, y: 0 }
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const arc = new OIEdgeArc(style, start, middle, end)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
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
      const start: TPoint = { x: 0, y: 0 }
      const middle: TPoint = { x: 5, y: 10 }
      const end: TPoint = { x: 10, y: 0 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const arc = new OIEdgeArc(style, start, middle, end)
      const clone = arc.clone()
      expect(clone).toEqual(arc)
      expect(clone).not.toBe(arc)
    })
  })
})
