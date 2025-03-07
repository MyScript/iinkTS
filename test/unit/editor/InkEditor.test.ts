import { buildOIStroke } from "../helpers"
import {
  InkEditor,
  TInkEditorOptions,
  RecognizerHTTPV2,
  DefaultInkEditorConfiguration
} from "../../../src/iink"

describe("InkEditor.ts", () => {
  const DefaultEditorRestRecognizerOptions: TInkEditorOptions = {
    configuration: DefaultInkEditorConfiguration
  }

  test("should instanciate InkEditor with default writer & recognizer", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
    expect(editor).toBeDefined()
    expect(editor.writer).toBeDefined()
    expect(editor.recognizer).toBeDefined()
    expect(editor.recognizer instanceof RecognizerHTTPV2).toBe(true)
  })

  test("should instanciate InkEditor with custom recognizer", () => {
    class CustomRecognizer extends RecognizerHTTPV2 {
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



  describe("init", () => {
    test("should call renderer init", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      editor.renderer.init = jest.fn()
      await editor.initialize()
      expect(editor.renderer.init).toHaveBeenCalledTimes(1)
      expect(editor.renderer.init).toHaveBeenCalledWith(editor.layers.rendering)
    })

    test("should attach writer", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      editor.renderer.init = jest.fn()
      editor.writer.attach = jest.fn()
      await editor.initialize()
      expect(editor.writer.attach).toHaveBeenCalledTimes(1)
      expect(editor.writer.attach).toHaveBeenCalledWith(editor.layers.root)
    })

    test("should resize", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      editor.renderer.resize = jest.fn()
      await editor.initialize()
      await editor.resize({ height: 1, width: 2 })
      expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
    })

    describe("undo", () => {
      test("should undo when added stroke", async () => {
        const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
        await editor.initialize()
        const stroke1 = buildOIStroke()
        const firstModel = editor.model.clone()
        firstModel.addStroke(stroke1)
        editor.recognizer.send = jest.fn()
        editor.renderer.drawSymbol = jest.fn()
        editor.renderer.removeSymbol = jest.fn()
        editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
        editor.history.context.canUndo = true
        await editor.undo()
        expect(editor.recognizer.send).toHaveBeenCalledTimes(0)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
        expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      })
      test("should undo when removed stroke", async () => {
        const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
        await editor.initialize()
        const stroke1 = buildOIStroke()
        const firstModel = editor.model.clone()
        firstModel.addStroke(stroke1)
        editor.recognizer.send = jest.fn()
        editor.renderer.drawSymbol = jest.fn()
        editor.renderer.removeSymbol = jest.fn()
        editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
        editor.history.context.canUndo = true
        await editor.undo()
        expect(editor.recognizer.send).toHaveBeenCalledTimes(0)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
        expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      })
    })

    describe("redo", () => {
      test("should redo when added stroke", async () => {
        const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
        await editor.initialize()
        const stroke1 = buildOIStroke()
        const firstModel = editor.model.clone()
        firstModel.addStroke(stroke1)
        editor.recognizer.send = jest.fn()
        editor.renderer.drawSymbol = jest.fn()
        editor.renderer.removeSymbol = jest.fn()
        editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
        editor.history.context.canRedo = true
        await editor.redo()
        expect(editor.recognizer.send).toHaveBeenCalledTimes(0)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
        expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      })
      test("should redo when removed stroke", async () => {
        const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
        await editor.initialize()
        const stroke1 = buildOIStroke()
        const firstModel = editor.model.clone()
        firstModel.addStroke(stroke1)
        editor.recognizer.send = jest.fn()
        editor.renderer.drawSymbol = jest.fn()
        editor.renderer.removeSymbol = jest.fn()
        editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { erased: [stroke1] } }))
        editor.history.context.canRedo = true
        await editor.redo()
        expect(editor.recognizer.send).toHaveBeenCalledTimes(0)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      })
    })

    test("should clear", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      await editor.initialize()
      const stroke1 = buildOIStroke()
      editor.model.addStroke(stroke1)
      editor.history.push = jest.fn()
      editor.renderer.clear = jest.fn()
      expect(editor.model.strokes.length).toBeGreaterThan(0)
      await editor.clear()
      expect(editor.model.strokes).toHaveLength(0)
      expect(editor.renderer.clear).toHaveBeenCalledTimes(1)
      expect(editor.history.push).toHaveBeenCalledTimes(1)
    })

    test("should destroy", async () => {
      const editor = new InkEditor(document.createElement("div"), DefaultEditorRestRecognizerOptions)
      await editor.initialize()
      editor.renderer.destroy = jest.fn()
      editor.history.push = jest.fn(m => m)
      editor.destroy()
      expect(editor.renderer.destroy).toHaveBeenCalledTimes(1)
    })
  })
})
