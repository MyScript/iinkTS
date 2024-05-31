import { OIEdgeArc, OIEdgeLine, OIEdgePolyLine, OISVGRendererEdgeUtil, TPoint } from "../../../src/iink"

describe("OISVGRendererEdgeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererEdgeUtil.getSVGPath({ kind: "pouet"})).toThrow("Can't getSVGPath for edge cause kind is unknow: \"pouet\"")
  })

  test("should getSVGPath for line", () =>
  {
    const start: TPoint = { x: 1, y: 1 }
    const end: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine({}, start, end)
    expect(OISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 11 11")
  })

  test("should getSVGPath for polyline", () =>
  {
    const points: TPoint[] = [
      { x: 1, y: 1 },
      { x: 11, y: 11 },
      { x: 111, y: 111 },
    ]
    const line = new OIEdgePolyLine({}, points)
    expect(OISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 1 1 L 11 11 L 111 111")
  })

  test("should getSVGPath for arc", () =>
  {
    const center: TPoint = { x: 1, y: 1 }
    const startAngle = Math.PI / 4
    const sweepAngle = Math.PI
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = new OIEdgeArc({}, center, startAngle, sweepAngle, radiusX, radiusY, phi)
    expect(OISVGRendererEdgeUtil.getSVGPath(arc)).toContain("M 8.071 8.071 Q 8.071 8.071 7.613 8.501")
  })

})
