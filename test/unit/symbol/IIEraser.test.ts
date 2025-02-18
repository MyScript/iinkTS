import
{
  IIEraser,
} from "../../../src/iink"

describe("IIEraser.ts", () =>
{
  test("constructor", () =>
  {
    const eraser = new IIEraser()
    expect(eraser).toBeDefined()
    expect(eraser.creationTime).toBeLessThanOrEqual(Date.now())
    expect(eraser.creationTime).toEqual(eraser.modificationDate)
    expect(eraser.pointers).toHaveLength(0)
    expect(eraser.selected).toEqual(false)
    expect(eraser.bounds.x).toEqual(0)
    expect(eraser.bounds.y).toEqual(0)
    expect(eraser.bounds.height).toEqual(0)
    expect(eraser.bounds.width).toEqual(0)
    expect(eraser.snapPoints).toHaveLength(0)
    expect(eraser.style).toEqual({
      "color": "grey",
      "fill": "none",
      "opacity": 0.2,
      "width": 12,
    })
  })

  describe("boundingBox", () =>
  {
    test("should get without pointers", () =>
    {
      const eraser = new IIEraser()
      expect(eraser.bounds.height).toEqual(0)
      expect(eraser.bounds.width).toEqual(0)
      expect(eraser.bounds.x).toEqual(0)
      expect(eraser.bounds.y).toEqual(0)
    })
    test("should get with pointers", () =>
    {
      const eraser = new IIEraser()
      eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })
      expect(eraser.bounds.height).toEqual(10)
      expect(eraser.bounds.width).toEqual(10)
      expect(eraser.bounds.x).toEqual(1)
      expect(eraser.bounds.y).toEqual(1)
    })
  })

  describe("overlaps", () =>
  {
    const eraser = new IIEraser()
    eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })
    test("should return true", () =>
    {
      expect(eraser.overlaps({ height: 10, width: 10, x: 0, y: 0 })).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(eraser.overlaps({ height: 10, width: 10, x: 100, y: 0 })).toEqual(false)
    })
  })



  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const eraser = new IIEraser()
      eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })

      const clone = eraser.clone()
      expect(clone).toEqual(eraser)
      expect(clone).not.toBe(eraser)
    })
  })
})
