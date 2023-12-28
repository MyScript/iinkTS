import
{
  OILine,
  TPoint,
  DefaultStyle,
  TStyle,
  MatrixTransform,
  SELECTION_MARGIN,
  TBoundingBox,
} from "../../../src/iink"


describe("OIEdge.ts", () =>
{
  describe("OILine", () =>
  {
    describe("constructor", () =>
    {
      test("should create", () =>
      {
        const start: TPoint = { x: 0, y: 0 }
        const end: TPoint = { x: 5, y: 5 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const line = new OILine(style, start, end)
        expect(line).toBeDefined()
        expect(line.creationTime).toBeLessThanOrEqual(Date.now())
        expect(line.creationTime).toEqual(line.modificationDate)
        expect(line.style).toEqual(style)
        expect(line.selected).toEqual(false)
        expect(line.transform).toEqual(MatrixTransform.identity())
        expect(line.start).toEqual(start)
        expect(line.end).toEqual(end)
        expect(line.boundingBox.x).toEqual(-5)
        expect(line.boundingBox.y).toEqual(-5)
        expect(line.boundingBox.width).toEqual(15)
        expect(line.boundingBox.height).toEqual(15)
        expect(line.vertices).toHaveLength(2)
      })
      test("should create with default style", () =>
      {
        const start: TPoint = { x: 0, y: 0 }
        const end: TPoint = { x: 5, y: 5 }
        const line = new OILine({}, start, end)
        expect(line.style).toEqual(DefaultStyle)
      })
    })
    describe("isCloseToPoint", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 50 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const line = new OILine(style, start, end)
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel vertice`, () =>
      {
        const closePoint: TPoint = { x: 0, y: 0 + SELECTION_MARGIN / 2 }
        expect(line.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return true when the point is within ${ SELECTION_MARGIN } pixel from line`, () =>
      {
        const closePoint: TPoint = { x: SELECTION_MARGIN / 2, y: 25  }
        expect(line.isCloseToPoint(closePoint)).toEqual(true)
      })
      test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
      {
        const closePoint: TPoint = { x: 25, y: 25 }
        expect(line.isCloseToPoint(closePoint)).toEqual(false)
      })
    })
    describe("isPartiallyOrTotallyWrapped", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 25 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const line = new OILine(style, start, end)
      test(`should return true if partially wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
        expect(line.isPartiallyOrTotallyWrapped(boundaries)).toEqual(true)
      })
      test(`should return true if totally wrap`, () =>
      {
        const boundaries: TBoundingBox = { height: 50, width: 50, x: -25, y: -25 }
        expect(line.isPartiallyOrTotallyWrapped(boundaries)).toEqual(true)
      })
      test(`should return false if box is outside`, () =>
      {
        const boundaries: TBoundingBox = { height: 2, width: 2, x: 50, y: 50 }
        expect(line.isPartiallyOrTotallyWrapped(boundaries)).toEqual(false)
      })
    })
    describe("getClone", () =>
    {
      test("should return clone", () =>
      {
        const start: TPoint = { x: 0, y: 0 }
        const end: TPoint = { x: 0, y: 25 }
        const style: TStyle = {
          color: "blue",
          width: 20
        }
        const line = new OILine(style, start, end)
        const clone = line.getClone()
        expect(clone).toEqual(line)
        expect(clone).not.toBe(line)
      })
    })
  })
})
