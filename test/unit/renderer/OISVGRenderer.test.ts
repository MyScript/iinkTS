import { buildOICircle, buildOIEraser, buildOIGroup, buildOILine, buildOIStroke, buildOIText } from "../helpers"
import
{
  OISVGRenderer,
  DefaultRenderingConfiguration,
  TRenderingConfiguration,
  TOISymbol,
  Box,
  TOISymbolChar,
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

    test("should write error if symbol type unknow", () =>
    {
      //@ts-ignore
      const unknowSym: TOISymbol = {
        //@ts-ignore
        type: "unknow",
        bounds: new Box({ height: 0, width: 0, x: 0, y: 0 }),
        creationTime: Date.now(),
        modificationDate: Date.now(),
        clone: jest.fn(),
        overlaps: jest.fn(),
        isCloseToPoint: jest.fn(),
        id: "unknow"

      }
      renderer.drawSymbol(unknowSym)
      const el = divElement.querySelector(`#${ unknowSym.id }`)!
      expect(el).toBeNull()
      expect(console.error).toHaveBeenCalledTimes(1)

    })
    test("should draw eraser", () =>
    {
      const eraser = buildOIEraser()
      renderer.drawSymbol(eraser)
      const el = divElement.querySelector(`#${ eraser.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(eraser.id)
      expect(el.getAttribute("type")).toEqual(eraser.type)
      expect(el.getAttribute("fill")).toEqual("transparent")
      expect(el.getAttribute("stroke")).toEqual("grey")
      expect(el.getAttribute("opacity")).toEqual("0.2")
      expect(el.getAttribute("stroke-width")).toEqual("12")
    })
    test("should draw stroke", () =>
    {
      const stroke = buildOIStroke()
      renderer.drawSymbol(stroke)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(stroke.id)
      expect(el.getAttribute("type")).toEqual("stroke")
      const path = el.querySelector("path")!
      expect(path.getAttribute("fill")).toEqual(stroke.style.color)
      expect(path.getAttribute("stroke-width")).toEqual(stroke.style.width?.toString())
    })
    test("should draw circle", () =>
    {
      const circle = buildOICircle()
      renderer.drawSymbol(circle)
      const el = divElement.querySelector(`#${ circle.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual("shape")
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(circle.style.color)
      expect(path.getAttribute("stroke-width")).toEqual(circle.style.width?.toString())
    })
    test("should draw line", () =>
    {
      const line = buildOILine()
      renderer.drawSymbol(line)
      const el = divElement.querySelector(`#${ line.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(line.id)
      expect(el.getAttribute("type")).toEqual("edge")
      expect(el.getAttribute("stroke")).toEqual(line.style.color)
      expect(el.getAttribute("stroke-width")).toEqual(line.style.width?.toString())
    })
    test("should draw text", () =>
    {
      const chars: TOISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "red",
          fontSize: 16,
          fontWeight: "bold",
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      renderer.drawSymbol(text)
      const el = divElement.querySelector(`#${ text.id }`)!
      expect(el).toBeDefined()
      expect(el.getAttribute("id")).toEqual(text.id)
      expect(el.getAttribute("type")).toEqual(text.type)
      const charsElements = el.querySelectorAll("tspan")
      expect(charsElements).toHaveLength(2)
      expect(charsElements[0].getAttribute("id")).toEqual(chars[0].id)
      expect(charsElements[0].getAttribute("fill")).toEqual(chars[0].color)
      expect(charsElements[0].getAttribute("font-size")).toEqual(chars[0].fontSize + "px")
      expect(charsElements[0].getAttribute("font-weight")).toEqual(chars[0].fontWeight)
    })
    test("should draw group", () =>
    {
      const groupSym = buildOIGroup({ nbOIStroke: 1, nbOILine: 1 })
      renderer.drawSymbol(groupSym)
      const el = divElement.querySelector(`#${ groupSym.id }`)!
      expect(el).toBeDefined()
      expect(el.children).toHaveLength(2)
    })
    test("should draw stroke already renderer", () =>
    {
      const stroke = buildOIStroke()
      renderer.drawSymbol(stroke)
      const oldPath = divElement.querySelector(`#${ stroke.id }`)!.querySelector("path")!.getAttribute("d")
      for (let x = 0; x < 10; x++) {
        stroke.addPointer({
          x,
          y: x * 2,
          p: 1,
          t: x
        })
      }
      renderer.drawSymbol(stroke)
      expect(divElement.querySelector(`#${ stroke.id }`)!.querySelector("path")!.getAttribute("d")!).not.toEqual(oldPath)
    })
    test("should replace stroke by circle", () =>
    {
      const stroke = buildOIStroke()
      renderer.drawSymbol(stroke)
      const oldEl = divElement.querySelector(`#${ stroke.id }`)!
      expect(oldEl).toBeDefined()

      const circle = buildOICircle()
      renderer.replaceSymbol(stroke.id, [circle])
      const el = divElement.querySelector(`#${ circle.id }`)!
      expect(el).toBeDefined()
      expect(oldEl).not.toEqual(el)
      expect(divElement.querySelector(`#${ stroke.id }`)).toBeNull()
    })
    test("should append circle if replace symbol not rendered", () =>
    {
      const circle = buildOICircle()
      renderer.replaceSymbol("not-rendered", [circle])
      const el = divElement.querySelector(`#${ circle.id }`)!
      expect(el).toBeDefined()

    })
    test("should removeSymbol stroke", () =>
    {
      const stroke = buildOIStroke()
      renderer.drawSymbol(stroke)
      expect(divElement.querySelector(`#${ stroke.id }`)).toBeDefined()
      renderer.removeSymbol(stroke.id)
      const el = divElement.querySelector(`#${ stroke.id }`)!
      expect(el).toBeNull()
    })
  })

  test("should drawCircle", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    renderer.drawCircle({ x: 10, y: 5 }, 42, { id: "test", fill: "red" })

    expect(divElement.children).toHaveLength(1)
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("circle")
    expect(el.getAttribute("cx")).toEqual("10")
    expect(el.getAttribute("cy")).toEqual("5")
    expect(el.getAttribute("r")).toEqual("42")
    expect(el.getAttribute("fill")).toEqual("red")
  })

  test("should drawRect", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    renderer.drawRect({ height: 10, width: 5, x: 0, y: 2 }, { id: "test", stroke: "blue" })

    expect(divElement.children).toHaveLength(1)
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("rect")
    expect(el.getAttribute("x")).toEqual("0")
    expect(el.getAttribute("y")).toEqual("2")
    expect(el.getAttribute("height")).toEqual("10")
    expect(el.getAttribute("width")).toEqual("5")
    expect(el.getAttribute("stroke")).toEqual("blue")
  })

  test("should drawLine", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const renderer = new OISVGRenderer(DefaultRenderingConfiguration)
    renderer.init(divElement)
    renderer.drawLine({ x: 0, y: 1 }, { x: 5, y: 10 }, { id: "test", stroke: "blue" })

    expect(divElement.children).toHaveLength(1)
    const el = divElement.querySelector("#test")!
    expect(el.tagName).toEqual("line")
    expect(el.getAttribute("x1")).toEqual("0")
    expect(el.getAttribute("y1")).toEqual("1")
    expect(el.getAttribute("x2")).toEqual("5")
    expect(el.getAttribute("y2")).toEqual("10")
    expect(el.getAttribute("stroke")).toEqual("blue")
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
