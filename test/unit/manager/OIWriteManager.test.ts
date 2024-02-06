import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OIWriteManager,
  DefaultStyle,
  SymbolType,
  TPointer,
  TStyle,
  WriteTool,
  ShapeKind,
  TOIShape,
  TOIEdge,
  EdgeDecoration,
  EdgeKind,
  OIStroke
} from "../../../src/iink"

describe("OIWriteManager.ts", () =>
{
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  DefaultBehaviorsOptions.configuration.offscreen = true
  DefaultBehaviorsOptions.configuration.recognition.type = "Raw Content"
  DefaultBehaviorsOptions.configuration.rendering.smartGuide.enable = false

  test("should create", () =>
  {
    const layerInfo = document.createElement("div")
    //@ts-ignore TODO IIC-1006
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    const manager = new OIWriteManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("writing process", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const layerInfo = document.createElement("div")
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))

    const manager = new OIWriteManager(behaviors)
    manager.renderer.drawSymbol = jest.fn()

    behaviors.init(wrapperHTML)

    test("should init model.currentSymbol with pencil", async () =>
    {
      expect(manager.model.currentSymbol).toBeUndefined()
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.creationTime).toStrictEqual(manager.model.modificationDate)
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toEqual(SymbolType.Stroke)
      expect(manager.model.currentSymbol?.style.color).toBe(DefaultStyle.color)
      expect(manager.model.currentSymbol?.style.width).toBe(DefaultStyle.width)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with pencil & custom style", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      const style: TStyle = { color: "red", width: 42 }
      manager.start(style, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.style.color).toBe(style.color)
      expect(manager.model.currentSymbol?.style.width).toBe(style.width)
    })
    test("should init model.currentSymbol with Rectangle", () =>
    {
      expect(wrapperHTML.classList.contains("shape")).toBe(false)
      manager.tool = WriteTool.Rectangle
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Rectangle)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Circle", () =>
    {
      manager.tool = WriteTool.Circle
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Circle)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Ellipse", () =>
    {
      manager.tool = WriteTool.Ellipse
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Ellipse)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Triangle", () =>
    {
      manager.tool = WriteTool.Triangle
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Triangle)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Parallelogram", () =>
    {
      manager.tool = WriteTool.Parallelogram
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.model.currentSymbol as TOIShape
      expect(shape.kind).toBe(ShapeKind.Parallelogram)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Line", () =>
    {
      manager.tool = WriteTool.Line
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TOIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toBeUndefined()
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with Arrow", () =>
    {
      manager.tool = WriteTool.Arrow
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TOIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should init model.currentSymbol with DoubleArrow", () =>
    {
      manager.tool = WriteTool.DoubleArrow
      expect(wrapperHTML.classList.contains("shape")).toBe(true)
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point, 42, "mouse")
      expect(manager.model.currentSymbol).toBeDefined()
      expect(manager.model.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.model.currentSymbol as TOIEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.model.currentSymbol)
    })
    test("should throw error if symbol type unknow when start", () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      const style: TStyle = { color: "red", width: 42 }
      //@ts-ignore
      manager.tool = "unknow"
      expect(() => manager.start(style, point, 42, "mouse")).toThrow("Can't create symbol, tool is unknow: \"unknow\"")
    })
    test("should update currentSymbol", () =>
    {
      manager.tool = WriteTool.Pencil
      const point1: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(DefaultStyle, point1, 42, "mouse")
      const point2: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      manager.continue(point2)
      const stroke = manager.model.currentSymbol as OIStroke
      expect(stroke.pointers).toHaveLength(2)
      expect(stroke.pointers[1].x).toBe(point2.x)
      expect(stroke.pointers[1].y).toBe(point2.y)
      expect(stroke.pointers[1].t).toBe(point2.t)
      expect(stroke.pointers[1].p).toBe(point2.p)
    })
    test("should throw error when continu if currentSymbol is undefined", () =>
    {
      manager.model.clear()
      const point: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      expect(() => manager.continue(point)).toThrow("Can't update current symbol because currentSymbol is undefined")
    })
    test("should clear currentSymbol and add into model.symbols", async () =>
    {
      manager.model.clear()
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      manager.start(DefaultStyle, point, 42, "mouse")
      manager.continue(point)
      await manager.end(point)
      expect(manager.model.currentSymbol).toBeUndefined()
      expect(manager.model.symbols).toHaveLength(1)
      expect(behaviors.recognizer.addStrokes).toHaveBeenCalledTimes(1)
      expect(behaviors.recognizer.addStrokes).toHaveBeenCalledWith([manager.model.symbols[0]], true)
    })
  })
})
