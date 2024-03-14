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
        x: 0.10600333639944215,
        y: 0.5519263838708298
      },
      {
        x: 1.8939966636005579,
        y: 1.4480736161291703
      }
    ])
  })

  test("should computeMiddlePointer", () =>
  {
    const point = computeMiddlePointer(p1, p2)
    expect(point).toStrictEqual({ x: 1.5, y: 3, p: 1, t: 1 })
  })
})
