import
{
  TPointer,
  computeLinksPointers,
  computeMiddlePointer
} from "../../../src/iink"

describe("quadratics", () =>
{
  const p1: TPointer = {
    p: 1,
    t: 1,
    x: 1,
    y: 1
  }
  const p2: TPointer = {
    p: 1,
    t: 1,
    x: 2,
    y: 5
  }

  test("should computeLinksPointers", () =>
  {
    const points = computeLinksPointers(p1, 90, 1)
    expect(points).toStrictEqual([
      {
        x: 0.106,
        y: 0.552
      },
      {
        x: 1.894,
        y: 1.448
      }
    ])
  })

  test("should computeMiddlePointer", () =>
  {
    const point = computeMiddlePointer(p1, p2)
    expect(point).toStrictEqual({ x: 1.5, y: 3, p: 1, t: 1 })
  })
})
