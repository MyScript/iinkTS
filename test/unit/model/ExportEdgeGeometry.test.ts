import { extractEdgeEndpoints, JIIXEdgeKind, convertMillimeterToPixel } from "@/iink"

describe("extractEdgeEndpoints", () => {
  test("Line edge → x1,y1 / x2,y2 converted to pixels", () => {
    const result = extractEdgeEndpoints({
      type: "Edge",
      id: "e1",
      kind: JIIXEdgeKind.Line,
      x1: 1,
      y1: 2,
      x2: 3,
      y2: 4,
    } as never)
    expect(result).toEqual({
      start: { x: convertMillimeterToPixel(1), y: convertMillimeterToPixel(2) },
      end: { x: convertMillimeterToPixel(3), y: convertMillimeterToPixel(4) },
    })
  })

  test("PolyEdge → first sub-edge start, last sub-edge end", () => {
    const result = extractEdgeEndpoints({
      type: "Edge",
      id: "e2",
      kind: JIIXEdgeKind.PolyEdge,
      edges: [
        { x1: 0, y1: 0, x2: 1, y2: 1 },
        { x1: 1, y1: 1, x2: 2, y2: 2 },
      ],
    } as never)
    expect(result).toEqual({
      start: { x: convertMillimeterToPixel(0), y: convertMillimeterToPixel(0) },
      end: { x: convertMillimeterToPixel(2), y: convertMillimeterToPixel(2) },
    })
  })

  test("Arc → points on the ellipse at startAngle and startAngle+sweepAngle", () => {
    const result = extractEdgeEndpoints({
      type: "Edge",
      id: "e3",
      kind: JIIXEdgeKind.Arc,
      cx: 0,
      cy: 0,
      rx: 10,
      ry: 10,
      phi: 0,
      startAngle: 0,
      sweepAngle: Math.PI,
    } as never)
    expect(result!.start.x).toBeCloseTo(convertMillimeterToPixel(10), 1)
    expect(result!.end.x).toBeCloseTo(convertMillimeterToPixel(-10), 1)
  })

  test("PolyEdge with no sub-edges → undefined", () => {
    const result = extractEdgeEndpoints({
      type: "Edge",
      id: "e4",
      kind: JIIXEdgeKind.PolyEdge,
      edges: [],
    } as never)
    expect(result).toBeUndefined()
  })
})
