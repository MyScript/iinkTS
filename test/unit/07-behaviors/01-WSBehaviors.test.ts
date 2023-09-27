import { delay } from "../utils/helpers"
import
{
  TBehaviorOptions,
  TConfiguration,
  TExport,
  TStroke,
  TWebSocketSVGPatchEvent,
  TPointer,
  TPenStyle,
  TTheme
} from "../../../src/@types"
import
{
  WSBehaviors,
  DefaultConfiguration,
  Constants,
  InternalEvent,
  Model,
  DefaultPenStyle
} from "../../../src/iink"

describe("WSBehaviors.ts", () =>
{
  const height = 100, width = 100
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: DefaultConfiguration
  }

  test("should instanciate WSBehaviors", () =>
  {
    const wsb = new WSBehaviors(DefaultBehaviorsOptions)
    expect(wsb).toBeDefined()
  })

  test("should have internalEvent property", () =>
  {
    const wsb = new WSBehaviors(DefaultBehaviorsOptions)
    expect(wsb.internalEvent).toBe(InternalEvent.getInstance())
    expect(wsb.internalEvent).toEqual(InternalEvent.getInstance())
  })

  describe("init", () =>
  {
    test("should init grabber, renderer & recognizer & context", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.init(wrapperHTML)
      await expect(wsb.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0
      })
      await expect(wsb.grabber.attach).toBeCalledTimes(1)
      await expect(wsb.grabber.attach).toBeCalledWith(wrapperHTML)
      await expect(wsb.renderer.init).toBeCalledTimes(1)
      await expect(wsb.renderer.init).toBeCalledWith(wrapperHTML)
      await expect(wsb.recognizer.init).toBeCalledTimes(1)
    })

    test("should resolve init when recognizer.init is resolve", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      await wsb.init(wrapperHTML)
      await expect(wsb.recognizer.init).toBeCalledTimes(1)
    })

    test("should reject init when recognizer.init is reject", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(wsb.init(wrapperHTML)).rejects.toEqual("pouet")
    })
  })

  describe("drawCurrentStroke", () =>
  {
    test("should call renderer.drawPendingStroke", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.drawPendingStroke = jest.fn()
      await wsb.init(wrapperHTML)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      wsb.model.initCurrentStroke(p1, 1, "pen", DefaultPenStyle)
      wsb.drawCurrentStroke()
      await expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(1)
      await expect(wsb.renderer.drawPendingStroke).toBeCalledWith(wsb.model.currentStroke)
    })
    test("should not call renderer.drawPendingStroke if currentStroke is null", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")

      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.drawPendingStroke = jest.fn()
      await wsb.init(wrapperHTML)
      wsb.drawCurrentStroke()
      await expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(0)
    })
  })

  describe("updateModelRendering", () =>
  {
    test("should call recognizer.addStrokes", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearErasingStrokes = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.resolve({} as TExport))
      await wsb.init(wrapperHTML)
      await wsb.updateModelRendering()
      await expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
    })
    test("should call renderer.clearErasingStrokes", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearErasingStrokes = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.resolve({} as TExport))
      await wsb.init(wrapperHTML)
      await wsb.updateModelRendering()
      await expect(wsb.renderer.clearErasingStrokes).toBeCalledTimes(1)
    })
    test("should not call recognizer.addStrokes when exportContent = DEMAND", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const wsb = new WSBehaviors({ configuration })
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.resolve({} as TExport))
      await wsb.init(wrapperHTML)
      await wsb.updateModelRendering()
      await expect(wsb.recognizer.addStrokes).toBeCalledTimes(0)
    })
    test("should reject if recognizer.addStrokes rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearErasingStrokes = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.reject("poney"))
      await wsb.init(wrapperHTML)
      await expect(wsb.updateModelRendering()).rejects.toEqual("poney")
    })
  })

  describe("export", () =>
  {
    test("should call recognizer.export", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await wsb.export()
      await expect(wsb.recognizer.export).toBeCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.export = jest.fn(() => Promise.reject("poney"))
      await wsb.init(wrapperHTML)
      await expect(wsb.export()).rejects.toEqual("poney")
    })
    test("should call recognizer.addStrokes when exportContent = DEMAND", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const wsb = new WSBehaviors({ configuration })
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.resolve({} as TExport))
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await wsb.export()
      await expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
      await expect(wsb.recognizer.export).toBeCalledTimes(0)
    })
    test("should reject if recognizer.addStrokes rejected when exportContent = DEMAND", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const configuration: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      configuration.triggers.exportContent = "DEMAND"
      const wsb = new WSBehaviors({ configuration })
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(() => Promise.reject("poney"))
      await wsb.init(wrapperHTML)
      await expect(wsb.export()).rejects.toEqual("poney")
    })
  })

  describe("convert", () =>
  {
    test("should call recognizer.convert", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.convert = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await wsb.convert()
      await expect(wsb.recognizer.convert).toBeCalledTimes(1)
    })
  })

  describe("import", () =>
  {
    test("should call recognizer.import", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.import = jest.fn()
      await wsb.init(wrapperHTML)
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      await wsb.import(blob, mimeType)
      await expect(wsb.recognizer.import).toBeCalledTimes(1)
    })
    test("should return model form recognizer when recognizer emit EXPORTED", async () =>
    {
      const exportExpected: TExport = { "test/plain": "cofveve" }
      const wrapperHTML: HTMLElement = document.createElement("div")
      const model = new Model(width, height)
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.import = jest.fn(() =>
      {
        model.exports = exportExpected
        return Promise.resolve(model)
      })
      await wsb.init(wrapperHTML)
      const mimeType = "text/plain"
      const textImport = "winter is comming"
      const blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await wsb.import(blob, mimeType)
      await await expect(modelReceive.exports).toBe(exportExpected)
    })
  })

  describe("importPointsEvent", () =>
  {
    test("should call recognizer.importPointsEvents", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.importPointEvents = jest.fn()
      await wsb.init(wrapperHTML)
      const tstrokeToImport: TStroke[] = JSON.parse(`[{
        "pointerType": "PEN",
        "pointerId": 1,
        "x": [128, 125, 122, 119, 118, 117, 116, 117, 119, 123, 127, 135, 139, 141, 144, 144, 143, 142, 141, 142],
        "y": [83, 91, 99, 107, 114, 121, 125, 120, 112, 101, 90, 76, 70, 66, 76, 88, 101, 111, 118, 123],
        "t": [1516190046205, 1516190046247, 1516190046264, 1516190046280, 1516190046297, 1516190046314, 1516190046330, 1516190046380, 1516190046397, 1516190046413, 1516190046430, 1516190046447, 1516190046463, 1516190046480, 1516190046547, 1516190046563, 1516190046581, 1516190046597, 1516190046614, 1516190046630],
        "p": [0.5, 0.7076987214308235, 0.8060672826037246, 0.8060672826037246, 0.785875329883628, 0.785875329883628, 0.7185264889882718, 0.7461846839143089, 0.8024894359144054, 0.6578786777951477, 0.6578786777951477, 0.5984465727129564, 0.7880849230110567, 0.7292125754002905, 0.6768853685004259, 0.6535898384862245, 0.6389126863152722, 0.6829846120277299, 0.785875329883628, 0.7461846839143089]
      },{
        "pointerType": "PEN",
        "pointerId": 1,
        "x": [117, 122, 128, 139, 146],
        "y": [105, 105, 106, 107, 106],
        "t": [1516190046870, 1516190046930, 1516190046947, 1516190046963, 1516190046980],
        "p": [0.5, 0.7763932022500211, 0.7681880209236327, 0.6676543814462531, 0.785875329883628]
      }]`)
      await wsb.importPointEvents(tstrokeToImport)
      expect(wsb.recognizer.importPointEvents).toBeCalledTimes(1)
      expect(wsb.recognizer.importPointEvents).toBeCalledWith(tstrokeToImport)
    })
  })

  describe("resize", () =>
  {
    test("should call renderer.resize", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await wsb.resize(1, 2)
      await expect(wsb.renderer.resize).toBeCalledTimes(1)
    })
    test("should reject if renderer.resize rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(() => Promise.reject("pony"))
      await wsb.init(wrapperHTML)
      await expect(wsb.resize(1, 2)).rejects.toEqual("pony")
    })
    test("should call recognizer.resize after resizeTriggerDelay", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      wsb.resize(1, 2)
      await delay(DefaultConfiguration.triggers.resizeTriggerDelay)
      await expect(wsb.recognizer.resize).toBeCalledTimes(1)
    })
  })

  describe("undo", () =>
  {
    test("should call recognizer.undo", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.undo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      wsb.context.canUndo = true
      wsb.context.stackIndex = 1
      wsb.context.stack.push(new Model(100, 200))
      await wsb.undo()
      await expect(wsb.recognizer.undo).toBeCalledTimes(1)
    })
    test("should return previous model", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.undo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      expect(wsb.model).toEqual(wsb.context.stack[0])
      wsb.context.canUndo = true
      wsb.context.stackIndex = 1
      wsb.context.stack.push(new Model(100, 200))
      await expect(wsb.undo()).resolves.toEqual(wsb.context.stack[0])
    })
    test("should throw error if context.canUndo = false", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.undo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await expect(wsb.undo()).rejects.toEqual(new Error("Undo not allowed"))
    })
  })

  describe("redo", () =>
  {
    test("should call recognizer.redo", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.redo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      wsb.context.canRedo = true
      wsb.context.stackIndex = 0
      wsb.context.stack.push(new Model(100, 200))
      await wsb.redo()
      await expect(wsb.recognizer.redo).toBeCalledTimes(1)
    })
    test("should return next model", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.redo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      wsb.context.canRedo = true
      wsb.context.stackIndex = 0
      const nextModel = new Model(100, 200)
      wsb.context.stack.push(nextModel)
      await expect(wsb.redo()).resolves.toEqual(wsb.context.stack[1])
    })
    test("should reject if recognizer.redo rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.redo = jest.fn(() => Promise.reject("pony"))
      await wsb.init(wrapperHTML)
      wsb.context.canRedo = true
      wsb.context.stackIndex = 0
      wsb.context.stack.push(new Model(100, 200))
      wsb.context.stack.push(new Model(42, 12))
      await expect(wsb.redo()).rejects.toEqual("pony")
    })
    test("should throw error if context.canRedo = false", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.redo = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await expect(wsb.redo()).rejects.toEqual(new Error("Redo not allowed"))
    })
  })

  describe("clear", () =>
  {
    test("should call recognizer.clear", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.clear = jest.fn()
      await wsb.init(wrapperHTML)
      await wsb.clear()
      await expect(wsb.recognizer.clear).toBeCalledTimes(1)
    })
  })

  describe("destroy", () =>
  {
    test("should call grabber.detach", async () =>
    {
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()
      wsb.destroy()
      await expect(wsb.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()
      wsb.destroy()
      await expect(wsb.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()
      wsb.destroy()
      await expect(wsb.recognizer.close).toBeCalledTimes(1)
      await expect(wsb.recognizer.close).toBeCalledWith(1000, Constants.WSMessage.CLOSE_RECOGNIZER)
    })

  })

  describe("Event", () =>
  {
    test("should updatesLayer when recognizer emit SVG_PATCH", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.renderer.updatesLayer = jest.fn()
      await wsb.init(wrapperHTML)
      const svgPatch: TWebSocketSVGPatchEvent = {
        type: "REPLACE_ALL",
        layer: "MODEL",
        updates: []
      }
      wsb.recognizer.internalEvent.emitSVGPatch(svgPatch)
      await expect(wsb.renderer.updatesLayer).toBeCalledTimes(1)
      await expect(wsb.renderer.updatesLayer).toBeCalledWith(svgPatch.layer, svgPatch.updates)
    })
  })

  describe("Style", () =>
  {
    test("should call styleManager.setPenStyle & recognizer.setPenStyle on init", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const customPenStyle: TPenStyle = { color: "#d1d1d1" }
      const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
      customBehaviorsOptions.penStyle = customPenStyle
      const wsb = new WSBehaviors(customBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.styleManager.setPenStyle = jest.fn()
      await wsb.init(wrapperHTML)
      await expect(wsb.styleManager.setPenStyle).toBeCalledTimes(1)
      await expect(wsb.styleManager.setPenStyle).toBeCalledWith(customPenStyle)
      await expect(wsb.recognizer.setPenStyle).toBeCalledTimes(1)
      await expect(wsb.recognizer.setPenStyle).toBeCalledWith(customPenStyle)
    })
    test("should change PenStyle", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.styleManager.setPenStyle = jest.fn()
      await wsb.init(wrapperHTML)
      const customPenStyle: TPenStyle = { color: "#d1d1d1" }
      await wsb.setPenStyle(customPenStyle)
      await expect(wsb.styleManager.setPenStyle).toBeCalledTimes(2)
      await expect(wsb.styleManager.setPenStyle).toHaveBeenNthCalledWith(2, customPenStyle)
      await expect(wsb.recognizer.setPenStyle).toBeCalledTimes(2)
      await expect(wsb.recognizer.setPenStyle).toHaveBeenNthCalledWith(2, wsb.styleManager.penStyle)
    })
    test("should call styleManager.setTheme & recognizer.setTheme on init", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
      const customTheme: TTheme = {
        ink: {
          width: 42,
          color: "#2E7D32",
          "-myscript-pen-width": 2,
          "-myscript-pen-fill-style": "purple",
          "-myscript-pen-fill-color": "#FFFFFF00"
        },
        ".math": {
          "font-family": "STIXGeneral"
        },
        ".math-solved": {
          "font-family": "STIXGeneral",
          color: "blue"
        },
        ".text": {
          "font-family": "Rubik Distressed",
          "font-size": 10
        }
      }
      customBehaviorsOptions.theme = customTheme
      const wsb = new WSBehaviors(customBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.styleManager.setTheme = jest.fn()
      await wsb.init(wrapperHTML)
      await expect(wsb.styleManager.setTheme).toBeCalledTimes(1)
      await expect(wsb.styleManager.setTheme).toBeCalledWith(customTheme)
      await expect(wsb.recognizer.setTheme).toBeCalledTimes(1)
      await expect(wsb.recognizer.setTheme).toBeCalledWith(wsb.styleManager.theme)
    })
    test("should change Theme", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.styleManager.setTheme = jest.fn()
      await wsb.init(wrapperHTML)
      await expect(wsb.recognizer.setTheme).toBeCalledTimes(1)
      await expect(wsb.styleManager.setTheme).toBeCalledTimes(1)
      const customTheme: TTheme = {
        ink: {
          width: 42,
          color: "#2E7D32",
          "-myscript-pen-width": 2,
          "-myscript-pen-fill-style": "purple",
          "-myscript-pen-fill-color": "#FFFFFF00"
        },
        ".math": {
          "font-family": "STIXGeneral"
        },
        ".math-solved": {
          "font-family": "STIXGeneral",
          color: "blue"
        },
        ".text": {
          "font-family": "Rubik Distressed",
          "font-size": 10
        }
      }
      await wsb.setTheme(customTheme)
      await expect(wsb.styleManager.setTheme).toBeCalledTimes(2)
      await expect(wsb.styleManager.setTheme).toHaveBeenNthCalledWith(2, customTheme)
      await expect(wsb.recognizer.setTheme).toBeCalledTimes(2)
      await expect(wsb.recognizer.setTheme).toHaveBeenNthCalledWith(2, wsb.styleManager.theme)
    })
    test("should change PenStyleClasses", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new WSBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyle = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.recognizer.setTheme = jest.fn(() => Promise.resolve())
      wsb.recognizer.setPenStyleClasses = jest.fn(() => Promise.resolve())
      wsb.styleManager.setPenStyleClasses = jest.fn()
      await wsb.init(wrapperHTML)
      await expect(wsb.recognizer.setPenStyleClasses).toBeCalledTimes(1)
      await expect(wsb.styleManager.setPenStyleClasses).toBeCalledTimes(1)
      await wsb.setPenStyleClasses("pouet")
      await expect(wsb.styleManager.setPenStyleClasses).toBeCalledTimes(2)
      await expect(wsb.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(2, "pouet")
      await expect(wsb.recognizer.setPenStyleClasses).toBeCalledTimes(2)
      await expect(wsb.recognizer.setPenStyleClasses).toHaveBeenNthCalledWith(2, wsb.styleManager.penStyleClasses)
    })
  })

})
