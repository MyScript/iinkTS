import { Box, TPoint } from "../../../src/iink"

describe("Box.ts", () =>
{
  test("should create", () =>
  {
    const x = 0, y = 1, width = 2, height = 3
    const box = new Box(x, y, width, height)
    expect(box).toBeDefined()
    expect(box.x).toEqual(x)
    expect(box.y).toEqual(y)
    expect(box.width).toEqual(width)
    expect(box.height).toEqual(height)

    expect(box.xMin).toEqual(x)
    expect(box.xMax).toEqual(x + width)
    expect(box.yMin).toEqual(y)
    expect(box.yMax).toEqual(y + height)
  })

  test("should create from points if no points", () =>
  {
    const points: TPoint[] = []
    const box = Box.createFromPoints(points)
    expect(box).toBeDefined()
    expect(box.x).toEqual(0)
    expect(box.y).toEqual(0)
    expect(box.width).toEqual(0)
    expect(box.height).toEqual(0)

    expect(box.xMin).toEqual(0)
    expect(box.xMax).toEqual(0)
    expect(box.yMin).toEqual(0)
    expect(box.yMax).toEqual(0)
  })

  test("should create from points", () =>
  {
    const xMin = -5, xMax = 5, yMin = 20, yMax = 25
    const points: TPoint[] = []
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        points.push({ x, y})
      }
    }
    const box = Box.createFromPoints(points)
    expect(box).toBeDefined()
    expect(box.x).toEqual(xMin)
    expect(box.y).toEqual(yMin)
    expect(box.width).toEqual(xMax - xMin)
    expect(box.height).toEqual(yMax - yMin)

    expect(box.xMin).toEqual(xMin)
    expect(box.xMax).toEqual(xMax)
    expect(box.yMin).toEqual(yMin)
    expect(box.yMax).toEqual(yMax)
  })

})
