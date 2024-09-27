import { AllOverrideConfiguration } from "./__dataset__/configuration.dataset"
import { buildStroke, delay } from "./helpers"

import
{
  TBehaviorOptions,
  TTheme,
  TPenStyle,
  TJIIXExport,
  TConfiguration,
  Editor,
  DefaultConfiguration,
  DefaultPenStyle,
  DefaultTheme,
  Model,
  PublicEvent,
  InternalEvent,
  Intention,
  EventType,
} from "../../src/iink"

describe("Editor.ts", () =>
{
  const publicEvent = PublicEvent.getInstance()
  const DefaultBehaviorsOptions: TBehaviorOptions = { configuration: DefaultConfiguration }

  describe("constructor", () =>
  {
    test("should instantiate Editor", () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      //@ts-ignore TODO IIC-1006
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      expect(editor).toBeDefined()
      expect(editor.configuration).toBeDefined()
      expect(editor.model).toBeDefined()
    })
    test("should instantiate Editor with custom configuration", () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, { configuration: (AllOverrideConfiguration as TConfiguration) })
      editor.initialize()
      expect(editor).toBeDefined()
      expect(editor.configuration).toBeDefined()
      expect(editor.model).toBeDefined()
    })
    // TODO
    // test("should define default grabber", () =>
    // {
    //   const wrapperhtml: htmlelement = document.createelement("div")
    //   wrapperhtml.style.height = "100px"
    //   wrapperhtml.style.width = "100px"
    //   const customgrabber = new pointereventgrabber(defaultconfiguration.grabber)
    //   const editor = new editor(wrapperhtml, defaultbehaviorsoptions)
    //   expect(editor.grabber).not.tobe(customgrabber)
    // })
    // TODO
    // test("should override grabber", () =>
    // {
    //   const wrapperHTML: HTMLElement = document.createElement("div")
    //   wrapperHTML.style.height = "100px"
    //   wrapperHTML.style.width = "100px"
    //   const customGrabber = new PointerEventGrabber(DefaultConfiguration.grabber)
    //   const customBehaviorsOptions: TBehaviorOptions = {
    //     configuration: DefaultConfiguration,
    //     behaviors: {
    //       grabber: customGrabber
    //     }
    //   }
    //   const editor = new Editor(wrapperHTML, customBehaviorsOptions)
    //   expect(editor.grabber).toBe(customGrabber)
    // })
    // TODO
    // test("should define default recognizer when REST", () =>
    // {
    //   const wrapperHTML: HTMLElement = document.createElement("div")
    //   wrapperHTML.style.height = "100px"
    //   wrapperHTML.style.width = "100px"
    //   const behaviorsOptions = structuredClone(DefaultBehaviorsOptions)
    //   behaviorsOptions.configuration.server.protocol = "REST"
    //   const customRecognizer = new WSRecognizer(behaviorsOptions.configuration.server, behaviorsOptions.configuration.recognition)
    //   const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
    //   const RESTBehaviors = editor.behaviors as RestBehaviors
    //   expect(RESTBehaviors.recognizer).not.toBe(customRecognizer)
    // })
    // TODO
    // test("should override recognizer when REST", () =>
    // {
    //   const wrapperHTML: HTMLElement = document.createElement("div")
    //   wrapperHTML.style.height = "100px"
    //   wrapperHTML.style.width = "100px"
    //   const behaviorsOptions = structuredClone(DefaultBehaviorsOptions)
    //   behaviorsOptions.configuration.server.protocol = "REST"
    //   const customRecognizer = RestRecognizer
    //   behaviorsOptions.behaviors = {
    //     recognizer: customRecognizer
    //   }
    //   const editor = new Editor(wrapperHTML, behaviorsOptions)
    //   const RESTBehaviors = editor.behaviors as RestBehaviors
    //   expect(RESTBehaviors.recognizer).toBe(customRecognizer)
    // })
    // TODO
    // test("should define default recognizer when Websocket", () =>
    // {
    //   const wrapperHTML: HTMLElement = document.createElement("div")
    //   wrapperHTML.style.height = "100px"
    //   wrapperHTML.style.width = "100px"
    //   const behaviorsOptions = structuredClone(DefaultBehaviorsOptions)
    //   behaviorsOptions.configuration.server.protocol = "WEBSOCKET"
    //   const customRecognizer = WSRecognizer
    //   const editor = new Editor(wrapperHTML, behaviorsOptions)
    //   const WSBehaviors = editor.behaviors as WSBehaviors
    //   expect(WSBehaviors.recognizer).not.toBe(customRecognizer)
    // })
    // TODO
    // test("should override recognizer when Websocket", () =>
    // {
    //   const wrapperHTML: HTMLElement = document.createElement("div")
    //   wrapperHTML.style.height = "100px"
    //   wrapperHTML.style.width = "100px"
    //   const behaviorsOptions = structuredClone(DefaultBehaviorsOptions)
    //   behaviorsOptions.configuration.server.protocol = "WEBSOCKET"
    //   const customRecognizer = new WSRecognizer(behaviorsOptions.configuration.server, behaviorsOptions.configuration.recognition)
    //   behaviorsOptions.behaviors = {
    //     recognizer: customRecognizer
    //   }
    //   const editor = new Editor(wrapperHTML, behaviorsOptions)
    //   const WSBehaviors = editor.behaviors as WSBehaviors
    //   expect(WSBehaviors.recognizer).toBe(customRecognizer)
    // })
    test("should throw error if instantiate Editor without configuration", () =>
    {
      expect.assertions(1)
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      try {
        //@ts-ignore
        new Editor(wrapperHTML, {})
      }
      catch (error) {
        expect((error as Error).message).toEqual("Configuration required")
      }
    })
    test("should append loader element", () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      new Editor(wrapperHTML, DefaultBehaviorsOptions)
      expect(wrapperHTML.querySelector(".loader")).toBeDefined()
    })
    test("should append error element", () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      new Editor(wrapperHTML, DefaultBehaviorsOptions)
      expect(wrapperHTML.querySelector(".error-msg")).toBeDefined()
    })
  })

  describe("initialize", () =>
  {
    test("should display and hide loader", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      const LOAD_TIMEOUT = 200
      editor.behaviors.init = jest.fn(async () => { await delay(LOAD_TIMEOUT); return Promise.resolve() })
      const loaderElement = wrapperHTML.querySelector(".loader") as HTMLElement
      expect(loaderElement.style.display).toEqual("none")
      editor.initialize()
      expect(loaderElement.style.display).toEqual("block")
      await delay(LOAD_TIMEOUT)
      expect(loaderElement.style.display).toEqual("none")
    })
    test("should resolve when behaviors.init is resolved", async () =>
    {
      expect.assertions(1)
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      expect(editor.initializationPromise).toBeDefined()
    })
    test("should reject when behaviors.init is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.reject("pouet"))
      expect(editor.initialize()).rejects.toEqual("pouet")
    })
    test("should show error when behaviors.init is rejected", async () =>
    {
      expect.assertions(3)
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.reject(new Error("pouet")))
      const messageContainer = wrapperHTML.querySelector(".message-container") as HTMLElement
      const messageElement = messageContainer.querySelector(".message-modal p") as HTMLElement
      try {
        expect(messageContainer!.style.display).toEqual("none")
        await editor.initialize()
      } catch (error) {
        expect(messageContainer.style.display).toEqual("block")
        expect(messageElement.innerText).toEqual("pouet")
      }
    })
  })

  describe("configuration", () =>
  {
    test("should change behaviors", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      expect(editor.behaviors.name).toEqual("WSBehaviors")
      editor.behaviors.destroy = jest.fn(() => Promise.resolve())
      //@ts-ignore
      editor.configuration = { ...DefaultBehaviorsOptions, server: { protocol: "REST" } }
      expect(editor.behaviors.name).toEqual("RestBehaviors")
    })
  })

  describe("intention", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    //@ts-ignore TODO IIC-1006
    const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
    test("should init intention = Write", () =>
    {
      expect(editor.intention).toBe(Intention.Write)
    })
    test("should set intention = erase", () =>
    {
      editor.intention = Intention.Erase
      expect(wrapperHTML.classList).toContain("erase")
    })
    test("should toggle intention", () =>
    {
      editor.intention = Intention.Erase
      expect(wrapperHTML.classList).toContain("erase")
      editor.intention = Intention.Write
      expect(wrapperHTML.classList).not.toContain("erase")
    })
  })

  describe("context", () =>
  {
    test("should get behaviors context", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      wrapperHTML.style.height = "100px"
      wrapperHTML.style.width = "100px"
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      expect(editor.context).toBe(editor.behaviors.history.context)
    })
  })

  describe("undo", () =>
  {
    test("should resolve when behaviors.undo is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.undo = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.undo()
      expect(editor.behaviors.undo).toBeCalledTimes(1)
    })
    test("should reject when behaviors.undo is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.undo = jest.fn(() => Promise.reject("pouet"))
      expect(editor.undo()).rejects.toEqual("pouet")
    })
  })

  describe("redo", () =>
  {
    test("should resolve when behaviors.redo is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.redo = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.redo()
      expect(editor.behaviors.redo).toBeCalledTimes(1)
    })
    test("should reject when behaviors.redo is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.redo = jest.fn(() => Promise.reject("pouet"))
      expect(editor.redo()).rejects.toEqual("pouet")
    })
  })

  describe("clear", () =>
  {
    test("should resolve when behaviors.clear is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.clear = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.clear()
      expect(editor.behaviors.clear).toBeCalledTimes(1)
    })
    test("should reject when behaviors.clear is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.clear = jest.fn(() => Promise.reject("pouet"))
      expect(editor.clear()).rejects.toEqual("pouet")
    })
    test("should emit cleared event", async () =>
    {
      const testFunction = jest.fn()
      publicEvent.addEventListener(EventType.CLEARED, testFunction)
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      const modelExpected = new Model(100, 100)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.clear = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.clear()
      expect(testFunction).toBeCalledTimes(1)
    })
  })

  describe("resize", () =>
  {
    test("should resolve when behaviors.resize is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.resize = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.resize()
      expect(editor.behaviors.resize).toBeCalledTimes(1)
    })
    test("should reject when behaviors.resize is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.resize = jest.fn(() => Promise.reject("pouet"))
      expect(editor.resize()).rejects.toEqual("pouet")
    })
  })

  describe("export", () =>
  {
    test("should resolve when behaviors.export is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.export = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.export()
      expect(editor.behaviors.export).toBeCalledTimes(1)
    })
    test("should reject when behaviors.export is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.export = jest.fn(() => Promise.reject("pouet"))
      expect(editor.export()).rejects.toEqual("pouet")
    })
  })

  describe("convert", () =>
  {
    test("should resolve when behaviors.convert is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      const modelExpected = new Model(100, 100)
      editor.behaviors.convert = jest.fn(() => Promise.resolve(modelExpected))
      await editor.initialize()
      await editor.convert()
      expect(editor.behaviors.convert).toBeCalledTimes(1)
    })
    test("should reject when behaviors.convert is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      editor.behaviors.convert = jest.fn(() => Promise.reject("pouet"))
      expect(editor.convert()).rejects.toEqual("pouet")
    })
  })

  describe("import", () =>
  {
    test("should resolve import Blob when behaviors.import is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      const model = new Model(100, 50)
      editor.behaviors.import = jest.fn(() => Promise.resolve(model))
      editor.events.emitImported = jest.fn()
      await editor.import(new Blob(), "text/plain")
      expect(editor.events.emitImported).toBeCalledTimes(1)
      expect(editor.behaviors.import).toBeCalledTimes(1)
    })
    test("should reject import Blob if behaviors.import is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = jest.fn(() => Promise.reject("pouet"))
      editor.events.emitImported = jest.fn()
      expect(editor.import(new Blob(), "text/plain")).rejects.toEqual("pouet")
    })
    test("should reject import Blob if behaviors.import is not define", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = undefined
      editor.events.emitImported = jest.fn()
      expect(editor.import(new Blob(), "text/plain")).rejects.toEqual("Import impossible, behaviors has no import function")
    })

    test("should resolve import Text  when behaviors.import is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      const model = new Model(100, 50)
      editor.behaviors.import = jest.fn(() => Promise.resolve(model))
      editor.events.emitImported = jest.fn()
      await editor.import("hello", "text/plain")
      expect(editor.events.emitImported).toBeCalledTimes(1)
      expect(editor.behaviors.import).toBeCalledTimes(1)
    })
    test("should reject import Text if behaviors.import is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = jest.fn(() => Promise.reject("pouet"))
      editor.events.emitImported = jest.fn()
      expect(editor.import("hello", "text/plain")).rejects.toEqual("pouet")
    })
    test("should reject import Text if behaviors.import is not define", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = undefined
      editor.events.emitImported = jest.fn()
      expect(editor.import("hello", "text/plain")).rejects.toEqual("Import impossible, behaviors has no import function")
    })

    test("should resolve import JIIX  when behaviors.import is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      const model = new Model(100, 50)
      editor.behaviors.import = jest.fn(() => Promise.resolve(model))
      editor.events.emitImported = jest.fn()
      const jiix: TJIIXExport = {
        type: "Text",
        label: "h",
        words: [
          {
            label: "h",
            candidates: ["h", "k", "hi", "hr", "hn"],
          },
        ],
        version: "3",
        id: "MainBlock",
      }
      await editor.import(jiix)
      expect(editor.events.emitImported).toBeCalledTimes(1)
      expect(editor.behaviors.import).toBeCalledTimes(1)
    })
    test("should reject import JIIX if behaviors.import is rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = jest.fn(() => Promise.reject("pouet"))
      editor.events.emitImported = jest.fn()
      const jiix: TJIIXExport = {
        type: "Text",
        label: "h",
        words: [
          {
            label: "h",
            candidates: ["h", "k", "hi", "hr", "hn"],
          },
        ],
        version: "3",
        id: "MainBlock",
      }
      expect(editor.import(jiix)).rejects.toEqual("pouet")
    })
    test("should reject import JIIX if behaviors.import is not define", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      editor.behaviors.import = undefined
      editor.events.emitImported = jest.fn()
      const jiix: TJIIXExport = {
        type: "Text",
        label: "h",
        words: [
          {
            label: "h",
            candidates: ["h", "k", "hi", "hr", "hn"],
          },
        ],
        version: "3",
        id: "MainBlock",
      }
      expect(editor.import(jiix)).rejects.toEqual("Import impossible, behaviors has no import function")
    })

    test("should resolve import points Events when behaviors.importPointEvents is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      const model = new Model(100, 50)
      const strokeToImport = buildStroke()
      editor.behaviors.importPointEvents = jest.fn(() => Promise.resolve(model))
      await editor.importPointEvents([strokeToImport])
      expect(editor.events.emitImported).toBeCalledTimes(1)
      expect(editor.behaviors.importPointEvents).toBeCalledTimes(1)
    })
    test("should resolve import points Events  when behaviors.importPointEvents is resolved", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
      editor.behaviors.init = jest.fn(() => Promise.resolve())
      await editor.initialize()
      const strokeToImport = buildStroke()
      editor.behaviors.importPointEvents = jest.fn(() => Promise.reject("pouet"))
      expect(editor.importPointEvents([strokeToImport])).rejects.toEqual("pouet")
    })
  })

  describe("Style", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    let editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
    test("should init theme", () =>
    {
      expect(editor.theme).toStrictEqual(DefaultTheme)
    })
    test("should set theme", () =>
    {
      editor.behaviors.setTheme = jest.fn()
      //@ts-ignore
      const customTheme: TTheme = {
        ink: {
          width: 42,
          color: "red",
          "-myscript-pen-fill-color": "blue",
          "-myscript-pen-fill-style": "style",
          "-myscript-pen-width": 5
        }
      }
      editor.theme = customTheme
      expect(editor.behaviors.setTheme).toBeCalledTimes(1)
      expect(editor.behaviors.setTheme).toBeCalledWith(customTheme)
    })
    test("should set penStyleClasses", () =>
    {
      editor.behaviors.setPenStyleClasses = jest.fn()
      const customPenStyleClasses = "customPenStyleClasses"
      editor.penStyleClasses = customPenStyleClasses
      expect(editor.behaviors.setPenStyleClasses).toBeCalledTimes(1)
      expect(editor.behaviors.setPenStyleClasses).toBeCalledWith(customPenStyleClasses)
    })
    test("should init penStyle", () =>
    {
      expect(editor.penStyle).toStrictEqual(DefaultPenStyle)
    })
    test("should init penStyle", () =>
    {
      editor.behaviors.setPenStyle = jest.fn()
      const customPenStyle: TPenStyle = {
        width: 42,
        color: "red",
        "-myscript-pen-fill-color": "blue",
        "-myscript-pen-fill-style": "style",
        "-myscript-pen-width": 5
      }
      editor.penStyle = customPenStyle
      expect(editor.behaviors.setPenStyle).toBeCalledTimes(1)
      expect(editor.behaviors.setPenStyle).toBeCalledWith(customPenStyle)
    })
  })

  describe("Events", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const editor = new Editor(wrapperHTML, DefaultBehaviorsOptions)
    // TODO problem with internal event singleton
    test.skip("should call convert when internalEvent emit convert", () =>
    {
      editor.convert = jest.fn()
      expect(editor.convert).toBeCalledTimes(0)
      InternalEvent.getInstance().emitConvert()
      expect(editor.convert).toBeCalledTimes(1)
    })
    // TODO problem with internal event singleton
    test.skip("should emit changed when internalEvent emit changed", () =>
    {
      editor.events.emitChanged = jest.fn()
      expect(editor.events.emitChanged).toBeCalledTimes(0)
      InternalEvent.getInstance().emitContextChange({ canRedo: true, canUndo: true, empty: false, possibleUndoCount: 10, stackIndex: 11 })
      expect(editor.events.emitChanged).toBeCalledTimes(1)
    })
    // TODO problem with internal event singleton
    test.skip("should emit idle when internalEvent emit idle", () =>
    {
      editor.events.emitIdle = jest.fn()
      expect(editor.events.emitIdle).toBeCalledTimes(0)
      InternalEvent.getInstance().emitIdle(true)
      expect(editor.events.emitIdle).toBeCalledTimes(1)
    })
  })

})
