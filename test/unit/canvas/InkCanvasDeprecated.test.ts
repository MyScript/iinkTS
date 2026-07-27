import { delay } from "../helpers"
import {
  InkCanvasDeprecated,
  Model,
  DefaultPenStyle,
  TInkCanvasDeprecatedOptions,
  TInkCanvasDeprecatedConfiguration,
  TPointer,
  PointerEventGrabber,
  HTTPClientV1,
  DefaultInkCanvasDeprecatedConfiguration,
} from "@/iink"

describe("InkCanvasDeprecated.ts", () => {
  const height = 100,
    width = 100
  const DefaultInkCanvasDeprecatedOptions: TInkCanvasDeprecatedOptions = {
    configuration: DefaultInkCanvasDeprecatedConfiguration,
  }

  test("should instanciate InkCanvasDeprecated with default grabber & client", () => {
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    expect(canvas).toBeDefined()
    expect(canvas.grabber).toBeDefined()
    expect(canvas.grabber instanceof PointerEventGrabber).toBe(true)
    expect(canvas.client).toBeDefined()
    expect(canvas.client instanceof HTTPClientV1).toBe(true)
  })

  test("should instanciate InkCanvasDeprecated with custom grabber", () => {
    class CustomGrabber extends PointerEventGrabber {
      name = "custom-grabber"
    }
    const customBehaviorsOptions = structuredClone(DefaultInkCanvasDeprecatedOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { grabber: CustomGrabber }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvasDeprecated(document.createElement("div"), customBehaviorsOptions)
    expect(canvas).toBeDefined()
    expect(canvas.grabber).toBeDefined()
    expect(canvas.grabber instanceof CustomGrabber).toBe(true)
  })

  test("should instanciate InkCanvasDeprecated with custom client", () => {
    class CustomClient extends HTTPClientV1 {
      name = "custom-client"
    }
    const customBehaviorsOptions = structuredClone(DefaultInkCanvasDeprecatedOptions)
    //@ts-ignore
    customBehaviorsOptions.override = { client: CustomClient }
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const canvas = new InkCanvasDeprecated(document.createElement("div"), customBehaviorsOptions)
    expect(canvas).toBeDefined()
    expect(canvas.client).toBeDefined()
    expect(canvas.client instanceof CustomClient).toBe(true)
  })

  test("should init", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    canvas.grabber.attach = jest.fn()
    canvas.renderer.init = jest.fn()
    await canvas.initialize()
    expect(canvas.grabber.attach).toHaveBeenCalledTimes(1)
    expect(canvas.grabber.attach).toHaveBeenCalledWith(canvas.layers.rendering)
    expect(canvas.renderer.init).toHaveBeenCalledTimes(1)
    expect(canvas.renderer.init).toHaveBeenCalledWith(canvas.layers.rendering, { x: 50, y: 50 })
  })

  test("should call renderer on drawCurrentStroke", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.renderer.drawPendingStroke = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    canvas.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    canvas.model.endCurrentStroke(p2)
    canvas.drawCurrentStroke()
    expect(canvas.renderer.drawPendingStroke).toHaveBeenCalledTimes(1)
    expect(canvas.renderer.drawPendingStroke).toHaveBeenCalledWith(canvas.model.currentSymbol)
  })

  describe("updateModelRendering", () => {
    test("should call renderer.drawModel", async () => {
      const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
      await canvas.initialize()
      canvas.renderer.drawModel = jest.fn()
      canvas.client.export = jest.fn((m) => Promise.resolve(m))
      canvas.updateModelRendering()
      expect(canvas.renderer.drawModel).toHaveBeenCalledTimes(1)
    })

    test("should call client.export", async () => {
      const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
      await canvas.initialize()
      canvas.renderer.drawModel = jest.fn()
      canvas.client.export = jest.fn((m) => Promise.resolve(m))
      await canvas.updateModelRendering()
      await delay(DefaultInkCanvasDeprecatedConfiguration.triggers.exportContentDelay)
      expect(canvas.client.export).toHaveBeenCalledTimes(1)
    })

    test("should reject if client.export in error", async () => {
      const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
      await canvas.initialize()
      canvas.renderer.drawModel = jest.fn()
      canvas.client.export = jest.fn(() => Promise.reject("pouet"))
      expect(canvas.updateModelRendering()).rejects.toEqual("pouet")
    })

    test("should not call client.export when exportContent = DEMAND", async () => {
      const configuration: TInkCanvasDeprecatedConfiguration = JSON.parse(
        JSON.stringify(DefaultInkCanvasDeprecatedConfiguration)
      )
      configuration.triggers.exportContent = "DEMAND"
      const canvas = new InkCanvasDeprecated(document.createElement("div"), { configuration })
      await canvas.initialize()
      canvas.renderer.drawModel = jest.fn()
      canvas.client.export = jest.fn((m) => Promise.resolve(m))
      await canvas.updateModelRendering()
      await delay(DefaultInkCanvasDeprecatedConfiguration.triggers.exportContentDelay)
      expect(canvas.client.export).toHaveBeenCalledTimes(0)
    })
  })

  test("should export", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.client.export = jest.fn((m) => Promise.resolve(m))
    canvas.export()
    await delay(DefaultInkCanvasDeprecatedConfiguration.triggers.exportContentDelay)
    expect(canvas.client.export).toHaveBeenCalledTimes(1)
  })

  test("should convert", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.client.convert = jest.fn((m) => Promise.resolve(m))
    canvas.convert({ conversionState: "DIGITAL_EDIT", mimeTypes: ["mime-type"] })
    await delay(DefaultInkCanvasDeprecatedConfiguration.triggers.exportContentDelay)
    expect(canvas.client.convert).toHaveBeenCalledTimes(1)
  })

  test("should resize", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    canvas.renderer.resize = jest.fn()
    canvas.client.resize = jest.fn((m) => Promise.resolve(m))
    await canvas.initialize()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    canvas.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    canvas.model.endCurrentStroke(p2)
    await canvas.resize({ height: 1, width: 2 })
    expect(canvas.renderer.resize).toHaveBeenCalledTimes(1)
  })

  test("should not call client on resize if no strokes", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.renderer.resize = jest.fn()
    canvas.client.resize = jest.fn((m) => Promise.resolve(m))
    await canvas.resize({ height: 1, width: 2 })
    expect(canvas.renderer.resize).toHaveBeenCalledTimes(1)
    expect(canvas.client.resize).toHaveBeenCalledTimes(0)
  })

  test("should undo", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    const model1 = new Model()
    canvas.client.export = jest.fn((m) => Promise.resolve(m))
    canvas.renderer.drawModel = jest.fn()
    canvas.history.undo = jest.fn(() => model1)
    await await canvas.updateModelRendering()
    await canvas.undo()
    expect(canvas.model).toEqual(model1)
  })

  test("should redo", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    const model2 = new Model(width, height)
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, "pen", DefaultPenStyle)
    model2.endCurrentStroke(p2)
    canvas.client.export = jest.fn((m) => Promise.resolve(m))
    canvas.renderer.drawModel = jest.fn()
    canvas.history.redo = jest.fn(() => model2)
    await canvas.redo()
    expect(canvas.model.creationTime).toEqual(model2.creationTime)
  })

  test("should clear", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.renderer.drawModel = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    canvas.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    canvas.model.endCurrentStroke(p2)
    expect(canvas.model.symbols.length).toBeGreaterThan(0)
    await canvas.clear()
    expect(canvas.model.symbols).toHaveLength(0)
  })

  test("should destroy", async () => {
    const canvas = new InkCanvasDeprecated(document.createElement("div"), DefaultInkCanvasDeprecatedOptions)
    await canvas.initialize()
    canvas.grabber.detach = jest.fn()
    canvas.renderer.destroy = jest.fn()
    canvas.history.push = jest.fn((m) => m)
    canvas.destroy()
    await delay(DefaultInkCanvasDeprecatedConfiguration.triggers.exportContentDelay)
    expect(canvas.grabber.detach).toHaveBeenCalledTimes(1)
    expect(canvas.renderer.destroy).toHaveBeenCalledTimes(1)
  })
})
