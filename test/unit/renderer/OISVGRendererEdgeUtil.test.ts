import { OIEdgeArc, OIEdgeLine, OIEdgePolyLine, OISVGRendererEdgeUtil, TPoint } from "../../../src/iink"

describe("OISVGRendererEdgeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererEdgeUtil.getSVGPath({ kind: "pouet"})).toThrow("Can't getSVGPath for edge cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for line", () =>
  {
    const start: TPoint = { x: 1, y: 1 }
    const end: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(start, end)
    expect(OISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 11 11")
  })

  test("should getSVGPath for polyline", () =>
  {
    const points: TPoint[] = [
      { x: 1, y: 1 },
      { x: 11, y: 11 },
      { x: 111, y: 111 },
    ]
    const line = new OIEdgePolyLine(points)
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
    const arc = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    expect(OISVGRendererEdgeUtil.getSVGPath(arc)).toEqual("M 8.071 8.071 Q 8.071 8.071 6.811 9.138 5.392 9.984 3.853 10.584 2.237 10.923 0.587 10.991 -1.052 10.787 -2.635 10.316 -4.119 9.591 -5.463 8.631 -6.631 7.463 -7.591 6.119 -8.316 4.635 -8.787 3.052 -8.991 1.413 -8.923 -0.237 -8.584 -1.853 -7.984 -3.392 -7.138 -4.811")
  })

})
