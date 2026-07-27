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
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      expect(canvas).toBeDefined()
      expect(canvas.grabber).toBeDefined()
      expect(canvas.grabber instanceof PointerEventGrabber).toBe(true)
      expect(canvas.client).toBeDefined()
      expect(canvas.client instanceof WebSocketSSRClient).toBe(true)
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
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), customOptions)
      expect(canvas).toBeDefined()
      expect(canvas.grabber).toBeDefined()
      expect(canvas.grabber instanceof CustomGrabber).toBe(true)
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
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), customOptions)
      expect(canvas).toBeDefined()
      expect(canvas.client).toBeDefined()
      expect(canvas.client instanceof WebSocketSSRClient).toBe(true)
    })
  })

  describe("tool", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    test("should set class draw on root element by default", () => {
      expect(canvas.layers.root.classList.contains("draw")).toBe(true)
      expect(canvas.layers.root.classList.contains("erase")).toBe(false)
    })
    test("should set class erase when set tool eraser", () => {
      canvas.tool = CanvasTool.Erase
      expect(canvas.layers.root.classList.contains("draw")).toBe(false)
      expect(canvas.layers.root.classList.contains("erase")).toBe(true)
    })
  })

  describe("init", () => {
    test("should init grabber, renderer & client & context", async () => {
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      canvas.client.init = jest.fn(() => Promise.resolve())
      canvas.client.setPenStyle = jest.fn(() => Promise.resolve())
      canvas.client.setPenStyleClasses = jest.fn(() => Promise.resolve())
      canvas.client.setTheme = jest.fn(() => Promise.resolve())
      canvas.initialize()
      await expect(canvas.history.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0,
      })
      await expect(canvas.grabber.attach).toHaveBeenNthCalledWith(1, canvas.layers.rendering)
      await expect(canvas.renderer.init).toHaveBeenNthCalledWith(1, canvas.layers.rendering)
      await expect(canvas.client.init).toHaveBeenCalledTimes(1)
    })

    test("should resolve init when client.init is resolve", async () => {
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      //@ts-ignore
      canvas.client.init = jest.fn((height: number, width: number) => {
        canvas.client.initialized.resolve()
        return canvas.client.initialized.promise
      })
      canvas.client.setPenStyle = jest.fn(() => Promise.resolve())
      canvas.client.setPenStyleClasses = jest.fn(() => Promise.resolve())
      canvas.client.setTheme = jest.fn(() => Promise.resolve())

      await canvas.initialize()
      await expect(canvas.client.init).toHaveBeenCalledTimes(1)
    })

    test("should reject init when client.init is reject", async () => {
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      //@ts-ignore
      canvas.client.init = jest.fn((height: number, width: number) => {
        canvas.client.initialized.reject("pouet")
        return canvas.client.initialized.promise
      })

      await expect(canvas.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("drawCurrentStroke", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    canvas.renderer.drawPendingStroke = jest.fn()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should not call renderer.drawPendingStroke if currentSymbol is null", async () => {
      canvas.drawCurrentStroke()
      await expect(canvas.renderer.drawPendingStroke).toHaveBeenCalledTimes(0)
    })
    test("should call renderer.drawPendingStroke", async () => {
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      canvas.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      canvas.drawCurrentStroke()
      await expect(canvas.renderer.drawPendingStroke).toHaveBeenCalledTimes(1)
      await expect(canvas.renderer.drawPendingStroke).toHaveBeenCalledWith(canvas.model.currentSymbol)
    })
  })

  describe("synchronizeModelWithBackend", () => {
    describe("with exportContent = 'POINTER_UP", () => {
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      canvas.renderer.clearErasingStrokes = jest.fn()
      canvas.client = new WebSocketSSRClientMock()
      beforeAll(async () => {
        await canvas.initialize()
      })
      test("should call client.addStrokes", async () => {
        await canvas.synchronizeModelWithBackend()
        await expect(canvas.client.addStrokes).toHaveBeenCalledTimes(1)
      })
      test("should call renderer.clearErasingStrokes", async () => {
        await canvas.synchronizeModelWithBackend()
        await expect(canvas.renderer.clearErasingStrokes).toHaveBeenCalledTimes(1)
      })
    })
    describe("with exportContent = 'DEMAND", () => {
      const options: TInteractiveInkSSRCanvasOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSRCanvasOptions))
      options!.configuration!.triggers!.exportContent = "DEMAND"
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), options)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      canvas.renderer.clearPendingStroke = jest.fn()
      canvas.client = new WebSocketSSRClientMock()
      beforeAll(async () => {
        await canvas.initialize()
      })
      test("should not call client.addStrokes when exportContent = DEMAND", async () => {
        await canvas.synchronizeModelWithBackend()
        await expect(canvas.client.addStrokes).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe("idle", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    canvas.event.emitError = jest.fn()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.waitForIdle", async () => {
      await canvas.waitForIdle()
      await expect(canvas.client.waitForIdle).toHaveBeenCalledTimes(1)
    })
  })

  describe("export", () => {
    describe("with exportContent = 'POINTER_UP", () => {
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      canvas.client = new WebSocketSSRClientMock()
      canvas.event.emitError = jest.fn()
      beforeAll(async () => {
        await canvas.initialize()
      })
      test("should call client.export", async () => {
        canvas.client.export = jest.fn((m) => Promise.resolve(m))
        await canvas.export()
        await expect(canvas.client.export).toHaveBeenCalledTimes(1)
      })
      test("should reject if client.export rejected", async () => {
        canvas.client.export = jest.fn(() => Promise.reject("poney"))
        await expect(canvas.export()).rejects.toEqual("poney")
        expect(canvas.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
    describe("with exportContent = 'POINTER_UP", () => {
      const options: TInteractiveInkSSRCanvasOptions = JSON.parse(JSON.stringify(DefaultInteractiveInkSSRCanvasOptions))
      options.configuration!.triggers!.exportContent = "DEMAND"
      const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), options)
      canvas.grabber.attach = jest.fn()
      canvas.renderer.init = jest.fn()
      canvas.client = new WebSocketSSRClientMock()
      canvas.event.emitError = jest.fn()
      beforeAll(async () => {
        await canvas.initialize()
      })
      test("should call client.addStrokes when exportContent = DEMAND", async () => {
        await canvas.initialize()
        await canvas.export()
        await expect(canvas.client.addStrokes).toHaveBeenCalledTimes(1)
        await expect(canvas.client.export).toHaveBeenCalledTimes(0)
      })
      test("should reject if client.addStrokes rejected when exportContent = DEMAND", async () => {
        canvas.client.addStrokes = jest.fn(() => Promise.reject("poney"))
        await canvas.initialize()
        await expect(canvas.export()).rejects.toEqual("poney")
        expect(canvas.event.emitError).toHaveBeenNthCalledWith(1, "poney")
      })
    })
  })

  describe("convert", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.event.emitConverted = jest.fn()
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.convert", async () => {
      await canvas.convert()
      await expect(canvas.client.convert).toHaveBeenCalledTimes(1)
    })
    test("should emit Converted client.convert", async () => {
      await canvas.convert()
      await expect(canvas.event.emitConverted).toHaveBeenCalledTimes(1)
    })
  })

  describe("import", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.import", async () => {
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      await canvas.import(blob, mimeType)
      await expect(canvas.client.import).toHaveBeenCalledTimes(1)
    })
    test("should return model with new export", async () => {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const model = new Model(width, height)
      canvas.client.import = jest.fn(() => {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await canvas.import(blob, mimeType)
      await await expect(modelReceive.exports).toBe(exportExpected)
    })
    test("should emit Imported", async () => {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const model = new Model(width, height)
      canvas.client.import = jest.fn(() => {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      canvas.event.emitImported = jest.fn()
      await canvas.import(blob, mimeType)
      await expect(canvas.event.emitImported).toHaveBeenNthCalledWith(1, model.exports)
    })
  })

  describe("importPointsEvent", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.importPointsEvents", async () => {
      await canvas.initialize()
      const strokeToImport = buildStroke()
      await canvas.importPointEvents([strokeToImport])
      expect(canvas.client.importPointEvents).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.resize = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call renderer.resize", async () => {
      await canvas.resize({ height: 1, width: 2 })
      await expect(canvas.renderer.resize).toHaveBeenCalledTimes(1)
    })
    test("should call client.resize after resizeTriggerDelay", async () => {
      await canvas.resize({ height: 3, width: 4 })
      await delay(canvas.configuration.triggers.resizeTriggerDelay)
      await expect(canvas.client.resize).toHaveBeenCalledTimes(1)
    })
    test("should reject if renderer.resize rejected", async () => {
      canvas.client.resize = jest.fn(() => Promise.reject("pony"))
      await expect(canvas.resize({ height: 5, width: 6 })).rejects.toEqual("pony")
    })
  })

  describe("undo", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.resize = jest.fn()
    canvas.client = new WebSocketSSRClientMock()

    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    canvas.history.stack = [firstModel, secondModel]
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.undo", async () => {
      canvas.history.context.canUndo = true
      canvas.history.context.stackIndex = 1
      await canvas.undo()
      await expect(canvas.client.undo).toHaveBeenCalledTimes(1)
    })
    test("should return previous model", async () => {
      canvas.history.context.canUndo = true
      canvas.history.context.stackIndex = 1
      await expect(canvas.undo()).resolves.toEqual(firstModel)
    })
    test("should reject if client.redo rejected", async () => {
      canvas.history.context.canUndo = true
      canvas.history.context.stackIndex = 1
      canvas.client.undo = jest.fn(() => Promise.reject("pony"))
      await expect(canvas.undo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canUndo = false", async () => {
      canvas.history.context.canUndo = false
      await expect(canvas.undo()).rejects.toEqual(new Error("Undo not allowed"))
    })
  })

  describe("redo", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.resize = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    const firstModel = new Model(200, 200)
    const secondModel = new Model(42, 12)
    canvas.history.stack = [firstModel, secondModel]
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call client.redo", async () => {
      canvas.history.context.canRedo = true
      canvas.history.context.stackIndex = 0
      await canvas.redo()
      await expect(canvas.client.redo).toHaveBeenCalledTimes(1)
    })
    test("should return next model", async () => {
      canvas.history.context.canRedo = true
      canvas.history.context.stackIndex = 0
      canvas.history.stack.push(secondModel)
      await expect(canvas.redo()).resolves.toEqual(canvas.history.stack[1])
    })
    test("should reject if client.redo rejected", async () => {
      canvas.history.context.canRedo = true
      canvas.history.context.stackIndex = 0
      canvas.client.redo = jest.fn(() => Promise.reject("pony"))
      await expect(canvas.redo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canRedo = false", async () => {
      canvas.history.context.canRedo = false
      await expect(canvas.redo()).rejects.toEqual(new Error("Redo not allowed"))
    })
  })

  describe("clear", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.resize = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call model.clear", async () => {
      canvas.model.clear = jest.fn()
      await canvas.clear()
      await expect(canvas.model.clear).toHaveBeenCalledTimes(1)
    })
    test("should call client.clear", async () => {
      await canvas.clear()
      await expect(canvas.client.clear).toHaveBeenCalledTimes(1)
    })
    test("should call client.clear", async () => {
      canvas.event.emitCleared = jest.fn()
      await canvas.clear()
      await expect(canvas.event.emitCleared).toHaveBeenCalledTimes(1)
    })
  })

  describe("destroy", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.grabber.detach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.destroy = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should call grabber.detach", async () => {
      canvas.destroy()
      expect(canvas.grabber.detach).toHaveBeenCalledTimes(1)
    })

    test("should call renderer.destroy", async () => {
      canvas.destroy()
      expect(canvas.renderer.destroy).toHaveBeenCalledTimes(1)
    })

    test("should call client.destroy", async () => {
      canvas.destroy()
      expect(canvas.client.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe("Event", () => {
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), DefaultInteractiveInkSSRCanvasOptions)
    canvas.grabber.attach = jest.fn()
    canvas.event.emitExported = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.updatesLayer = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    beforeAll(async () => {
      await canvas.initialize()
    })
    test("should emitExported when client emitExported", async () => {
      canvas.client.event.emitExported({ "text/plain": "test-exported" })
      expect(canvas.event.emitExported).toHaveBeenNthCalledWith(1, { "text/plain": "test-exported" })
    })
    test("should update smarguide when client emitExported", async () => {
      //@ts-ignore
      canvas.smartGuide.update = jest.fn()
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
      canvas.client.event.emitExported({ "application/vnd.myscript.jiix": jiix })
      expect(canvas.smartGuide?.update).toHaveBeenNthCalledWith(1, jiix)
    })
    test("should updatesLayer when client emit SVG_PATCH", async () => {
      const svgPatch: TWebSocketSSRClientMessageSVGPatch = {
        type: "REPLACE_ALL",
        layer: "MODEL",
        updates: [],
      }
      canvas.client.event.emitSVGPatch(svgPatch)
      expect(canvas.renderer.updatesLayer).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.updatesLayer).toHaveBeenCalledWith(svgPatch.layer, svgPatch.updates)
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
    const canvas = new InteractiveInkSSRCanvas(document.createElement("div"), { configuration: customConfig })
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.renderer.updatesLayer = jest.fn()
    canvas.styleManager.setPenStyle = jest.fn()
    canvas.styleManager.setPenStyleClasses = jest.fn()
    canvas.styleManager.setTheme = jest.fn()
    canvas.client = new WebSocketSSRClientMock()
    test("should have set PenStyle on initialization", async () => {
      await canvas.initialize()
      await expect(canvas.client.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle)
    })
    test("should change PenStyle", async () => {
      const customPenStyle2: TPenStyle = { color: "red" }
      canvas.penStyle = customPenStyle2
      expect(canvas.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, customPenStyle2)
      expect(canvas.client.setPenStyle).toHaveBeenNthCalledWith(1, canvas.styleManager.penStyle)
    })
    test("should have set Theme on initialization", async () => {
      await canvas.initialize()
      await expect(canvas.client.setTheme).toHaveBeenNthCalledWith(1, canvas.styleManager.theme)
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
      canvas.theme = customTheme2
      expect(canvas.styleManager.setTheme).toHaveBeenNthCalledWith(1, customTheme2)
      expect(canvas.client.setTheme).toHaveBeenNthCalledWith(1, canvas.styleManager.theme)
    })
    test("should have set PenStyleClasses on initialization", async () => {
      await canvas.initialize()
      await expect(canvas.client.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
    })
    test("should change PenStyleClasses", async () => {
      canvas.penStyleClasses = "pouet"
      expect(canvas.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "pouet")
      expect(canvas.client.setPenStyleClasses).toHaveBeenNthCalledWith(1, canvas.styleManager.penStyleClasses)
    })
  })
})
