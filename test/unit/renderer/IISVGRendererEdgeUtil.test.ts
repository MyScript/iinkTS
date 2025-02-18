import { DefaultStyle, EdgeDecoration, EdgeKind, IIEdgeArc, IIEdgeLine, IIEdgePolyLine, IISVGRendererConst, IISVGRendererEdgeUtil, SymbolType, TPoint, TStyle } from "../../../src/iink"

describe("IISVGRendererEdgeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => IISVGRendererEdgeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for edge cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for line", () =>
  {
    const start: TPoint = { x: 1, y: 1 }
    const end: TPoint = { x: 11, y: 11 }
    const line = new IIEdgeLine(start, end)
    expect(IISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 11 11")
  })

  test("should getSVGPath for polyline", () =>
  {
    const points: TPoint[] = [
      { x: 1, y: 1 },
      { x: 11, y: 11 },
      { x: 111, y: 111 },
    ]
    const line = new IIEdgePolyLine(points)
    expect(IISVGRendererEdgeUtil.getSVGPath(line)).toEqual("M 1 1 L 1 1 L 11 11 L 111 111")
  })

  test("should getSVGPath for arc", () =>
  {
    const center: TPoint = { x: 1, y: 1 }
    const startAngle = Math.PI / 4
    const sweepAngle = Math.PI
    const radiusX = 10
    const radiusY = 50
    const phi = 0
    const arc = new IIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
    expect(IISVGRendererEdgeUtil.getSVGPath(arc)).toEqual("M 8.071 36.355 Q 8.071 36.355 5.792 44.884 3.126 49.857 0.287 50.873 -2.495 47.847 -4.993 41.027 -7.005 30.964 -8.369 18.473 -8.975 4.567 -8.771 -9.628 -7.777 -22.962 -6.071 -34.355 -6.071 -34.355")
  })

  describe("getSVGElement", () =>
  {
    test("should get line with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end, undefined, undefined, style)
      const el = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Line)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get line with default style", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end)
      const el = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(path.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get line with startDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-start")).toEqual(`url(#${ IISVGRendererConst. arrowHeadStartMarker })`)
    })
    test("should get line with endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end, undefined, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-end")).toEqual(`url(#${ IISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get line with startDecoration & endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-start")).toEqual(`url(#${ IISVGRendererConst.arrowHeadStartMarker })`)
      expect(path.getAttribute("marker-end")).toEqual(`url(#${ IISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get line when selected", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end)
      const elNotSelected = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.selected = true
      const elSelected = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.selectionFilterId })`)
    })
    test("should get line when deleting", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new IIEdgeLine(start, end)
      const elNotSelected = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.deleting = true
      const elSelected = IISVGRendererEdgeUtil.getSVGElement(line)!
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.removalFilterId })`)
    })
    test("should get arc with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const center: TPoint = { x: 1, y: 1 }
      const startAngle = Math.PI / 4
      const sweepAngle = Math.PI
      const radiusX = 10
      const radiusY = 50
      const phi = 0
      const arc = new IIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi, undefined, undefined, style)
      const el = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Arc)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get arc with default style", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const el = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(path.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get arc with startDecoration", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-start")).toEqual(`url(#${ IISVGRendererConst.arrowHeadStartMarker })`)
    })
    test("should get arc with endDecoration", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, undefined, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-end")).toEqual(`url(#${ IISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get arc with startDecoration & endDecoration", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(el.getAttribute("id")).toEqual(arc.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      const path = el.querySelector("path")!
      expect(path.getAttribute("marker-start")).toEqual(`url(#${ IISVGRendererConst.arrowHeadStartMarker })`)
      expect(path.getAttribute("marker-end")).toEqual(`url(#${ IISVGRendererConst.arrowHeadEndMaker })`)
    })
    test("should get arc when selected", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const elNotSelected = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      arc.selected = true
      const elSelected = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elSelected.getAttribute("id")).toEqual(arc.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.selectionFilterId })`)
    })
    test("should get arc when deleting", () =>
    {
      const arc = new IIEdgeArc({ x: 1, y: 1 }, Math.PI / 4, Math.PI, 10, 50, 0)
      const elNotSelected = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elNotSelected.getAttribute("id")).toEqual(arc.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      arc.deleting = true
      const elSelected = IISVGRendererEdgeUtil.getSVGElement(arc)!
      expect(elSelected.getAttribute("id")).toEqual(arc.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.removalFilterId })`)
    })
  })

})
