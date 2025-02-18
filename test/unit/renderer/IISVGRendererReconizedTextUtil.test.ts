import { DecoratorKind, IIDecorator } from "../../../src/symbol"
import { IISVGRendererConst, IISVGRendererRecognizedUtil, IISVGRendererStrokeUtil } from "../../../src/renderer"
import { buildRecognizedText } from "../helpers"


describe("IISVGRendererRecognizedUtil", () =>
{
  test("should getSVGElement and call IISVGRendererStrokeUtil.getSVGElement", () =>
  {
    IISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    const el = IISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)

    expect(IISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(1, recognizedText.strokes[0])
    expect(IISVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(2, recognizedText.strokes[1])
  })

  test("should getSVGElement with selected filter", () =>
  {
    IISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.selected = true
    const el = IISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.selectionFilterId })`)
  })

  test("should getSVGElement with removal filter", () =>
  {
    IISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true
    const el = IISVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ IISVGRendererConst.removalFilterId })`)
  })

  test("should getSVGElement with decorators", () =>
  {
    IISVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true

    const elWithoutDecorator = IISVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elWithoutDecorator.getAttribute("id")).toEqual(recognizedText.id)
    expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

    recognizedText.decorators.push(new IIDecorator(DecoratorKind.Highlight, { color: "red" }))
    recognizedText.decorators.push(new IIDecorator(DecoratorKind.Underline, { color: "blue", width: 12 }))

    const elDecorated = IISVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elDecorated.getAttribute("id")).toEqual(recognizedText.id)
    expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

    const highlight = elDecorated.querySelector(`[kind=${ DecoratorKind.Highlight }]`)
    expect(highlight?.getAttribute("fill")).toEqual("red")

    const underline = elDecorated.querySelector(`[kind=${ DecoratorKind.Underline }]`)
    expect(underline?.getAttribute("stroke")).toEqual("blue")
    expect(underline?.getAttribute("stroke-width")).toEqual("12")
  })
})
