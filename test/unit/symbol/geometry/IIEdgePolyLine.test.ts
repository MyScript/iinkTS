import
{
  IIEdgePolyLine,
  TPoint,
  DefaultStyle,
  TStyle,
  TBox,
} from "../../../../src/iink"

describe("IIEdgePolyLine.ts", () =>
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
      const line = new IIEdgePolyLine(points, undefined, undefined, style)
      expect(line).toBeDefined()
      expect(line.creationTime).toBeLessThanOrEqual(Date.now())
      expect(line.creationTime).toEqual(line.modificationDate)
      expect(line.style).toEqual(expect.objectContaining(style))
      expect(line.selected).toEqual(false)
      expect(line.points).toEqual(points)
      expect(line.bounds.x).toEqual(-5)
      expect(line.bounds.y).toEqual(-5)
      expect(line.bounds.width).toEqual(15)
      expect(line.bounds.height).toEqual(15)
      expect(line.vertices).toHaveLength(3)
    })
    test("should create with default style", () =>
    {
      const points: TPoint[] = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 5 }]
      const line = new IIEdgePolyLine(points)
      expect(line.style).toEqual(DefaultStyle)
    })
  })
  describe("overlaps", () =>
  {
    const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 15, y: 15 }, { x: 0, y: 25 }]
    const line = new IIEdgePolyLine(middles)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(line.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(line.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(line.overlaps(boundaries)).toEqual(false)
    })
  })
  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const middles: TPoint[] = [{ x: 0, y: 0 }, { x: 15, y: 15 }, { x: 0, y: 25 }]
      const line = new IIEdgePolyLine(middles)
      const clone = line.clone()
      expect(clone).toEqual(line)
      expect(clone).not.toBe(line)
    })
  })
})
