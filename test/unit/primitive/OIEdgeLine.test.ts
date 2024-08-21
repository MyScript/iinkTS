import
{
  OIEdgeLine,
  TPoint,
  DefaultStyle,
  TStyle,
  TBoundingBox,
} from "../../../src/iink"

describe("OIEdgeLine.ts", () =>
{
  describe("constructor", () =>
  {
    test("should create", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const line = new OIEdgeLine(start, end, undefined, undefined, style)
      expect(line).toBeDefined()
      expect(line.creationTime).toBeLessThanOrEqual(Date.now())
      expect(line.creationTime).toEqual(line.modificationDate)
      expect(line.style).toEqual(expect.objectContaining(style))
      expect(line.selected).toEqual(false)
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
      expect(line.bounds.x).toEqual(-5)
      expect(line.bounds.y).toEqual(-5)
      expect(line.bounds.width).toEqual(15)
      expect(line.bounds.height).toEqual(15)
      expect(line.vertices).toHaveLength(2)
    })
    test("should create with default style", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const line = new OIEdgeLine(start, end)
      expect(line.style).toEqual(DefaultStyle)
    })
  })
  describe("overlaps", () =>
  {
    const start: TPoint = { x: 0, y: 0 }
    const end: TPoint = { x: 0, y: 25 }
    const line = new OIEdgeLine(start, end)
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
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 25 }
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const line = new OIEdgeLine(start, end, undefined, undefined, style)
      const clone = line.clone()
      expect(clone).toEqual(line)
      expect(clone).not.toBe(line)
    })
  })
})
