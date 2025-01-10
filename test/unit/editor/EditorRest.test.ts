import { delay } from "../helpers"
import {
  EditorRest,
  Model,
  DefaultPenStyle,
  TEditorRestOptions,
  TEditorRestConfiguration,
  TPointer,
  PointerEventGrabber,
  RestRecognizer,
  DefaultEditorRestConfiguration
} from "../../../src/iink"

describe("EditorRest.ts", () =>
{
  const height = 100, width = 100
  const DefaultEditorRestOptions: TEditorRestOptions = {
    configuration: DefaultEditorRestConfiguration
  }

  test("should instanciate EditorRest with default grabber & recognizer", () =>
  {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    expect(editor).toBeDefined()
    expect(editor.grabber).toBeDefined()
    expect(editor.grabber instanceof PointerEventGrabber).toBe(true)
    expect(editor.recognizer).toBeDefined()
    expect(editor.recognizer instanceof RestRecognizer).toBe(true)
  })

  test("should instanciate EditorRest with custom grabber", () =>
  {
    class CustomGrabber extends PointerEventGrabber {
      name = "custom-grabber"
    }
    const customBehaviorsOptions = structuredClone(DefaultEditorRestOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { grabber: CustomGrabber }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new EditorRest(document.createElement("div"), customBehaviorsOptions)
    expect(editor).toBeDefined()
    expect(editor.grabber).toBeDefined()
    expect(editor.grabber instanceof CustomGrabber).toBe(true)
  })

  test("should instanciate EditorRest with custom recognizer", () =>
  {
    class CustomRecognizer extends RestRecognizer {
      name = "custom-recognizer"
    }
    const customBehaviorsOptions = structuredClone(DefaultEditorRestOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { recognizer: CustomRecognizer }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new EditorRest(document.createElement("div"), customBehaviorsOptions)
    expect(editor).toBeDefined()
    expect(editor.recognizer).toBeDefined()
    expect(editor.recognizer instanceof CustomRecognizer).toBe(true)
  })

  test("should init", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    editor.grabber.attach = jest.fn()
    editor.renderer.init = jest.fn()
    await editor.initialize()
    expect(editor.grabber.attach).toBeCalledTimes(1)
    expect(editor.grabber.attach).toBeCalledWith(editor.layers.rendering)
    expect(editor.renderer.init).toBeCalledTimes(1)
    expect(editor.renderer.init).toBeCalledWith(editor.layers.rendering)
  })

  test("should call renderer on drawCurrentStroke", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    editor.renderer.drawPendingStroke = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    editor.model.endCurrentStroke(p2)
    editor.drawCurrentStroke()
    expect(editor.renderer.drawPendingStroke).toBeCalledTimes(1)
    expect(editor.renderer.drawPendingStroke).toBeCalledWith(editor.model.currentSymbol)
  })

  describe("updateModelRendering", () =>
  {
    test("should call renderer.drawModel", async () =>
    {
      const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.recognizer.export = jest.fn(m => Promise.resolve(m))
      editor.updateModelRendering()
      expect(editor.renderer.drawModel).toBeCalledTimes(1)
    })

    test("should call recognizer.export", async () =>
    {
      const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.recognizer.export = jest.fn(m => Promise.resolve(m))
      await editor.updateModelRendering()
      await delay(DefaultEditorRestConfiguration.triggers.exportContentDelay)
      expect(editor.recognizer.export).toBeCalledTimes(1)
    })

    test("should reject if recognizer.export in error", async () =>
    {
      const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.recognizer.export = jest.fn(() => Promise.reject("pouet"))
      expect(editor.updateModelRendering()).rejects.toEqual("pouet")
    })

    test("should not call recognizer.export when exportContent = DEMAND", async () =>
    {
      const configuration: TEditorRestConfiguration = JSON.parse(JSON.stringify(DefaultEditorRestConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const editor = new EditorRest(document.createElement("div"), { configuration })
      await editor.initialize()
      editor.renderer.drawModel = jest.fn()
      editor.recognizer.export = jest.fn(m => Promise.resolve(m))
      await editor.updateModelRendering()
      await delay(DefaultEditorRestConfiguration.triggers.exportContentDelay)
      expect(editor.recognizer.export).toBeCalledTimes(0)
    })
  })

  test("should export", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    editor.recognizer.export = jest.fn(m => Promise.resolve(m))
    editor.export()
    await delay(DefaultEditorRestConfiguration.triggers.exportContentDelay)
    expect(editor.recognizer.export).toBeCalledTimes(1)
  })

  test("should convert", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    editor.recognizer.convert = jest.fn(m => Promise.resolve(m))
    editor.convert({ conversionState: "DIGITAL_EDIT", mimeTypes: ["mime-type"]})
    await delay(DefaultEditorRestConfiguration.triggers.exportContentDelay)
    expect(editor.recognizer.convert).toBeCalledTimes(1)
  })

  test("should resize", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    editor.renderer.resize = jest.fn()
    editor.recognizer.resize = jest.fn(m => Promise.resolve(m))
    await editor.initialize()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    editor.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    editor.model.endCurrentStroke(p2)
    await editor.resize({ height: 1, width: 2 })
    expect(editor.renderer.resize).toBeCalledTimes(1)
    expect(editor.recognizer.resize).toBeCalledTimes(1)
  })

  test("should not call recognizer on resize if no strokes", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    editor.renderer.resize = jest.fn()
    editor.recognizer.resize = jest.fn(m => Promise.resolve(m))
    await editor.resize({ height: 1, width: 2 })
    expect(editor.renderer.resize).toBeCalledTimes(1)
    expect(editor.recognizer.resize).toBeCalledTimes(0)
  })

  test("should undo", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    const model1 = new Model()
    editor.recognizer.export = jest.fn(m => Promise.resolve(m))
    editor.renderer.drawModel = jest.fn()
    editor.history.undo = jest.fn(() => model1)
    await await editor.updateModelRendering()
    await editor.undo()
    expect(editor.model).toEqual(model1)
  })

  test("should redo", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    const model2 = new Model(width, height)
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, "pen", DefaultPenStyle)
    model2.endCurrentStroke(p2)
    editor.recognizer.export = jest.fn(m => Promise.resolve(m))
    editor.renderer.drawModel = jest.fn()
    editor.history.redo = jest.fn(() => model2)
    await editor.redo()
    expect(editor.model.creationTime).toEqual(model2.creationTime)
  })

  test("should clear", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
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

  test("should destroy", async () =>
  {
    const editor = new EditorRest(document.createElement("div"), DefaultEditorRestOptions)
    await editor.initialize()
    editor.grabber.detach = jest.fn()
    editor.renderer.destroy = jest.fn()
    editor.history.push = jest.fn(m => m)
    editor.destroy()
    await delay(DefaultEditorRestConfiguration.triggers.exportContentDelay)
    expect(editor.grabber.detach).toBeCalledTimes(1)
    expect(editor.renderer.destroy).toBeCalledTimes(1)
  })

})
