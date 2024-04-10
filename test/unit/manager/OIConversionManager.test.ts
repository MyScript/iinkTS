import { arcJIIX, circleJIIX, ellipseJIIX, helloJIIX, lineJIIX, parallelogramJIIX, polygonJIIX, rectangleJIIX, rhombusJIIX, triangleJIIX } from "../__dataset__/jiix.dataset"
import { buildOIStroke } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { Box, OIConversionManager, TJIIXEdgeElement, TJIIXNodeElement, TJIIXTextElement } from "../../../src/iink"

describe("OIConversionManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIConversionManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("convert", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.texter.adjustText = jest.fn()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.selector.removeSelectedGroup = jest.fn()
    const manager = new OIConversionManager(behaviors)
    manager.convertText = jest.fn((_t: TJIIXTextElement, _a: boolean) => Promise.resolve())
    manager.convertNode = jest.fn((_t: TJIIXNodeElement) => Promise.resolve())
    manager.convertEdge = jest.fn((_t: TJIIXEdgeElement) => Promise.resolve())
    test("should call behaviors.export if no model.exports?.[\"application/vnd.myscript.jiix\"]", async () =>
    {
      await manager.convert()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(behaviors.export).toHaveBeenCalledTimes(1)
      expect(behaviors.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
    })
    test("should call convertText", async () =>
    {
      expect(manager.convertText).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": helloJIIX }
      await manager.convert()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertText).toHaveBeenCalledTimes(1)
      expect(behaviors.texter.adjustText).toHaveBeenCalledTimes(1)
    })
    test("should call convertNode", async () =>
    {
      expect(manager.convertNode).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": rectangleJIIX }
      await manager.convert()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertNode).toHaveBeenCalledTimes(1)
    })
    test("should call convertEdge", async () =>
    {
      expect(manager.convertEdge).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": lineJIIX }
      await manager.convert()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertEdge).toHaveBeenCalledTimes(1)
    })
  })

  describe("convertText", () =>
  {
    const symEl = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.texter.getElementBoundingBox = jest.fn(() => new Box({ height: 10, width: 5, x: 1, y: 2}))
    behaviors.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.drawSymbol = jest.fn(() => symEl)
    behaviors.renderer.removeSymbol = jest.fn(() => Promise.resolve())
    behaviors.model.addSymbol = jest.fn()
    behaviors.model.removeSymbol = jest.fn()
    const manager = new OIConversionManager(behaviors)

    const helloTextJIIX = helloJIIX.elements?.[0] as TJIIXTextElement

    test("should throw Error if jiix has no word", async () =>
    {
      const noChars = JSON.parse(JSON.stringify(helloTextJIIX)) as TJIIXTextElement
      delete noChars.words
      await expect(async () => await manager.convertText(noChars, false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.text.words = true")
    })
    test("should throw Error if jiix has no char", async () =>
    {
      const noChars = JSON.parse(JSON.stringify(helloTextJIIX)) as TJIIXTextElement
      delete noChars.chars
      await expect(async () => await manager.convertText(noChars, false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.text.chars = true")
    })
    test("should throw Error if jiix char has no items", async () =>
    {
      const noItems = JSON.parse(JSON.stringify(helloTextJIIX)) as TJIIXTextElement
      noItems.chars?.forEach(c => delete c.items)
      await expect(async () => await manager.convertText(noItems, false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.strokes = true")
    })
    test("should render & update model", async () =>
    {
      const helloStroke = buildOIStroke()
      helloStroke.id = "stroke-78f208b6-dcc4-4f76-8c5b-e0093a9e2e62"
      manager.model.symbols.push(helloStroke)
      await manager.convertText(helloTextJIIX, false)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(helloStroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(helloStroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([helloStroke.id])
    })
  })

  describe("convertNode", () =>
  {
    const symEl = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.drawSymbol = jest.fn(() => symEl)
    behaviors.renderer.removeSymbol = jest.fn(() => Promise.resolve())
    behaviors.model.addSymbol = jest.fn()
    behaviors.model.removeSymbol = jest.fn()
    const manager = new OIConversionManager(behaviors)

    const jiixNodeRect = rectangleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeCircle = circleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeEllipse = ellipseJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeTriangle = triangleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeParrallelogram = parallelogramJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeRhombus = rhombusJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodePolygon = polygonJIIX.elements?.[0] as TJIIXNodeElement

    test("should should do nothing when shape.kind unknow", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-95ec1ea8-3dc9-4d63-945c-eaaa1d926367"
      manager.model.symbols.push(stroke)
      //@ts-ignore
      await manager.convertNode({ ...jiixNodeRect, kind: "pouet" })
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
    })
    test("should should render & update model when rectangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-95ec1ea8-3dc9-4d63-945c-eaaa1d926367"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeRect)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when rectangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-e3ab0f2b-7846-4440-9e49-97ae560813ee"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeCircle)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when ellipse", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-c5f186da-33c9-41ce-8750-1909e52fbf4c"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeEllipse)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when triangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-024da324-4196-41d0-8f51-16c2a21b9226"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeTriangle)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when parallelogram", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-768451fe-6737-43e7-b3a5-d7f2b3da8caa"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeParrallelogram)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when rhombus", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-1d68a985-9ca6-48dd-88b5-d385df793105"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodeRhombus)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when polygon", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-fa6ee3fd-6189-4bdf-8c06-1907588f298f"
      manager.model.symbols.push(stroke)
      await manager.convertNode(jiixNodePolygon)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
  })

  describe("convertEdge", () =>
  {
    const symEl = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.drawSymbol = jest.fn(() => symEl)
    behaviors.renderer.removeSymbol = jest.fn(() => Promise.resolve())
    behaviors.model.addSymbol = jest.fn()
    behaviors.model.removeSymbol = jest.fn()
    const manager = new OIConversionManager(behaviors)

    const jiixEdgeLine = lineJIIX.elements?.[0] as TJIIXEdgeElement
    const jiixEdgeArc = arcJIIX.elements?.[0] as TJIIXEdgeElement

    test("should should render & update model when line", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c498203182"
      manager.model.symbols.push(stroke)
      //@ts-ignore
      await manager.convertEdge({ ...jiixEdgeLine, kind: "pouet" })
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
    })
    test("should should render & update model when line", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c498203182"
      manager.model.symbols.push(stroke)
      await manager.convertEdge(jiixEdgeLine)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({ type: "edge", kind: "line" }))
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
    test("should should render & update model when line", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-a3aea978-6ea3-449e-8b02-74772a8233bb"
      manager.model.symbols.push(stroke)
      await manager.convertEdge(jiixEdgeArc)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({ type: "edge", kind: "arc" }))
      expect(behaviors.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.model.addSymbol).toHaveBeenCalledTimes(1)
      expect(behaviors.model.removeSymbol).toHaveBeenCalledWith(stroke.id)
      expect(behaviors.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
    })
  })

})
