import { OIShapeCircle, OIShapeEllipse, OIShapeParallelogram, OIShapeRectangle, OIShapeTriangle, TPoint } from "../../../src/primitive"
import { OISVGRendererShapeUtil } from "../../../src/renderer"

describe("OISVGRendererShapeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererShapeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for shape cause kind is unknow: \"pouet\"")
  })
  test("should getSVGPath for rectangle", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const rect = OIShapeRectangle.createFromLine({}, origin, target)
    expect(OISVGRendererShapeUtil.getSVGPath(rect)).toEqual("M 1 1 L 11 1 L 11 11 L 1 11 Z")
  })
  test("should getSVGPath for circle", () =>
  {
    const origin: TPoint = { x: 0, y: 0 }
    const target: TPoint = { x: 0, y: 10 }
    const circle = OIShapeCircle.createFromLine({}, origin, target)
    expect(OISVGRendererShapeUtil.getSVGPath(circle)).toEqual("M 0 5 a 0 0 0 1 1 0 0 a 0 0 0 1 1 -0 0 Z")
  })
  test("should getSVGPath for ellipse", () =>
  {
    const origin: TPoint = { x: 0, y: 0 }
    const target: TPoint = { x: 0, y: 10 }
    const ellipse = OIShapeEllipse.createFromLine({}, origin, target)
    expect(OISVGRendererShapeUtil.getSVGPath(ellipse)).toEqual("M 0 5 a 0 5 0 1 1 0 0 a 0 5 0 1 1 -0 0 Z")
  })
  test("should getSVGPath for parallelogram", () =>
  {
    const origin: TPoint = { x: 0, y: 0 }
    const target: TPoint = { x: 10, y: 20 }
    const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
    expect(OISVGRendererShapeUtil.getSVGPath(parallelogram)).toEqual("M 0 0 L 7.5 0 L 10 20 L 2.5 20 Z")
  })
  test("should getSVGPath for triangle", () =>
  {
    const origin: TPoint = { x: 0, y: 0 }
    const target: TPoint = { x: 10, y: 20 }
    const triangle = OIShapeTriangle.createFromLine({}, origin, target)
    expect(OISVGRendererShapeUtil.getSVGPath(triangle)).toEqual("M 0 0 L 10 0 L 5 20 Z")
  })

})
