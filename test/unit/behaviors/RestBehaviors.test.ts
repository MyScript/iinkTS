
import { delay } from "../helpers"
import {
  RestBehaviors,
  Model,
  DefaultConfiguration,
  DefaultPenStyle,
  TBehaviorOptions,
  TConfiguration,
  TPointer,
  EditorLayer
} from "../../../src/iink"

describe("RestBehaviors.ts", () =>
{
  const height = 100, width = 100
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: DefaultConfiguration
  }

  test("should instanciate RestBehaviors", () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    //@ts-ignore IIC-1006 Type instantiation is excessively deep and possibly infinite.
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    expect(rb).toBeDefined()
  })

  test("should init", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    rb.grabber.attach = jest.fn()
    rb.renderer.init = jest.fn()
    await rb.init()
    expect(rb.grabber.attach).toBeCalledTimes(1)
    expect(rb.grabber.attach).toBeCalledWith(layers.render)
    expect(rb.renderer.init).toBeCalledTimes(1)
    expect(rb.renderer.init).toBeCalledWith(layers.render)
  })

  test("should call renderer on drawCurrentStroke", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.renderer.drawPendingStroke = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    rb.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    rb.model.endCurrentStroke(p2)
    rb.drawCurrentStroke()
    expect(rb.renderer.drawPendingStroke).toBeCalledTimes(1)
    expect(rb.renderer.drawPendingStroke).toBeCalledWith(rb.model.currentSymbol)
  })

  describe("updateModelRendering", () =>
  {
    test("should call renderer.drawModel", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
      await rb.init()
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      rb.updateModelRendering()
      expect(rb.renderer.drawModel).toBeCalledTimes(1)
    })

    test("should call recognizer.export", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
      await rb.init()
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await rb.updateModelRendering()
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(rb.recognizer.export).toBeCalledTimes(1)
    })

    test("should reject if recognizer.export in error", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
      await rb.init()
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(() => Promise.reject("pouet"))
      expect(rb.updateModelRendering()).rejects.toEqual("pouet")
    })

    test("should not call recognizer.export when exportContent = DEMAND", async () =>
    {
      const layers = new EditorLayer(document.createElement("div"))
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const rb = new RestBehaviors({ configuration }, layers)
      await rb.init()
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await rb.updateModelRendering()
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(rb.recognizer.export).toBeCalledTimes(0)
    })
  })

  test("should export", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.export()
    await delay(DefaultConfiguration.triggers.exportContentDelay)
    expect(rb.recognizer.export).toBeCalledTimes(1)
  })

  test("should convert", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.recognizer.convert = jest.fn(m => Promise.resolve(m))
    rb.convert("DIGITAL_EDIT", ["mime-type"])
    await delay(DefaultConfiguration.triggers.exportContentDelay)
    expect(rb.recognizer.convert).toBeCalledTimes(1)
  })

  test("should resize", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    rb.renderer.resize = jest.fn()
    rb.recognizer.resize = jest.fn(m => Promise.resolve(m))
    await rb.init()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    rb.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    rb.model.endCurrentStroke(p2)
    await rb.resize(1, 2)
    expect(rb.renderer.resize).toBeCalledTimes(1)
    expect(rb.recognizer.resize).toBeCalledTimes(1)
  })

  test("should not call recognizer on resize if no strokes", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.renderer.resize = jest.fn()
    rb.recognizer.resize = jest.fn(m => Promise.resolve(m))
    await rb.resize(1, 2)
    expect(rb.renderer.resize).toBeCalledTimes(1)
    expect(rb.recognizer.resize).toBeCalledTimes(0)
  })

  test("should undo", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    const model1 = new Model()
    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()
    rb.history.undo = jest.fn(() => model1)
    await await rb.updateModelRendering()
    const undoModel = await rb.undo()
    expect(undoModel).toEqual(model1)
  })

  test("should redo", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    const model2 = new Model(width, height)
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, "pen", DefaultPenStyle)
    model2.endCurrentStroke(p2)
    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()
    rb.history.redo = jest.fn(() => model2)
    const redoModel = await rb.redo()
    expect(redoModel.creationTime).toEqual(model2.creationTime)
  })

  test("should clear", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.renderer.drawModel = jest.fn()
    const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
    rb.model.initCurrentStroke(p1, "pen", DefaultPenStyle)
    rb.model.endCurrentStroke(p2)
    expect(rb.model.symbols.length).toBeGreaterThan(0)
    const clearedModel = await rb.clear()
    expect(rb.model.symbols).toHaveLength(0)
    expect(clearedModel).toBe(rb.model)
  })

  test("should destroy", async () =>
  {
    const layers = new EditorLayer(document.createElement("div"))
    const rb = new RestBehaviors(DefaultBehaviorsOptions, layers)
    await rb.init()
    rb.grabber.detach = jest.fn()
    rb.renderer.destroy = jest.fn()
    rb.history.push = jest.fn(m => m)
    rb.destroy()
    await delay(DefaultConfiguration.triggers.exportContentDelay)
    expect(rb.grabber.detach).toBeCalledTimes(1)
    expect(rb.renderer.destroy).toBeCalledTimes(1)
  })

})
