import { jiixText } from "../__dataset__/exports.dataset"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { buildOICircle, buildOIGroup, buildOIStroke, buildRecognizedText, buildOIText, delay } from "../helpers"
import
{
  OIBehaviors,
  DefaultConfiguration,
  EditorTool,
  TBehaviorOptions,
  TStyle,
  TTheme,
  PartialDeep,
  OIStroke,
  SymbolType,
  OIShapeCircle,
  ShapeKind,
  EditorLayer,
  TOISymbol,
} from "../../../src/iink"
import { EditorEventMock } from "../__mocks__/EditorEventMock"

describe("OIBehaviors.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  DefaultBehaviorsOptions.configuration.offscreen = true
  DefaultBehaviorsOptions.configuration.recognition.type = "Raw Content"
  DefaultBehaviorsOptions.configuration.rendering.smartGuide.enable = false
  const editorEventMock = new EditorEventMock(document.createElement("div"))

  test("should instanciate OIBehaviors", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    expect(oib).toBeDefined()
  })

  describe("Style", () =>
  {
    const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
    const customStyle: TStyle = { color: "#d1d1d1" }
    customBehaviorsOptions.penStyle = customStyle
    const customTheme: TTheme = {
      ink: {
        width: 42,
        color: "#2E7D32",
        "-myscript-pen-width": 2,
        "-myscript-pen-fill-style": "purple",
        "-myscript-pen-fill-color": "#FFFFFF00"
      },
      ".math": {
        "font-family": "STIXGeneral"
      },
      ".math-solved": {
        "font-family": "STIXGeneral",
        color: "blue"
      },
      ".text": {
        "font-family": "Rubik Distressed",
        "font-size": 10
      }
    }
    customBehaviorsOptions.theme = customTheme
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(customBehaviorsOptions, layers, editorEventMock)
    oib.styler.setPenStyle = jest.fn()
    oib.styler.setTheme = jest.fn()
    oib.styler.setPenStyleClasses = jest.fn()

    test("should define style", async () =>
    {
      await expect(oib.penStyle).toEqual(expect.objectContaining(customStyle))
    })
    test("should change Style", async () =>
    {
      const customStyle: TStyle = { color: "#d1d1d1" }
      await oib.setPenStyle(customStyle)
      await expect(oib.styler.setPenStyle).toHaveBeenNthCalledWith(1, expect.objectContaining(customStyle))
    })
    test("should define theme", async () =>
    {
      await expect(oib.theme).toEqual(customTheme)
    })
    test("should change Theme", async () =>
    {
      const customTheme: TTheme = {
        ink: {
          width: 42,
          color: "#2E7D32",
          "-myscript-pen-width": 2,
          "-myscript-pen-fill-style": "purple",
          "-myscript-pen-fill-color": "#FFFFFF00"
        },
        ".math": {
          "font-family": "STIXGeneral"
        },
        ".math-solved": {
          "font-family": "STIXGeneral",
          color: "blue"
        },
        ".text": {
          "font-family": "Rubik Distressed",
          "font-size": 10
        }
      }
      await oib.setTheme(customTheme)
      await expect(oib.styler.setTheme).toHaveBeenNthCalledWith(1, customTheme)
    })
    test("should change PenStyleClasses", async () =>
    {
      await oib.setPenStyleClasses("pouet")
      await expect(oib.styler.setPenStyleClasses).toHaveBeenNthCalledWith(1, "pouet")
    })
  })

  describe("init", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.menu.render = jest.fn()
    oib.grabber.attach = jest.fn()
    oib.renderer.init = jest.fn()
    oib.setPenStyle = jest.fn()
    oib.setTheme = jest.fn()
    oib.setPenStyleClasses = jest.fn()

    test("should init grabber, renderer & recognizer & context", async () =>
    {
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.init()
      expect(oib.history.context.canRedo).toEqual(false)
      expect(oib.history.context.canUndo).toEqual(false)
      expect(oib.history.context.empty).toEqual(true)
      expect(oib.history.context.stackIndex).toEqual(0)
      expect(oib.history.stack.length).toEqual(1)
      await expect(oib.grabber.attach).toBeCalledTimes(1)
      await expect(oib.renderer.init).toBeCalledTimes(1)
      await expect(oib.recognizer.init).toBeCalledTimes(1)
    })
    test("should resolve init when recognizer.init is resolve", async () =>
    {
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init()
      await expect(oib.recognizer.init).toBeCalledTimes(1)
    })
    test("should set style after recognizer init", async () =>
    {
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init()
      expect(oib.setPenStyle).toBeCalledTimes(1)
      expect(oib.setTheme).toBeCalledTimes(1)
      expect(oib.setPenStyleClasses).toBeCalledTimes(1)
    })
    test("should reject init when recognizer.init is reject", async () =>
    {
      oib.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(oib.init()).rejects.toEqual("pouet")
    })
  })

  describe("CRUD", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.menu.update = jest.fn()
    oib.svgDebugger.apply = jest.fn()
    oib.recognizer.waitForIdle = jest.fn()

    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
    oib.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())

    oib.renderer.drawSymbol = jest.fn()
    oib.renderer.changeOrderSymbol = jest.fn()
    oib.renderer.replaceSymbol = jest.fn()
    oib.renderer.removeSymbol = jest.fn()

    oib.model.addSymbol = jest.fn()
    oib.model.changeOrderSymbol = jest.fn()
    oib.model.replaceSymbol = jest.fn()
    oib.model.removeSymbol = jest.fn()

    test("add stroke", async () =>
    {
      const stroke = buildOIStroke()
      await oib.addSymbol(stroke)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("add shape", async () =>
    {
      const shape = buildOICircle()
      await oib.addSymbol(shape)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("create stroke", async () =>
    {
      const stroke: PartialDeep<OIStroke> = {
        type: SymbolType.Stroke,
        pointers: [{ x: 0, y: 1, t: 1, p: 1 }]
      }
      await oib.createSymbol(stroke)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [expect.objectContaining(stroke)], false)
    })
    test("create shape", async () =>
    {
      const shape: PartialDeep<OIShapeCircle> = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 5, y: 5 },
        radius: 5
      }
      await oib.createSymbol(shape)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("replace stroke by stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      await oib.replaceSymbols([stroke1], [stroke2])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(oib.recognizer.replaceStrokes).toHaveBeenNthCalledWith(1, [stroke1.id], [stroke2])
    })
    test("replace stroke by shape", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await oib.replaceSymbols([stroke], [shape])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(oib.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("replace shape by stroke", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await oib.replaceSymbols([shape], [stroke])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("change order symbol", async () =>
    {
      const stroke = buildOIStroke()
      await oib.changeOrderSymbol(stroke, "last")
      expect(oib.model.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke.id, "last")
      expect(oib.renderer.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke, "last")
    })
    test("remove stroke", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.symbols.push(stroke)
      await oib.removeSymbol(stroke.id)
      expect(oib.model.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(oib.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("remove shape", async () =>
    {
      const shape = buildOICircle()
      oib.model.symbols.push(shape)
      await oib.removeSymbol(shape.id)
      expect(oib.model.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
    })
  })

  describe("updateSymbolsStyle", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.renderer.drawSymbol = jest.fn()
    const stroke1 = buildOIStroke()
    oib.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    oib.model.addSymbol(stroke2)
    test("should update symbol color and draw", async () =>
    {
      await oib.init()
      expect(oib.model.symbols[0].style.color).toEqual("#000000")
      oib.updateSymbolsStyle([stroke1.id], { color: "red" })
      expect(oib.model.symbols[0].style.color).toEqual("red")
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should update symbol width and draw", async () =>
    {
      await oib.init()
      expect(oib.model.symbols[1].style.width).toEqual(2)
      oib.updateSymbolsStyle([stroke2.id], { width: 42 })
      expect(oib.model.symbols[1].style.width).toEqual(42)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledWith(stroke2)
    })
  })

  describe("Writer", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.writer.start = jest.fn()
    oib.writer.continue = jest.fn()
    oib.writer.end = jest.fn()
    const pointerId = 666
    test("should call writer.start on pointerdown", async () =>
    {
      await oib.init()
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(oib.writer.start).toBeCalledTimes(1)
      expect(oib.writer.continue).toBeCalledTimes(0)
      expect(oib.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.continue on pointermove", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(oib.writer.start).toBeCalledTimes(0)
      expect(oib.writer.continue).toBeCalledTimes(1)
      expect(oib.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.end on pointerup", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(oib.writer.start).toBeCalledTimes(0)
      expect(oib.writer.continue).toBeCalledTimes(0)
      expect(oib.writer.end).toBeCalledTimes(1)
    })
  })

  describe("Eraser", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.tool = EditorTool.Erase
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.eraser.start = jest.fn()
    oib.eraser.continue = jest.fn()
    oib.eraser.end = jest.fn()
    const pointerId = 666
    test("should call eraseManager.start on pointerdown", async () =>
    {
      await oib.init()
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(oib.eraser.start).toBeCalledTimes(1)
      expect(oib.eraser.continue).toBeCalledTimes(0)
      expect(oib.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.continue on pointermove", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(oib.eraser.start).toBeCalledTimes(0)
      expect(oib.eraser.continue).toBeCalledTimes(1)
      expect(oib.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.end on pointerup", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(oib.eraser.start).toBeCalledTimes(0)
      expect(oib.eraser.continue).toBeCalledTimes(0)
      expect(oib.eraser.end).toBeCalledTimes(1)
    })
  })

  describe("Select", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.tool = EditorTool.Select
    oib.updateLayerUI = jest.fn()
    oib.renderer.drawSymbol = jest.fn()
    oib.recognizer.init = jest.fn(() => Promise.resolve())
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.selector.start = jest.fn()
    oib.selector.continue = jest.fn()
    oib.selector.end = jest.fn()
    oib.selector.removeSelectedGroup = jest.fn()
    oib.selector.drawSelectedGroup = jest.fn()
    oib.event.emitSelected = jest.fn()
    const pointerId = 666
    const stroke = buildOIStroke()
    const circle = buildOICircle()

    beforeAll(async () => {
      await oib.init()
      oib.model.addSymbol(stroke)
      oib.model.addSymbol(circle)
    })

    test("should select all symbols", async () =>
    {
      oib.selectAll()
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(oib.selector.drawSelectedGroup).toHaveBeenNthCalledWith(1,[stroke, circle])
      expect(oib.event.emitSelected).toHaveBeenNthCalledWith(1,[stroke, circle])
    })
    test("should unselect all symbols", async () =>
    {
      oib.unselectAll()
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(oib.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(oib.event.emitSelected).toHaveBeenNthCalledWith(1,[])
    })
    test("should call selector.start on pointerdown", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(oib.selector.start).toBeCalledTimes(1)
      expect(oib.selector.continue).toBeCalledTimes(0)
      expect(oib.selector.end).toBeCalledTimes(0)
    })
    test("should call selector.continue on pointermove", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(oib.selector.start).toBeCalledTimes(0)
      expect(oib.selector.continue).toBeCalledTimes(1)
      expect(oib.selector.end).toBeCalledTimes(0)
    })
    test("should call selector.end on pointerup", async () =>
    {
      const target = layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(oib.selector.start).toBeCalledTimes(0)
      expect(oib.selector.continue).toBeCalledTimes(0)
      expect(oib.selector.end).toBeCalledTimes(1)
    })
  })

  describe("importPointsEvent", () =>
  {
    const pStrokes: PartialDeep<OIStroke>[] = [
      {
        pointers: [
          { x: 254, y: 37, t: 1, p: 1 },
          { x: 253, y: 42, t: 2, p: 0.7 },
        ]
      },
      {
        pointers: [
          { x: 222, y: 386, t: 3, p: 0.5 },
          { x: 226, y: 385, t: 4, p: 0.8 },
        ],
        style: { width: 3, color: "#1A8CFF" }
      }
    ]

    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.event.emitIdle = jest.fn()
    oib.layers.updateState = jest.fn()
    oib.renderer.drawSymbol = jest.fn()
    oib.recognizer.addStrokes = jest.fn()
    oib.updateLayerUI = jest.fn()
    oib.event.emitImported = jest.fn()

    test("should update layer state", async () =>
    {
      await oib.importPointEvents(pStrokes)
      expect(oib.event.emitIdle).toHaveBeenNthCalledWith(1, false)
      expect(oib.layers.updateState).toHaveBeenNthCalledWith(1, false)
    })
    test("should call recognizer.addStrokes", async () =>
    {
      await oib.importPointEvents(pStrokes)
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
    })
    test("should add symbols to model and draw", async () =>
    {
      oib.model.symbols = []
      await oib.importPointEvents(pStrokes)
      expect(oib.model.symbols).toHaveLength(pStrokes.length)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(2)
    })
    test("should update layer UI", async () =>
    {
      await oib.importPointEvents(pStrokes)
      expect(oib.updateLayerUI).toHaveBeenCalledTimes(1)
    })
    test("should emit Imported", async () =>
    {
      await oib.importPointEvents(pStrokes)
      expect(oib.event.emitImported).toHaveBeenCalledTimes(1)
    })
  })

  describe("Download", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    const stroke1 = buildOIStroke()
    stroke1.selected = true
    oib.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    oib.model.addSymbol(stroke2)

    oib.renderer.getElementById = jest.fn((id) =>
    {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.id = id
      return p
    })

    test("should call trigger download svg file", async () =>
    {
      global.URL.createObjectURL = jest.fn(() => 'download-svg-url')
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => link)
      oib.downloadAsSVG()
      expect(link.href).toContain('download-svg-url')
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".svg")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    // //fix canvas.getContext
    test.skip("should call trigger download png file", async () =>
    {
      global.URL.createObjectURL = jest.fn(() => 'download-png-url')
      //@ts-ignore
      global.Image = class
      {
        onload: () => void
        //@ts-ignore
        constructor(width?: number, height?: number)
        {
          this.onload = jest.fn()
          setTimeout(() =>
          {
            this.onload()
          }, 50)
        }
      } as unknown as HTMLImageElement
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => link)
      oib.downloadAsPNG()
      await delay(101)
      expect(link.href).toContain('download-png-url')
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file", async () =>
    {
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => link)
      oib.downloadAsJson()
      expect(link.href).toContain('data:text/json;charset=utf-8,')
      expect(link.href).toContain(stroke1.id)
      expect(link.href).toContain(stroke2.id)
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".json")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file with only selected files", async () =>
    {
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => link)
      oib.downloadAsJson(true)
      expect(link.href).toContain('data:text/json;charset=utf-8,')
      expect(link.href).toContain(stroke1.id)
      expect(link.href).not.toContain(stroke2.id)
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".json")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
  })

  describe("extract symbols", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    const text1 = buildOIText()
    const text2 = buildOIText()
    const stroke1 = buildOIStroke()
    const stroke2 = buildOIStroke()
    const strokeText = buildRecognizedText()
    const group = buildOIGroup({ nbOIText: 1, nbOIStroke: 1 })
    const symbols: TOISymbol[] = [
      stroke1,
      text1,
      stroke2,
      strokeText,
      text2,
      buildOICircle(),
      group
    ]
    test("should extract strokes", () =>
    {
      const strokes = oib.extractStrokesFromSymbols(symbols)
      expect(strokes).toEqual([stroke1, stroke2, ...strokeText.strokes, ...group.children.filter(s => s.type === SymbolType.Stroke)])
    })
    test("should extract texts", () =>
    {
      const texts = oib.extractTextsFromSymbols(symbols)
      expect(texts).toEqual([text1, text2, ...group.children.filter(s => s.type === SymbolType.Text)])
    })
  })

  describe("undo", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    let oib!: OIBehaviors

    beforeEach(() =>
    {
      oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      oib.event.emitIdle = jest.fn()
      oib.unselectAll = jest.fn()
      oib.history.undo = jest.fn()
      oib.recognizer.undo = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.menu.update = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canUndo = false", async () =>
    {
      oib.history.context.canUndo = false
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(0)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(0)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.drawSymbol when history.undo return added stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ added: [stroke1] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should not call recognizer.undo & call renderer.drawSymbol when history.undo return added shape", async () =>
    {
      const circle = buildOICircle()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(circle)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(0)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(circle)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.removeSymbol when history.undo return erased stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      oib.model.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(0)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return replaced stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.model.addSymbol(stroke2)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke2.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return matrix", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, symbols: [stroke1] } } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, strokes: [stroke1] } }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return translate", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { translate: [{ tx: 1, ty: 2, symbols: [stroke1] }] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ translate: [{ tx: 1, ty: 2, strokes: [stroke1] }] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return scale", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, symbols: [stroke1] }] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, strokes: [stroke1] }] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return rotate", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.history.undo = jest.fn(() => ({ model: firstModel, changes: { rotate: [{ angle: 42, center: { x: 1, y: 2 }, symbols: [stroke1] }] } }))
      oib.history.context.canUndo = true
      await oib.undo()
      expect(oib.recognizer.undo).toBeCalledTimes(1)
      expect(oib.recognizer.undo).toBeCalledWith(expect.objectContaining({ rotate: [{ angle: 42, center: { x: 1, y: 2 }, strokes: [stroke1] }] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
  })

  describe("redo", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    let oib!: OIBehaviors

    beforeEach(() =>
    {
      oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      oib.event.emitIdle = jest.fn()
      oib.unselectAll = jest.fn()
      oib.history.undo = jest.fn()
      oib.recognizer.redo = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.menu.update = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canRedo = false", async () =>
    {
      oib.history.context.canRedo = false
      await oib.redo()
      expect(oib.recognizer.redo).toBeCalledTimes(0)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(0)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.drawSymbol when history.redo return added stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const secondModel = oib.model.clone()
      secondModel.addSymbol(stroke1)
      oib.history.context.canRedo = true
      oib.history.redo = jest.fn(() => ({ model: secondModel, changes: { added: [stroke1] } }))
      await oib.redo()
      expect(oib.recognizer.redo).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should not call recognizer.redo & call renderer.drawSymbol when history.redo return added shape", async () =>
    {
      const circle = buildOICircle()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(circle)
      oib.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      oib.history.context.canRedo = true
      await oib.redo()
      expect(oib.recognizer.redo).toBeCalledTimes(0)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(circle)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.removeSymbol when history.redo return erased stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      oib.model.addSymbol(stroke1)
      oib.history.redo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      oib.history.context.canRedo = true
      await oib.redo()
      expect(oib.recognizer.redo).toBeCalledTimes(1)
      expect(oib.recognizer.redo).toBeCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(0)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should call recognizer.redo & renderer.drawSymbol & renderer.removeSymbol when history.redo return replaced stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.model.addSymbol(stroke2)
      oib.history.redo = jest.fn(() => ({ model: firstModel, changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } } }))
      oib.history.context.canRedo = true
      await oib.redo()
      expect(oib.recognizer.redo).toBeCalledTimes(1)
      expect(oib.recognizer.redo).toBeCalledWith(expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } }))
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke2.id)
    })
  })

  describe("export", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)

    test("should call recognizer.export", async () =>
    {
      oib.recognizer.export = jest.fn(() => Promise.resolve(jiixText))
      await oib.export()
      await expect(oib.recognizer.export).toBeCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () =>
    {
      oib.recognizer.export = jest.fn(() => Promise.reject("export-error"))
      await expect(async () => await oib.export()).rejects.toEqual("export-error")
      expect(oib.event.emitError).toHaveBeenCalledTimes(1)
    })
  })

  describe("convert", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.svgDebugger.apply = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.converter.apply = jest.fn(() => Promise.resolve())

    test("should call converter.apply", async () =>
    {
      await oib.convert()
      await expect(oib.converter.apply).toBeCalledTimes(1)
    })
    test("should emitConverted", async () =>
    {
      await oib.convert()
      expect(editorEventMock.emitConverted).toBeCalledTimes(1)
    })
    test("should emit error if converter.apply is rejected", async () =>
    {
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.converter.apply = jest.fn(() => Promise.reject("convert-error"))
      oib.event.emitError = jest.fn()
      await expect(async () => await oib.convert()).rejects.toEqual("convert-error")
      expect(oib.event.emitError).toHaveBeenCalledTimes(1)
      expect(oib.event.emitError).toHaveBeenCalledWith("convert-error")
    })
  })

  describe("idle", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.recognizer.init = jest.fn(() => Promise.resolve())
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.event.emitIdle = jest.fn()
    oib.layers.updateState = jest.fn()

    beforeAll(async () =>
    {
      await oib.init()
    })

    test("should call recognizer.waitForIdle", async () =>
    {
      await oib.waitForIdle()
      await expect(oib.recognizer.waitForIdle).toBeCalledTimes(1)
    })
    test("should emit idle & call layers.updateState when recognizer emit idle", async () =>
    {
      oib.recognizer.event.emitIdle(true)
      expect(oib.event.emitIdle).toHaveBeenNthCalledWith(1, true)
      expect(oib.layers.updateState).toHaveBeenNthCalledWith(1, true)
    })
  })

  describe("resize", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.menu.render = jest.fn()
    oib.menu.style.update = jest.fn()
    oib.renderer.resize = jest.fn()
    oib.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () =>
    {
      await oib.init()
    })

    test("should call renderer.resize", async () =>
    {
      await oib.init()
      await oib.resize(1, 2)
      await expect(oib.renderer.resize).toBeCalledTimes(1)
    })
    test("should update model", async () =>
    {
      await oib.resize(1, 2)
      await expect(oib.model.height).toEqual(1)
      await expect(oib.model.width).toEqual(2)
    })
  })

  describe("clear", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.svgDebugger.apply = jest.fn()
    oib.selector.removeSelectedGroup = jest.fn()
    oib.renderer.clear = jest.fn()
    oib.recognizer.clear = jest.fn(() => Promise.resolve())
    oib.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () =>
    {
      await oib.init()
    })

    test("should call renderer.clear", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      await oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(1)
    })
    test("should call selector.removeSelectedGroup", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      await oib.clear()
      await expect(oib.selector.removeSelectedGroup).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.clear()
      await expect(oib.recognizer.clear).toBeCalledTimes(1)
    })
    test("should clear model", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      await oib.clear()
      const newModel = await oib.clear()
      await expect(newModel.symbols).toHaveLength(0)
      await expect(oib.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () =>
    {
      await oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(0)
      await expect(oib.recognizer.clear).toBeCalledTimes(0)
    })
  })

  describe("destroy", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    oib.grabber.detach = jest.fn()
    oib.renderer.destroy = jest.fn()
    oib.recognizer.destroy = jest.fn()

    test("should call grabber.detach", async () =>
    {
      oib.destroy()
      await expect(oib.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      oib.destroy()
      await expect(oib.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      oib.destroy()
      await expect(oib.recognizer.destroy).toBeCalledTimes(1)
    })

  })
})
