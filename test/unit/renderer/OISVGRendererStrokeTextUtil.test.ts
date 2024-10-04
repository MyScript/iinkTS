import { DecoratorKind, OIDecorator } from "../../../src/primitive"
import { OISVGRendererConst, OISVGRendererStrokeTextUtil, OISVGRendererStrokeUtil } from "../../../src/renderer"
import { buildOIStrokeText } from "../helpers"


describe("OISVGRendererStrokeTextUtil", () =>
{
  test("should getSVGElement and call OISVGRendererStrokeUtil.getSVGElement", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const strokeText = buildOIStrokeText(2)
    const el = OISVGRendererStrokeTextUtil.getSVGElement(strokeText)

    expect(el.getAttribute("id")).toEqual(strokeText.id)
    expect(el.getAttribute("type")).toEqual(strokeText.type)

    expect(OISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(1, strokeText.strokes[0])
    expect(OISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(2, strokeText.strokes[1])
  })

  test("should getSVGElement with selected filter", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const strokeText = buildOIStrokeText(2)
    strokeText.selected = true
    const el = OISVGRendererStrokeTextUtil.getSVGElement(strokeText)

    expect(el.getAttribute("id")).toEqual(strokeText.id)
    expect(el.getAttribute("type")).toEqual(strokeText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
  })

  test("should getSVGElement with removal filter", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const strokeText = buildOIStrokeText(2)
    strokeText.deleting = true
    const el = OISVGRendererStrokeTextUtil.getSVGElement(strokeText)

    expect(el.getAttribute("id")).toEqual(strokeText.id)
    expect(el.getAttribute("type")).toEqual(strokeText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
  })

  test("should getSVGElement with decorators", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const strokeText = buildOIStrokeText(2)
    strokeText.deleting = true

    const elWithoutDecorator = OISVGRendererStrokeTextUtil.getSVGElement(strokeText)!
    expect(elWithoutDecorator.getAttribute("id")).toEqual(strokeText.id)
    expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

    strokeText.decorators.push(new OIDecorator(DecoratorKind.Highlight, { color: "red" }))
    strokeText.decorators.push(new OIDecorator(DecoratorKind.Underline, { color: "blue", width: 12 }))

    const elDecorated = OISVGRendererStrokeTextUtil.getSVGElement(strokeText)!
    expect(elDecorated.getAttribute("id")).toEqual(strokeText.id)
    expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

    const highlight = elDecorated.querySelector(`[kind=${ DecoratorKind.Highlight }]`)
    expect(highlight?.getAttribute("fill")).toEqual("red")

    const underline = elDecorated.querySelector(`[kind=${ DecoratorKind.Underline }]`)
    expect(underline?.getAttribute("stroke")).toEqual("blue")
    expect(underline?.getAttribute("stroke-width")).toEqual("12")
  })
})
