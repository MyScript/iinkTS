import { buildIIStroke } from "../helpers"
import { InkCanvas, TInkCanvasOptions, HTTPClientV2, DefaultInkCanvasConfiguration, IModel } from "@/iink"

describe("InkCanvas.ts", () => {
  const DefaultInkCanvasRestClientOptions: TInkCanvasOptions = {
    configuration: DefaultInkCanvasConfiguration,
  }

  test("should instanciate InkCanvas with default writer & client", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    expect(editor).toBeDefined()
    expect(editor.writer).toBeDefined()
    expect(editor.client).toBeDefined()
    expect(editor.client instanceof HTTPClientV2).toBe(true)
  })

  test("should instanciate InkCanvas with custom client", () => {
    class CustomClient extends HTTPClientV2 {
      name = "custom-client"
    }
    const customBehaviorsOptions = structuredClone(DefaultInkCanvasRestClientOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { client: CustomClient }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const editor = new InkCanvas(document.createElement("div"), customBehaviorsOptions)
    expect(editor).toBeDefined()
    expect(editor.client).toBeDefined()
    expect(editor.client instanceof CustomClient).toBe(true)
  })

  describe("init", () => {
    test("should call renderer init", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      editor.renderer.init = jest.fn()
      await editor.initialize()
      expect(editor.renderer.init).toHaveBeenCalledTimes(1)
      expect(editor.renderer.init).toHaveBeenCalledWith(editor.layers.rendering)
    })

    test("should attach writer", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      editor.renderer.init = jest.fn()
      editor.writer.attach = jest.fn()
      await editor.initialize()
      expect(editor.writer.attach).toHaveBeenCalledTimes(1)
      expect(editor.writer.attach).toHaveBeenCalledWith(editor.layers.root)
    })

    test("should load server infos", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      editor.renderer.init = jest.fn()
      editor.writer.attach = jest.fn()
      editor.loadInfo = jest.fn(
        async () => (editor.info = { version: "3.1.3", gitCommit: "unknown", nativeVersion: "<=3.1.1" })
      )
      await editor.initialize()
      expect(editor.loadInfo).toHaveBeenCalledTimes(1)
      expect(editor.loadInfo).toHaveBeenCalledWith(editor.configuration.server)
    })
  })

  test("should resize", async () => {
    const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    editor.renderer.resize = jest.fn()
    await editor.initialize()
    await editor.resize({ height: 1, width: 2 })
    expect(editor.renderer.resize).toHaveBeenCalledTimes(1)
  })

  test("should updateSymbolsStyle", async () => {
    const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)

    const stroke1 = buildIIStroke()
    const stroke2 = buildIIStroke()
    editor.model.addStroke(stroke1)
    editor.model.addStroke(stroke2)
    editor.renderer.drawSymbol = jest.fn()
    await editor.initialize()
    await editor.updateSymbolsStyle([stroke1.id], { color: "red" })
    expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
    expect(editor.model.strokes[0].style.color).toBe("red")
  })

  describe("undo", () => {
    test("should call client.send", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.client.send).toHaveBeenNthCalledWith(1, [stroke1], undefined)
    })
    test("should call renderer.drawSymbol when add stroke", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call renderer.removeSymbol when stroke remove", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.undo = jest.fn(() => ({ model: firstModel, changes: { removed: [stroke1] } }))
      editor.history.context.canUndo = true
      await editor.undo()
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
  })

  describe("redo", () => {
    test("should call renderer.drawSymbol when added stroke", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.client.send).toHaveBeenNthCalledWith(1, [stroke1], undefined)
    })
    test("should call renderer.drawSymbol when added stroke", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = editor.model.clone()
      firstModel.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(editor.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should redo when removed stroke", async () => {
      const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await editor.initialize()
      const stroke1 = buildIIStroke()
      editor.model.addStroke(stroke1)
      editor.client.send = jest.fn()
      editor.renderer.drawSymbol = jest.fn()
      editor.renderer.removeSymbol = jest.fn()
      editor.history.redo = jest.fn(() => ({ model: new IModel(), changes: { removed: [stroke1] } }))
      editor.history.context.canRedo = true
      await editor.redo()
      expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(editor.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke1.id)
    })
  })

  test("should clear", async () => {
    const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    await editor.initialize()
    const stroke1 = buildIIStroke()
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
    const editor = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    await editor.initialize()
    editor.renderer.destroy = jest.fn()
    editor.history.push = jest.fn((m) => m)
    editor.destroy()
    expect(editor.renderer.destroy).toHaveBeenCalledTimes(1)
  })
})
