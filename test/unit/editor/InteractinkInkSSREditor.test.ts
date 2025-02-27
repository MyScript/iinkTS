import { buildStroke, delay } from "../helpers"
import
{
  InteractiveInkSSREditor,
  Model,
  DefaultInteractiveInkSSREditorConfiguration,
  DefaultPenStyle,
  TInteractiveInkSSREditorConfiguration,
  TExport,
  TRecognizerWebSocketSSRMessageSVGPatch,
  TPointer,
  TPenStyle,
  TTheme,
  RecognizerWebSocketSSR,
  PointerEventGrabber,
  EditorTool,
  TInteractiveInkSSREditorOptions
} from "../../../src/iink"
import { RecognizerWebSocketSSRMock } from "../__mocks__/RecognizerWebSocketSSRMock"

describe("InteractiveInkSSREditor.ts", () =>
{
  const height = 100, width = 100
  const DefaultInteractiveInkSSREditorOptions: TInteractiveInkSSREditorOptions = {
    configuration: DefaultInteractiveInkSSREditorConfiguration
  }

  describe("constructor", () =>
  {
    test("should instanciate with default grabber & recognizer", () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      expect(editor).toBeDefined()
      expect(editor.grabber).toBeDefined()
      expect(editor.grabber instanceof PointerEventGrabber).toBe(true)
      expect(editor.recognizer).toBeDefined()
      expect(editor.recognizer instanceof RecognizerWebSocketSSR).toBe(true)
    })

    test("should instanciate with custom grabber", () =>
    {
      class CustomGrabber extends PointerEventGrabber
      {
        name = "custom-grabber"
      }
      const customOptions: TInteractiveInkSSREditorOptions = {
        configuration: DefaultInteractiveInkSSREditorConfiguration,
        //@ts-ignore
        override: { grabber: CustomGrabber }
      }
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const editor = new InteractiveInkSSREditor(document.createElement("div"), customOptions)
      expect(editor).toBeDefined()
      expect(editor.grabber).toBeDefined()
      expect(editor.grabber instanceof CustomGrabber).toBe(true)
    })

    test("should instanciate with custom recognizer", () =>
    {
      class CustomRecognizer extends RecognizerWebSocketSSR
      {
        name = "custom-recognizer"
      }
      const customOptions: TInteractiveInkSSREditorOptions = {
        configuration: DefaultInteractiveInkSSREditorConfiguration,
        //@ts-ignore
        override: { recognizer: CustomRecognizer }
      }
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const editor = new InteractiveInkSSREditor(document.createElement("div"), customOptions)
      expect(editor).toBeDefined()
      expect(editor.recognizer).toBeDefined()
      expect(editor.recognizer instanceof RecognizerWebSocketSSR).toBe(true)
    })
  })

  describe("tool", () =>
  {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    test("should set class draw on root element by default", () =>
    {
      expect(editor.layers.root.classList.contains("draw")).toBe(true)
      expect(editor.layers.root.classList.contains("erase")).toBe(false)
    })
    test("should set class erase when set tool eraser", () =>
    {
      editor.tool = EditorTool.Erase
      expect(editor.layers.root.classList.contains("draw")).toBe(false)
      expect(editor.layers.root.classList.contains("erase")).toBe(true)
    })
  })

  describe("init", () =>
  {
    test("should init grabber, renderer & recognizer & context", async () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.recognizer.init = jest.fn(() => Promise.resolve())
      editor.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      editor.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      editor.recognizer.setTheme = jest.fn(() => Promise.resolve())
      editor.initialize()
      await expect(editor.history.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0
      })
      await expect(editor.grabber.attach).toHaveBeenNthCalledWith(1, editor.layers.rendering)
      await expect(editor.renderer.init).toHaveBeenNthCalledWith(1, editor.layers.rendering)
      await expect(editor.recognizer.init).toBeCalledTimes(1)
    })

    test("should resolve init when recognizer.init is resolve", async () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      //@ts-ignore
      editor.recognizer.init = jest.fn((height: number, width: number) =>
      {
        editor.recognizer.initialized.resolve()
        return editor.recognizer.initialized.promise
      })
      editor.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      editor.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      editor.recognizer.setTheme = jest.fn(() => Promise.resolve())

      await editor.initialize()
      await expect(editor.recognizer.init).toBeCalledTimes(1)
    })

    test("should reject init when recognizer.init is reject", async () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      //@ts-ignore
      editor.recognizer.init = jest.fn((height: number, width: number) =>
      {
        editor.recognizer.initialized.reject("pouet")
        return editor.recognizer.initialized.promise
      })

      await expect(editor.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("drawCurrentStroke", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    editor.renderer.drawPendingStroke = jest.fn()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should not call renderer.drawPendingStroke if currentSymbol is null", async () =>
    {
      editor.drawCurrentStroke()
      await expect(editor.renderer.drawPendingStroke).toBeCalledTimes(0)
    })
    test("should call renderer.drawPendingStroke", async () =>
    {
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      editor.drawCurrentStroke()
      await expect(editor.renderer.drawPendingStroke).toBeCalledTimes(1)
      await expect(editor.renderer.drawPendingStroke).toBeCalledWith(editor.model.currentSymbol)
    })
  })

  describe("synchronizeModelWithBackend", () =>
  {
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.renderer.clearErasingStrokes = jest.fn()
      editor.recognizer = new RecognizerWebSocketSSRMock()
      beforeAll(async () =>
      {
        await editor.initialize()
      })
      test("should call recognizer.addStrokes", async () =>
      {
        await editor.synchronizeModelWithBackend()
        await expect(editor.recognizer.addStrokes).toBeCalledTimes(1)
      })
      test("should call renderer.clearErasingStrokes", async () =>
      {
        await editor.synchronizeModelWithBackend()
        await expect(editor.renderer.clearErasingStrokes).toBeCalledTimes(1)
      })
    })
    describe("with exportContent = 'DEMAND", () =>
    {
      const options: TInteractiveInkSSREditorOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSREditorOptions))
      options!.configuration!.triggers!.exportContent = "DEMAND"
      const editor = new InteractiveInkSSREditor(document.createElement("div"), options)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.renderer.clearPendingStroke = jest.fn()
      editor.recognizer = new RecognizerWebSocketSSRMock()
      beforeAll(async () =>
      {
        await editor.initialize()
      })
      test("should not call recognizer.addStrokes when exportContent = DEMAND", async () =>
      {
        await editor.synchronizeModelWithBackend()
        await expect(editor.recognizer.addStrokes).toBeCalledTimes(0)
      })
    })
  })

  describe("idle", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    editor.event.emitError = jest.fn()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.waitForIdle", async () =>
    {
      await editor.waitForIdle()
      await expect(editor.recognizer.waitForIdle).toBeCalledTimes(1)
    })
  })

  describe("export", () =>
  {
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.recognizer = new RecognizerWebSocketSSRMock()
      editor.event.emitError = jest.fn()
      beforeAll(async () =>
      {
        await editor.initialize()
      })
      test("should call recognizer.export", async () =>
      {
        editor.recognizer.export = jest.fn(m => Promise.resolve(m))
        await editor.export()
        await expect(editor.recognizer.export).toBeCalledTimes(1)
      })
      test("should reject if recognizer.export rejected", async () =>
      {
        editor.recognizer.export = jest.fn(() => Promise.reject("poney"))
        await expect(editor.export()).rejects.toEqual("poney")
        expect(editor.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
    describe("with exportContent = 'POINTER_UP", () =>
    {
      const options: TInteractiveInkSSREditorOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSREditorOptions))
      options.configuration!.triggers!.exportContent = "DEMAND"
      const editor = new InteractiveInkSSREditor(document.createElement("div"), options)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.recognizer = new RecognizerWebSocketSSRMock()
      editor.event.emitError = jest.fn()
      beforeAll(async () =>
      {
        await editor.initialize()
      })
      test("should call recognizer.addStrokes when exportContent = DEMAND", async () =>
      {
        await editor.initialize()
        await editor.export()
        await expect(editor.recognizer.addStrokes).toBeCalledTimes(1)
        await expect(editor.recognizer.export).toBeCalledTimes(0)
      })
      test("should reject if recognizer.addStrokes rejected when exportContent = DEMAND", async () =>
      {
        editor.recognizer.addStrokes = jest.fn(() => Promise.reject("poney"))
        await editor.initialize()
        await expect(editor.export()).rejects.toEqual("poney")
        expect(editor.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
  })

  describe("convert", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.event.emitConverted = jest.fn()
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.convert", async () =>
    {
      await editor.convert()
      await expect(editor.recognizer.convert).toBeCalledTimes(1)
    })
    test("should emit Converted recognizer.convert", async () =>
    {
      await editor.convert()
      await expect(editor.event.emitConverted).toBeCalledTimes(1)
    })
  })

  describe("import", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.import", async () =>
    {
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      await editor.import(blob, mimeType)
      await expect(editor.recognizer.import).toBeCalledTimes(1)
    })
    test("should return model with new export", async () =>
    {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const model = new Model(width, height)
      editor.recognizer.import = jest.fn(() =>
      {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await editor.import(blob, mimeType)
      await await expect(modelReceive.exports).toBe(exportExpected)
    })
    test("should emit Imported", async () =>
    {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const model = new Model(width, height)
      editor.recognizer.import = jest.fn(() =>
      {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      editor.event.emitImported = jest.fn()
      await editor.import(blob, mimeType)
      await expect(editor.event.emitImported).toHaveBeenNthCalledWith(1, model.exports)
    })
  })

  describe("importPointsEvent", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.importPointsEvents", async () =>
    {
      await editor.initialize()
      const strokeToImport = buildStroke()
      await editor.importPointEvents([strokeToImport])
      expect(editor.recognizer.importPointEvents).toBeCalledTimes(1)
    })
  })

  describe("resize", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call renderer.resize", async () =>
    {
      await editor.resize({ height: 1, width: 2})
      await expect(editor.renderer.resize).toBeCalledTimes(1)
    })
    test("should call recognizer.resize after resizeTriggerDelay", async () =>
    {
      await editor.resize({ height: 3, width: 4})
      await delay(editor.configuration.triggers.resizeTriggerDelay)
      await expect(editor.recognizer.resize).toBeCalledTimes(1)
    })
    test("should reject if renderer.resize rejected", async () =>
    {
      editor.recognizer.resize = jest.fn(() => Promise.reject("pony"))
      await expect(editor.resize({ height: 5, width: 6})).rejects.toEqual("pony")
    })
  })

  describe("undo", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()

    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    editor.history.stack = [firstModel, secondModel]
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.undo", async () =>
    {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      await editor.undo()
      await expect(editor.recognizer.undo).toBeCalledTimes(1)
    })
    test("should return previous model", async () =>
    {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      await expect(editor.undo()).resolves.toEqual(firstModel)
    })
    test("should reject if recognizer.redo rejected", async () =>
    {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      editor.recognizer.undo = jest.fn(() => Promise.reject("pony"))
      await expect(editor.undo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canUndo = false", async () =>
    {
      editor.history.context.canUndo = false
      await expect(editor.undo()).rejects.toEqual(new Error("Undo not allowed"))
    })
  })

  describe("redo", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    editor.history.stack = [firstModel, secondModel]
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call recognizer.redo", async () =>
    {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      await editor.redo()
      await expect(editor.recognizer.redo).toBeCalledTimes(1)
    })
    test("should return next model", async () =>
    {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      editor.history.stack.push(secondModel)
      await expect(editor.redo()).resolves.toEqual(editor.history.stack[1])
    })
    test("should reject if recognizer.redo rejected", async () =>
    {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      editor.recognizer.redo = jest.fn(() => Promise.reject("pony"))
      await expect(editor.redo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canRedo = false", async () =>
    {
      editor.history.context.canRedo = false
      await expect(editor.redo()).rejects.toEqual(new Error("Redo not allowed"))
    })
  })

  describe("clear", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call model.clear", async () =>
    {
      editor.model.clear = jest.fn()
      await editor.clear()
      await expect(editor.model.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      await editor.clear()
      await expect(editor.recognizer.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      editor.event.emitCleared = jest.fn()
      await editor.clear()
      await expect(editor.event.emitCleared).toBeCalledTimes(1)
    })
  })

  describe("destroy", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.grabber.detach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.destroy = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should call grabber.detach", async () =>
    {
      editor.destroy()
      expect(editor.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      editor.destroy()
      expect(editor.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      editor.destroy()
      expect(editor.recognizer.destroy).toBeCalledTimes(1)
    })

  })

  describe("Event", () =>
  {
    const editor = new InteractiveInkSSREditor(document.createElement("div"), DefaultInteractiveInkSSREditorOptions)
    editor.grabber.attach = jest.fn()
    editor.event.emitExported = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.updatesLayer = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    beforeAll(async () =>
    {
      await editor.initialize()
    })
    test("should emitExported when recognizer emitExported", async () =>
    {
      editor.recognizer.event.emitExported({ "text/plain": "test-exported" })
      expect(editor.event.emitExported).toHaveBeenNthCalledWith(1, { "text/plain": "test-exported" })
    })
    test("should update smarguide when recognizer emitExported", async () =>
    {
      //@ts-ignore
      editor.smartGuide.update = jest.fn()
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
      editor.recognizer.event.emitExported({ "application/vnd.myscript.jiix": jiix })
      expect(editor.smartGuide?.update).toHaveBeenNthCalledWith(1, jiix)
    })
    test("should updatesLayer when recognizer emit SVG_PATCH", async () =>
    {
      const svgPatch: TRecognizerWebSocketSSRMessageSVGPatch = {
        type: "REPLACE_ALL",
        layer: "MODEL",
        updates: []
      }
      editor.recognizer.event.emitSVGPatch(svgPatch)
      expect(editor.renderer.updatesLayer).toBeCalledTimes(1)
      expect(editor.renderer.updatesLayer).toBeCalledWith(svgPatch.layer, svgPatch.updates)
    })
  })

  describe("Style", () =>
  {
    const customConfig: TInteractiveInkSSREditorConfiguration = JSON.parse(JSON.stringify(DefaultInteractiveInkSSREditorOptions))
    const customPenStyle: TPenStyle = { color: "#d1d1d1" }
    customConfig.penStyle = customPenStyle
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
    customConfig.theme = customTheme
    const editor = new InteractiveInkSSREditor(document.createElement("div"), { configuration: customConfig })
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.updatesLayer = jest.fn()
    editor.styleManager.setPenStyle = jest.fn()
    editor.styleManager.setPenStyleClasses = jest.fn()
    editor.styleManager.setTheme = jest.fn()
    editor.recognizer = new RecognizerWebSocketSSRMock()
    test("should have set PenStyle on initialization", async () =>
    {
      await editor.initialize()
      await expect(editor.recognizer.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle)
    })
    test("should change PenStyle", async () =>
    {
      const customPenStyle2: TPenStyle = { color: "red" }
      editor.penStyle = customPenStyle2
      expect(editor.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle2)
      expect(editor.recognizer.setPenStyle).toHaveBeenNthCalledWith(1, editor.styleManager.penStyle)
    })
    test("should have set Theme on initialization", async () =>
    {
      await editor.initialize()
      await expect(editor.recognizer.setTheme).toHaveBeenNthCalledWith(1, editor.styleManager.theme)
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
      editor.theme = customTheme2
      expect(editor.styleManager.setTheme).toHaveBeenNthCalledWith(1, customTheme2)
      expect(editor.recognizer.setTheme).toHaveBeenNthCalledWith(1, editor.styleManager.theme)
    })
    test("should have set PenStyleClasses on initialization", async () =>
    {
      await editor.initialize()
      await expect(editor.recognizer.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
    })
    test("should change PenStyleClasses", async () =>
    {
      editor.penStyleClasses = "pouet"
      expect(editor.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "pouet")
      expect(editor.recognizer.setPenStyleClasses).toHaveBeenNthCalledWith(1, editor.styleManager.penStyleClasses)
    })
  })

})
