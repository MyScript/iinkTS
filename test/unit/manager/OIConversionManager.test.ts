import { arcJIIX, circleJIIX, ellipseJIIX, hTextJIIX, lineJIIX, parallelogramJIIX, polygonJIIX, rectangleJIIX, rhombusJIIX, triangleJIIX } from "../__dataset__/jiix.dataset"
import { buildOIStroke } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { OIConversionManager, TJIIXEdgeElement, TJIIXNodeElement, TJIIXTextElement } from "../../../src/iink"

describe("OIConversionManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIConversionManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("apply", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.selector.removeSelectedGroup = jest.fn()
    const manager = new OIConversionManager(behaviors)
    manager.convertText = jest.fn()
    manager.convertNode = jest.fn()
    manager.convertEdge = jest.fn()
    test("should call behaviors.export if no model.exports?.[\"application/vnd.myscript.jiix\"]", async () =>
    {
      await manager.apply()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(behaviors.export).toHaveBeenCalledTimes(1)
      expect(behaviors.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
    })
    test("should call convertText", async () =>
    {
      expect(manager.convertText).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": hTextJIIX }
      await manager.apply()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertText).toHaveBeenCalledTimes(1)
    })
    test("should call convertNode", async () =>
    {
      expect(manager.convertNode).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": rectangleJIIX }
      await manager.apply()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertNode).toHaveBeenCalledTimes(1)
    })
    test("should call convertEdge", async () =>
    {
      expect(manager.convertEdge).toHaveBeenCalledTimes(0)
      manager.model.exports = { "application/vnd.myscript.jiix": lineJIIX }
      await manager.apply()
      expect(behaviors.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.convertEdge).toHaveBeenCalledTimes(1)
    })
  })

  describe("convertText", () =>
  {
    const symEl = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.texter.setBounds = jest.fn()
    behaviors.texter.getSpaceWidth = jest.fn(() => 10)
    behaviors.renderer.drawSymbol = jest.fn(() => symEl)
    behaviors.renderer.removeSymbol = jest.fn()
    behaviors.model.addSymbol = jest.fn()
    behaviors.model.removeSymbol = jest.fn()
    const manager = new OIConversionManager(behaviors)

    const hTextJIIXElement = hTextJIIX.elements?.[0] as TJIIXTextElement

    test("should throw Error if jiix has no lines", async () =>
    {
      const hTextJIIXElementClone = JSON.parse(JSON.stringify(hTextJIIXElement)) as TJIIXTextElement
      delete hTextJIIXElementClone.lines
      await expect(async () => await manager.convertText(hTextJIIXElementClone, [], false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.text.lines = true")
    })
    test("should throw Error if jiix has no word", async () =>
    {
      const hTextJIIXElementClone = JSON.parse(JSON.stringify(hTextJIIXElement)) as TJIIXTextElement
      delete hTextJIIXElementClone.words
      await expect(async () => await manager.convertText(hTextJIIXElementClone, [], false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.text.words = true")
    })
    test("should throw Error if jiix has no char", async () =>
    {
      const hTextJIIXElementClone = JSON.parse(JSON.stringify(hTextJIIXElement)) as TJIIXTextElement
      delete hTextJIIXElementClone.chars
      await expect(async () => await manager.convertText(hTextJIIXElementClone, [], false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.text.chars = true")
    })
    test("should throw Error if jiix char has no items", async () =>
    {
      const hTextJIIXElementClone = JSON.parse(JSON.stringify(hTextJIIXElement)) as TJIIXTextElement
      hTextJIIXElementClone.chars?.forEach(c => delete c.items)
      await expect(async () => await manager.convertText(hTextJIIXElementClone, [], false)).rejects.toThrowError("You need to active configuration.recognition.export.jiix.strokes = true")
    })
    test("should return converted symbol & strokes associate", async () =>
    {
      const helloStroke = buildOIStroke()
      helloStroke.id = hTextJIIXElement.words![0].items![0]["full-id"]!
      manager.model.symbols.push(helloStroke)
      const result = manager.convertText(hTextJIIXElement, [helloStroke], false)!
      expect(result).toHaveLength(1)
      expect(result[0].strokes).toEqual([helloStroke])
      expect(result[0].symbol.label).toEqual("h")
    })
  })

  describe("convertNode", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    const manager = new OIConversionManager(behaviors)

    const jiixNodeRect = rectangleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeCircle = circleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeEllipse = ellipseJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeTriangle = triangleJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeParrallelogram = parallelogramJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodeRhombus = rhombusJIIX.elements?.[0] as TJIIXNodeElement
    const jiixNodePolygon = polygonJIIX.elements?.[0] as TJIIXNodeElement

    test("should should return nothing when shape.kind unknow", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-95ec1ea8-3dc9-4d63-945c-eaaa1d92636711"
      manager.model.symbols.push(stroke)
      //@ts-ignore
      expect(manager.convertNode({ ...jiixNodeRect, kind: "pouet" }, [stroke])).toBeUndefined()
    })
    test("should return converted symbol & strokes associate when rectangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-95ec1ea8-3dc9-4d63-945c-eaaa1d926367"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeRect, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("polygon")
    })
    test("should return converted symbol & strokes associate when rectangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-e3ab0f2b-7846-4440-9e49-97ae560813ee"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeCircle, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("circle")
    })
    test("should return converted symbol & strokes associate when ellipse", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-c5f186da-33c9-41ce-8750-1909e52fbf4c"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeEllipse, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("ellipse")
    })
    test("should return converted symbol & strokes associate when triangle", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-024da324-4196-41d0-8f51-16c2a21b9226"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeTriangle, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("polygon")
    })
    test("should return converted symbol & strokes associate when parallelogram", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-768451fe-6737-43e7-b3a5-d7f2b3da8caa"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeParrallelogram, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("polygon")
    })
    test("should return converted symbol & strokes associate when rhombus", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-1d68a985-9ca6-48dd-88b5-d385df793105"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodeRhombus, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("polygon")
    })
    test("should return converted symbol & strokes associate when polygon", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-fa6ee3fd-6189-4bdf-8c06-1907588f298f"
      manager.model.symbols.push(stroke)
      const result = manager.convertNode(jiixNodePolygon, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("polygon")
    })
  })

  describe("convertEdge", () =>
  {
    const symEl = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const behaviors = new OIBehaviorsMock()
    behaviors.export = jest.fn(() => Promise.resolve(behaviors.model))
    behaviors.renderer.drawSymbol = jest.fn(() => symEl)
    behaviors.renderer.removeSymbol = jest.fn()
    const manager = new OIConversionManager(behaviors)

    const jiixEdgeLine = lineJIIX.elements?.[0] as TJIIXEdgeElement
    const jiixEdgeArc = arcJIIX.elements?.[0] as TJIIXEdgeElement

    test("should return nothing when when edge.kind unknow", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c49820318211"
      manager.model.symbols.push(stroke)
      //@ts-ignore
      expect(manager.convertEdge({ ...jiixEdgeLine, kind: "pouet" }, [stroke])).toBeUndefined()
    })
    test("should return converted symbol & strokes associate when line", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-2632b9c1-697d-44e6-bba4-44c498203182"
      manager.model.symbols.push(stroke)
      const result = manager.convertEdge(jiixEdgeLine, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("line")
    })
    test("should return converted symbol & strokes associate when arc", async () =>
    {
      const stroke = buildOIStroke()
      stroke.id = "stroke-a3aea978-6ea3-449e-8b02-74772a8233bb"
      manager.model.symbols.push(stroke)
      const result = manager.convertEdge(jiixEdgeArc, [stroke])!
      expect(result.strokes).toEqual([stroke])
      expect(result.symbol.kind).toEqual("arc")
    })
  })

})
