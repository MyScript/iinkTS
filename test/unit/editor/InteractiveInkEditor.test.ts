import { jiixMathDuplicateStrokes, jiixText } from "../__dataset__/exports.dataset"
import { buildIICircle, buildIIStroke, buildIIText, buildIIMath, buildIIDecorator, delay } from "../helpers"
import {
  InteractiveInkEditor,
  DefaultInteractiveInkEditorConfiguration,
  EditorTool,
  TInteractiveInkEditorOptions,
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
} from "@/iink"

describe("EditorOffscreen.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock
  const EditorOptions: TInteractiveInkEditorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkEditorConfiguration)),
  }
  EditorOptions.configuration!.server!.version = "3.0.0"

  test("should instanciate", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    expect(editor).toBeDefined()
  })

  describe("Style", () => {
    const customEditorOptions: TInteractiveInkEditorOptions = JSON.parse(JSON.stringify(EditorOptions))
    const initCustomStyle: TStyle = { color: "#d1d1d1", width: 42 }
    customEditorOptions.configuration!.penStyle = initCustomStyle
    const editor = new InteractiveInkEditor(document.createElement("div"), customEditorOptions)

    test("should define style", async () => {
      expect(editor.penStyle).toEqual(expect.objectContaining(initCustomStyle))
    })
    test("should change Style", async () => {
      const customStyle: TStyle = { color: "red", width: 51, fill: "black", opacity: 0.5 }
      editor.penStyle = customStyle
      expect(editor.penStyle).toEqual(expect.objectContaining(customStyle))
    })
  })

  describe("Tool", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.menu.render = jest.fn()
    editor.renderer.init = jest.fn()

    editor.writer.attach = jest.fn()
    editor.selector.attach = jest.fn()
    editor.move.attach = jest.fn()
    editor.eraser.attach = jest.fn()
    editor.writer.detach = jest.fn()
    editor.selector.detach = jest.fn()
    editor.move.detach = jest.fn()
    editor.eraser.detach = jest.fn()

    test("should set tool to write on init", async () => {
      editor.initialize()
      expect(editor.writer.detach).toHaveBeenCalledTimes(1)
      expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      expect(editor.move.detach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.detach).toHaveBeenCalledTimes(1)

      expect(editor.writer.attach).toHaveBeenCalledTimes(1)
      expect(editor.selector.attach).toHaveBeenCalledTimes(0)
      expect(editor.move.attach).toHaveBeenCalledTimes(0)
      expect(editor.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to erase", async () => {
      editor.tool = EditorTool.Erase
      expect(editor.writer.detach).toHaveBeenCalledTimes(1)
      expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      expect(editor.move.detach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.detach).toHaveBeenCalledTimes(1)

      expect(editor.writer.attach).toHaveBeenCalledTimes(0)
      expect(editor.selector.attach).toHaveBeenCalledTimes(0)
      expect(editor.move.attach).toHaveBeenCalledTimes(0)
      expect(editor.eraser.attach).toHaveBeenCalledTimes(1)
    })
    test("should set tool to move", async () => {
      editor.tool = EditorTool.Move
      expect(editor.writer.detach).toHaveBeenCalledTimes(1)
      expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      expect(editor.move.detach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.detach).toHaveBeenCalledTimes(1)

      expect(editor.writer.attach).toHaveBeenCalledTimes(0)
      expect(editor.selector.attach).toHaveBeenCalledTimes(0)
      expect(editor.move.attach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to select", async () => {
      editor.tool = EditorTool.Select
      expect(editor.writer.detach).toHaveBeenCalledTimes(1)
      expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      expect(editor.move.detach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.detach).toHaveBeenCalledTimes(1)

      expect(editor.writer.attach).toHaveBeenCalledTimes(0)
      expect(editor.selector.attach).toHaveBeenCalledTimes(1)
      expect(editor.move.attach).toHaveBeenCalledTimes(0)
      expect(editor.eraser.attach).toHaveBeenCalledTimes(0)
    })
    test("should set tool to write", async () => {
      editor.tool = EditorTool.Write
      expect(editor.writer.detach).toHaveBeenCalledTimes(1)
      expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      expect(editor.move.detach).toHaveBeenCalledTimes(1)
      expect(editor.eraser.detach).toHaveBeenCalledTimes(1)

      expect(editor.writer.attach).toHaveBeenCalledTimes(1)
      expect(editor.selector.attach).toHaveBeenCalledTimes(0)
      expect(editor.move.attach).toHaveBeenCalledTimes(0)
      expect(editor.eraser.attach).toHaveBeenCalledTimes(0)
    })
  })

  describe("connectionState", () => {
    let editor: InteractiveInkEditor

    beforeEach(() => {
      editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    })

    function stubOfflineQueueLength(length: number): void {
      Object.defineProperty(editor.recognizer, "offlineQueueLength", { get: () => length, configurable: true })
    }

    test("should start as initializing before the first successful connection", () => {
      expect(editor.connectionState).toEqual("initializing")
    })

    test("should become online-idle once connected for the first time", () => {
      editor.recognizer.event.emitEndInitialization()
      expect(editor.connectionState).toEqual("online-idle")
    })

    test("should become online-working while an operation is active", () => {
      // recognizer.idle only fires in response to an explicit waitForIdle() call, not
      // automatically after addStrokes()/etc — "Recognizing" is tracked at the call site instead.
      editor.recognizer.event.emitEndInitialization()
      editor.startOperation("Recognizing")
      expect(editor.connectionState).toEqual("online-working")
    })

    test("should return to online-idle once the active operation ends", () => {
      editor.recognizer.event.emitEndInitialization()
      editor.startOperation("Recognizing")
      editor.endOperation("Recognizing")
      expect(editor.connectionState).toEqual("online-idle")
    })

    test("should become offline when disconnected with nothing queued", () => {
      editor.recognizer.event.emitEndInitialization()
      stubOfflineQueueLength(0)
      editor.recognizer.event.emitConnectionStatusChanged("offline")
      expect(editor.connectionState).toEqual("offline")
    })

    test("should become syncing when disconnected with strokes queued", () => {
      editor.recognizer.event.emitEndInitialization()
      stubOfflineQueueLength(2)
      editor.recognizer.event.emitConnectionStatusChanged("offline")
      expect(editor.connectionState).toEqual("syncing")
    })

    test("should become error once reconnection attempts are exhausted", () => {
      editor.recognizer.event.emitEndInitialization()
      editor.recognizer.event.emitConnectionStatusChanged("error")
      expect(editor.connectionState).toEqual("error")
    })

    test("should emit connectionStateChanged only when the derived state actually changes", () => {
      const spyEmit: jest.SpyInstance = jest.spyOn(editor.event, "emitConnectionStateChanged")
      editor.recognizer.event.emitEndInitialization()
      expect(spyEmit).toHaveBeenCalledWith("online-idle")
      spyEmit.mockClear()
      // idle already true — emitting idle(true) again should not change the derived state
      editor.recognizer.event.emitIdle(true)
      expect(spyEmit).not.toHaveBeenCalled()
    })

    test("should always refresh the layer badge, even when the discrete state stays the same", () => {
      const spyLayer: jest.SpyInstance = jest.spyOn(editor.layers, "updateEditorState")
      editor.recognizer.event.emitEndInitialization()
      expect(spyLayer).toHaveBeenCalledWith("online-idle", { queuedCount: 0, activeOperations: [] })
      spyLayer.mockClear()
      // starting a second overlapping operation stays "online-working" but the label list changes
      editor.startOperation("Recognizing")
      editor.startOperation("Converting")
      expect(spyLayer).toHaveBeenLastCalledWith("online-working", {
        queuedCount: 0,
        activeOperations: ["Recognizing", "Converting"],
      })
    })

    test("should still forward the passthrough connectionStatusChanged event unchanged", () => {
      const spyStatus: jest.SpyInstance = jest.spyOn(editor.event, "emitConnectionStatusChanged")
      editor.recognizer.event.emitConnectionStatusChanged("offline")
      expect(spyStatus).toHaveBeenCalledWith("offline")
    })
  })

  describe("init", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.menu.render = jest.fn()
    editor.renderer.init = jest.fn()
    editor.recognizer.init = jest.fn(() => Promise.resolve())

    test("should init grabber, renderer & recognizer & context", async () => {
      editor.initialize()
      expect(editor.history.context.canRedo).toEqual(false)
      expect(editor.history.context.canUndo).toEqual(false)
      expect(editor.history.context.empty).toEqual(true)
      expect(editor.history.context.stackIndex).toEqual(0)
      expect(editor.history.stack.length).toEqual(1)
      await expect(editor.renderer.init).toHaveBeenCalledTimes(1)
      await expect(editor.recognizer.init).toHaveBeenCalledTimes(1)
    })
    test("should resolve init when recognizer.init is resolve", async () => {
      await editor.initialize()
      await expect(editor.recognizer.init).toHaveBeenCalledTimes(1)
    })
    test("should reject init when recognizer.init is reject", async () => {
      editor.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(editor.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("CRUD", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.menu.update = jest.fn()
    editor.overlays.apply = jest.fn()
    editor.recognizer.waitForIdle = jest.fn()

    editor.recognizer.init = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
    editor.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    editor.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())

    editor.renderer.drawSymbol = jest.fn()
    editor.renderer.changeOrderSymbol = jest.fn()
    editor.renderer.replaceSymbol = jest.fn()
    editor.renderer.removeSymbol = jest.fn()

    editor.model.addSymbol = jest.fn()
    editor.model.changeOrderSymbol = jest.fn()
    editor.model.replaceSymbol = jest.fn()
    editor.model.removeSymbol = jest.fn()

    test("add stroke", async () => {
      const stroke = buildIIStroke()
      await editor.addSymbol(stroke)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("add shape", async () => {
      const shape = buildIICircle()
      await editor.addSymbol(shape)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("create stroke", async () => {
      const stroke: TPartialDeep<TStroke> = {
        type: SymbolType.Stroke,
        pointers: [{ x: 0, y: 1, t: 1, p: 1 }],
      }
      await editor.createSymbol(stroke)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [expect.objectContaining(stroke)], false)
    })
    test("create shape", async () => {
      const shape: TPartialDeep<TShapeCircle> = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 5, y: 5 },
        radius: 5,
      }
      await editor.createSymbol(shape)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("replace stroke by stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      await editor.replaceSymbols([stroke1], [stroke2])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(editor.recognizer.replaceStrokes).toHaveBeenNthCalledWith(1, [stroke1.id], [stroke2])
    })
    test("replace stroke by shape", async () => {
      const stroke = buildIIStroke()
      const shape = buildIICircle()
      await editor.replaceSymbols([stroke], [shape])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(editor.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("replace shape by stroke", async () => {
      const stroke = buildIIStroke()
      const shape = buildIICircle()
      await editor.replaceSymbols([shape], [stroke])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("change order symbol", async () => {
      const stroke = buildIIStroke()
      await editor.changeOrderSymbol(stroke, "last")
      expect(editor.model.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke.id, "last")
      expect(editor.renderer.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke, "last")
    })
    test("remove stroke", async () => {
      const stroke = buildIIStroke()
      editor.model.symbols.push(stroke)
      await editor.removeSymbol(stroke.id)
      expect(editor.model.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(editor.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(editor.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("remove shape", async () => {
      const shape = buildIICircle()
      editor.model.symbols.push(shape)
      await editor.removeSymbol(shape.id)
      expect(editor.model.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(editor.renderer.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
    })
  })

  describe("updateSymbolsStyle", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.renderer.drawSymbol = jest.fn()
    const stroke1 = buildIIStroke()
    editor.model.addSymbol(stroke1)
    const stroke2 = buildIIStroke()
    editor.model.addSymbol(stroke2)
    test("should update symbol color and draw", async () => {
      await editor.initialize()
      expect(editor.model.symbols[0].style.color).toEqual("#000000")
      editor.updateSymbolsStyle([stroke1.id], { color: "red" })
      expect(editor.model.symbols[0].style.color).toEqual("red")
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should update symbol width and draw", async () => {
      await editor.initialize()
      expect(editor.model.symbols[1].style.width).toEqual(2)
      editor.updateSymbolsStyle([stroke2.id], { width: 42 })
      expect(editor.model.symbols[1].style.width).toEqual(42)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke2)
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

    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.event.emitIdle = jest.fn()
    editor.layers.updateEditorState = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.recognizer.addStrokes = jest.fn()
    editor.updateLayerUI = jest.fn()
    editor.event.emitImported = jest.fn()

    test("should update layer state", async () => {
      await editor.importPointEvents(pStrokes)
      expect(editor.event.emitIdle).toHaveBeenNthCalledWith(1, false)
      expect(editor.layers.updateEditorState).toHaveBeenCalled()
    })
    test("should call recognizer.addStrokes", async () => {
      await editor.importPointEvents(pStrokes)
      expect(editor.recognizer.addStrokes).toHaveBeenCalledTimes(1)
    })
    test("should add symbols to model and draw", async () => {
      editor.model.symbols = []
      await editor.importPointEvents(pStrokes)
      expect(editor.model.symbols).toHaveLength(pStrokes.length)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(2)
    })
    test("should update layer UI", async () => {
      await editor.importPointEvents(pStrokes)
      expect(editor.updateLayerUI).toHaveBeenCalledTimes(1)
    })
    test("should emit Imported", async () => {
      await editor.importPointEvents(pStrokes)
      expect(editor.event.emitImported).toHaveBeenCalledTimes(1)
    })
  })

  describe("Download", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    const stroke1 = buildIIStroke()
    editor.model.addSymbol(stroke1)
    editor.model.selectedIds.add(stroke1.id)
    const stroke2 = buildIIStroke()
    editor.model.addSymbol(stroke2)

    editor.renderer.getElementById = jest.fn((id) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.id = id
      return p
    })

    test("should call trigger download svg file", async () => {
      global.URL.createObjectURL = jest.fn(() => "download-svg-url")
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsSVG()
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
      editor.downloadAsPNG()
      await delay(101)
      expect(link.href).toContain("download-png-url")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file", async () => {
      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsJson()
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
      editor.downloadAsJson(true)
      expect(link.href).toContain("data:text/json;charset=utf-8,")
      expect(link.href).toContain(stroke1.id)
      expect(link.href).not.toContain(stroke2.id)
      expect(link.download).toContain("iink-ts-")
      expect(link.download).toContain(".json")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download text file", async () => {
      const oiMath = buildIIMath("a=b+c")
      editor.model.addSymbol(oiMath)

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsText()

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
        editor.model.addSymbol(s)
      }
      addStrokeWithId("eq-1")
      addStrokeWithId("eq-2")
      addStrokeWithId("x-1")
      addStrokeWithId("x-2")
      addStrokeWithId("n-1")
      editor.model.exports = { "application/vnd.myscript.jiix": jiixMathDuplicateStrokes }

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsText()

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
      editor.model.addSymbol(middleWord)
      editor.model.addSymbol(aboveWord)

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsText()

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

      editor.model.addSymbol(wordAt("How", 0, line1Y))
      editor.model.addSymbol(wordAt("are", 100, line1Y))
      editor.model.addSymbol(wordAt("you", 200, line1Y))
      editor.model.addSymbol(wordAt("?", 300, line1Y))
      editor.model.addSymbol(wordAt("Fine", 0, line2Y))
      editor.model.addSymbol(wordAt("and", 100, line2Y))
      editor.model.addSymbol(wordAt("you", 200, line2Y))
      editor.model.addSymbol(wordAt("?", 300, line2Y))

      const link = document.createElement("a")
      link.click = jest.fn()
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsText()

      const decoded = decodeURIComponent(link.href)
      expect(decoded).toContain("How are you ?")
      expect(decoded).toContain("Fine and you ?")
    })
  })

  describe("extract symbols", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    const text1 = buildIIText()
    const text2 = buildIIText()
    const stroke1 = buildIIStroke()
    const stroke2 = buildIIStroke()
    const symbols: TSymbol[] = [stroke1, text1, stroke2, text2, buildIICircle()]
    test("should extract strokes", () => {
      const strokes = editor.extractStrokesFromSymbols(symbols)
      expect(strokes).toEqual([stroke1, stroke2])
    })
  })

  describe("undo", () => {
    let editor!: InteractiveInkEditor

    beforeEach(() => {
      editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      editor.event.emitIdle = jest.fn()
      editor.unselectAll = jest.fn()
      editor.history.undo = jest.fn()
      editor.recognizer.undo = jest.fn(() => Promise.resolve())
      editor.renderer.removeSymbol = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.menu.update = jest.fn()
      editor.overlays.apply = jest.fn()
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canUndo = false", async () => {
      editor.history.context.canUndo = false
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(0)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.drawSymbol when history.undo return added stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(expect.objectContaining({ added: [stroke1] }))
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should not call recognizer.undo & call renderer.drawSymbol when history.undo return added shape", async () => {
      const circle = buildIICircle()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(circle)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(0)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(circle)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.removeSymbol when history.undo return erased stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      editor.model.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledWith(stroke1.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return replaced stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } },
      }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(
        expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledWith(stroke2.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return matrix", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, symbols: [stroke1] } },
      }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(
        expect.objectContaining({
          matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, strokes: [stroke1] },
        })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return translate", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { translate: [{ tx: 1, ty: 2, symbols: [stroke1] }] },
      }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(
        expect.objectContaining({ translate: [{ tx: 1, ty: 2, strokes: [stroke1] }] })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return scale", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, symbols: [stroke1] }] },
      }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(
        expect.objectContaining({ scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, strokes: [stroke1] }] })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return rotate", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({
        model: firstModel,
        changes: { rotate: [{ angle: 42, center: { x: 1, y: 2 }, symbols: [stroke1] }] },
      }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.undo).toHaveBeenCalledWith(
        expect.objectContaining({ rotate: [{ angle: 42, center: { x: 1, y: 2 }, strokes: [stroke1] }] })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
  })

  describe("redo", () => {
    let editor!: InteractiveInkEditor

    beforeEach(() => {
      editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      editor.event.emitIdle = jest.fn()
      editor.unselectAll = jest.fn()
      editor.history.undo = jest.fn()
      editor.recognizer.redo = jest.fn(() => Promise.resolve())
      editor.renderer.removeSymbol = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.menu.update = jest.fn()
      editor.overlays.apply = jest.fn()
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canRedo = false", async () => {
      editor.history.context.canRedo = false
      await editor.redo()
      expect(editor.recognizer.redo).toHaveBeenCalledTimes(0)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.drawSymbol when history.redo return added stroke", async () => {
      const stroke1 = buildIIStroke()
      const secondModel = editor.model.clone()
      secondModel.addSymbol(stroke1)
      editor.history.context.canRedo = true
      editor.history.redo = jest.fn(() => ({ model: secondModel, changes: { added: [stroke1] } }))
      await editor.redo()
      expect(editor.recognizer.redo).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should not call recognizer.redo & call renderer.drawSymbol when history.redo return added shape", async () => {
      const circle = buildIICircle()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(circle)
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toHaveBeenCalledTimes(0)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(circle)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.removeSymbol when history.redo return erased stroke", async () => {
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      editor.model.addSymbol(stroke1)
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.redo).toHaveBeenCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledWith(stroke1.id)
    })
    test("should call recognizer.redo & renderer.drawSymbol & renderer.removeSymbol when history.redo return replaced stroke", async () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.history.redo = jest.fn(() => ({
        model: firstModel,
        changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } },
      }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toHaveBeenCalledTimes(1)
      expect(editor.recognizer.redo).toHaveBeenCalledWith(
        expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } })
      )
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledWith(stroke2.id)
    })
  })

  describe("export", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)

    test("should call recognizer.export", async () => {
      editor.recognizer.export = jest.fn(() => Promise.resolve(jiixText))
      await editor.export()
      await expect(editor.recognizer.export).toHaveBeenCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () => {
      editor.recognizer.export = jest.fn(() => Promise.reject("export-error"))
      editor.event.emitError = jest.fn()
      await expect(async () => await editor.export()).rejects.toEqual("export-error")
      expect(editor.event.emitError).toHaveBeenCalledTimes(1)
    })

    test("should only request mimeTypes not already cached in model.exports", async () => {
      const cachedEditor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      cachedEditor.model.exports = { "text/plain": "already cached" }
      cachedEditor.recognizer.export = jest.fn(() =>
        Promise.resolve({ "application/vnd.myscript.jiix": jiixText })
      )

      const result = await cachedEditor.export(["text/plain", "application/vnd.myscript.jiix"])

      expect(cachedEditor.recognizer.export).toHaveBeenCalledTimes(1)
      expect(cachedEditor.recognizer.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
      expect(result).toEqual({
        "text/plain": "already cached",
        "application/vnd.myscript.jiix": jiixText,
      })
    })

    test("should not call recognizer.export at all when every requested mimeType is already cached", async () => {
      const cachedEditor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      cachedEditor.model.exports = { "text/plain": "already cached" }
      cachedEditor.recognizer.export = jest.fn()

      const result = await cachedEditor.export(["text/plain"])

      expect(cachedEditor.recognizer.export).not.toHaveBeenCalled()
      expect(result).toBe(cachedEditor.model.exports)
    })

    test("should use the recognizer's default mimeTypes when none are requested", async () => {
      const freshEditor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      freshEditor.recognizer.export = jest.fn(() => Promise.resolve({ "application/vnd.myscript.jiix": jiixText }))

      await freshEditor.export()

      expect(freshEditor.recognizer.export).toHaveBeenCalledWith(freshEditor.recognizer.mimeTypes)
    })

    test("should not call recognizer.export when no mimeTypes requested but the recognizer's defaults are already cached", async () => {
      const freshEditor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      freshEditor.model.exports = { "application/vnd.myscript.jiix": jiixText }
      freshEditor.recognizer.export = jest.fn()

      const result = await freshEditor.export()

      expect(freshEditor.recognizer.export).not.toHaveBeenCalled()
      expect(result).toBe(freshEditor.model.exports)
    })
  })

  describe("convert", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.overlays.apply = jest.fn()
    editor.event.emitConverted = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.converter.apply = jest.fn(() => Promise.resolve([]))

    test("should call converter.apply", async () => {
      await editor.convert()
      await expect(editor.converter.apply).toHaveBeenCalledTimes(1)
    })
    test("should emitConverted", async () => {
      await editor.convert()
      expect(editor.event.emitConverted).toHaveBeenCalledTimes(1)
    })
    test("should emit error if converter.apply is rejected", async () => {
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      editor.converter.apply = jest.fn(() => Promise.reject("convert-error"))
      editor.event.emitError = jest.fn()
      await expect(async () => await editor.convert()).rejects.toEqual("convert-error")
      expect(editor.event.emitError).toHaveBeenCalledTimes(1)
      expect(editor.event.emitError).toHaveBeenCalledWith("convert-error")
    })
  })

  describe("idle", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.event.emitIdle = jest.fn()
    editor.layers.updateEditorState = jest.fn()

    beforeAll(async () => {
      await editor.initialize()
    })

    test("should call recognizer.waitForIdle", async () => {
      await editor.waitForIdle()
      await expect(editor.recognizer.waitForIdle).toHaveBeenCalledTimes(1)
    })
    test("should pass through the idle event (recognizer.idle only fires in response to an explicit waitForIdle call)", async () => {
      editor.recognizer.event.emitIdle(true)
      expect(editor.event.emitIdle).toHaveBeenNthCalledWith(1, true)
    })
  })

  describe("resize", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.menu.render = jest.fn()
    editor.menu.style.update = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () => {
      await editor.initialize()
    })

    test("should call renderer.resize", async () => {
      await editor.initialize()
      await editor.resize({ height: 1, width: 2 })
      await expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
    })
  })

  describe("clear", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.overlays.apply = jest.fn()
    editor.selector.removeSelectedGroup = jest.fn()
    editor.renderer.clear = jest.fn()
    editor.recognizer.clear = jest.fn(() => Promise.resolve())
    editor.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () => {
      await editor.initialize()
    })

    test("should call renderer.clear", async () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      await expect(editor.renderer.clear).toHaveBeenCalledTimes(1)
    })
    test("should call selector.removeSelectedGroup", async () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      await expect(editor.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
    })
    test("should call recognizer.clear", async () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.clear()
      await expect(editor.recognizer.clear).toHaveBeenCalledTimes(1)
    })
    test("should clear model", async () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      expect(editor.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () => {
      await editor.clear()
      await expect(editor.renderer.clear).toHaveBeenCalledTimes(0)
      await expect(editor.recognizer.clear).toHaveBeenCalledTimes(0)
    })
  })

  describe("destroy", () => {
    const editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
    editor.eraser.detach = jest.fn()
    editor.selector.detach = jest.fn()
    editor.move.detach = jest.fn()
    editor.writer.detach = jest.fn()

    editor.renderer.destroy = jest.fn()
    editor.recognizer.destroy = jest.fn()

    test("should detach all.managers", async () => {
      editor.destroy()
      await expect(editor.eraser.detach).toHaveBeenCalledTimes(1)
      await expect(editor.selector.detach).toHaveBeenCalledTimes(1)
      await expect(editor.move.detach).toHaveBeenCalledTimes(1)
      await expect(editor.writer.detach).toHaveBeenCalledTimes(1)
    })

    test("should call renderer.destroy", async () => {
      editor.destroy()
      await expect(editor.renderer.destroy).toHaveBeenCalledTimes(1)
    })

    test("should call recognizer.destroy", async () => {
      editor.destroy()
      await expect(editor.recognizer.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe("zoomToFit", () => {
    let editor: InteractiveInkEditor

    beforeEach(() => {
      editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      editor.renderer.setZoom = jest.fn()
      editor.renderer.setViewBox = jest.fn()
      const mockParent = document.createElement("div")
      Object.defineProperty(mockParent, "clientWidth", { value: 800 })
      Object.defineProperty(mockParent, "clientHeight", { value: 600 })
      editor.renderer.parent = mockParent
    })

    test("should reset to zoom 1 and origin viewBox when no symbols", () => {
      editor.zoomToFit()

      expect(editor.renderer.setZoom).toHaveBeenCalledWith(1)
      expect(editor.renderer.setViewBox).toHaveBeenCalledWith(0, 0, 800, 600)
    })

    test("should zoom and center on symbols", () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.getSymbolsBounds = jest.fn(() => ({ x: 10, y: 20, width: 200, height: 100 }))

      editor.zoomToFit()

      // zoom = Math.min((800-80)/200, (600-80)/100) = Math.min(3.6, 5.2) = 3.6
      expect(editor.renderer.setZoom).toHaveBeenCalledWith(3.6)
      // vbW=800/3.6, vbH=600/3.6, centered on cx=110, cy=70
      const vbW = 800 / 3.6
      const vbH = 600 / 3.6
      expect(editor.renderer.setViewBox).toHaveBeenCalledWith(
        expect.closeTo(110 - vbW / 2, 5),
        expect.closeTo(70 - vbH / 2, 5),
        expect.closeTo(vbW, 5),
        expect.closeTo(vbH, 5)
      )
    })

    test("should fit only the provided symbols subset", () => {
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      const getSymbolsBoundsSpy = jest
        .spyOn(editor, "getSymbolsBounds")
        .mockReturnValue({ x: 0, y: 0, width: 100, height: 100 })

      editor.zoomToFit([stroke1])

      expect(getSymbolsBoundsSpy).toHaveBeenCalledWith([stroke1], 0)
    })

    test("should clamp zoom to minimum 0.1 for very large content", () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.getSymbolsBounds = jest.fn(() => ({ x: 0, y: 0, width: 100000, height: 100000 }))

      editor.zoomToFit()

      const [zoom] = (editor.renderer.setZoom as jest.Mock).mock.calls[0]
      expect(zoom).toBeCloseTo(0.1, 5)
    })
  })

  describe("copy / paste / cut", () => {
    let editor: InteractiveInkEditor

    beforeEach(() => {
      editor = new InteractiveInkEditor(document.createElement("div"), EditorOptions)
      editor.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      editor.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.renderer.updateSelectedState = jest.fn()
      editor.menu.update = jest.fn()
      editor.overlays.apply = jest.fn()
      editor.selector.drawSelectedGroup = jest.fn()
      editor.selector.removeSelectedGroup = jest.fn()
      editor.math.selectBlock = jest.fn()
      editor.math.clearBlockSelection = jest.fn()
    })

    describe("copy", () => {
      test("should copy selected symbols to clipboard", async () => {
        const stroke1 = buildIIStroke()
        const stroke2 = buildIIStroke()
        editor.model.addSymbol(stroke1)
        editor.model.addSymbol(stroke2)
        editor.model.selectedIds.add(stroke1.id)

        editor.copy()

        await editor.paste()
        expect(editor.recognizer.addStrokes).toHaveBeenCalledWith(
          [expect.objectContaining({ type: SymbolType.Stroke })],
          false
        )
        const addedStrokes = (editor.recognizer.addStrokes as jest.Mock).mock.calls[0][0] as TStroke[]
        expect(addedStrokes).toHaveLength(1)
        expect(addedStrokes[0].id).not.toBe(stroke1.id)
      })

      test("should copy all symbols when nothing selected", async () => {
        const stroke1 = buildIIStroke()
        const stroke2 = buildIIStroke()
        editor.model.addSymbol(stroke1)
        editor.model.addSymbol(stroke2)

        editor.copy()

        await editor.paste()
        const addedStrokes = (editor.recognizer.addStrokes as jest.Mock).mock.calls[0][0] as TStroke[]
        expect(addedStrokes).toHaveLength(2)
      })

      test("should filter out decorators from clipboard", async () => {
        const stroke = buildIIStroke()
        const decorator = buildIIDecorator(DecoratorKind.Highlight)
        editor.model.addSymbol(stroke)
        editor.model.addSymbol(decorator)
        editor.model.selectedIds.add(stroke.id)
        editor.model.selectedIds.add(decorator.id)

        editor.copy()

        await editor.paste()
        const addedStrokes = (editor.recognizer.addStrokes as jest.Mock).mock.calls[0][0] as TSymbol[]
        expect(addedStrokes).toHaveLength(1)
      })

      test("should filter out solver output strokes from clipboard", async () => {
        const stroke = buildIIStroke()
        const solverStroke = buildIIStroke()
        solverStroke.isSolverOutput = true
        editor.model.addSymbol(stroke)
        editor.model.addSymbol(solverStroke)
        editor.model.selectedIds.add(stroke.id)
        editor.model.selectedIds.add(solverStroke.id)

        editor.copy()

        await editor.paste()
        const addedStrokes = (editor.recognizer.addStrokes as jest.Mock).mock.calls[0][0] as TSymbol[]
        expect(addedStrokes).toHaveLength(1)
      })
    })

    describe("paste", () => {
      test("should do nothing when clipboard is empty", async () => {
        await editor.paste()
        expect(editor.recognizer.addStrokes).not.toHaveBeenCalled()
        expect(editor.renderer.drawSymbol).not.toHaveBeenCalled()
      })

      test("should paste clones with new IDs", async () => {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)
        editor.copy()

        await editor.paste()

        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        const drawn = (editor.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        expect(drawn.id).not.toBe(stroke.id)
        expect(drawn.type).toBe(SymbolType.Stroke)
      })

      test("should paste clones offset by PASTE_OFFSET", async () => {
        const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
        editor.model.addSymbol(stroke)
        editor.copy()

        await editor.paste()

        const drawn = (editor.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        const offset = InteractiveInkEditor.PASTE_OFFSET
        drawn.pointers.forEach((p, i) => {
          expect(p.x).toBeCloseTo(stroke.pointers[i].x + offset)
          expect(p.y).toBeCloseTo(stroke.pointers[i].y + offset)
        })
      })

      test("should select pasted symbols", async () => {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)
        editor.copy()

        await editor.paste()

        expect(editor.selector.drawSelectedGroup).toHaveBeenCalled()
      })

      test("should allow multiple independent pastes", async () => {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)
        editor.copy()

        await editor.paste()
        await editor.paste()

        const calls = (editor.renderer.drawSymbol as jest.Mock).mock.calls
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
        editor.model.addSymbol(stroke)
        editor.model.selectedIds.add(stroke.id)

        await editor.cut()

        expect(editor.recognizer.eraseStrokes).toHaveBeenCalledWith([stroke.id])
        expect(editor.renderer.removeSymbol).toHaveBeenCalledWith(stroke.id)
      })

      test("should copy symbols before removing", async () => {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)
        editor.model.selectedIds.add(stroke.id)

        await editor.cut()

        expect(editor.recognizer.eraseStrokes).toHaveBeenCalledTimes(1)
        jest.clearAllMocks()

        await editor.paste()
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        const drawn = (editor.renderer.drawSymbol as jest.Mock).mock.calls[0][0] as TStroke
        expect(drawn.id).not.toBe(stroke.id)
      })

      test("should do nothing when nothing selected", async () => {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)

        await editor.cut()

        expect(editor.recognizer.eraseStrokes).not.toHaveBeenCalled()
      })
    })
  })
})
