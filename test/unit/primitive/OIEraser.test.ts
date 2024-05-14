import
{
  OIEraser,
} from "../../../src/iink"

describe("OIEraser.ts", () =>
{
  test("constructor", () =>
  {
    const eraser = new OIEraser()
    expect(eraser).toBeDefined()
    expect(eraser.creationTime).toBeLessThanOrEqual(Date.now())
    expect(eraser.creationTime).toEqual(eraser.modificationDate)
    expect(eraser.pointers).toHaveLength(0)
    expect(eraser.selected).toEqual(false)
    expect(eraser.boundingBox.x).toEqual(0)
    expect(eraser.boundingBox.y).toEqual(0)
    expect(eraser.boundingBox.height).toEqual(0)
    expect(eraser.boundingBox.width).toEqual(0)
    expect(eraser.snapPoints).toHaveLength(0)
    expect(eraser.style).toEqual({})
  })

  describe("boundingBox", () =>
  {
    test("should get without pointers", () =>
    {
      const eraser = new OIEraser()
      expect(eraser.boundingBox.height).toEqual(0)
      expect(eraser.boundingBox.width).toEqual(0)
      expect(eraser.boundingBox.x).toEqual(0)
      expect(eraser.boundingBox.y).toEqual(0)
    })
    test("should get with pointers", () =>
    {
      const eraser = new OIEraser()
      eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })
      expect(eraser.boundingBox.height).toEqual(10)
      expect(eraser.boundingBox.width).toEqual(10)
      expect(eraser.boundingBox.x).toEqual(1)
      expect(eraser.boundingBox.y).toEqual(1)
    })
  })

  describe("overlaps", () =>
  {
    const eraser = new OIEraser()
    eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })
    test("should return true", () =>
    {
      expect(eraser.overlaps({ height: 10, width: 10, x: 0, y: 0})).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(eraser.overlaps({ height: 10, width: 10, x: 100, y: 0})).toEqual(false)
    })
  })

  describe("isCloseToPoint", () =>
  {
    const eraser = new OIEraser()
    eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })
    test("should return true", () =>
    {
      expect(eraser.isCloseToPoint({ x: 0, y: 0})).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(eraser.isCloseToPoint({ x: 35, y: 0})).toEqual(false)
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const eraser = new OIEraser()
      eraser.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
      eraser.pointers.push({ p: 1, t: 1, x: 11, y: 11 })

      const clone = eraser.clone()
      expect(clone).toEqual(eraser)
      expect(clone).not.toBe(eraser)
    })
  })
})
