import { DecoratorKind, OIDecorator } from "../../../src/symbol"
import { OISVGRendererConst, OISVGRendererRecognizedUtil, OISVGRendererStrokeUtil } from "../../../src/renderer"
import { buildRecognizedText } from "../helpers"


describe("OISVGRendererRecognizedUtil", () =>
{
  test("should getSVGElement and call OISVGRendererStrokeUtil.getSVGElement", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    const el = OISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)

    expect(OISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(1, recognizedText.strokes[0])
    expect(OISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(2, recognizedText.strokes[1])
  })

  test("should getSVGElement with selected filter", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.selected = true
    const el = OISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
  })

  test("should getSVGElement with removal filter", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true
    const el = OISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
  })

  test("should getSVGElement with decorators", () =>
  {
    OISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true

    const elWithoutDecorator = OISVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elWithoutDecorator.getAttribute("id")).toEqual(recognizedText.id)
    expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

    recognizedText.decorators.push(new OIDecorator(DecoratorKind.Highlight, { color: "red" }))
    recognizedText.decorators.push(new OIDecorator(DecoratorKind.Underline, { color: "blue", width: 12 }))

    const elDecorated = OISVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elDecorated.getAttribute("id")).toEqual(recognizedText.id)
    expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

    const highlight = elDecorated.querySelector(`[kind=${ DecoratorKind.Highlight }]`)
    expect(highlight?.getAttribute("fill")).toEqual("red")

    const underline = elDecorated.querySelector(`[kind=${ DecoratorKind.Underline }]`)
    expect(underline?.getAttribute("stroke")).toEqual("blue")
    expect(underline?.getAttribute("stroke-width")).toEqual("12")
  })
})
