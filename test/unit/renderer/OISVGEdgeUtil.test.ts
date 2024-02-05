import { DefaultStyle, EdgeDecoration, EdgeKind, OIEdgeArc, OIEdgeLine, OISVGEdgeUtil, SymbolType, TPoint, TStyle } from "../../../src/iink"

describe("OISVGEdgeUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const arrowStartDecoration = "arrowStartDecoration"
  const arrowEndDecoration = "arrowEndDecoration"
  const renderer = new OISVGEdgeUtil(selectionFilterId, removalFilterId, arrowStartDecoration, arrowEndDecoration)

  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const start: TPoint = { x: 0, y: 0 }
    const middle: TPoint = { x: 5, y: 10 }
    const end: TPoint = { x: 0, y: 10 }
    const line = new OIEdgeArc(style, start, middle, end)
    //@ts-ignore
    line.kind = "pouet"
    expect(() => renderer.getSVGPath(line)).toThrow("Can't getSVGPath for edge cause kind is unknow: \"pouet\"")
  })

  describe("line", () =>
  {
    test("should getSVGPath", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(style, start, end)
      expect(renderer.getSVGPath(line)).toEqual("M 1 1 L 11 11")
    })
    test("should getSVGElement with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(style, start, end)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Line)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement with default style", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine({}, start, end)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with startDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(DefaultStyle, start, end, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
    })
    test("should getSVGElement with endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(DefaultStyle, start, end, undefined, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
    })
    test("should getSVGElement with startDecoration & endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(DefaultStyle, start, end, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
    })
    test("should getSVGElement when selected", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(DefaultStyle, start, end)
      const elNotSelected = renderer.getSVGElement(line)
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.selected = true
      const elSelected = renderer.getSVGElement(line)
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
    test("should getSVGElement when deleting", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeLine(DefaultStyle, start, end)
      const elNotSelected = renderer.getSVGElement(line)
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.deleting = true
      const elSelected = renderer.getSVGElement(line)
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
    })
  })

  describe("arc", () =>
  {
    test("should getSVGElement with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 0, y: 0 }
      const middle: TPoint = { x: 5, y: 10 }
      const end: TPoint = { x: 0, y: 10 }
      const line = new OIEdgeArc(style, start, middle, end)
      expect(renderer.getSVGPath(line)).toEqual("M 0 0 A 5.735 5.735 0 1 1 0 10")
    })
    test("should getSVGElement with style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const start: TPoint = { x: 0, y: 0 }
      const middle: TPoint = { x: 5, y: 10 }
      const end: TPoint = { x: 0, y: 10 }
      const line = new OIEdgeArc(style, start, middle, end)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("kind")).toEqual(EdgeKind.Arc)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement with default style", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with startDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
    })
    test("should getSVGElement with endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end, undefined, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
    })
    test("should getSVGElement with startDecoration & endDecoration", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      const el = renderer.getSVGElement(line)
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
      expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
    })
    test("should getSVGElement when selected", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end)
      const elNotSelected = renderer.getSVGElement(line)
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.selected = true
      const elSelected = renderer.getSVGElement(line)
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
    test("should getSVGElement when deleting", () =>
    {
      const start: TPoint = { x: 1, y: 1 }
      const middle: TPoint = { x: 5, y: 18 }
      const end: TPoint = { x: 11, y: 11 }
      const line = new OIEdgeArc(DefaultStyle, start, middle, end)
      const elNotSelected = renderer.getSVGElement(line)
      expect(elNotSelected.getAttribute("id")).toEqual(line.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      line.deleting = true
      const elSelected = renderer.getSVGElement(line)
      expect(elSelected.getAttribute("id")).toEqual(line.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Edge)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ removalFilterId })`)
    })
  })
})
