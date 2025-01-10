import { jiixText } from "../__dataset__/exports.dataset"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { buildOICircle, buildOIGroup, buildOIStroke, buildRecognizedText, buildOIText, delay } from "../helpers"
import
{
  EditorOffscreen,
  DefaultEditorOffscreenConfiguration,
  EditorTool,
  TEditorOffscreenOptions,
  TStyle,
  PartialDeep,
  OIStroke,
  SymbolType,
  OIShapeCircle,
  ShapeKind,
  TOISymbol,
} from "../../../src/iink"

describe("EditorOffscreen.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock
  const EditorOptions: TEditorOffscreenOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultEditorOffscreenConfiguration))
  }

  test("should instanciate", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    expect(editor).toBeDefined()
  })

  describe("Style", () =>
  {
    const customEditorOptions: TEditorOffscreenOptions = JSON.parse(JSON.stringify(EditorOptions))
    const initCustomStyle: TStyle = { color: "#d1d1d1", width: 42 }
    customEditorOptions.configuration!.penStyle = initCustomStyle
    const editor = new EditorOffscreen(document.createElement("div"), customEditorOptions)

    test("should define style", async () =>
    {
      expect(editor.penStyle).toEqual(expect.objectContaining(initCustomStyle))
    })
    test("should change Style", async () =>
    {
      const customStyle: TStyle = { color: "red", width: 51, fill: "black", opacity: 0.5 }
      editor.penStyle = customStyle
      expect(editor.penStyle).toEqual(expect.objectContaining(customStyle))
    })
  })

  describe("init", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.menu.render = jest.fn()
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()

    test("should init grabber, renderer & recognizer & context", async () =>
    {
      editor.recognizer.init = jest.fn(() => Promise.resolve())
      editor.initialize()
      expect(editor.history.context.canRedo).toEqual(false)
      expect(editor.history.context.canUndo).toEqual(false)
      expect(editor.history.context.empty).toEqual(true)
      expect(editor.history.context.stackIndex).toEqual(0)
      expect(editor.history.stack.length).toEqual(1)
      await expect(editor.grabber.attach).toBeCalledTimes(1)
      await expect(editor.renderer.init).toBeCalledTimes(1)
      await expect(editor.recognizer.init).toBeCalledTimes(1)
    })
    test("should resolve init when recognizer.init is resolve", async () =>
    {
      editor.recognizer.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      await expect(editor.recognizer.init).toBeCalledTimes(1)
    })
    test("should reject init when recognizer.init is reject", async () =>
    {
      editor.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(editor.initialize()).rejects.toEqual("pouet")
    })
  })

  describe("CRUD", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.menu.update = jest.fn()
    editor.svgDebugger.apply = jest.fn()
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

    test("add stroke", async () =>
    {
      const stroke = buildOIStroke()
      await editor.addSymbol(stroke)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("add shape", async () =>
    {
      const shape = buildOICircle()
      await editor.addSymbol(shape)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("create stroke", async () =>
    {
      const stroke: PartialDeep<OIStroke> = {
        type: SymbolType.Stroke,
        pointers: [{ x: 0, y: 1, t: 1, p: 1 }]
      }
      await editor.createSymbol(stroke)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [expect.objectContaining(stroke)], false)
    })
    test("create shape", async () =>
    {
      const shape: PartialDeep<OIShapeCircle> = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 5, y: 5 },
        radius: 5
      }
      await editor.createSymbol(shape)
      expect(editor.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [], false)
    })
    test("replace stroke by stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      await editor.replaceSymbols([stroke1], [stroke2])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(editor.recognizer.replaceStrokes).toHaveBeenNthCalledWith(1, [stroke1.id], [stroke2])
    })
    test("replace stroke by shape", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await editor.replaceSymbols([stroke], [shape])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(editor.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("replace shape by stroke", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await editor.replaceSymbols([shape], [stroke])
      expect(editor.model.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(editor.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(editor.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("change order symbol", async () =>
    {
      const stroke = buildOIStroke()
      await editor.changeOrderSymbol(stroke, "last")
      expect(editor.model.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke.id, "last")
      expect(editor.renderer.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke, "last")
    })
    test("remove stroke", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.symbols.push(stroke)
      await editor.removeSymbol(stroke.id)
      expect(editor.model.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(editor.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(editor.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("remove shape", async () =>
    {
      const shape = buildOICircle()
      editor.model.symbols.push(shape)
      await editor.removeSymbol(shape.id)
      expect(editor.model.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(editor.renderer.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
    })
  })

  describe("updateSymbolsStyle", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.renderer.drawSymbol = jest.fn()
    const stroke1 = buildOIStroke()
    editor.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    editor.model.addSymbol(stroke2)
    test("should update symbol color and draw", async () =>
    {
      await editor.initialize()
      expect(editor.model.symbols[0].style.color).toEqual("#000000")
      editor.updateSymbolsStyle([stroke1.id], { color: "red" })
      expect(editor.model.symbols[0].style.color).toEqual("red")
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should update symbol width and draw", async () =>
    {
      await editor.initialize()
      expect(editor.model.symbols[1].style.width).toEqual(2)
      editor.updateSymbolsStyle([stroke2.id], { width: 42 })
      expect(editor.model.symbols[1].style.width).toEqual(42)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke2)
    })
  })

  describe("Writer", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.writer.start = jest.fn()
    editor.writer.continue = jest.fn()
    editor.writer.end = jest.fn()
    const pointerId = 666
    test("should call writer.start on pointerdown", async () =>
    {
      await editor.initialize()
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(editor.writer.start).toBeCalledTimes(1)
      expect(editor.writer.continue).toBeCalledTimes(0)
      expect(editor.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.continue on pointermove", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(editor.writer.start).toBeCalledTimes(0)
      expect(editor.writer.continue).toBeCalledTimes(1)
      expect(editor.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.end on pointerup", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(editor.writer.start).toBeCalledTimes(0)
      expect(editor.writer.continue).toBeCalledTimes(0)
      expect(editor.writer.end).toBeCalledTimes(1)
    })
  })

  describe("Eraser", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.tool = EditorTool.Erase
    editor.recognizer.init = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.eraser.start = jest.fn()
    editor.eraser.continue = jest.fn()
    editor.eraser.end = jest.fn()
    const pointerId = 666
    test("should call eraseManager.start on pointerdown", async () =>
    {
      await editor.initialize()
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(editor.eraser.start).toBeCalledTimes(1)
      expect(editor.eraser.continue).toBeCalledTimes(0)
      expect(editor.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.continue on pointermove", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(editor.eraser.start).toBeCalledTimes(0)
      expect(editor.eraser.continue).toBeCalledTimes(1)
      expect(editor.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.end on pointerup", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(editor.eraser.start).toBeCalledTimes(0)
      expect(editor.eraser.continue).toBeCalledTimes(0)
      expect(editor.eraser.end).toBeCalledTimes(1)
    })
  })

  describe("Select", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.tool = EditorTool.Select
    editor.updateLayerUI = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.selector.start = jest.fn()
    editor.selector.continue = jest.fn()
    editor.selector.end = jest.fn()
    editor.selector.removeSelectedGroup = jest.fn()
    editor.selector.drawSelectedGroup = jest.fn()
    editor.event.emitSelected = jest.fn()
    const pointerId = 666
    const stroke = buildOIStroke()
    const circle = buildOICircle()

    beforeAll(async () => {
      await editor.initialize()
      editor.model.addSymbol(stroke)
      editor.model.addSymbol(circle)
    })

    test("should select all symbols", async () =>
    {
      editor.selectAll()
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(editor.selector.drawSelectedGroup).toHaveBeenNthCalledWith(1,[stroke, circle])
      expect(editor.event.emitSelected).toHaveBeenNthCalledWith(1,[stroke, circle])
    })
    test("should unselect all symbols", async () =>
    {
      editor.unselectAll()
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(editor.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
      expect(editor.event.emitSelected).toHaveBeenNthCalledWith(1,[])
    })
    test("should call selector.start on pointerdown", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 1,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerDown)
      expect(editor.selector.start).toBeCalledTimes(1)
      expect(editor.selector.continue).toBeCalledTimes(0)
      expect(editor.selector.end).toBeCalledTimes(0)
    })
    test("should call selector.continue on pointermove", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 5,
        clientY: 4,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerMove)
      expect(editor.selector.start).toBeCalledTimes(0)
      expect(editor.selector.continue).toBeCalledTimes(1)
      expect(editor.selector.end).toBeCalledTimes(0)
    })
    test("should call selector.end on pointerup", async () =>
    {
      const target = editor.layers.root.querySelector("svg") as SVGSVGElement
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 10,
        clientY: 11,
        pressure: 1,
        pointerId
      }) as PointerEvent

      target.dispatchEvent(pointerUp)
      expect(editor.selector.start).toBeCalledTimes(0)
      expect(editor.selector.continue).toBeCalledTimes(0)
      expect(editor.selector.end).toBeCalledTimes(1)
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

    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.event.emitIdle = jest.fn()
    editor.layers.updateState = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.recognizer.addStrokes = jest.fn()
    editor.updateLayerUI = jest.fn()
    editor.event.emitImported = jest.fn()

    test("should update layer state", async () =>
    {
      await editor.importPointEvents(pStrokes)
      expect(editor.event.emitIdle).toHaveBeenNthCalledWith(1, false)
      expect(editor.layers.updateState).toHaveBeenNthCalledWith(1, false)
    })
    test("should call recognizer.addStrokes", async () =>
    {
      await editor.importPointEvents(pStrokes)
      expect(editor.recognizer.addStrokes).toBeCalledTimes(1)
    })
    test("should add symbols to model and draw", async () =>
    {
      editor.model.symbols = []
      await editor.importPointEvents(pStrokes)
      expect(editor.model.symbols).toHaveLength(pStrokes.length)
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(2)
    })
    test("should update layer UI", async () =>
    {
      await editor.importPointEvents(pStrokes)
      expect(editor.updateLayerUI).toHaveBeenCalledTimes(1)
    })
    test("should emit Imported", async () =>
    {
      await editor.importPointEvents(pStrokes)
      expect(editor.event.emitImported).toHaveBeenCalledTimes(1)
    })
  })

  describe("Download", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    const stroke1 = buildOIStroke()
    stroke1.selected = true
    editor.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    editor.model.addSymbol(stroke2)

    editor.renderer.getElementById = jest.fn((id) =>
    {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.id = id
      return p
    })

    test("should call trigger download svg file", async () =>
    {
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
    test.skip("should call trigger download png file", async () =>
    {
      global.URL.createObjectURL = jest.fn(() => "download-png-url")
      //@ts-ignore
      global.Image = class
      {
        onload: () => void
        //@ts-ignore
        constructor()
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
      jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
      editor.downloadAsPNG()
      await delay(101)
      expect(link.href).toContain("download-png-url")
      expect(link.click).toHaveBeenCalledTimes(1)
    })
    test("should call trigger download json file", async () =>
    {
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
    test("should call trigger download json file with only selected files", async () =>
    {
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
  })

  describe("extract symbols", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
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
      const strokes = editor.extractStrokesFromSymbols(symbols)
      expect(strokes).toEqual([stroke1, stroke2, ...strokeText.strokes, ...group.children.filter(s => s.type === SymbolType.Stroke)])
    })
    test("should extract texts", () =>
    {
      const texts = editor.extractTextsFromSymbols(symbols)
      expect(texts).toEqual([text1, text2, ...group.children.filter(s => s.type === SymbolType.Text)])
    })
  })

  describe("undo", () =>
  {
    let editor!: EditorOffscreen

    beforeEach(() =>
    {
      editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
      editor.event.emitIdle = jest.fn()
      editor.unselectAll = jest.fn()
      editor.history.undo = jest.fn()
      editor.recognizer.undo = jest.fn(() => Promise.resolve())
      editor.renderer.removeSymbol = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.menu.update = jest.fn()
      editor.svgDebugger.apply = jest.fn()
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canUndo = false", async () =>
    {
      editor.history.context.canUndo = false
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(0)
      expect(editor.renderer.drawSymbol).toBeCalledTimes(0)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.drawSymbol when history.undo return added stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ added: [stroke1] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should not call recognizer.undo & call renderer.drawSymbol when history.undo return added shape", async () =>
    {
      const circle = buildOICircle()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(circle)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(0)
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(circle)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.undo & renderer.removeSymbol when history.undo return erased stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      editor.model.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(0)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(1)
      expect(editor.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return replaced stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(1)
      expect(editor.renderer.removeSymbol).toBeCalledWith(stroke2.id)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return matrix", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, symbols: [stroke1] } } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ matrix: { matrix: { tx: 2, ty: 3, xx: 4, xy: 5, yx: 6, yy: 7 }, strokes: [stroke1] } }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return translate", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { translate: [{ tx: 1, ty: 2, symbols: [stroke1] }] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ translate: [{ tx: 1, ty: 2, strokes: [stroke1] }] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return scale", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, symbols: [stroke1] }] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ scale: [{ origin: { x: 1, y: 2 }, scaleX: 2, scaleY: 4, strokes: [stroke1] }] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.undo & renderer.drawSymbol & renderer.removeSymbol when history.undo return rotate", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { rotate: [{ angle: 42, center: { x: 1, y: 2 }, symbols: [stroke1] }] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.recognizer.undo).toBeCalledTimes(1)
      expect(editor.recognizer.undo).toBeCalledWith(expect.objectContaining({ rotate: [{ angle: 42, center: { x: 1, y: 2 }, strokes: [stroke1] }] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
  })

  describe("redo", () =>
  {
    let editor!: EditorOffscreen

    beforeEach(() =>
    {
      editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
      editor.event.emitIdle = jest.fn()
      editor.unselectAll = jest.fn()
      editor.history.undo = jest.fn()
      editor.recognizer.redo = jest.fn(() => Promise.resolve())
      editor.renderer.removeSymbol = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.menu.update = jest.fn()
      editor.svgDebugger.apply = jest.fn()
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    })

    test("should do nothing if canRedo = false", async () =>
    {
      editor.history.context.canRedo = false
      await editor.redo()
      expect(editor.recognizer.redo).toBeCalledTimes(0)
      expect(editor.renderer.drawSymbol).toBeCalledTimes(0)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.drawSymbol when history.redo return added stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const secondModel = editor.model.clone()
      secondModel.addSymbol(stroke1)
      editor.history.context.canRedo = true
      editor.history.redo = jest.fn(() => ({ model: secondModel, changes: { added: [stroke1] } }))
      await editor.redo()
      expect(editor.recognizer.redo).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should not call recognizer.redo & call renderer.drawSymbol when history.redo return added shape", async () =>
    {
      const circle = buildOICircle()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(circle)
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [circle] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toBeCalledTimes(0)
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(circle)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(0)
    })
    test("should call recognizer.redo & renderer.removeSymbol when history.redo return erased stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const firstModel = editor.model.clone()
      editor.model.addSymbol(stroke1)
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toBeCalledTimes(1)
      expect(editor.recognizer.redo).toBeCalledWith(expect.objectContaining({ erased: [stroke1] }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(0)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(1)
      expect(editor.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should call recognizer.redo & renderer.drawSymbol & renderer.removeSymbol when history.redo return replaced stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      const firstModel = editor.model.clone()
      firstModel.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { replaced: { newSymbols: [stroke2], oldSymbols: [stroke1] } } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.recognizer.redo).toBeCalledTimes(1)
      expect(editor.recognizer.redo).toBeCalledWith(expect.objectContaining({ replaced: { newStrokes: [stroke2], oldStrokes: [stroke1] } }))
      expect(editor.renderer.drawSymbol).toBeCalledTimes(1)
      expect(editor.renderer.drawSymbol).toBeCalledWith(stroke1)
      expect(editor.renderer.removeSymbol).toBeCalledTimes(1)
      expect(editor.renderer.removeSymbol).toBeCalledWith(stroke2.id)
    })
  })

  describe("export", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)

    test("should call recognizer.export", async () =>
    {
      editor.recognizer.export = jest.fn(() => Promise.resolve(jiixText))
      await editor.export()
      await expect(editor.recognizer.export).toBeCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () =>
    {
      editor.recognizer.export = jest.fn(() => Promise.reject("export-error"))
      editor.event.emitError = jest.fn()
      await expect(async () => await editor.export()).rejects.toEqual("export-error")
      expect(editor.event.emitError).toHaveBeenCalledTimes(1)
    })
  })

  describe("convert", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.svgDebugger.apply = jest.fn()
    editor.event.emitConverted = jest.fn()
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.converter.apply = jest.fn(() => Promise.resolve())

    test("should call converter.apply", async () =>
    {
      await editor.convert()
      await expect(editor.converter.apply).toBeCalledTimes(1)
    })
    test("should emitConverted", async () =>
    {
      await editor.convert()
      expect(editor.event.emitConverted).toBeCalledTimes(1)
    })
    test("should emit error if converter.apply is rejected", async () =>
    {
      editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      editor.converter.apply = jest.fn(() => Promise.reject("convert-error"))
      editor.event.emitError = jest.fn()
      await expect(async () => await editor.convert()).rejects.toEqual("convert-error")
      expect(editor.event.emitError).toHaveBeenCalledTimes(1)
      expect(editor.event.emitError).toHaveBeenCalledWith("convert-error")
    })
  })

  describe("idle", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    editor.event.emitIdle = jest.fn()
    editor.layers.updateState = jest.fn()

    beforeAll(async () =>
    {
      await editor.initialize()
    })

    test("should call recognizer.waitForIdle", async () =>
    {
      await editor.waitForIdle()
      await expect(editor.recognizer.waitForIdle).toBeCalledTimes(1)
    })
    test("should emit idle & call layers.updateState when recognizer emit idle", async () =>
    {
      editor.recognizer.event.emitIdle(true)
      expect(editor.event.emitIdle).toHaveBeenNthCalledWith(1, true)
      expect(editor.layers.updateState).toHaveBeenNthCalledWith(1, true)
    })
  })

  describe("resize", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.menu.render = jest.fn()
    editor.menu.style.update = jest.fn()
    editor.renderer.resize = jest.fn()
    editor.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () =>
    {
      await editor.initialize()
    })

    test("should call renderer.resize", async () =>
    {
      await editor.initialize()
      await editor.resize({ height: 1, width: 2})
      await expect(editor.renderer.resize).toBeCalledTimes(1)
    })
    test("should update model", async () =>
    {
        await editor.resize({ height: 5, width: 6})
      await expect(editor.model.height).toEqual(5)
      await expect(editor.model.width).toEqual(6)
    })
  })

  describe("clear", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.svgDebugger.apply = jest.fn()
    editor.selector.removeSelectedGroup = jest.fn()
    editor.renderer.clear = jest.fn()
    editor.recognizer.clear = jest.fn(() => Promise.resolve())
    editor.recognizer.init = jest.fn(() => Promise.resolve())

    beforeAll(async () =>
    {
      await editor.initialize()
    })

    test("should call renderer.clear", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      await expect(editor.renderer.clear).toBeCalledTimes(1)
    })
    test("should call selector.removeSelectedGroup", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      await expect(editor.selector.removeSelectedGroup).toBeCalledTimes(1)
    })
    test("should call recognizer.clear", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.addSymbol(stroke)
      editor.clear()
      await expect(editor.recognizer.clear).toBeCalledTimes(1)
    })
    test("should clear model", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.addSymbol(stroke)
      await editor.clear()
      expect(editor.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () =>
    {
      await editor.clear()
      await expect(editor.renderer.clear).toBeCalledTimes(0)
      await expect(editor.recognizer.clear).toBeCalledTimes(0)
    })
  })

  describe("destroy", () =>
  {
    const editor = new EditorOffscreen(document.createElement("div"), EditorOptions)
    editor.grabber.detach = jest.fn()
    editor.renderer.destroy = jest.fn()
    editor.recognizer.destroy = jest.fn()

    test("should call grabber.detach", async () =>
    {
      editor.destroy()
      await expect(editor.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      editor.destroy()
      await expect(editor.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      editor.destroy()
      await expect(editor.recognizer.destroy).toBeCalledTimes(1)
    })

  })
})
