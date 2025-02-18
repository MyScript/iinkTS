import { delay } from "../helpers"
import {
  InkEditor,
  Model,
  DefaultPenStyle,
  TInkEditorOptions,
  TInkEditorConfiguration,
  TPointer,
  PointerEventGrabber,
  InkRecognizer,
  DefaultInkEditorConfiguration
} from "../../../src/iink"

describe("InkEditor.ts", () => {
  const height = 100, width = 100
  const DefaultEditorRestRecognizerOptions: TInkEditorOptions = {
    configuration: DefaultInkEditorConfiguration
  }

  test("should instanciate InkEditor with default grabber & recognizer", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    expect(editor).toBeDefined()
    expect(editor.grabber).toBeDefined()
    expect(editor.grabber instanceof PointerEventGrabber).toBe(true)
    expect(editor.recognizer).toBeDefined()
    expect(editor.recognizer instanceof InkRecognizer).toBe(true)
  })

  test("should instanciate InkEditor with custom grabber", () => {
    class CustomGrabber extends PointerEventGrabber {
      name = "custom-grabber"
    }
    const customBehaviorsOptions = structuredClone(DefaultEditorRestRecognizerOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { grabber: CustomGrabber }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkEditor(document.createElement("div"), customBehaviorsOptions)
    expect(editor).toBeDefined()
    expect(editor.grabber).toBeDefined()
    expect(editor.grabber instanceof CustomGrabber).toBe(true)
  })

  test("should instanciate InkEditor with custom recognizer", () => {
    class CustomRecognizer extends InkRecognizer {
      name = "custom-recognizer"
    }
    const customBehaviorsOptions = structuredClone(DefaultEditorRestRecognizerOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { recognizer: CustomRecognizer }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkEditor(document.createElement("div"), customBehaviorsOptions)
    expect(editor).toBeDefined()
    expect(editor.recognizer).toBeDefined()
    expect(editor.recognizer instanceof CustomRecognizer).toBe(true)
  })

  test("should init", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    await editor.initialize()
    expect(editor.grabber.attach).toHaveBeenCalledTimes(1)
    expect(editor.grabber.attach).toHaveBeenCalledWith(editor.layers.rendering)
    expect(editor.renderer.init).toHaveBeenCalledTimes(1)
    expect(editor.renderer.init).toHaveBeenCalledWith(editor.layers.rendering)
  })

  test("should call renderer on drawCurrentStroke", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    editor.renderer.drawPendingStroke = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    editor.model.endCurrentStroke(p2)
    editor.drawCurrentStroke()
    expect(editor.renderer.drawPendingStroke).toHaveBeenCalledTimes(1)
    expect(editor.renderer.drawPendingStroke).toHaveBeenCalledWith(editor.model.currentSymbol)
  })

  describe("updateModelRendering", () => {
    test("should call renderer.drawModel", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.updateModelRendering()
      expect(editor.renderer.drawModel).toHaveBeenCalledTimes(1)
    })

    test("should not call recognizer.export when exportContent = DEMAND", async () => {
      const configuration: TInkEditorConfiguration = JSON.parse(JSON.stringify(DefaultInkEditorConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const editor = new InkEditor(document.createElement("div"), { configuration })
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.recognizer.send = jest.fn()
      await editor.updateModelRendering()
      await delay(DefaultInkEditorConfiguration.triggers.exportContentDelay)
      expect(editor.recognizer.send).toHaveBeenCalledTimes(0)
    })
  })

  test("should resize", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    editor.renderer.resize = jest.fn()
    await editor.initialize()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    editor.model.endCurrentStroke(p2)
    await editor.resize({ height: 1, width: 2 })
    expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
  })

  test("should not call recognizer on resize if no strokes", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    editor.renderer.resize = jest.fn()
    await editor.resize({ height: 1, width: 2 })
    expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
  })

  test("should undo", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    const model1 = new Model()
    editor.renderer.drawModel = jest.fn()
    editor.history.undo = jest.fn(() => model1)
    await await editor.updateModelRendering()
    await editor.undo()
    expect(editor.model).toEqual(model1)
  })

  test("should redo", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    const model2 = new Model(width, height)
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, "pen", DefaultPenStyle)
    model2.endCurrentStroke(p2)
    editor.renderer.drawModel = jest.fn()
    editor.history.redo = jest.fn(() => model2)
    await editor.redo()
    expect(editor.model.creationTime).toEqual(model2.creationTime)
  })

  test("should clear", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    editor.renderer.drawModel = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    editor.model.endCurrentStroke(p2)
    expect(editor.model.symbols.length).toBeGreaterThan(0)
    await editor.clear()
    expect(editor.model.symbols).toHaveLength(0)
  })

  test("should destroy", async () => {
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    await editor.initialize()
    editor.grabber.detach = jest.fn()
    editor.renderer.destroy = jest.fn()
    editor.history.push = jest.fn(m => m)
    editor.destroy()
    expect(editor.grabber.detach).toHaveBeenCalledTimes(1)
    expect(editor.renderer.destroy).toHaveBeenCalledTimes(1)
  })

})