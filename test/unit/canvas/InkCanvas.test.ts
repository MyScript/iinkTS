import { buildIIStroke } from "../helpers"
import { InkCanvas, TInkCanvasOptions, HTTPClientV2, DefaultInkCanvasConfiguration, IModel } from "@/iink"

describe("InkCanvas.ts", () => {
  const DefaultInkCanvasRestClientOptions: TInkCanvasOptions = {
    configuration: DefaultInkCanvasConfiguration,
  }

  test("should instanciate InkCanvas with default writer & client", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    expect(canvas).toBeDefined()
    expect(canvas.writer).toBeDefined()
    expect(canvas.client).toBeDefined()
    expect(canvas.client instanceof HTTPClientV2).toBe(true)
  })

  test("should instanciate InkCanvas with custom client", () => {
    class CustomClient extends HTTPClientV2 {
      name = "custom-client"
    }
    const customBehaviorsOptions = structuredClone(DefaultInkCanvasRestClientOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { client: CustomClient }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvas(document.createElement("div"), customBehaviorsOptions)
    expect(canvas).toBeDefined()
    expect(canvas.client).toBeDefined()
    expect(canvas.client instanceof CustomClient).toBe(true)
  })

  describe("init", () => {
    test("should call renderer init", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      canvas.renderer.init = jest.fn()
      await canvas.initialize()
      expect(canvas.renderer.init).toHaveBeenCalledTimes(1)
      expect(canvas.renderer.init).toHaveBeenCalledWith(canvas.layers.rendering)
    })

    test("should attach writer", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      canvas.renderer.init = jest.fn()
      canvas.writer.attach = jest.fn()
      await canvas.initialize()
      expect(canvas.writer.attach).toHaveBeenCalledTimes(1)
      expect(canvas.writer.attach).toHaveBeenCalledWith(canvas.layers.root)
    })

    test("should load server infos", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      canvas.renderer.init = jest.fn()
      canvas.writer.attach = jest.fn()
      canvas.loadInfo = jest.fn(
        async () => (canvas.info = { version: "3.1.3", gitCommit: "unknown", nativeVersion: "<=3.1.1" })
      )
      await canvas.initialize()
      expect(canvas.loadInfo).toHaveBeenCalledTimes(1)
      expect(canvas.loadInfo).toHaveBeenCalledWith(canvas.configuration.server)
    })
  })

  test("should resize", async () => {
    const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    canvas.renderer.resize = jest.fn()
    await canvas.initialize()
    await canvas.resize({ height: 1, width: 2 })
    expect(canvas.renderer.resize).toHaveBeenCalledTimes(1)
  })

  test("should updateSymbolsStyle", async () => {
    const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)

    const stroke1 = buildIIStroke()
    const stroke2 = buildIIStroke()
    canvas.model.addStroke(stroke1)
    canvas.model.addStroke(stroke2)
    canvas.renderer.drawSymbol = jest.fn()
    await canvas.initialize()
    await canvas.updateSymbolsStyle([stroke1.id], { color: "red" })
    expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
    expect(canvas.model.strokes[0].style.color).toBe("red")
  })

  describe("undo", () => {
    test("should call client.send", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.client.send).toHaveBeenNthCalledWith(1, [stroke1], undefined)
    })
    test("should call renderer.drawSymbol when add stroke", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should call renderer.removeSymbol when stroke remove", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.undo = jest.fn(() => ({ model: firstModel, changes: { removed: [stroke1] } }))
      canvas.history.context.canUndo = true
      await canvas.undo()
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
  })

  describe("redo", () => {
    test("should call renderer.drawSymbol when added stroke", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.client.send).toHaveBeenNthCalledWith(1, [stroke1], undefined)
    })
    test("should call renderer.drawSymbol when added stroke", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      const firstModel = canvas.model.clone()
      firstModel.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.redo = jest.fn(() => ({ model: firstModel, changes: { added: [stroke1] } }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke1)
      expect(canvas.renderer.removeSymbol).toHaveBeenCalledTimes(0)
    })
    test("should redo when removed stroke", async () => {
      const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
      await canvas.initialize()
      const stroke1 = buildIIStroke()
      canvas.model.addStroke(stroke1)
      canvas.client.send = jest.fn()
      canvas.renderer.drawSymbol = jest.fn()
      canvas.renderer.removeSymbol = jest.fn()
      canvas.history.redo = jest.fn(() => ({ model: new IModel(), changes: { removed: [stroke1] } }))
      canvas.history.context.canRedo = true
      await canvas.redo()
      expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(canvas.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke1.id)
    })
  })

  test("should clear", async () => {
    const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    await canvas.initialize()
    const stroke1 = buildIIStroke()
    canvas.model.addStroke(stroke1)
    canvas.history.push = jest.fn()
    canvas.renderer.clear = jest.fn()
    expect(canvas.model.strokes.length).toBeGreaterThan(0)
    await canvas.clear()
    expect(canvas.model.strokes).toHaveLength(0)
    expect(canvas.renderer.clear).toHaveBeenCalledTimes(1)
    expect(canvas.history.push).toHaveBeenCalledTimes(1)
  })

  test("should destroy", async () => {
    const canvas = new InkCanvas(document.createElement("div"), DefaultInkCanvasRestClientOptions)
    await canvas.initialize()
    canvas.renderer.destroy = jest.fn()
    canvas.history.push = jest.fn((m) => m)
    canvas.destroy()
    expect(canvas.renderer.destroy).toHaveBeenCalledTimes(1)
  })
})
