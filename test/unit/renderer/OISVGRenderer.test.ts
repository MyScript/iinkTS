import { buildOICircle, buildOILine, buildOIStroke } from "../helpers"
import
{
  OISVGRenderer,
  DefaultRenderingConfiguration,
  TRenderingConfiguration,
  TOISymbol,
  Box
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
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
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
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
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
      customConf.minHeight = customConf.guides.gap * 2
      customConf.minWidth = customConf.guides.gap * 2
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
      expect(console.error).toBeCalledWith({ "error": ["Guide type unknow: test"], "from": "RENDERER.drawGuides" })
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

  describe("attribute", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    const element = document.createElement("path")
    element.id = "attribut-test-id"
    renderer.layer.appendChild(element)
    const attr = { name: "attribut-test-name", value: "attribut-test-value" }

    test("should set & get attribut", () =>
    {
      expect(renderer.getAttribute(element.id, attr.name)).toBeFalsy()

      renderer.setAttribute(element.id, attr.name, attr.value)
      expect(renderer.getAttribute(element.id, attr.name)).toEqual(attr.value)
    })

    test("should do nothing if element not exist in layer", () =>
    {
      renderer.setAttribute("unknow-id", attr.name, attr.value)
      expect(renderer.getAttribute("unknow-id", attr.name)).toBeFalsy()
    })
  })

  describe("element", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)

    const elementToPreprend = document.createElement("path")
    elementToPreprend.id = "preprend-id"

    const elementToAppend = document.createElement("path")
    elementToAppend.id = "append-id"

    test("should prependElement", () =>
    {
      const nbChild = renderer.layer.childElementCount
      expect(renderer.layer.firstElementChild?.getAttribute("id")).not.toEqual(elementToPreprend.id)
      renderer.prependElement(elementToPreprend)
      expect(renderer.layer.childElementCount).toEqual(nbChild + 1)
      expect(renderer.layer.firstElementChild?.getAttribute("id")).toEqual(elementToPreprend.id)
    })

    test("should appendElement", () =>
    {
      const nbChild = renderer.layer.childElementCount
      expect(renderer.layer.lastElementChild?.getAttribute("id")).not.toEqual(elementToAppend.id)
      renderer.appendElement(elementToAppend)
      expect(renderer.layer.childElementCount).toEqual(nbChild + 1)
      expect(renderer.layer.lastElementChild?.getAttribute("id")).toEqual(elementToAppend.id)
    })
  })

  describe("symbol", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    const stroke = buildOIStroke()
    const circle = buildOICircle()
    const line = buildOILine()

    test("should write error if symbol type unknow", () =>
    {
      //@ts-ignore
      const unknowSym: TOISymbol = {
        //@ts-ignore
        type: "unknow",
        bounds: new Box({ height: 0, width: 0, x: 0, y: 0}),
        creationTime: Date.now(),
        modificationDate: Date.now(),
        clone: jest.fn(),
        overlaps: jest.fn(),
        isCloseToPoint: jest.fn(),

      }
      renderer.drawSymbol(unknowSym)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeNull()
      expect(console.error).toHaveBeenCalledTimes(1)

    })
    test("should draw new stroke", () =>
    {
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      expect(el.getAttribute("fill")).toEqual(stroke.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(stroke.style.width?.toString())
    })
    test("should replace stroke", () =>
    {
      const oldEl = divElement.querySelector(`#${ stroke.id }`)!
      stroke.addPointer({ x: 20, y: 50, p: 1, t: 1 })
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeDefined()
      expect(oldEl).not.toEqual(el)
    })
    test("should removeSymbol stroke", () =>
    {
      renderer.removeSymbol(stroke.id)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeNull()
    })
    test("should draw new circle", () =>
    {
      renderer.drawSymbol(circle)
      const el = divElement.querySelector(`#${ circle.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("stroke")).toEqual(circle.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(circle.style.width?.toString())
    })
    test("should draw new line", () =>
    {
      renderer.drawSymbol(line)
      const el = divElement.querySelector(`#${ line.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual("edge")
      expect(el.getAttribute("stroke")).toEqual(line.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(line.style.width?.toString())
    })
  })

  describe("resize", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)

    test("should update height, width & viewbox", () =>
    {
      expect(renderer.layer.getAttribute("width")).toEqual("100px")
      expect(renderer.layer.getAttribute("height")).toEqual("100px")
      expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 100, 100")
      renderer.resize(200, 400)
      expect(renderer.layer.getAttribute("width")).toEqual("400px")
      expect(renderer.layer.getAttribute("height")).toEqual("200px")
      expect(renderer.layer.getAttribute("viewBox")).toEqual("0, 0, 400, 200")
    })

    test("should update guides", () =>
    {
      const nbGuide = renderer.layer.querySelector(`#${ renderer.groupGuidesId }`)?.children.length
      renderer.resize(400, 400)
      expect(nbGuide).not.toEqual(renderer.layer.querySelector(`#${ renderer.groupGuidesId }`)?.children.length)
    })
  })

  describe("clearElements", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)

    test("should clearElements by tagName", () =>
    {
      const nbPath = renderer.layer.querySelectorAll("path").length
      const stroke1 = buildOIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildOIStroke()
      renderer.drawSymbol(stroke2)
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(nbPath + 2)
      renderer.clearElements({ tagName: "path" })
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(0)
    })
    test("should clearElements by attrs", () =>
    {
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(0)
      const stroke1 = buildOIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildOIStroke()
      renderer.drawSymbol(stroke2)
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(2)
      renderer.clearElements({ attrs: { id: stroke2.id } })
      expect(renderer.layer.querySelectorAll("path")).toHaveLength(1)
    })
    test("should clearElements by tagName and attrs", () =>
    {
      renderer.clearElements({ tagName: "path" })
      const stroke1 = buildOIStroke()
      renderer.drawSymbol(stroke1)
      const stroke2 = buildOIStroke()
      renderer.drawSymbol(stroke2)
      const nbGroup = renderer.layer.querySelectorAll("g").length
      renderer.clearElements({ tagName: "g", attrs: { id: stroke2.id } })
      expect(renderer.layer.querySelectorAll("g")).toHaveLength(nbGroup - 1)
    })
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
