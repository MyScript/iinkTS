import { buildStroke, delay } from "../helpers"
import
{
  WSBehaviors,
  Model,
  DefaultConfiguration,
  DefaultPenStyle,
  TBehaviorOptions,
  TConfiguration,
  TExport,
  TWSMessageEventSVGPatch,
  TPointer,
  TPenStyle,
  TTheme,
  EditorLayer,
  WSRecognizer,
  PointerEventGrabber,
  EditorTool
} from "../../../src/iink"
import { EditorEventMock } from "../__mocks__/EditorEventMock"
import { WSRecognizerMock } from "../__mocks__/WSRecognizerMock"

describe("WSBehaviors.ts", () =>
{
  const height = 100, width = 100
  const editorEventMock = new EditorEventMock(document.createElement("div"))
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: DefaultConfiguration
  }

  describe("constructor", () =>
  {
    test("should instanciate with default grabber & recognizer", () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      expect(wsb).toBeDefined()
      expect(wsb.grabber).toBeDefined()
      expect(wsb.grabber instanceof PointerEventGrabber).toBe(true)
      expect(wsb.recognizer).toBeDefined()
      expect(wsb.recognizer instanceof WSRecognizer).toBe(true)
    })

    test("should instanciate with custom grabber", () =>
    {
      class CustomGrabber extends PointerEventGrabber
      {
        name = "custom-grabber"
      }
      const customBehaviorsOptions = structuredClone(DefaultBehaviorsOptions)
      //@ts-ignore
      customBehaviorsOptions.behaviors = { grabber: CustomGrabber }
      const layers = new EditorLayer(document.createElement("div"))
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const wsb = new WSBehaviors(customBehaviorsOptions, layers, event)
      expect(wsb).toBeDefined()
      expect(wsb.grabber).toBeDefined()
      expect(wsb.grabber instanceof CustomGrabber).toBe(true)
    })

    test("should instanciate with custom recognizer", () =>
    {
      class CustomRecognizer extends WSRecognizer
      {
        name = "custom-recognizer"
      }
      const customBehaviorsOptions = structuredClone(DefaultBehaviorsOptions)
      //@ts-ignore
      customBehaviorsOptions.behaviors = { recognizer: CustomRecognizer }
      const layers = new EditorLayer(document.createElement("div"))
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const wsb = new WSBehaviors(customBehaviorsOptions, layers, event)
      expect(wsb).toBeDefined()
      expect(wsb.recognizer).toBeDefined()
      expect(wsb.recognizer instanceof WSRecognizer).toBe(true)
    })
  })

  describe("tool", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    test("should set class draw on root element by default", () =>
    {
      expect(layers.root.classList.contains("draw")).toBe(true)
      expect(layers.root.classList.contains("erase")).toBe(false)
    })
    test("should set class erase when set tool eraser", () =>
    {
      wsb.tool = EditorTool.Erase
      expect(layers.root.classList.contains("draw")).toBe(false)
      expect(layers.root.classList.contains("erase")).toBe(true)
    })
  })

  describe("init", () =>
  {
    test("should init grabber, renderer & recognizer & context", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.init()
      await expect(wsb.history.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0
      })
      await expect(wsb.grabber.attach).toHaveBeenNthCalledWith(1, layers.render)
      await expect(wsb.renderer.init).toHaveBeenNthCalledWith(1, layers.render)
      await expect(wsb.recognizer.init).toBeCalledTimes(1)
    })

    test("should resolve init when recognizer.init is resolve", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      //@ts-ignore
      wsb.recognizer.init = jest.fn((height: number, width: number) =>
      {
        wsb.recognizer.initialized.resolve()
        return wsb.recognizer.initialized.promise
      })
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())

      await wsb.init()
      await expect(wsb.recognizer.init).toBeCalledTimes(1)
    })

    test("should reject init when recognizer.init is reject", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      //@ts-ignore
      wsb.recognizer.init = jest.fn((height: number, width: number) =>
      {
        wsb.recognizer.initialized.reject("pouet")
        return wsb.recognizer.initialized.promise
      })

      await expect(wsb.init()).rejects.toEqual("pouet")
    })
  })

  describe("drawCurrentStroke", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    wsb.renderer.drawPendingStroke = jest.fn()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should not call renderer.drawPendingStroke if currentSymbol is null", async () =>
    {
      wsb.drawCurrentStroke()
      await expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(0)
    })
    test("should call renderer.drawPendingStroke", async () =>
    {
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      wsb.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      wsb.drawCurrentStroke()
      await expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(1)
      await expect(wsb.renderer.drawPendingStroke).toBeCalledWith(wsb.model.currentSymbol)
    })
  })

  describe("synchronizeModelWithBackend", () =>
  {
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearErasingStrokes = jest.fn()
      wsb.recognizer = new WSRecognizerMock()
      beforeAll(async () =>
      {
        await wsb.init()
      })
      test("should call recognizer.addStrokes", async () =>
      {
        await wsb.synchronizeModelWithBackend()
        await expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
      })
      test("should call renderer.clearErasingStrokes", async () =>
      {
        await wsb.synchronizeModelWithBackend()
        await expect(wsb.renderer.clearErasingStrokes).toBeCalledTimes(1)
      })
    })
    describe("with exportContent = 'DEMAND", () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const wsb = new WSBehaviors({ configuration }, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer = new WSRecognizerMock()
      beforeAll(async () =>
      {
        await wsb.init()
      })
      test("should not call recognizer.addStrokes when exportContent = DEMAND", async () =>
      {
        await wsb.synchronizeModelWithBackend()
        await expect(wsb.recognizer.addStrokes).toBeCalledTimes(0)
      })
    })
  })

  describe("idle", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    wsb.event.emitError = jest.fn()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.waitForIdle", async () =>
    {
      await wsb.waitForIdle()
      await expect(wsb.recognizer.waitForIdle).toBeCalledTimes(1)
    })
  })

  describe("export", () =>
  {
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer = new WSRecognizerMock()
      wsb.event.emitError = jest.fn()
      beforeAll(async () =>
      {
        await wsb.init()
      })
      test("should call recognizer.export", async () =>
      {
        wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
        await wsb.export()
        await expect(wsb.recognizer.export).toBeCalledTimes(1)
      })
      test("should reject if recognizer.export rejected", async () =>
      {
        wsb.recognizer.export = jest.fn(() => Promise.reject("poney"))
        await expect(wsb.export()).rejects.toEqual("poney")
        expect(wsb.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const wsb = new WSBehaviors({ configuration }, layers, editorEventMock)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer = new WSRecognizerMock()
      wsb.event.emitError = jest.fn()
      beforeAll(async () =>
      {
        await wsb.init()
      })
      test("should call recognizer.addStrokes when exportContent = DEMAND", async () =>
      {
        await wsb.init()
        await wsb.export()
        await expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
        await expect(wsb.recognizer.export).toBeCalledTimes(0)
      })
      test("should reject if recognizer.addStrokes rejected when exportContent = DEMAND", async () =>
      {
        wsb.recognizer.addStrokes = jest.fn(() => Promise.reject("poney"))
        await wsb.init()
        await expect(wsb.export()).rejects.toEqual("poney")
        expect(wsb.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
  })

  describe("convert", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.convert", async () =>
    {
      await wsb.convert()
      await expect(wsb.recognizer.convert).toBeCalledTimes(1)
    })
    test("should emot Converted recognizer.convert", async () =>
    {
      await wsb.convert()
      await expect(wsb.event.emitConverted).toBeCalledTimes(1)
    })
  })

  describe("import", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.import", async () =>
    {
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      await wsb.import(blob, mimeType)
      await expect(wsb.recognizer.import).toBeCalledTimes(1)
    })
    test("should return model with new export", async () =>
    {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const model = new Model(width, height)
      wsb.recognizer.import = jest.fn(() =>
      {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await wsb.import(blob, mimeType)
      await await expect(modelReceive.exports).toBe(exportExpected)
    })
    test("should emit Imported", async () =>
    {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const model = new Model(width, height)
      wsb.recognizer.import = jest.fn(() =>
      {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      wsb.event.emitImported = jest.fn()
      await wsb.import(blob, mimeType)
      await expect(wsb.event.emitImported).toHaveBeenNthCalledWith(1, model.exports)
    })
  })

  describe("importPointsEvent", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.importPointsEvents", async () =>
    {
      await wsb.init()
      const strokeToImport = buildStroke()
      await wsb.importPointEvents([strokeToImport])
      expect(wsb.recognizer.importPointEvents).toBeCalledTimes(1)
    })
  })

  describe("resize", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.resize = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call renderer.resize", async () =>
    {
      await wsb.resize(1, 2)
      await expect(wsb.renderer.resize).toBeCalledTimes(1)
    })
    test("should call recognizer.resize after resizeTriggerDelay", async () =>
    {
      wsb.resize(1, 2)
      await delay(DefaultConfiguration.triggers.resizeTriggerDelay)
      await expect(wsb.recognizer.resize).toBeCalledTimes(1)
    })
    test("should reject if renderer.resize rejected", async () =>
    {
      wsb.recognizer.resize = jest.fn(() => Promise.reject("pony"))
      await expect(wsb.resize(1, 2)).rejects.toEqual("pony")
    })
  })

  describe("undo", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.resize = jest.fn()
    wsb.recognizer = new WSRecognizerMock()

    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    wsb.history.stack = [firstModel, secondModel]
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.undo", async () =>
    {
      wsb.history.context.canUndo = true
      wsb.history.context.stackIndex = 1
      await wsb.undo()
      await expect(wsb.recognizer.undo).toBeCalledTimes(1)
    })
    test("should return previous model", async () =>
    {
      wsb.history.context.canUndo = true
      wsb.history.context.stackIndex = 1
      await expect(wsb.undo()).resolves.toEqual(firstModel)
    })
    test("should reject if recognizer.redo rejected", async () =>
    {
      wsb.history.context.canUndo = true
      wsb.history.context.stackIndex = 1
      wsb.recognizer.undo = jest.fn(() => Promise.reject("pony"))
      await expect(wsb.undo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canUndo = false", async () =>
    {
      wsb.history.context.canUndo = false
      await expect(wsb.undo()).rejects.toEqual(new Error("Undo not allowed"))
    })
  })

  describe("redo", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.resize = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    wsb.history.stack = [firstModel, secondModel]
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call recognizer.redo", async () =>
    {
      wsb.history.context.canRedo = true
      wsb.history.context.stackIndex = 0
      await wsb.redo()
      await expect(wsb.recognizer.redo).toBeCalledTimes(1)
    })
    test("should return next model", async () =>
    {
      wsb.history.context.canRedo = true
      wsb.history.context.stackIndex = 0
      wsb.history.stack.push(secondModel)
      await expect(wsb.redo()).resolves.toEqual(wsb.history.stack[1])
    })
    test("should reject if recognizer.redo rejected", async () =>
    {
      wsb.history.context.canRedo = true
      wsb.history.context.stackIndex = 0
      wsb.recognizer.redo = jest.fn(() => Promise.reject("pony"))
      await expect(wsb.redo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canRedo = false", async () =>
    {
      wsb.history.context.canRedo = false
      await expect(wsb.redo()).rejects.toEqual(new Error("Redo not allowed"))
    })
  })

  describe("clear", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.resize = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call model.clear", async () =>
    {
      wsb.model.clear = jest.fn()
      await wsb.clear()
      await expect(wsb.model.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      await wsb.clear()
      await expect(wsb.recognizer.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      wsb.event.emitCleared = jest.fn()
      await wsb.clear()
      await expect(wsb.event.emitCleared).toBeCalledTimes(1)
    })
  })

  describe("destroy", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.grabber.detach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.destroy = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should call grabber.detach", async () =>
    {
      wsb.destroy()
      expect(wsb.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      wsb.destroy()
      expect(wsb.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      wsb.destroy()
      expect(wsb.recognizer.destroy).toBeCalledTimes(1)
    })

  })

  describe("Event", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const wsb = new WSBehaviors(DefaultBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.updatesLayer = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    beforeAll(async () =>
    {
      await wsb.init()
    })
    test("should emitExported when recognizer emitExported", async () =>
    {
      wsb.recognizer.event.emitExported({ "text/plain": "test-exported" })
      expect(editorEventMock.emitExported).toHaveBeenNthCalledWith(1, { "text/plain": "test-exported" })
    })
    test("should update smarguide when recognizer emitExported", async () =>
    {
      //@ts-ignore
      wsb.smartGuide.update = jest.fn()
      const jiix = {
        type: "Text",
        label: "h",
        words: [
          {
            label: "h",
            candidates: ["h", "k", "hi", "hr", "hn"],
          },
        ],
        version: "3",
        id: "MainBlock",
      }
      wsb.recognizer.event.emitExported({ "application/vnd.myscript.jiix": jiix })
      expect(wsb.smartGuide?.update).toHaveBeenNthCalledWith(1, jiix)
    })
    test("should updatesLayer when recognizer emit SVG_PATCH", async () =>
    {
      const svgPatch: TWSMessageEventSVGPatch = {
        type: "REPLACE_ALL",
        layer: "MODEL",
        updates: []
      }
      wsb.recognizer.event.emitSVGPatch(svgPatch)
      await expect(wsb.renderer.updatesLayer).toBeCalledTimes(1)
      await expect(wsb.renderer.updatesLayer).toBeCalledWith(svgPatch.layer, svgPatch.updates)
    })
  })

  describe("Style", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
    const customPenStyle: TPenStyle = { color: "#d1d1d1" }
    customBehaviorsOptions.penStyle = customPenStyle
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
    const wsb = new WSBehaviors(customBehaviorsOptions, layers, editorEventMock)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.updatesLayer = jest.fn()
    wsb.styleManager.setPenStyle = jest.fn()
    wsb.styleManager.setPenStyleClasses = jest.fn()
    wsb.styleManager.setTheme = jest.fn()
    wsb.recognizer = new WSRecognizerMock()
    test("should have set PenStyle on initialization", async () =>
    {
      await wsb.init()
      await expect(wsb.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle)
      await expect(wsb.recognizer.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle)
    })
    test("should change PenStyle", async () =>
    {
      const customPenStyle2: TPenStyle = { color: "red" }
      await wsb.setPenStyle(customPenStyle2)
      await expect(wsb.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle2)
      await expect(wsb.recognizer.setPenStyle).toHaveBeenNthCalledWith(1, wsb.styleManager.penStyle)
    })
    test("should have set Theme on initialization", async () =>
    {
      await wsb.init()
      await expect(wsb.styleManager.setTheme).toHaveBeenNthCalledWith(1, customTheme)
      await expect(wsb.recognizer.setTheme).toHaveBeenNthCalledWith(1, wsb.styleManager.theme)
    })
    test("should change Theme", async () =>
    {
      const customTheme2: TTheme = {
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
      await wsb.setTheme(customTheme2)
      await expect(wsb.styleManager.setTheme).toHaveBeenNthCalledWith(1, customTheme2)
      await expect(wsb.recognizer.setTheme).toHaveBeenNthCalledWith(1, wsb.styleManager.theme)
    })
    test("should have set Theme on initialization", async () =>
    {
      await wsb.init()
      await expect(wsb.recognizer.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
      await expect(wsb.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
    })
    test("should change PenStyleClasses", async () =>
    {
      await wsb.setPenStyleClasses("pouet")
      await expect(wsb.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "pouet")
      await expect(wsb.recognizer.setPenStyleClasses).toHaveBeenNthCalledWith(1, wsb.styleManager.penStyleClasses)
    })
  })

})
