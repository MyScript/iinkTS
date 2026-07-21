import { WebSocketSSRClientMock } from "../__mocks__/WebSocketSSRClientMock"
import { buildStroke, delay } from "../helpers"
import {
  InteractiveInkSSRCanvas,
  Model,
  DefaultInteractiveInkSSRCanvasConfiguration,
  DefaultPenStyle,
  TInteractiveInkSSRCanvasConfiguration,
  TExport,
  TWebSocketSSRClientMessageSVGPatch,
  TPointer,
  TPenStyle,
  TTheme,
  WebSocketSSRClient,
  PointerEventGrabber,
  CanvasTool,
  TInteractiveInkSSRCanvasOptions,
} from "@/iink"

describe("InteractiveInkSSRCanvas.ts", () => {
  const height = 100,
    width = 100
  const DefaultInteractiveInkSSRCanvasOptions: TInteractiveInkSSRCanvasOptions = {
    configuration: DefaultInteractiveInkSSRCanvasConfiguration,
  }

  describe("constructor", () => {
    test("should instanciate with default grabber & client", () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      expect(editor).toBeDefined()
      expect(editor.grabber).toBeDefined()
      expect(editor.grabber instanceof PointerEventGrabber).toBe(true)
      expect(editor.client).toBeDefined()
      expect(editor.client instanceof WebSocketSSRClient).toBe(true)
    })

    test("should instanciate with custom grabber", () => {
      class CustomGrabber extends PointerEventGrabber {
        name = "custom-grabber"
      }
      const customOptions: TInteractiveInkSSRCanvasOptions = {
        configuration: DefaultInteractiveInkSSRCanvasConfiguration,
        //@ts-ignore
        override: { grabber: CustomGrabber },
      }
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), customOptions)
      expect(editor).toBeDefined()
      expect(editor.grabber).toBeDefined()
      expect(editor.grabber instanceof CustomGrabber).toBe(true)
    })

    test("should instanciate with custom client", () => {
      class CustomClient extends WebSocketSSRClient {
        name = "custom-client"
      }
      const customOptions: TInteractiveInkSSRCanvasOptions = {
        configuration: DefaultInteractiveInkSSRCanvasConfiguration,
        //@ts-ignore
        override: { client: CustomClient },
      }
      //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), customOptions)
      expect(editor).toBeDefined()
      expect(editor.client).toBeDefined()
      expect(editor.client instanceof WebSocketSSRClient).toBe(true)
    })
  })

  describe("tool", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    test("should set class draw on root element by default", () => {
      expect(editor.layers.root.classList.contains("draw")).toBe(true)
      expect(editor.layers.root.classList.contains("erase")).toBe(false)
    })
    test("should set class erase when set tool eraser", () => {
      editor.tool = CanvasTool.Erase
      expect(editor.layers.root.classList.contains("draw")).toBe(false)
      expect(editor.layers.root.classList.contains("erase")).toBe(true)
    })
  })

  describe("init", () => {
    test("should init grabber, renderer & client & context", async () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.client.init = jest.fn(() => Promise.resolve())
      editor.client.setPenStyle = jest.fn(() => Promise.resolve())
      editor.client.setPenStyleClasses = jest.fn(() => Promise.resolve())
      editor.client.setTheme = jest.fn(() => Promise.resolve())
      editor.initialize()
      await expect(editor.history.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0,
      })
      await expect(editor.grabber.attach).toHaveBeenNthCalledWith(1, editor.layers.rendering)
      await expect(editor.renderer.init).toHaveBeenNthCalledWith(1, editor.layers.rendering)
      await expect(editor.client.init).toHaveBeenCalledTimes(1)
    })

    test("should resolve init when client.init is resolve", async () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      //@ts-ignore
      editor.client.init = jest.fn((height: number, width: number) => {
        editor.client.initialized.resolve()
        return editor.client.initialized.promise
      })
      editor.client.setPenStyle = jest.fn(() => Promise.resolve())
      editor.client.setPenStyleClasses = jest.fn(() => Promise.resolve())
      editor.client.setTheme = jest.fn(() => Promise.resolve())

      await editor.initialize()
      await expect(editor.client.init).toHaveBeenCalledTimes(1)
    })

    test("should reject init when client.init is reject", async () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      //@ts-ignore
      editor.client.init = jest.fn((height: number, width: number) => {
        editor.client.initialized.reject("pouet")
        return editor.client.initialized.promise
      })

      await expect(editor.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("drawCurrentStroke", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    editor.renderer.drawPendingStroke = jest.fn()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should not call renderer.drawPendingStroke if currentSymbol is null", async () => {
      editor.drawCurrentStroke()
      await expect(editor.renderer.drawPendingStroke).toHaveBeenCalledTimes(0)
    })
    test("should call renderer.drawPendingStroke", async () => {
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      editor.drawCurrentStroke()
      await expect(editor.renderer.drawPendingStroke).toHaveBeenCalledTimes(1)
      await expect(editor.renderer.drawPendingStroke).toHaveBeenCalledWith(editor.model.currentSymbol)
    })
  })

  describe("synchronizeModelWithBackend", () => {
    describe("with exportContent = 'POINTER_UP", () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.renderer.clearErasingStrokes = jest.fn()
      editor.client = new WebSocketSSRClientMock()
      beforeAll(async () => {
        await editor.initialize()
      })
      test("should call client.addStrokes", async () => {
        await editor.synchronizeModelWithBackend()
        await expect(editor.client.addStrokes).toHaveBeenCalledTimes(1)
      })
      test("should call renderer.clearErasingStrokes", async () => {
        await editor.synchronizeModelWithBackend()
        await expect(editor.renderer.clearErasingStrokes).toHaveBeenCalledTimes(1)
      })
    })
    describe("with exportContent = 'DEMAND", () => {
      const options: TInteractiveInkSSRCanvasOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSRCanvasOptions))
      options!.configuration!.triggers!.exportContent = "DEMAND"
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), options)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.renderer.clearPendingStroke = jest.fn()
      editor.client = new WebSocketSSRClientMock()
      beforeAll(async () => {
        await editor.initialize()
      })
      test("should not call client.addStrokes when exportContent = DEMAND", async () => {
        await editor.synchronizeModelWithBackend()
        await expect(editor.client.addStrokes).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe("idle", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    editor.event.emitError = jest.fn()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.waitForIdle", async () => {
      await editor.waitForIdle()
      await expect(editor.client.waitForIdle).toHaveBeenCalledTimes(1)
    })
  })

  describe("export", () => {
    describe("with exportContent = 'POINTER_UP", () => {
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.client = new WebSocketSSRClientMock()
      editor.event.emitError = jest.fn()
      beforeAll(async () => {
        await editor.initialize()
      })
      test("should call client.export", async () => {
        editor.client.export = jest.fn((m) => Promise.resolve(m))
        await editor.export()
        await expect(editor.client.export).toHaveBeenCalledTimes(1)
      })
      test("should reject if client.export rejected", async () => {
        editor.client.export = jest.fn(() => Promise.reject("poney"))
        await expect(editor.export()).rejects.toEqual("poney")
        expect(editor.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
    describe("with exportContent = 'POINTER_UP", () => {
      const options: TInteractiveInkSSRCanvasOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSRCanvasOptions))
      options.configuration!.triggers!.exportContent = "DEMAND"
      const editor = new InteractiveInkSSRCanvas(document.createElement("div"), options)
      editor.grabber.attach = jest.fn()
      editor.renderer.init = jest.fn()
      editor.client = new WebSocketSSRClientMock()
      editor.event.emitError = jest.fn()
      beforeAll(async () => {
        await editor.initialize()
      })
      test("should call client.addStrokes when exportContent = DEMAND", async () => {
        await editor.initialize()
        await editor.export()
        await expect(editor.client.addStrokes).toHaveBeenCalledTimes(1)
        await expect(editor.client.export).toHaveBeenCalledTimes(0)
      })
      test("should reject if client.addStrokes rejected when exportContent = DEMAND", async () => {
        editor.client.addStrokes = jest.fn(() => Promise.reject("poney"))
        await editor.initialize()
        await expect(editor.export()).rejects.toEqual("poney")
        expect(editor.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
  })

  describe("convert", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.event.emitConverted = jest.fn()
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.convert", async () => {
      await editor.convert()
      await expect(editor.client.convert).toHaveBeenCalledTimes(1)
    })
    test("should emit Converted client.convert", async () => {
      await editor.convert()
      await expect(editor.event.emitConverted).toHaveBeenCalledTimes(1)
    })
  })

  describe("import", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.import", async () => {
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      await editor.import(blob, mimeType)
      await expect(editor.client.import).toHaveBeenCalledTimes(1)
    })
    test("should return model with new export", async () => {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const model = new Model(width, height)
      editor.client.import = jest.fn(() => {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await editor.import(blob, mimeType)
      await await expect(modelReceive.exports).toBe(exportExpected)
    })
    test("should emit Imported", async () => {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const model = new Model(width, height)
      editor.client.import = jest.fn(() => {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      editor.event.emitImported = jest.fn()
      await editor.import(blob, mimeType)
      await expect(editor.event.emitImported).toHaveBeenNthCalledWith(1, model.exports)
    })
  })

  describe("importPointsEvent", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.importPointsEvents", async () => {
      await editor.initialize()
      const strokeToImport = buildStroke()
      await editor.importPointEvents([strokeToImport])
      expect(editor.client.importPointEvents).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call renderer.resize", async () => {
      await editor.resize({ height: 1, width: 2 })
      await expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
    })
    test("should call client.resize after resizeTriggerDelay", async () => {
      await editor.resize({ height: 3, width: 4 })
      await delay(editor.configuration.triggers.resizeTriggerDelay)
      await expect(editor.client.resize).toHaveBeenCalledTimes(1)
    })
    test("should reject if renderer.resize rejected", async () => {
      editor.client.resize = jest.fn(() => Promise.reject("pony"))
      await expect(editor.resize({ height: 5, width: 6 })).rejects.toEqual("pony")
    })
  })

  describe("undo", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.client = new WebSocketSSRClientMock()

    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    editor.history.stack = [firstModel, secondModel]
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.undo", async () => {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      await editor.undo()
      await expect(editor.client.undo).toHaveBeenCalledTimes(1)
    })
    test("should return previous model", async () => {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      await expect(editor.undo()).resolves.toEqual(firstModel)
    })
    test("should reject if client.redo rejected", async () => {
      editor.history.context.canUndo = true
      editor.history.context.stackIndex = 1
      editor.client.undo = jest.fn(() => Promise.reject("pony"))
      await expect(editor.undo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canUndo = false", async () => {
      editor.history.context.canUndo = false
      await expect(editor.undo()).rejects.toEqual(new Error("Undo not allowed"))
    })
  })

  describe("redo", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    editor.history.stack = [firstModel, secondModel]
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call client.redo", async () => {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      await editor.redo()
      await expect(editor.client.redo).toHaveBeenCalledTimes(1)
    })
    test("should return next model", async () => {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      editor.history.stack.push(secondModel)
      await expect(editor.redo()).resolves.toEqual(editor.history.stack[1])
    })
    test("should reject if client.redo rejected", async () => {
      editor.history.context.canRedo = true
      editor.history.context.stackIndex = 0
      editor.client.redo = jest.fn(() => Promise.reject("pony"))
      await expect(editor.redo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canRedo = false", async () => {
      editor.history.context.canRedo = false
      await expect(editor.redo()).rejects.toEqual(new Error("Redo not allowed"))
    })
  })

  describe("clear", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call model.clear", async () => {
      editor.model.clear = jest.fn()
      await editor.clear()
      await expect(editor.model.clear).toHaveBeenCalledTimes(1)
    })
    test("should call client.clear", async () => {
      await editor.clear()
      await expect(editor.client.clear).toHaveBeenCalledTimes(1)
    })
    test("should call client.clear", async () => {
      editor.event.emitCleared = jest.fn()
      await editor.clear()
      await expect(editor.event.emitCleared).toHaveBeenCalledTimes(1)
    })
  })

  describe("destroy", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.grabber.detach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.destroy = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should call grabber.detach", async () => {
      editor.destroy()
      expect(editor.grabber.detach).toHaveBeenCalledTimes(1)
    })

    test("should call renderer.destroy", async () => {
      editor.destroy()
      expect(editor.renderer.destroy).toHaveBeenCalledTimes(1)
    })

    test("should call client.destroy", async () => {
      editor.destroy()
      expect(editor.client.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe("Event", () => {
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    editor.grabber.attach = jest.fn()
    editor.event.emitExported = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.updatesLayer = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await editor.initialize()
    })
    test("should emitExported when client emitExported", async () => {
      editor.client.event.emitExported({ "text/plain": "test-exported" })
      expect(editor.event.emitExported).toHaveBeenNthCalledWith(1, { "text/plain": "test-exported" })
    })
    test("should update smarguide when client emitExported", async () => {
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
      editor.client.event.emitExported({ "application/vnd.myscript.jiix": jiix })
      expect(editor.smartGuide?.update).toHaveBeenNthCalledWith(1, jiix)
    })
    test("should updatesLayer when client emit SVG_PATCH", async () => {
      const svgPatch: TWebSocketSSRClientMessageSVGPatch = {
        type: "REPLACE_ALL",
        layer: "MODEL",
        updates: [],
      }
      editor.client.event.emitSVGPatch(svgPatch)
      expect(editor.renderer.updatesLayer).toHaveBeenCalledTimes(1)
      expect(editor.renderer.updatesLayer).toHaveBeenCalledWith(svgPatch.layer, svgPatch.updates)
    })
  })

  describe("Style", () => {
    const customConfig: TInteractiveInkSSRCanvasConfiguration = JSON.parse(
      JSON.stringify(DefaultInteractiveInkSSRCanvasOptions)
    )
    const customPenStyle: TPenStyle = { color: "#d1d1d1" }
    customConfig.penStyle = customPenStyle
    const customTheme: TTheme = {
      ink: {
        width: 42,
        color: "#2E7D32",
        "-myscript-pen-width": 2,
        "-myscript-pen-fill-style": "purple",
        "-myscript-pen-fill-color": "#FFFFFF00",
      },
      ".math": {
        "font-family": "STIXGeneral",
      },
      ".math-solved": {
        "font-family": "STIXGeneral",
        color: "blue",
      },
      ".text": {
        "font-family": "Rubik Distressed",
        "font-size": 10,
      },
    }
    customConfig.theme = customTheme
    const editor = new InteractiveInkSSRCanvas(document.createElement("div"), { configuration: customConfig })
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    editor.renderer.updatesLayer = jest.fn()
    editor.styleManager.setPenStyle = jest.fn()
    editor.styleManager.setPenStyleClasses = jest.fn()
    editor.styleManager.setTheme = jest.fn()
    editor.client = new WebSocketSSRClientMock()
    test("should have set PenStyle on initialization", async () => {
      await editor.initialize()
      await expect(editor.client.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle)
    })
    test("should change PenStyle", async () => {
      const customPenStyle2: TPenStyle = { color: "red" }
      editor.penStyle = customPenStyle2
      expect(editor.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle2)
      expect(editor.client.setPenStyle).toHaveBeenNthCalledWith(1, editor.styleManager.penStyle)
    })
    test("should have set Theme on initialization", async () => {
      await editor.initialize()
      await expect(editor.client.setTheme).toHaveBeenNthCalledWith(1, editor.styleManager.theme)
    })
    test("should change Theme", async () => {
      const customTheme2: TTheme = {
        ink: {
          width: 42,
          color: "#2E7D32",
          "-myscript-pen-width": 2,
          "-myscript-pen-fill-style": "purple",
          "-myscript-pen-fill-color": "#FFFFFF00",
        },
        ".math": {
          "font-family": "STIXGeneral",
        },
        ".math-solved": {
          "font-family": "STIXGeneral",
          color: "blue",
        },
        ".text": {
          "font-family": "Rubik Distressed",
          "font-size": 10,
        },
      }
      editor.theme = customTheme2
      expect(editor.styleManager.setTheme).toHaveBeenNthCalledWith(1, customTheme2)
      expect(editor.client.setTheme).toHaveBeenNthCalledWith(1, editor.styleManager.theme)
    })
    test("should have set PenStyleClasses on initialization", async () => {
      await editor.initialize()
      await expect(editor.client.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
    })
    test("should change PenStyleClasses", async () => {
      editor.penStyleClasses = "pouet"
      expect(editor.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "pouet")
      expect(editor.client.setPenStyleClasses).toHaveBeenNthCalledWith(1, editor.styleManager.penStyleClasses)
    })
  })
})
