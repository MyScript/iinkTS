import
{
  OIEdgePolyLine,
  TPoint,
  DefaultStyle,
  TStyle,
  SELECTION_MARGIN,
  TBoundingBox,
} from "../../../src/iink"

describe("OIEdgePolyLine.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create", () =>
    {
      const points: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const line = new OIEdgePolyLine(style, points)
      expect(line).toBeDefined()
      expect(line.creationTime).toBeLessThanOrEqual(Date.now())
      expect(line.creationTime).toEqual(line.modificationDate)
      expect(line.style).toEqual(expect.objectContaining(style))
      expect(line.selected).toEqual(false)
      expect(line.points).toEqual(points)
      expect(line.boundingBox.x).toEqual(-5)
      expect(line.boundingBox.y).toEqual(-5)
      expect(line.boundingBox.width).toEqual(15)
      expect(line.boundingBox.height).toEqual(15)
      expect(line.vertices).toHaveLength(3)
    })
    test("should create with default style", () =>
    {
      const points: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
      const line = new OIEdgePolyLine({}, points)
      expect(line.style).toEqual(DefaultStyle)
    })
  })
  describe("isCloseToPoint", () =>
  {
    const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }]
    const line = new OIEdgePolyLine({}, middles)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel vertice`, () =>
    {
      const closePoint: TPoint = { x: 0, y: SELECTION_MARGIN / 2 }
      expect(line.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel from line`, () =>
    {
      const closePoint: TPoint = { x: 25, y: SELECTION_MARGIN / 2 }
      expect(line.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: 25, y: 25 }
      expect(line.isCloseToPoint(closePoint)).toEqual(false)
    })
  })
  describe("overlaps", () =>
  {
    const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 15, y: 15 }, { x: 0, y: 25 }]
    const line = new OIEdgePolyLine({}, middles)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(line.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(line.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(line.overlaps(boundaries)).toEqual(false)
    })
  })
  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 15, y: 15 }, { x: 0, y: 25 }]
      const line = new OIEdgePolyLine({}, middles)
      const clone = line.clone()
      expect(clone).toEqual(line)
      expect(clone).not.toBe(line)
    })
  })
})
