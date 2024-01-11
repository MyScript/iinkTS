import { DefaultStyle, EdgeDecoration, OIEdgeLine, OISVGEdgeUtil, SymbolType, TPoint, TStyle } from "../../../src/iink"

describe("OISVGEdgeUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const arrowStartDecoration = "arrowStartDecoration"
  const arrowEndDecoration = "arrowEndDecoration"
  const renderer = new OISVGEdgeUtil(selectionFilterId, removalFilterId, arrowStartDecoration, arrowEndDecoration)

  test("should getSVGElement with style", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(style, origin, target)
    const el = renderer.getSVGElement(line)
    expect(el.getAttribute("id")).toEqual(line.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
    expect(el.getAttribute("kind")).toEqual("line")
    expect(el.getAttribute("d")).toEqual("M 1 1 L 11 11")
    expect(el.getAttribute("stroke")).toEqual(style.color)
    expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
  })
  test("should getSVGElement with default style", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine({}, origin, target)
    const el = renderer.getSVGElement(line)
    expect(el.getAttribute("id")).toEqual(line.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
    expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
    expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
  })
  test("should getSVGElement with startDecoration", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(DefaultStyle, origin, target, EdgeDecoration.Arrow)
    const el = renderer.getSVGElement(line)
    expect(el.getAttribute("id")).toEqual(line.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
    expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
  })
  test("should getSVGElement with endDecoration", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(DefaultStyle, origin, target, undefined, EdgeDecoration.Arrow)
    const el = renderer.getSVGElement(line)
    expect(el.getAttribute("id")).toEqual(line.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
    expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
  })
  test("should getSVGElement with startDecoration & endDecoration", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(DefaultStyle, origin, target, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
    const el = renderer.getSVGElement(line)
    expect(el.getAttribute("id")).toEqual(line.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Edge)
    expect(el.getAttribute("marker-start")).toEqual(`url(#${ arrowStartDecoration })`)
    expect(el.getAttribute("marker-end")).toEqual(`url(#${ arrowEndDecoration })`)
  })
  test("should getSVGElement when selected", () =>
  {
    const origin: TPoint = { x: 1, y: 1 }
    const target: TPoint = { x: 11, y: 11 }
    const line = new OIEdgeLine(DefaultStyle, origin, target)
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
})
