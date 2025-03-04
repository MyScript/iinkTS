import { DecoratorKind, IIDecorator } from "../../../src/symbol"
import { SVGRendererConst, SVGRendererRecognizedUtil, SVGRendererStrokeUtil } from "../../../src/renderer"
import { buildRecognizedText } from "../helpers"


describe("SVGRendererRecognizedUtil", () =>
{
  test("should getSVGElement and call SVGRendererStrokeUtil.getSVGElement", () =>
  {
    SVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    const el = SVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)

    expect(SVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(1, recognizedText.strokes[0])
    expect(SVGRendererStrokeUtil.getSVGElement).toHaveBeenNthCalledWith(2, recognizedText.strokes[1])
  })

  test("should getSVGElement with selected filter", () =>
  {
    SVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.selected = true
    const el = SVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.selectionFilterId })`)
  })

  test("should getSVGElement with removal filter", () =>
  {
    SVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true
    const el = SVGRendererRecognizedUtil.getSVGElement(recognizedText)

    expect(el.getAttribute("id")).toEqual(recognizedText.id)
    expect(el.getAttribute("type")).toEqual(recognizedText.type)
    expect(el.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.removalFilterId })`)
  })

  test("should getSVGElement with decorators", () =>
  {
    SVGRendererStrokeUtil.getSVGElement = jest.fn()
    const recognizedText = buildRecognizedText(2)
    recognizedText.deleting = true

    const elWithoutDecorator = SVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elWithoutDecorator.getAttribute("id")).toEqual(recognizedText.id)
    expect(elWithoutDecorator.querySelectorAll("[type=decorator]")).toHaveLength(0)

    recognizedText.decorators.push(new IIDecorator(DecoratorKind.Highlight, { color: "red" }))
    recognizedText.decorators.push(new IIDecorator(DecoratorKind.Underline, { color: "blue", width: 12 }))

    const elDecorated = SVGRendererRecognizedUtil.getSVGElement(recognizedText)!
    expect(elDecorated.getAttribute("id")).toEqual(recognizedText.id)
    expect(elDecorated.querySelectorAll("[type=decorator]")).toHaveLength(2)

    const highlight = elDecorated.querySelector(`[kind=${ DecoratorKind.Highlight }]`)
    expect(highlight?.getAttribute("fill")).toEqual("red")

    const underline = elDecorated.querySelector(`[kind=${ DecoratorKind.Underline }]`)
    expect(underline?.getAttribute("stroke")).toEqual("blue")
    expect(underline?.getAttribute("stroke-width")).toEqual("12")
  })
})
