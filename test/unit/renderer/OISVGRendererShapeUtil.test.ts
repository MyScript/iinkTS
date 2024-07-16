import { OIShapeCircle, OIShapeEllipse, OIShapePolygon, TPoint } from "../../../src/primitive"
import { OISVGRendererShapeUtil } from "../../../src/renderer"

describe("OISVGRendererShapeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererShapeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for shape cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for circle", () =>
  {
    const circle = new OIShapeCircle({ x: 0, y: 5 }, 5)
    expect(OISVGRendererShapeUtil.getSVGPath(circle)).toEqual("M -5 5 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for ellipse", () =>
  {
    const ellipse = new OIShapeEllipse({ x: 0, y: 0 }, 5, 10)
    expect(OISVGRendererShapeUtil.getSVGPath(ellipse)).toEqual("M -5 0 a 5 10 0 1 1 10 0 a 5 10 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for parallelogram", () =>
  {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 20 },
    ]
    const polygon = new OIShapePolygon(points)
    expect(OISVGRendererShapeUtil.getSVGPath(polygon)).toEqual("M 0 0 L 10 20 L 20 20 Z")
  })

})
