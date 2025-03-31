import { SVGRendererStrokeUtil, IIStroke } from "../../../src/iink"

describe("SVGRendererStrokeUtil.ts", () =>
{

  test("should getSVGPath when no pointers", () =>
  {
    const stroke = new IIStroke({})
    expect(SVGRendererStrokeUtil.getSVGPath(stroke)).toEqual("")
  })

  test("should getSVGPath when 2 pointers with default width (2)", () =>
  {
    const stroke = new IIStroke()
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererStrokeUtil.getSVGPath(stroke)).toEqual("M 1 1 m -1.2 0 a 1.2 1.2 0 1 0 2.4 0 a 1.2 1.2 0 1 0 -2.4 0")
  })

  test("should getSVGPath when 2 pointers with width = 4", () =>
  {
    const stroke = new IIStroke({ width: 4 })
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererStrokeUtil.getSVGPath(stroke)).toEqual("M 1 1 m -2.4 0 a 2.4 2.4 0 1 0 4.8 0 a 2.4 2.4 0 1 0 -4.8 0")
  })

  test("should getSVGPath when more than 2 pointers", () =>
  {
    const stroke = new IIStroke()
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 5, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 7, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererStrokeUtil.getSVGPath(stroke)).toContain("M 1 1 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0 M -0.414 2.414 L 1.755 4.245 L 4.245 1.755 L 2.414 -0.414 M 1.755 4.245 Q 5 6.52 8.456 4.195 L 6.544 1.805 Q 5 3.48 4.245 1.755 M 8.456 4.195 L 10.962 2.203 L 9.038 -0.203 L 6.544 1.805 M 10.962 2.203 L 11.434 1.56 L 11.522 0.768 L 11.203 0.038 L 10.56 -0.434 L 9.768 -0.522 L 9.038 -0.203")
  })

  test("should getSVGPath when 2 pointers with width = 4", () =>
  {
    const stroke = new IIStroke({ width: 4 })
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 5, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 7, y: 5 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    expect(SVGRendererStrokeUtil.getSVGPath(stroke)).toContain("M 1 1 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0 M -1.828 3.828 L 0.511 5.489 L 5.489 0.511 L 3.828 -1.828 M 0.511 5.489 Q 5 8.04 9.412 5.389 L 5.588 0.611 Q 5 1.96 5.489 0.511 M 9.412 5.389 L 11.924 3.405 L 8.076 -1.405 L 5.588 0.611 M 11.924 3.405 L 12.869 2.121 L 13.045 0.536 L 12.405 -0.924 L 11.121 -1.869 L 9.536 -2.045 L 8.076 -1.405")
  })

})
