import { OIText, OISVGTextUtil, TPoint, TOISymbolChar, SymbolType, TBoundingBox } from "../../../src/iink"

describe("OISVGTextUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const renderer = new OISVGTextUtil(selectionFilterId, removalFilterId)

  const chars: TOISymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: 400,
      id: 'id-1',
      label: "first",
      boundingBox: {
        height: 10,
        width: 5,
        x: 0,
        y: 10
      }
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: 200,
      id: 'id-2',
      label: "second",
      boundingBox: {
        height: 10,
        width: 5,
        x: 5,
        y: 10
      }
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const boundingBox: TBoundingBox = { height: 100, width: 100, x: 0, y: 0 }
  const text = new OIText({}, chars, point, boundingBox)

  test("should getSVGElement with style for each char", () =>
  {
    const el = renderer.getSVGElement(text)
    expect(el.getAttribute("id")).toEqual(text.id)
    expect(el.getAttribute("type")).toEqual(SymbolType.Text)
    const spans = el.querySelectorAll("tspan")

    expect(spans).toHaveLength(2)
    expect(spans[0].id).toEqual(chars[0].id)
    expect(spans[0].getAttribute("fill")).toEqual(chars[0].color)
    expect(spans[0].getAttribute("font-size")).toEqual(`${ chars[0].fontSize }px`)
    expect(spans[0].getAttribute("font-weight")).toEqual(`${ chars[0].fontWeight }`)
    expect(spans[0].textContent).toEqual(chars[0].label)

    expect(spans[1].id).toEqual(chars[1].id)
    expect(spans[1].getAttribute("fill")).toEqual(chars[1].color)
    expect(spans[1].getAttribute("font-size")).toEqual(`${ chars[1].fontSize }px`)
    expect(spans[1].getAttribute("font-weight")).toEqual(`${ chars[1].fontWeight }`)
    expect(spans[1].textContent).toEqual(chars[1].label)
  })

  test("should getSVGElement with selected filter", () =>
  {
    const elNotSelected = renderer.getSVGElement(text)
    expect(elNotSelected.getAttribute("id")).toEqual(text.id)
    expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Text)
    expect(elNotSelected.getAttribute("filter")).toBeFalsy()

    text.selected = true
    const elSelected = renderer.getSVGElement(text)
    expect(elSelected.getAttribute("id")).toEqual(text.id)
    expect(elSelected.getAttribute("type")).toEqual(SymbolType.Text)
    expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
  })

})
