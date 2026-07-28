import { jiixMathDuplicateStrokes, jiixText } from "../__dataset__/exports.dataset"
import { buildIICircle, buildIIStroke, buildIIText, buildIIMath, buildIIDecorator, delay } from "../helpers"
import {
  InteractiveInkCanvas,
  DefaultInteractiveInkCanvasConfiguration,
  CanvasTool,
  TInteractiveInkCanvasOptions,
  TStyle,
  TPartialDeep,
  TStroke,
  SymbolType,
  TShapeCircle,
  ShapeKind,
  TSymbol,
  DecoratorKind,
  TSymbolChar,
  TText,
  getInitialHistoryContext,
} from "@/iink"

describe("CanvasOffscreen.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock
  const CanvasOptions: TInteractiveInkCanvasOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
  }
  CanvasOptions.configuration!.server!.version = "3.0.0"

  test("should instanciate", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    expect(canvas).toBeDefined()
  })

  describe("Style", () => {
    const customCanvasOptions: TInteractiveInkCanvasOptions = JSON.parse(JSON.stringify(CanvasOptions))
    const initCustomStyle: TStyle = { color: "#d1d1d1", width: 42 }
    customCanvasOptions.configuration!.penStyle = initCustomStyle
    const canvas = new InteractiveInkCanvas(document.createElement("div"), customCanvasOptions)

    test("should define style", async () => {
      expect(canvas.penStyle).toEqual(expect.objectContaining(initCustomStyle))
    })
    test("should change Style", async () => {
      const customStyle: TStyle = { color: "red", width: 51, fill: "black", opacity: 0.5 }
      canvas.penStyle = customStyle
      expect(canvas.penStyle).toEqual(expect.objectContaining(customStyle))
    })
  })

  describe("Tool", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.menu.render = jest.fn()
    canvas.renderer.init = jest.fn()

    canvas.writer.attach = jest.fn()
    canvas.selector.attach = jest.fn()
    canvas.move.attach = jest.fn()
    canvas.eraser.attach = jest.fn()
    canvas.writer.detach = jest.fn()
    canvas.selector.detach = jest.fn()
    canvas.move.detach = jest.fn()
    canvas.eraser.detach = jest.fn()

    test("should set tool to write on init", async () => {
      canvas.initialize()
      expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)

      expect(canvas.writer.attach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.attach).toHaveBeenCalledTimes(0)
      expect(canvas.move.attach).toHaveBeenCalledTimes(0)
      expect(canvas.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to erase", async () => {
      canvas.tool = CanvasTool.Erase
      expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)

      expect(canvas.writer.attach).toHaveBeenCalledTimes(0)
      expect(canvas.selector.attach).toHaveBeenCalledTimes(0)
      expect(canvas.move.attach).toHaveBeenCalledTimes(0)
      expect(canvas.eraser.attach).toHaveBeenCalledTimes(1)
    })
    test("should set tool to move", async () => {
      canvas.tool = CanvasTool.Move
      expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)

      expect(canvas.writer.attach).toHaveBeenCalledTimes(0)
      expect(canvas.selector.attach).toHaveBeenCalledTimes(0)
      expect(canvas.move.attach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to select", async () => {
      canvas.tool = CanvasTool.Select
      expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)

      expect(canvas.writer.attach).toHaveBeenCalledTimes(0)
      expect(canvas.selector.attach).toHaveBeenCalledTimes(1)
      expect(canvas.move.attach).toHaveBeenCalledTimes(0)
      expect(canvas.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to write", async () => {
      canvas.tool = CanvasTool.Write
      expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)

      expect(canvas.writer.attach).toHaveBeenCalledTimes(1)
      expect(canvas.selector.attach).toHaveBeenCalledTimes(0)
      expect(canvas.move.attach).toHaveBeenCalledTimes(0)
      expect(canvas.eraser.attach).toHaveBeenCalledTimes(0)
    })
  })

  describe("connectionState", () => {
    let canvas: InteractiveInkCanvas

    beforeEach(() => {
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    })

    function stubOfflineQueueLength(length: number): void {
      Object.defineProperty(canvas.client, "offlineQueueLength", { get: () => length, configurable: true })
    }

    test("should start as initializing before the first successful connection", () => {
      expect(canvas.connectionState).toEqual("initializing")
    })

    test("should become online-idle once connected for the first time", () => {
      canvas.client.event.emitEndInitialization()
      expect(canvas.connectionState).toEqual("online-idle")
    })

    test("should become online-working while an operation is active", () => {
      // client.idle only fires in response to an explicit waitForIdle() call, not
      // automatically after addStrokes()/etc — "Recognizing" is tracked at the call site instead.
      canvas.client.event.emitEndInitialization()
      canvas.startOperation("Recognizing")
      expect(canvas.connectionState).toEqual("online-working")
    })

    test("should return to online-idle once the active operation ends", () => {
      canvas.client.event.emitEndInitialization()
      canvas.startOperation("Recognizing")
      canvas.endOperation("Recognizing")
      expect(canvas.connectionState).toEqual("online-idle")
    })

    test("hasOperation() reflects whether a label is currently active", () => {
      expect(canvas.hasOperation("Recognizing")).toBe(false)
      canvas.startOperation("Recognizing")
      expect(canvas.hasOperation("Recognizing")).toBe(true)
      canvas.endOperation("Recognizing")
      expect(canvas.hasOperation("Recognizing")).toBe(false)
    })

    test("should become offline when disconnected with nothing queued", () => {
      canvas.client.event.emitEndInitialization()
      stubOfflineQueueLength(0)
      canvas.client.event.emitConnectionStatusChanged("offline")
      expect(canvas.connectionState).toEqual("offline")
    })

    test("should become syncing when disconnected with strokes queued", () => {
      canvas.client.event.emitEndInitialization()
      stubOfflineQueueLength(2)
      canvas.client.event.emitConnectionStatusChanged("offline")
      expect(canvas.connectionState).toEqual("syncing")
    })

    test("should become error once reconnection attempts are exhausted", () => {
      canvas.client.event.emitEndInitialization()
      canvas.client.event.emitConnectionStatusChanged("error")
      expect(canvas.connectionState).toEqual("error")
    })

    test("should emit connectionStateChanged only when the derived state actually changes", () => {
      const spyEmit: jest.SpyInstance = jest.spyOn(canvas.event, "emitConnectionStateChanged")
      canvas.client.event.emitEndInitialization()
      expect(spyEmit).toHaveBeenCalledWith("online-idle")
      spyEmit.mockClear()
      // idle already true — emitting idle(true) again should not change the derived state
      canvas.client.event.emitIdle(true)
      expect(spyEmit).not.toHaveBeenCalled()
    })

    test("should always refresh the layer badge, even when the discrete state stays the same", () => {
      const spyLayer: jest.SpyInstance = jest.spyOn(canvas.layers, "updateCanvasState")
      canvas.client.event.emitEndInitialization()
      expect(spyLayer).toHaveBeenCalledWith("online-idle", { queuedCount: 0, activeOperations: [] })
      spyLayer.mockClear()
      // starting a second overlapping operation stays "online-working" but the label list changes
      canvas.startOperation("Recognizing")
      canvas.startOperation("Converting")
      expect(spyLayer).toHaveBeenLastCalledWith("online-working", {
        queuedCount: 0,
        activeOperations: ["Recognizing", "Converting"],
      })
    })

    test("should still forward the passthrough connectionStatusChanged event unchanged", () => {
      const spyStatus: jest.SpyInstance = jest.spyOn(canvas.event, "emitConnectionStatusChanged")
      canvas.client.event.emitConnectionStatusChanged("offline")
      expect(spyStatus).toHaveBeenCalledWith("offline")
    })
  })

  describe("gesture start cancels the pending debounced synchronize", () => {
    let canvas: InteractiveInkCanvas

    beforeEach(() => {
      jest.useFakeTimers()
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test("startOperation('Writing') clears the debounce so the scheduled synchronize() never fires", () => {
      const synchronizeSpy = jest.spyOn(canvas.synchronizer, "synchronize").mockResolvedValue(undefined)

      canvas.client.event.emitContentChanged(getInitialHistoryContext())
      // A new stroke starts before the 500ms debounce elapses.
      canvas.startOperation("Writing")

      jest.advanceTimersByTime(500)
      expect(synchronizeSpy).not.toHaveBeenCalled()
    })

    test("a non-gesture operation label does not clear the pending debounce", () => {
      const synchronizeSpy = jest.spyOn(canvas.synchronizer, "synchronize").mockResolvedValue(undefined)

      canvas.client.event.emitContentChanged(getInitialHistoryContext())
      canvas.startOperation("Converting")

      jest.advanceTimersByTime(500)
      expect(synchronizeSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe("init", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.menu.render = jest.fn()
    canvas.renderer.init = jest.fn()
    canvas.client.init = jest.fn(() => Promise.resolve())

    test("should init grabber, renderer & client & context", async () => {
      canvas.initialize()
      expect(canvas.history.context.canRedo).toEqual(false)
      expect(canvas.history.context.canUndo).toEqual(false)
      expect(canvas.history.context.empty).toEqual(true)
      expect(canvas.history.context.stackIndex).toEqual(0)
      expect(canvas.history.stack.length).toEqual(1)
      await expect(canvas.renderer.init).toHaveBeenCalledTimes(1)
      await expect(canvas.client.init).toHaveBeenCalledTimes(1)
    })
    test("should resolve init when client.init is resolve", async () => {
      await canvas.initialize()
      await expect(canvas.client.init).toHaveBeenCalledTimes(1)
    })
    test("should reject init when client.init is reject", async () => {
      canvas.client.init = jest.fn(() => Promise.reject("pouet"))
      await expect(canvas.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("CRUD", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.menu.update = jest.fn()
    canvas.overlays.apply = jest.fn()
    canvas.client.waitForIdle = jest.fn()

    canvas.client.init = jest.fn()
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve(undefined))
    canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
    canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())

    canvas.renderer.drawSymbol = jest.fn()
    canvas.renderer.changeOrderSymbol = jest.fn()
    canvas.renderer.replaceSymbol = jest.fn()
    canvas.renderer.removeSymbol = jest.fn()

    canvas.model.addSymbol = jest.fn()
    canvas.model.changeOrderSymbol = jest.fn()
    canvas.model.replaceSymbol = jest.fn()
    canvas.model.removeSymbol = jest.fn()

    test("add stroke", async () => {
      const stroke = buildIIStroke()
      await canvas.addSymbol(stroke)
      expect(canvas.model.addSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(canvas.client.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("add shape", async () => {
      const shape = buildIICircle()
      await canvas.addSymbol(shape)
      expect(canvas.model.addSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(canvas.client.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("create stroke", async () => {
      const stroke: TPartialDeep<TStroke> = {
        type: SymbolType.Stroke,
        pointers: [{ x: 0, y: 1, t: 1, p: 1 }],
      }
      await canvas.createSymbol(stroke)
      expect(canvas.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(canvas.client.addStrokes).toHaveBeenNthCalledWith(1, [expect.objectContaining(stroke)], false)
    })
    test("create shape", async () => {
      const shape: TPartialDeep<TShapeCircle> = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 5, y: 5 },
        radius: 5,
      }
      await canvas.createSymbol(shape)
      expect(canvas.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(canvas.client.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("replace stroke by stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      await canvas.replaceSymbols([stroke1], [stroke2])
      expect(canvas.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(canvas.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(canvas.client.replaceStrokes).toHaveBeenNthCalledWith(1, [stroke1.id], [stroke2])
    })
    test("replace stroke by shape", async () => {
      const stroke = buildIIStroke()
      const shape = buildIICircle()
      await canvas.replaceSymbols([stroke], [shape])
      expect(canvas.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(canvas.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(canvas.client.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("replace shape by stroke", async () => {
      const stroke = buildIIStroke()
      const shape = buildIICircle()
      await canvas.replaceSymbols([shape], [stroke])
      expect(canvas.model.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(canvas.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(canvas.client.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("change order symbol", async () => {
      const stroke = buildIIStroke()
      await canvas.changeOrderSymbol(stroke, "last")
      expect(canvas.model.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke.id, "last")
      expect(canvas.renderer.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke, "last")
    })
    test("remove stroke", async () => {
      const stroke = buildIIStroke()
      canvas.model.symbols.push(stroke)
      await canvas.removeSymbol(stroke.id)
      expect(canvas.model.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(canvas.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(canvas.client.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("remove shape", async () => {
      const shape = buildIICircle()
      canvas.model.symbols.push(shape)
      await canvas.removeSymbol(shape.id)
      expect(canvas.model.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(canvas.renderer.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
    })
  })

  describe("updateSymbolsStyle", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.client.init = jest.fn()
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.renderer.drawSymbol = jest.fn()
    const stroke1 = buildIIStroke()
    canvas.model.addSymbol(stroke1)
    const stroke2 = buildIIStroke()
    canvas.model.addSymbol(stroke2)
    test("should update symbol color and draw", async () => {
      await canvas.initialize()
      expect(canvas.model.symbols[0].style.color).toEqual("#000000")
      canvas.updateSymbolsStyle([stroke1.id], { color: "red" })
      expect(canvas.model.symbols[0].style.color).toEqual("red")
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should update symbol width and draw", async () => {
      await canvas.initialize()
      expect(canvas.model.symbols[1].style.width).toEqual(2)
      canvas.updateSymbolsStyle([stroke2.id], { width: 42 })
      expect(canvas.model.symbols[1].style.width).toEqual(42)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke2)
    })
  })

  describe("importPointsEvent", () => {
    const pStrokes: TPartialDeep<TStroke>[] = [
      {
        pointers: [
          { x: 254, y: 37, t: 1, p: 1 },
          { x: 253, y: 42, t: 2, p: 0.7 },
        ],
      },
      {
        pointers: [
          { x: 222, y: 386, t: 3, p: 0.5 },
          { x: 226, y: 385, t: 4, p: 0.8 },
        ],
        style: { width: 3, color: "#1A8CFF" },
      },
    ]

    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.event.emitIdle = jest.fn()
    canvas.layers.updateCanvasState = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()
    canvas.client.addStrokes = jest.fn()
    canvas.updateLayerUI = jest.fn()
    canvas.event.emitImported = jest.fn()

    test("should update layer state", async () => {
      await canvas.importPointEvents(pStrokes)
      expect(canvas.event.emitIdle).toHaveBeenNthCalledWith(1, false)
      expect(canvas.layers.updateCanvasState).toHaveBeenCalled()
    })
    test("should call client.addStrokes", async () => {
      await canvas.importPointEvents(pStrokes)
      expect(canvas.client.addStrokes).toHaveBeenCalledTimes(1)
    })
    test("should add symbols to model and draw", async () => {
      canvas.model.symbols = []
      await canvas.importPointEvents(pStrokes)
      expect(canvas.model.symbols).toHaveLength(pStrokes.length)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(2)
    })
    test("should update layer UI", async () => {
      await canvas.importPointEvents(pStrokes)
      expect(canvas.updateLayerUI).toHaveBeenCalledTimes(1)
    })
    test("should emit Imported", async () => {
      await canvas.importPointEvents(pStrokes)
      expect(canvas.event.emitImported).toHaveBeenCalledTimes(1)
    })
  })

  describe("Download", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    const stroke1 = buildIIStroke()
    canvas.model.addSymbol(stroke1)
    canvas.model.selectedIds.add(stroke1.id)
    const stroke2 = buildIIStroke()
    canvas.model.addSymbol(stroke2)

    canvas.renderer.getElementById = jest.fn((id) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.id = id
      return p
    })

    test("should call trigger download svg file", async () => {
      global.URL.createObjectURL = jest.fn(() => "download-svg-url")
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsSVG()
      expect(link.href).toContain("download-svg-url")
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".svg")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    // //fix canvas.getContext
    test.skip("should call trigger download png file", async () => {
      global.URL.createObjectURL = jest.fn(() => "download-png-url")
      //@ts-ignore
      global.Image = class {
        onload: () => void
        //@ts-ignore
        constructor() {
          this.onload = jest.fn()
          setTimeout(() => {
            this.onload()
          }, 50)
        }
      } as unknown as HTMLImageElement
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsPNG()
      await delay(101)
      expect(link.href).toContain("download-png-url")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file", async () => {
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsJson()
      expect(link.href).toContain("data:text/json;charset=utf-8,")
      expect(link.href).toContain(stroke1.id)
      expect(link.href).toContain(stroke2.id)
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".json")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file with only selected files", async () => {
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsJson(true)
      expect(link.href).toContain("data:text/json;charset=utf-8,")
      expect(link.href).toContain(stroke1.id)
      expect(link.href).not.toContain(stroke2.id)
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".json")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download text file", async () => {
      const oiMath = buildIIMath("a=b+c")
      canvas.model.addSymbol(oiMath)

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsText()

      expect(link.href).toContain("data:text/plain;charset=utf-8,")
      expect(link.href).toContain("a%3Db%2Bc")
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".txt")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should not duplicate label of a math item written with several strokes", async () => {
      // "x" and "=" are each drawn with 2 strokes; JIIX maps every stroke of
      // an item to that item's single label, so a naive per-stroke join
      // used to produce "xx==2" instead of "x=2"
      const addStrokeWithId = (id: string): void => {
        const s = buildIIStroke()
        s.id = id
        canvas.model.addSymbol(s)
      }
      addStrokeWithId("eq-1")
      addStrokeWithId("eq-2")
      addStrokeWithId("x-1")
      addStrokeWithId("x-2")
      addStrokeWithId("n-1")
      canvas.model.exports = { "application/vnd.myscript.jiix": jiixMathDuplicateStrokes }

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsText()

      expect(link.href).toContain(encodeURIComponent("x=2"))
      expect(link.href).not.toContain(encodeURIComponent("xx==2"))
    })
    test("should order extracted text by reading position, not draw order", async () => {
      const charFor = (label: string): TSymbolChar => ({
        bounds: { height: 0, width: 0, x: 0, y: 0 },
        color: "black",
        fontSize: 12,
        fontWeight: "normal",
        id: `char-${label}`,
        label,
      })
      // "middle" is drawn first but sits below "above" on the page
      const middleWord = buildIIText({
        chars: [charFor("middle")],
        boundingBox: { x: 0, y: 50, width: 40, height: 20 },
      })
      const aboveWord = buildIIText({
        chars: [charFor("above")],
        boundingBox: { x: 0, y: 0, width: 40, height: 20 },
      })
      canvas.model.addSymbol(middleWord)
      canvas.model.addSymbol(aboveWord)

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsText()

      const decoded = decodeURIComponent(link.href)
      expect(decoded.indexOf("above")).toBeLessThan(decoded.indexOf("middle"))
    })
    test("should keep words recognized on the same line together", async () => {
      const charFor = (label: string): TSymbolChar => ({
        bounds: { height: 0, width: 0, x: 0, y: 0 },
        color: "black",
        fontSize: 52,
        fontWeight: "normal",
        id: `char-${label}`,
        label,
      })
      const line1Y = { x: 0, y: 501, width: 62 }
      const line2Y = { x: 0, y: 611, width: 49 }
      const wordAt = (label: string, x: number, line: typeof line1Y): TText =>
        buildIIText({
          chars: [charFor(label)],
          boundingBox: { x, y: line.y, width: line.width, height: 62 },
        })

      canvas.model.addSymbol(wordAt("How", 0, line1Y))
      canvas.model.addSymbol(wordAt("are", 100, line1Y))
      canvas.model.addSymbol(wordAt("you", 200, line1Y))
      canvas.model.addSymbol(wordAt("?", 300, line1Y))
      canvas.model.addSymbol(wordAt("Fine", 0, line2Y))
      canvas.model.addSymbol(wordAt("and", 100, line2Y))
      canvas.model.addSymbol(wordAt("you", 200, line2Y))
      canvas.model.addSymbol(wordAt("?", 300, line2Y))

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      canvas.downloadAsText()

      const decoded = decodeURIComponent(link.href)
      expect(decoded).toContain("How are you ?")
      expect(decoded).toContain("Fine and you ?")
    })
  })

  describe("extract symbols", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    const text1 = buildIIText()
    const text2 = buildIIText()
    const stroke1 = buildIIStroke()
    const stroke2 = buildIIStroke()
    const symbols: TSymbol[] = [stroke1, text1, stroke2, text2, buildIICircle()]
    test("should extract strokes", () => {
      const strokes = canvas.extractStrokesFromSymbols(symbols)
      expect(strokes).toEqual([stroke1, stroke2])
    })
  })

  describe("undo", () => {
    let canvas!: InteractiveInkCanvas

    beforeEach(() => {
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      canvas.event.emitIdle = jest.fn()
      canvas.unselectAll = jest.fn()
      canvas.history.undo = jest.fn()
      canvas.client.undo = jest.fn(() => Promise.resolve())
      canvas.renderer.removeSymbol = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.menu.update = jest.fn()
      canvas.overlays.apply = jest.fn()
      canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canUndo = false", async () => {
      canvas.history.context.canUndo = false
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call client.undo & renderer.drawSymbol when history.undo return added stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(expect.objectContaining({ added: [stroke1] }))
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should not call client.undo & call renderer.drawSymbol when history.undo return added shape", async () => {
      const circle = buildIICircle()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(circle)
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(circle)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call client.undo & renderer.removeSymbol when history.undo return erased stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      canvas.model.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith(stroke1.id)
    })
    test("should call client.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return replaced stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } },
      }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(
        expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith(stroke2.id)
    })
    test("should call client.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return matrix", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, symbols: [stroke1] } },
      }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(
        expect.objectContaining({
          matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, strokes: [stroke1] },
        })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call client.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return translate", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { translate: [{ tx: 1, ty: 2, symbols: [stroke1] }] },
      }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(
        expect.objectContaining({ translate: [{ tx: 1, ty: 2, strokes: [stroke1] }] })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call client.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return scale", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, symbols: [stroke1] }] },
      }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(
        expect.objectContaining({ scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, strokes: [stroke1] }] })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call client.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return rotate", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { rotate: [{ angle: 42, center: { x: 1, y: 2 }, symbols: [stroke1] }] },
      }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.undo).toHaveBeenCalledTimes(1)
      expect(canvas.client.undo).toHaveBeenCalledWith(
        expect.objectContaining({ rotate: [{ angle: 42, center: { x: 1, y: 2 }, strokes: [stroke1] }] })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
  })

  describe("redo", () => {
    let canvas!: InteractiveInkCanvas

    beforeEach(() => {
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      canvas.event.emitIdle = jest.fn()
      canvas.unselectAll = jest.fn()
      canvas.history.undo = jest.fn()
      canvas.client.redo = jest.fn(() => Promise.resolve())
      canvas.renderer.removeSymbol = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.menu.update = jest.fn()
      canvas.overlays.apply = jest.fn()
      canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canRedo = false", async () => {
      canvas.history.context.canRedo = false
      await canvas.redo()
      expect(canvas.client.redo).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call client.redo & renderer.drawSymbol when history.redo return added stroke", async () => {
      const stroke1 = buildIIStroke()
      const secondModel = canvas.model.clone()
      secondModel.addSymbol(stroke1)
      canvas.history.context.canRedo = true
      canvas.history.redo = jest.fn(() => ({ model: secondModel, changes: { added: [stroke1] } }))
      await canvas.redo()
      expect(canvas.client.redo).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should not call client.redo & call renderer.drawSymbol when history.redo return added shape", async () => {
      const circle = buildIICircle()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(circle)
      canvas.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.client.redo).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(circle)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call client.redo & renderer.removeSymbol when history.redo return erased stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      canvas.model.addSymbol(stroke1)
      canvas.history.redo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.client.redo).toHaveBeenCalledTimes(1)
      expect(canvas.client.redo).toHaveBeenCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith(stroke1.id)
    })
    test("should call client.redo & renderer.drawSymbol & renderer.removeSymbol when history.redo return replaced stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.history.redo = jest.fn(() => ({
        model: firstModel,
        changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } },
      }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.client.redo).toHaveBeenCalledTimes(1)
      expect(canvas.client.redo).toHaveBeenCalledWith(
        expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } })
      )
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith(stroke2.id)
    })
  })

  describe("export", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)

    test("should call client.export", async () => {
      canvas.client.export = jest.fn(() => Promise.resolve(jiixText))
      await canvas.export()
      await expect(canvas.client.export).toHaveBeenCalledTimes(1)
    })
    test("should reject if client.export rejected", async () => {
      canvas.client.export = jest.fn(() => Promise.reject("export-error"))
      canvas.event.emitError = jest.fn()
      await expect(async () => await canvas.export()).rejects.toEqual("export-error")
      expect(canvas.event.emitError).toHaveBeenCalledTimes(1)
    })

    test("should only request mimeTypes not already cached in model.exports", async () => {
      const cachedCanvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      cachedCanvas.model.exports = { "text/plain": "already cached" }
      cachedCanvas.client.export = jest.fn(() =>
        Promise.resolve({ "application/vnd.myscript.jiix": jiixText })
      )

      const result = await cachedCanvas.export(["text/plain", "application/vnd.myscript.jiix"])

      expect(cachedCanvas.client.export).toHaveBeenCalledTimes(1)
      expect(cachedCanvas.client.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
      expect(result).toEqual({
        "text/plain": "already cached",
        "application/vnd.myscript.jiix": jiixText,
      })
    })

    test("should not call client.export at all when every requested mimeType is already cached", async () => {
      const cachedCanvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      cachedCanvas.model.exports = { "text/plain": "already cached" }
      cachedCanvas.client.export = jest.fn()

      const result = await cachedCanvas.export(["text/plain"])

      expect(cachedCanvas.client.export).not.toHaveBeenCalled()
      expect(result).toBe(cachedCanvas.model.exports)
    })

    test("should use the client's default mimeTypes when none are requested", async () => {
      const freshCanvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      freshCanvas.client.export = jest.fn(() => Promise.resolve({ "application/vnd.myscript.jiix": jiixText }))

      await freshCanvas.export()

      expect(freshCanvas.client.export).toHaveBeenCalledWith(freshCanvas.client.mimeTypes)
    })

    test("should not call client.export when no mimeTypes requested but the client's defaults are already cached", async () => {
      const freshCanvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      freshCanvas.model.exports = { "application/vnd.myscript.jiix": jiixText }
      freshCanvas.client.export = jest.fn()

      const result = await freshCanvas.export()

      expect(freshCanvas.client.export).not.toHaveBeenCalled()
      expect(result).toBe(freshCanvas.model.exports)
    })
  })

  describe("convert", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.overlays.apply = jest.fn()
    canvas.event.emitConverted = jest.fn()
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.converter.apply = jest.fn(() => Promise.resolve([]))

    test("should call converter.apply", async () => {
      await canvas.convert()
      await expect(canvas.converter.apply).toHaveBeenCalledTimes(1)
    })
    test("should emitConverted", async () => {
      await canvas.convert()
      expect(canvas.event.emitConverted).toHaveBeenCalledTimes(1)
    })
    test("should emit error if converter.apply is rejected", async () => {
      canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
      canvas.converter.apply = jest.fn(() => Promise.reject("convert-error"))
      canvas.event.emitError = jest.fn()
      await expect(async () => await canvas.convert()).rejects.toEqual("convert-error")
      expect(canvas.event.emitError).toHaveBeenCalledTimes(1)
      expect(canvas.event.emitError).toHaveBeenCalledWith("convert-error")
    })
  })

  describe("idle", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.waitForIdle = jest.fn(() => Promise.resolve())
    canvas.event.emitIdle = jest.fn()
    canvas.layers.updateCanvasState = jest.fn()

    beforeAll(async () => {
      await canvas.initialize()
    })

    test("should call client.waitForIdle", async () => {
      await canvas.waitForIdle()
      await expect(canvas.client.waitForIdle).toHaveBeenCalledTimes(1)
    })
    test("should pass through the idle event (client.idle only fires in response to an explicit waitForIdle call)", async () => {
      canvas.client.event.emitIdle(true)
      expect(canvas.event.emitIdle).toHaveBeenNthCalledWith(1, true)
    })
  })

  describe("resize", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.menu.render = jest.fn()
    canvas.menu.style.update = jest.fn()
    canvas.renderer.resize = jest.fn()
    canvas.client.init = jest.fn(() => Promise.resolve())

    beforeAll(async () => {
      await canvas.initialize()
    })

    test("should call renderer.resize", async () => {
      await canvas.initialize()
      await canvas.resize({ height: 1, width: 2 })
      await expect(canvas.renderer.resize).toHaveBeenCalledTimes(1)
    })
  })

  describe("clear", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.overlays.apply = jest.fn()
    canvas.selector.removeSelectedGroup = jest.fn()
    canvas.renderer.clear = jest.fn()
    canvas.client.clear = jest.fn(() => Promise.resolve())
    canvas.client.init = jest.fn(() => Promise.resolve())

    beforeAll(async () => {
      await canvas.initialize()
    })

    test("should call renderer.clear", async () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      await canvas.clear()
      await expect(canvas.renderer.clear).toHaveBeenCalledTimes(1)
    })
    test("should call selector.removeSelectedGroup", async () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      await canvas.clear()
      await expect(canvas.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
    })
    test("should call client.clear", async () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.clear()
      await expect(canvas.client.clear).toHaveBeenCalledTimes(1)
    })
    test("should clear model", async () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      await canvas.clear()
      expect(canvas.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () => {
      await canvas.clear()
      await expect(canvas.renderer.clear).toHaveBeenCalledTimes(0)
      await expect(canvas.client.clear).toHaveBeenCalledTimes(0)
    })
  })

  describe("destroy", () => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.eraser.detach = jest.fn()
    canvas.selector.detach = jest.fn()
    canvas.move.detach = jest.fn()
    canvas.writer.detach = jest.fn()

    canvas.renderer.destroy = jest.fn()
    canvas.client.destroy = jest.fn()

    test("should detach all.managers", async () => {
      canvas.destroy()
      await expect(canvas.eraser.detach).toHaveBeenCalledTimes(1)
      await expect(canvas.selector.detach).toHaveBeenCalledTimes(1)
      await expect(canvas.move.detach).toHaveBeenCalledTimes(1)
      await expect(canvas.writer.detach).toHaveBeenCalledTimes(1)
    })

    test("should call renderer.destroy", async () => {
      canvas.destroy()
      await expect(canvas.renderer.destroy).toHaveBeenCalledTimes(1)
    })

    test("should call client.destroy", async () => {
      canvas.destroy()
      await expect(canvas.client.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe("zoomToFit", () => {
    let canvas: InteractiveInkCanvas

    beforeEach(() => {
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      canvas.renderer.setZoom = jest.fn()
      canvas.renderer.setViewBox = jest.fn()
      const mockParent = document.createElement("div")
      Object.defineProperty(mockParent, "clientWidth", { value: 800 })
      Object.defineProperty(mockParent, "clientHeight", { value: 600 })
      canvas.renderer.parent = mockParent
    })

    test("should reset to zoom 1 and origin viewBox when no symbols", () => {
      canvas.zoomToFit()

      expect(canvas.renderer.setZoom).toHaveBeenCalledWith(1)
      expect(canvas.renderer.setViewBox).toHaveBeenCalledWith(0, 0, 800, 600)
    })

    test("should zoom and center on symbols", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.getSymbolsBounds = jest.fn(() => ({ x: 10, y: 20, width: 200, height: 100 }))

      canvas.zoomToFit()

      // zoom = Math.min((800-80)/200, (600-80)/100) = Math.min(3.6, 5.2) = 3.6
      expect(canvas.renderer.setZoom).toHaveBeenCalledWith(3.6)
      // vbW=800/3.6, vbH=600/3.6, centered on cx=110, cy=70
      const vbW = 800 / 3.6
      const vbH = 600 / 3.6
      expect(canvas.renderer.setViewBox).toHaveBeenCalledWith(
        expect.closeTo(110 - vbW / 2, 5),
        expect.closeTo(70 - vbH / 2, 5),
        expect.closeTo(vbW, 5),
        expect.closeTo(vbH, 5)
      )
    })

    test("should fit only the provided symbols subset", () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      const getSymbolsBoundsSpy = jest
        .spyOn(canvas, "getSymbolsBounds")
        .mockReturnValue({ x: 0, y: 0, width: 100, height: 100 })

      canvas.zoomToFit([stroke1])

      expect(getSymbolsBoundsSpy).toHaveBeenCalledWith([stroke1], 0)
    })

    test("should clamp zoom to minimum 0.1 for very large content", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.getSymbolsBounds = jest.fn(() => ({ x: 0, y: 0, width: 100000, height: 100000 }))

      canvas.zoomToFit()

      const [zoom] = (canvas.renderer.setZoom as jest.Mock).mock.calls[0]
      expect(zoom).toBeCloseTo(0.1, 5)
    })
  })

  describe("copy / paste / cut", () => {
    let canvas: InteractiveInkCanvas

    beforeEach(() => {
      canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
      canvas.client.addStrokes = jest.fn(() => Promise.resolve(undefined))
      canvas.client.eraseStrokes = jest.fn(() => Promise.resolve())
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.renderer.updateSelectedState = jest.fn()
      canvas.menu.update = jest.fn()
      canvas.overlays.apply = jest.fn()
      canvas.selector.drawSelectedGroup = jest.fn()
      canvas.selector.removeSelectedGroup = jest.fn()
      canvas.math.selectBlock = jest.fn()
      canvas.math.clearBlockSelection = jest.fn()
    })

    describe("copy", () => {
      test("should copy selected symbols to clipboard", async () => {
        const stroke1 = buildIIStroke()
        const stroke2 = buildIIStroke()
        canvas.model.addSymbol(stroke1)
        canvas.model.addSymbol(stroke2)
        canvas.model.selectedIds.add(stroke1.id)

        canvas.copy()

        await canvas.paste()
        expect(canvas.client.addStrokes).toHaveBeenCalledWith(
          [expect.objectContaining({ type: SymbolType.Stroke })],
          false
        )
        const addedStrokes = (canvas.client.addStrokes as jest.Mock).mock.calls[0][0] as TStroke[]
        expect(addedStrokes).toHaveLength(1)
        expect(addedStrokes[0].id).not.toBe(stroke1.id)
      })

      test("should copy all symbols when nothing selected", async () => {
        const stroke1 = buildIIStroke()
        const stroke2 = buildIIStroke()
        canvas.model.addSymbol(stroke1)
        canvas.model.addSymbol(stroke2)

        canvas.copy()

        await canvas.paste()
        const addedStrokes = (canvas.client.addStrokes as jest.Mock).mock.calls[0][0] as TStroke[]
        expect(addedStrokes).toHaveLength(2)
      })

      test("should filter out decorators from clipboard", async () => {
        const stroke = buildIIStroke()
        const decorator = buildIIDecorator(DecoratorKind.Highlight)
        canvas.model.addSymbol(stroke)
        canvas.model.addSymbol(decorator)
        canvas.model.selectedIds.add(stroke.id)
        canvas.model.selectedIds.add(decorator.id)

        canvas.copy()

        await canvas.paste()
        const addedStrokes = (canvas.client.addStrokes as jest.Mock).mock.calls[0][0] as TSymbol[]
        expect(addedStrokes).toHaveLength(1)
      })

      test("should filter out solver output strokes from clipboard", async () => {
        const stroke = buildIIStroke()
        const solverStroke = buildIIStroke()
        solverStroke.isSolverOutput = true
        canvas.model.addSymbol(stroke)
        canvas.model.addSymbol(solverStroke)
        canvas.model.selectedIds.add(stroke.id)
        canvas.model.selectedIds.add(solverStroke.id)

        canvas.copy()

        await canvas.paste()
        const addedStrokes = (canvas.client.addStrokes as jest.Mock).mock.calls[0][0] as TSymbol[]
        expect(addedStrokes).toHaveLength(1)
      })
    })

    describe("paste", () => {
      test("should do nothing when clipboard is empty", async () => {
        await canvas.paste()
        expect(canvas.client.addStrokes).not.toHaveBeenCalled()
        expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
      })

      test("should paste clones with new IDs", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        canvas.copy()

        await canvas.paste()

        expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        const drawn = (canvas.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        expect(drawn.id).not.toBe(stroke.id)
        expect(drawn.type).toBe(SymbolType.Stroke)
      })

      test("should paste clones offset by PASTE_OFFSET", async () => {
        const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
        canvas.model.addSymbol(stroke)
        canvas.copy()

        await canvas.paste()

        const drawn = (canvas.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        const offset = InteractiveInkCanvas.PASTE_OFFSET
        drawn.pointers.forEach((p, i) => {
          expect(p.x).toBeCloseTo(stroke.pointers[i].x + offset)
          expect(p.y).toBeCloseTo(stroke.pointers[i].y + offset)
        })
      })

      test("should select pasted symbols", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        canvas.copy()

        await canvas.paste()

        expect(canvas.selector.drawSelectedGroup).toHaveBeenCalled()
      })

      test("should allow multiple independent pastes", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        canvas.copy()

        await canvas.paste()
        await canvas.paste()

        const calls = (canvas.renderer.drawSymbol as jest.Mock).mock.calls
        expect(calls).toHaveLength(2)
        const id1 = (calls[0][0] as TStroke).id
        const id2 = (calls[1][0] as TStroke).id
        expect(id1).not.toBe(id2)
        expect(id1).not.toBe(stroke.id)
        expect(id2).not.toBe(stroke.id)
      })
    })

    describe("cut", () => {
      test("should remove selected symbols", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        canvas.model.selectedIds.add(stroke.id)

        await canvas.cut()

        expect(canvas.client.eraseStrokes).toHaveBeenCalledWith([stroke.id])
        expect(canvas.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      })

      test("should copy symbols before removing", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        canvas.model.selectedIds.add(stroke.id)

        await canvas.cut()

        expect(canvas.client.eraseStrokes).toHaveBeenCalledTimes(1)
        jest.clearAllMocks()

        await canvas.paste()
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        const drawn = (canvas.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        expect(drawn.id).not.toBe(stroke.id)
      })

      test("should do nothing when nothing selected", async () => {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)

        await canvas.cut()

        expect(canvas.client.eraseStrokes).not.toHaveBeenCalled()
      })
    })
  })
})
