import { buildOIStroke, delay } from "../helpers"
import { LeftClickEventFake } from "../PointerEventFake"

import
{
  OIBehaviors,
  DefaultConfiguration,
  Intention,
  WriteTool,
  InternalEventType,
  DefaultTheme,
  InternalEvent,
  TBehaviorOptions,
  TStyle,
  TTheme,
  OIModel,
  PartialDeep,
  TStroke,
} from "../../../src/iink"
import { jiixText } from "../_dataset/exports.dataset"

describe("OIBehaviors.ts", () =>
{

  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  DefaultBehaviorsOptions.configuration.offscreen = true
  DefaultBehaviorsOptions.configuration.recognition.type = "Raw Content"
  DefaultBehaviorsOptions.configuration.rendering.smartGuide.enable = false

  test("should instanciate OIBehaviors", () =>
  {
    const oib = new OIBehaviors(DefaultBehaviorsOptions)
    expect(oib).toBeDefined()
  })

  describe("Properties", () =>
  {
    const oib = new OIBehaviors(DefaultBehaviorsOptions)
    test("should have internalEvent property", () =>
    {
      expect(oib.internalEvent).toBe(InternalEvent.getInstance())
      expect(oib.internalEvent).toEqual(InternalEvent.getInstance())
    })
    test("should have intention property initialize on Write", () =>
    {
      expect(oib.intention).toEqual(Intention.Write)
    })
    test("should set intention property to Erase", () =>
    {
      oib.intention = Intention.Erase
      expect(oib.intention).toEqual(Intention.Erase)
    })
    test("should removeSelection on change intention", () =>
    {
      oib.model.resetSelection = jest.fn()
      oib.intention = Intention.Erase
      expect(oib.model.resetSelection).toBeCalledTimes(1)
    })
    test("should have writeTool property initialize to Pencil", () =>
    {
      expect(oib.writeTool).toEqual(WriteTool.Pencil)
    })
    test("should set writeTool property to Circle", () =>
    {
      oib.writeTool = WriteTool.Circle
      expect(oib.writeTool).toEqual(WriteTool.Circle)
    })
    test("should have model property initialize", () =>
    {
      expect(oib.model).toBeDefined()
      expect(oib.model.symbols).toHaveLength(0)
    })
    test("should have context property initialize", () =>
    {
      expect(oib.context).toBeDefined()
      expect(oib.context.canRedo).toEqual(false)
      expect(oib.context.canUndo).toEqual(false)
      expect(oib.context.empty).toEqual(true)
      expect(oib.context.stack.length).toEqual(1)
      expect(oib.context.stackIndex).toEqual(0)
    })
    test("should have configuration property", () =>
    {
      expect(oib.configuration).toEqual(DefaultBehaviorsOptions.configuration)
    })
  })

  describe("Style", () =>
  {
    test("should define style", async () =>
    {
      const customStyle: TStyle = { color: "#d1d1d1" }
      const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
      customBehaviorsOptions.penStyle = customStyle
      const oib = new OIBehaviors(customBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      await expect(oib.penStyle).toEqual(customStyle)
    })
    test("should change Style", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.styleManager.setPenStyle = jest.fn()
      await oib.init(wrapperHTML)
      const customStyle: TStyle = { color: "#d1d1d1" }
      await oib.setPenStyle(customStyle)
      await expect(oib.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, {})
      await expect(oib.styleManager.setPenStyle).toHaveBeenNthCalledWith(2, customStyle)
    })
    test("should define theme", async () =>
    {
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
      const oib = new OIBehaviors(customBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await expect(oib.theme).toEqual(customTheme)
    })
    test("should change Theme", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.styleManager.setTheme = jest.fn()
      await oib.init(wrapperHTML)
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
      await oib.setTheme(customTheme)
      await expect(oib.styleManager.setTheme).toHaveBeenNthCalledWith(1, DefaultTheme)
      await expect(oib.styleManager.setTheme).toHaveBeenNthCalledWith(2, customTheme)
    })
    test("should change PenStyleClasses", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.styleManager.setPenStyleClasses = jest.fn()
      await oib.init(wrapperHTML)
      await oib.setPenStyleClasses("pouet")
      await expect(oib.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(1, "")
      await expect(oib.styleManager.setPenStyleClasses).toHaveBeenNthCalledWith(2, "pouet")
    })
  })

  describe("init", () =>
  {
    test("should init grabber, renderer & recognizer & context", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.init(wrapperHTML)
      await expect(oib.context).toMatchObject({
        canRedo: false,
        canUndo: false,
        empty: true,
        stackIndex: 0,
        possibleUndoCount: 0
      })
      await expect(oib.grabber.attach).toBeCalledTimes(1)
      await expect(oib.renderer.init).toBeCalledTimes(1)
      await expect(oib.recognizer.init).toBeCalledTimes(1)
    })

    test("should resolve init when recognizer.init is resolve", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      await expect(oib.recognizer.init).toBeCalledTimes(1)
    })

    test("should reject init when recognizer.init is reject", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(oib.init(wrapperHTML)).rejects.toEqual(new Error("pouet"))
    })
  })

  describe("drawSymbol", () =>
  {
    test("should call renderer.drawSymbol", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      oib.renderer.drawSymbol = jest.fn()
      const symbol = buildOIStroke()
      oib.drawSymbol(symbol)
      await expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      await expect(oib.renderer.drawSymbol).toBeCalledWith(symbol)
    })
    test("should not call renderer.drawSymbol if not symbol", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")

      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      oib.renderer.drawSymbol = jest.fn()
      //@ts-ignore
      oib.drawSymbol()
      await expect(oib.renderer.drawSymbol).toBeCalledTimes(0)
    })
  })

  describe("Draw", () =>
  {
    describe("Draw pen Stroke", () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.recognizer.init = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.renderer.drawSymbol = jest.fn()
      const div = document.createElement("div")
      const pointerId = 666
      test("should draw on pointerdown", async () =>
      {
        await oib.init(div)
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerDown = new LeftClickEventFake("pointerdown", {
          pointerType: "pen",
          clientX: 1,
          clientY: 1,
          pressure: 1,
          pointerId
        }) as PointerEvent

        target.dispatchEvent(pointerDown)
        expect(oib.model.currentSymbol).toMatchObject({
          pointers: [
            {
              x: 1,
              y: 1,
              p: expect.any(Number),
              t: expect.any(Number),
            }
          ]
        })
        expect(oib.renderer.drawSymbol).toBeCalledWith(oib.model.currentSymbol)
      })
      test("should draw on pointermove", async () =>
      {
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerMove = new LeftClickEventFake("pointermove", {
          pointerType: "pen",
          clientX: 5,
          clientY: 4,
          pressure: 1,
          pointerId
        }) as PointerEvent

        target.dispatchEvent(pointerMove)
        expect(oib.model.currentSymbol).toMatchObject({
          pointers: [
            {
              x: 1,
              y: 1,
              p: expect.any(Number),
              t: expect.any(Number),
            },
            {
              x: 5,
              y: 4,
              p: expect.any(Number),
              t: expect.any(Number),
            },
          ]
        })
        expect(oib.renderer.drawSymbol).toBeCalledWith(oib.model.currentSymbol)
      })
      test("should draw and add pen stroke on pointerup", async () =>
      {
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerUp = new LeftClickEventFake("pointerup", {
          pointerType: "pen",
          clientX: 10,
          clientY: 11,
          pressure: 1,
          pointerId
        }) as PointerEvent

        target.dispatchEvent(pointerUp)
        expect(oib.model.currentSymbol).toBeUndefined()
        expect(oib.model.symbols[0]).toMatchObject({
          pointers: [
            {
              x: 1,
              y: 1,
              p: expect.any(Number),
              t: expect.any(Number),
            },
            {
              x: 5,
              y: 4,
              p: expect.any(Number),
              t: expect.any(Number),
            },
            {
              x: 10,
              y: 11,
              p: expect.any(Number),
              t: expect.any(Number),
            },
          ]
        })
        expect(oib.renderer.drawSymbol).toBeCalledWith(oib.model.symbols[0])
        expect(oib.recognizer.addStrokes).toBeCalledWith([oib.model.symbols[0]], true)
      })
    })
    describe("Draw erase Stroke", () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.intention = Intention.Erase
      oib.recognizer.init = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.removeSymbol = jest.fn()
      const div = document.createElement("div")
      const pointerId = 666
      test("should start to draw stroke on pointerdown", async () =>
      {
        await oib.init(div)
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerDown = new LeftClickEventFake("pointerdown", {
          pointerType: "pen",
          clientX: 1,
          clientY: 1,
          pressure: 1,
          pointerId
        }) as PointerEvent

        target.dispatchEvent(pointerDown)
        expect(oib.model.currentSymbol).toMatchObject({
          pointers: [
            {
              x: 1,
              y: 1,
              p: expect.any(Number),
              t: expect.any(Number),
            }
          ]
        })
        expect(oib.renderer.drawSymbol).toBeCalledWith(oib.model.currentSymbol)
      })
      test("should draw stroke on pointermove", async () =>
      {
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerMove = new LeftClickEventFake("pointermove", {
          pointerType: "eraser",
          clientX: 5,
          clientY: 4,
          pressure: 1,
          pointerId
        }) as PointerEvent

        target.dispatchEvent(pointerMove)
        expect(oib.model.currentSymbol).toMatchObject({
          pointers: [
            {
              x: 1,
              y: 1,
              p: expect.any(Number),
              t: expect.any(Number),
            },
            {
              x: 5,
              y: 4,
              p: expect.any(Number),
              t: expect.any(Number),
            },
          ]
        })
        expect(oib.renderer.drawSymbol).toBeCalledWith(oib.model.currentSymbol)
      })
      test("should draw and erase stroke on pointerup", async () =>
      {
        const selectedSymbol = buildOIStroke()
        selectedSymbol.selected = true
        oib.model.addSymbol(selectedSymbol)
        oib.model.addSymbol(buildOIStroke())
        const target = div.querySelector("svg") as SVGSVGElement
        const pointerUp = new LeftClickEventFake("pointerup", {
          pointerType: "eraser",
          clientX: 10,
          clientY: 11,
          pressure: 1,
          pointerId
        }) as PointerEvent
        const strokeID = oib.model.currentSymbol?.id
        target.dispatchEvent(pointerUp)
        //¯\_(ツ)_/¯  required to wait oib.recognizer.eraseStrokes
        await delay(100)
        expect(oib.model.currentSymbol).toBeUndefined()
        expect(oib.model.symbols).toHaveLength(1)
        expect(oib.recognizer.eraseStrokes).toBeCalledWith([selectedSymbol.id])
        expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(1, strokeID)
        expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(2, selectedSymbol.id)
      })
    })
  })

  describe("importPointsEvent", () =>
  {
    test("should call recognizer.importPointsEvents", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new OIBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn()
      await wsb.init(wrapperHTML)
      const pStrokes: PartialDeep<TStroke>[] = [
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
      await wsb.importPointEvents(pStrokes)
      expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
    })
    test("should add symbols to model", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const wsb = new OIBehaviors(DefaultBehaviorsOptions)
      wsb.grabber.attach = jest.fn()
      wsb.recognizer.send = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn()
      expect(wsb.model.symbols).toHaveLength(0)
      await wsb.init(wrapperHTML)
      const pStrokes: PartialDeep<TStroke>[] = [
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
      await wsb.importPointEvents(pStrokes)
      expect(wsb.model.symbols).toHaveLength(pStrokes.length)
    })
  })

  describe("undo", () =>
  {
    test("should call recognizer.addStrokes & renderer.drawSymbol", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.getClone()
      firstModel.addSymbol(stroke1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      await oib.undo()
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.addStrokes).toBeCalledWith([stroke1], false)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.eraseStrokes & renderer.removeSymbol", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      oib.model.addSymbol(stroke1)
      const firstModel = new OIModel(1, 1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      await oib.undo()
      expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke1.id])
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should return next model", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      const firstModel = new OIModel(1, 1)
      firstModel.addSymbol(stroke1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      const modelReceive = await oib.undo()
      expect(modelReceive).toEqual(firstModel)
    })
    test("should throw error if canUndo = false", async () =>
    {
      try {
        const oib = new OIBehaviors(DefaultBehaviorsOptions)
        await oib.undo()
      } catch (error) {
        expect(error).toEqual(new Error("undo not allowed"))
      }
    })
  })

  describe("redo", () =>
  {
    test("should call recognizer.addStrokes & renderer.drawSymbol", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      const secondModel = oib.model.getClone()
      secondModel.addSymbol(stroke1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      await oib.redo()
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.addStrokes).toBeCalledWith([stroke1], false)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.eraseStrokes & renderer.removeSymbol", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      oib.model.addSymbol(stroke1)
      const secondModel = new OIModel(1, 1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      await oib.redo()
      expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke1.id])
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should return next model", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke1 = buildOIStroke()
      const secondModel = new OIModel(1, 1)
      secondModel.addSymbol(stroke1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.drawCircle = jest.fn()
      oib.renderer.clearElements = jest.fn()
      oib.renderer.removeSelectedGroup = jest.fn()
      const modelReceive = await oib.redo()
      expect(modelReceive).toEqual(secondModel)
    })
    test("should throw error if canRedo = false", async () =>
    {
      try {
        const oib = new OIBehaviors(DefaultBehaviorsOptions)
        await oib.redo()
      } catch (error) {
        expect(error).toEqual(new Error("redo not allowed"))
      }
    })
  })

  describe("export", () =>
  {
    test("should call recognizer.export", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.export = jest.fn(() => Promise.resolve(jiixText))
      await oib.init(wrapperHTML)
      await oib.export()
      await expect(oib.recognizer.export).toBeCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.export = jest.fn(() => Promise.reject("poney"))
      await oib.init(wrapperHTML)
      await expect(oib.export()).rejects.toEqual("poney")
    })
  })

  describe("resize", () =>
  {
    test("should call renderer.resize", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.renderer.resize = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      await oib.resize(1, 2)
      await expect(oib.renderer.resize).toBeCalledTimes(1)
    })
    test("should update model", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.renderer.resize = jest.fn()
      await oib.init(wrapperHTML)
      await oib.resize(1, 2)
      await expect(oib.model.height).toEqual(1)
      await expect(oib.model.width).toEqual(2)
    })
  })

  describe("clear", () =>
  {
    test("should call renderer.clear", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.eraseStrokes", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.clear()
      await expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      await expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke.id])
    })
    test("should clear model", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      const newModel = await oib.clear()
      await expect(newModel.symbols).toHaveLength(0)
      await expect(oib.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(0)
      await expect(oib.recognizer.eraseStrokes).toBeCalledTimes(0)
    })
  })

  describe("destroy", () =>
  {
    test("should call grabber.detach", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      const oib = new OIBehaviors(DefaultBehaviorsOptions)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.recognizer.close).toBeCalledTimes(1)
      await expect(oib.recognizer.close).toBeCalledWith(1000, InternalEventType.WS_CLOSED)
    })

  })
})
