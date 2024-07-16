import { OISVGRendererStrokeUtil, OIStroke } from "../../../src/iink"

describe("OISVGRendererStrokeUtil.ts", () =>
{

  test("should getSVGPath when no pointers", () =>
  {
    const stroke = new OIStroke({})
    expect(OISVGRendererStrokeUtil.getSVGPath(stroke)).toEqual("")
  })

  test("should getSVGPath when 2 pointers", () =>
  {
    const stroke = new OIStroke()
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(OISVGRendererStrokeUtil.getSVGPath(stroke)).toEqual("M 1 1 m -2.4 0 a 2.4 2.4 0 1 0 4.8 0 a 2.4 2.4 0 1 0 -4.8 0")
  })

  test("should getSVGPath when more than 2 pointers", () =>
  {
    const stroke = new OIStroke()
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 5, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 7, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(OISVGRendererStrokeUtil.getSVGPath(stroke)).toContain("M 1 1 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0")
  })

})
