import { buildOIStroke } from "../helpers"
import
{
  OISVGRenderer,
  DefaultRenderingConfiguration,
  TRenderingConfiguration,
} from "../../../src/iink"

describe("OISVGRenderer.ts", () =>
{
  test("should instanciate", () =>
  {
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    expect(renderer).toBeDefined()
    expect(renderer.configuration).toEqual(DefaultRenderingConfiguration)
  })

  describe("init", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    test("should create layer", () =>
    {
      const elements = divElement.getElementsByTagName("svg")
      expect(elements).toHaveLength(1)
      const layer = elements.item(0) as SVGElement
      expect(renderer.layer).toBe(layer)
    })

    test("should create guides with default gap", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration)) as TRenderingConfiguration
      customConf.guides.type = "point"
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("circle")
      expect(guideLines).toHaveLength(1)
    })
    test("should create guides with custom gap", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration)) as TRenderingConfiguration
      customConf.guides.gap = 5
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("circle")
      expect(guideLines).toHaveLength(361)
    })
    test("should create guides line", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration)) as TRenderingConfiguration
      customConf.guides.type = "line"
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("line")
      expect(guideLines).toHaveLength(1)
    })
    test("should create guides grid", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration)) as TRenderingConfiguration
      customConf.guides.type = "grid"
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      const guidesGroup = divElement.querySelector("#guides-wrapper") as SVGGElement
      expect(guidesGroup).toBeDefined()
      const guideLines = guidesGroup.getElementsByTagName("line")
      expect(guideLines).toHaveLength(20)
    })
    test("should write error if guides.type unknow", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration))
      customConf.guides.type = "test"
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      expect(console.error).toBeCalledTimes(1)
      expect(console.error).toBeCalledWith({ "error": ["Guide type unknow: test"], "from": "RENDERER.#drawGuides" })
    })
    test("should not create guides", () =>
    {
      const divElement: HTMLDivElement = document.createElement("div")
      const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration))
      customConf.guides.enable = false
      const rendererCustom = new OISVGRenderer(customConf)
      rendererCustom.init(divElement)
      const element = divElement.querySelector("#guides-wrapper")
      expect(element).toBeNull()
    })
  })

  describe("symbol", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    const stroke = buildOIStroke()

    test("should draw new stroke", () =>
    {
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${stroke.id}`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      expect(el.getAttribute("stroke")).toEqual(stroke.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(stroke.style.width?.toString())

    })
    test("should replace stroke", () =>
    {
      const oldEl = divElement.querySelector(`#${stroke.id}`)!
      stroke.addPointer({ x : 20, y: 50, p: 1, t: 1})
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${stroke.id}`)!
      expect(el).toBeDefined()
      expect(oldEl).not.toEqual(el)
    })
    test("should removeSymbol stroke", () =>
    {
      renderer.removeSymbol(stroke.id)
      const el = divElement.querySelector(`#${stroke.id}`)!
      expect(el).toBeNull()
    })
  })

  test("should resize", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)

    expect(renderer.layer.getAttribute("width")).toEqual("100px")
    expect(renderer.layer.getAttribute("height")).toEqual("100px")
    expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 100, 100")
    renderer.resize(200, 400)
    expect(renderer.layer.getAttribute("width")).toEqual("400px")
    expect(renderer.layer.getAttribute("height")).toEqual("200px")
    expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 400, 200")
  })

  test("should clearElements", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const customConf = JSON.parse(JSON.stringify(DefaultRenderingConfiguration))
    customConf.guides.enable = false
    const renderer = new OISVGRenderer(customConf)
    renderer.init(divElement)
    expect(renderer.layer.childElementCount).toEqual(0)
    const stroke = buildOIStroke()
    renderer.drawSymbol(stroke)
    expect(renderer.layer.childElementCount).toEqual(1)
    renderer.clearElements("path", { id: stroke.id })
    expect(renderer.layer.childElementCount).toEqual(0)
  })

  test("should clear", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    const initChildNumber = renderer.layer.childElementCount
    const stroke = buildOIStroke()
    renderer.drawSymbol(stroke)
    expect(renderer.layer.childElementCount).toEqual(initChildNumber + 1)
    renderer.clear()
    expect(renderer.layer.childElementCount).toEqual(initChildNumber)
  })

  test("should destroy", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    expect(divElement.childElementCount).toEqual(1)
    renderer.destroy()
    expect(divElement.childElementCount).toEqual(0)
  })
})
