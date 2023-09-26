import { buildStroke } from "../utils/helpers"
import { renderer } from "../../../src/iink"

describe("SVGStroker.ts", () =>
{
  const { SVGStroker } = renderer
  const strokePen = buildStroke()

  test("should instanciate", () =>
  {
    const stroker = new SVGStroker()
    expect(stroker).toBeDefined()
  })

  test("should drawStroke with default pointerType", () =>
  {
    const svgElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    const stroker = new SVGStroker()
    stroker.drawStroke(svgElement, strokePen)
    const pathElement = svgElement.querySelector("path")
    expect(pathElement?.getAttribute("id")).toEqual(strokePen.id)
    expect(pathElement?.getAttribute("type")).toEqual("pen")
  })

  test("should drawStroke with pointerType = mouse", () =>
  {
    const strokeMouse = buildStroke({ pointerType: "mouse" })
    const svgElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    const stroker = new SVGStroker()
    stroker.drawStroke(svgElement, strokeMouse)
    const pathElement = svgElement.querySelector("path")
    expect(pathElement?.getAttribute("id")).toEqual(strokeMouse.id)
    expect(pathElement?.getAttribute("type")).toEqual(strokeMouse.pointerType)
  })

  test("should drawStroke with attrs", () =>
  {
    const svgElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    const stroker = new SVGStroker()
    stroker.drawStroke(svgElement, strokePen, [{ name: "style", value: `fill:${ strokePen.style.color };strokePen:transparent;` }])
    const pathElement = svgElement.querySelector("path")
    expect(pathElement?.getAttribute("id")).toEqual(strokePen.id)
    expect(pathElement?.getAttribute("type")).toEqual("pen")
    expect(pathElement?.getAttribute("style")).toEqual(`fill:${ strokePen.style.color };strokePen:transparent;`)
  })
})
