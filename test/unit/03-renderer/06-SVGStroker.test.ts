import { TStroke } from "../../../src/@types"
import { SVGStroker } from "../../../src/iink"

describe("SVGStroker.ts", () =>
{
  //@ts-ignore
  const stroke: TStroke = {
    type: "pen",
    pointerType: "pen",
    pointerId: 0,
    id: "test",
    style: {
      "-myscript-pen-fill-color": "red",
      "-myscript-pen-fill-style": "none",
      "-myscript-pen-width": 1,
      color: "red",
      width: 1,
    },
    "pointers": [
      { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
      { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
      { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
    ]
  }

  test("should instanciate", () =>
  {
    const stroker = new SVGStroker()
    expect(stroker).toBeDefined()
  })

  test("should drawStroke", () =>
  {
    const svgElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    const stroker = new SVGStroker()
    stroker.drawStroke(svgElement, stroke)
    const pathElement = svgElement.querySelector("path")
    expect(pathElement?.getAttribute("id")).toEqual(stroke.id)
    expect(pathElement?.getAttribute("type")).toEqual("stroke")
  })

  test("should drawStroke with attrs", () =>
  {
    const svgElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement
    const stroker = new SVGStroker()
    stroker.drawStroke(svgElement, stroke, [{ name: "style", value: `fill:${ stroke.style.color };stroke:transparent;` }])
    const pathElement = svgElement.querySelector("path")
    expect(pathElement?.getAttribute("id")).toEqual(stroke.id)
    expect(pathElement?.getAttribute("type")).toEqual("stroke")
    expect(pathElement?.getAttribute("style")).toEqual(`fill:${ stroke.style.color };stroke:transparent;`)
  })
})
