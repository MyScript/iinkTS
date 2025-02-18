import { DecoratorKind, IIDecorator, IIStroke, IISymbolGroup } from "../../../src/symbol"
import { IISVGRendererConst, IISVGRendererGroupUtil } from "../../../src/renderer"
import { buildOIGroup } from "../helpers"

describe("IISVGRendererGroupUtil", () =>
{
  test("should getSVGElement for group", () =>
  {
    const groupSym = buildOIGroup({ nbOICircle: 5, nbOILine: 2, nbOIStroke: 3, nbOIText: 1})
    const groupChild = buildOIGroup({ nbOICircle: 1 })
    groupSym.children.push(groupChild)
    const el = IISVGRendererGroupUtil.getSVGElement(groupSym)!
    expect(el.getAttribute("id")).toEqual(groupSym.id)
    expect(el.getAttribute("type")).toEqual("group")
    expect(el.querySelectorAll(`#${groupSym.id} > [type=shape]`)).toHaveLength(5)
    expect(el.querySelectorAll(`#${groupSym.id} > [type=edge]`)).toHaveLength(2)
    expect(el.querySelectorAll(`#${groupSym.id} > [type=stroke]`)).toHaveLength(3)
    expect(el.querySelectorAll(`#${groupSym.id} > [type=text]`)).toHaveLength(1)
    expect(el.querySelectorAll(`#${groupSym.id} > [type=group]`)).toHaveLength(1)
  })
  test("should getSymbolElement with selected filter", () =>
  {
    const stroke = new IIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    const groupSym = new IISymbolGroup([stroke])
    groupSym.selected = true
    const el = IISVGRendererGroupUtil.getSVGElement(groupSym)!
    expect(el.getAttribute("id")).toEqual(groupSym.id)
    expect(el.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.selectionFilterId })`)
  })
  test("should getSymbolElement with removal filter", () =>
  {
    const stroke = new IIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 1 })
    const groupSym = new IISymbolGroup([stroke])
    groupSym.deleting = true
    const el = IISVGRendererGroupUtil.getSVGElement(groupSym)!
    expect(el.getAttribute("id")).toEqual(groupSym.id)
    expect(el.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.removalFilterId })`)
  })
  test("should getSymbolElement with decorators", () =>
  {
    const stroke = new IIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
    const groupSym = new IISymbolGroup([stroke])

    const elWithoutDecorator = IISVGRendererGroupUtil.getSVGElement(groupSym)!
    expect(elWithoutDecorator.getAttribute("id")).toEqual(groupSym.id)
    expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

    groupSym.decorators.push(new IIDecorator(DecoratorKind.Highlight, { color: "red" }))
    groupSym.decorators.push(new IIDecorator(DecoratorKind.Underline, { color: "blue", width: 12 }))

    const elDecorated = IISVGRendererGroupUtil.getSVGElement(groupSym)!
    expect(elDecorated.getAttribute("id")).toEqual(groupSym.id)
    expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

    const highlight = elDecorated.querySelector(`[kind=${ DecoratorKind.Highlight }]`)
    expect(highlight?.getAttribute("fill")).toEqual("red")

    const underline = elDecorated.querySelector(`[kind=${ DecoratorKind.Underline }]`)
    expect(underline?.getAttribute("stroke")).toEqual("blue")
    expect(underline?.getAttribute("stroke-width")).toEqual("12")
  })
})
