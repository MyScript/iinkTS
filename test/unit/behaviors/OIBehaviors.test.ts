import { jiixText } from "../_dataset/exports.dataset"
import { buildOICircle, buildOIStroke } from "../helpers"
import { LeftClickEventFake } from "../PointerEventFake"
import
{
  OIBehaviors,
  DefaultConfiguration,
  Intention,
  InternalEventType,
  DefaultTheme,
  InternalEvent,
  TBehaviorOptions,
  TStyle,
  TTheme,
  OIModel,
  PartialDeep,
  TStroke,
  DefaultStyle,
  SymbolType,
  OIShapeCircle,
  OIStroke,
  ShapeKind,
} from "../../../src/iink"

describe("OIBehaviors.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  DefaultBehaviorsOptions.configuration.offscreen = true
  DefaultBehaviorsOptions.configuration.recognition.type = "Raw Content"
  DefaultBehaviorsOptions.configuration.rendering.smartGuide.enable = false

  test("should instanciate OIBehaviors", () =>
  {
    const layerInfo = document.createElement("div")
    //@ts-ignore TODO IIC-1006
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    expect(oib).toBeDefined()
  })

  describe("Properties", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.selector.removeSelectedGroup = jest.fn()
    oib.renderer.parent = layerInfo
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
    test("should unselectAll on change intention", () =>
    {
      oib.unselectAll= jest.fn()
      oib.intention = Intention.Erase
      expect(oib.unselectAll).toBeCalledTimes(1)
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
  })

  describe("Style", () =>
  {
    test("should define style", async () =>
    {
      const customStyle: TStyle = { color: "#d1d1d1" }
      const customBehaviorsOptions: TBehaviorOptions = JSON.parse(JSON.stringify(DefaultBehaviorsOptions))
      customBehaviorsOptions.penStyle = customStyle
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(customBehaviorsOptions, layerInfo)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      await expect(oib.penStyle).toEqual(expect.objectContaining(customStyle))
    })
    test("should change Style", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.styleManager.setPenStyle = jest.fn()
      await oib.init(wrapperHTML)
      const customStyle: TStyle = { color: "#d1d1d1" }
      await oib.setPenStyle(customStyle)
      await expect(oib.styleManager.setPenStyle).toHaveBeenNthCalledWith(1, DefaultStyle)
      await expect(oib.styleManager.setPenStyle).toHaveBeenNthCalledWith(2, expect.objectContaining(customStyle))
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(customBehaviorsOptions, layerInfo)
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await expect(oib.theme).toEqual(customTheme)
    })
    test("should change Theme", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.reject("pouet"))
      await expect(oib.init(wrapperHTML)).rejects.toEqual(new Error("pouet"))
    })
  })

  describe("CRUD", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.menu.update = jest.fn()
    oib.svgDebugger.apply = jest.fn()
    oib.recognizer.waitForIdle = jest.fn()

    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
    oib.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())

    oib.renderer.drawSymbol = jest.fn()
    oib.renderer.changeOrderSymbol = jest.fn()
    oib.renderer.replaceSymbol = jest.fn()
    oib.renderer.removeSymbol = jest.fn()

    oib.model.addSymbol = jest.fn()
    oib.model.changeOrderSymbol = jest.fn()
    oib.model.replaceSymbol = jest.fn()
    oib.model.removeSymbol = jest.fn()

    test("add stroke", async () =>
    {
      const stroke = buildOIStroke()
      await oib.addSymbol(stroke)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, stroke)
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("add shape", async () =>
    {
      const shape = buildOICircle()
      await oib.addSymbol(shape)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, shape)
      expect(oib.recognizer.addStrokes).not.toHaveBeenCalled()
    })
    test("create stroke", async () =>
    {
      const stroke: PartialDeep<OIStroke> = {
        type: SymbolType.Stroke,
        pointers: [{ x: 0, y: 1, t: 1, p: 1 }]
      }
      await oib.createSymbol(stroke)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(stroke))
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [expect.objectContaining(stroke)], false)
    })
    test("create shape", async () =>
    {
      const shape: PartialDeep<OIShapeCircle> = {
        type: SymbolType.Shape,
        kind: ShapeKind.Circle,
        center: { x: 5, y: 5 },
        radius: 5
      }
      await oib.createSymbol(shape)
      expect(oib.model.addSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(oib.renderer.drawSymbol).toHaveBeenNthCalledWith(1, expect.objectContaining(shape))
      expect(oib.recognizer.addStrokes).not.toHaveBeenCalled()
    })
    test("replace stroke by stroke", async () =>
    {
      const stroke1 = buildOIStroke()
      const stroke2 = buildOIStroke()
      await oib.replaceSymbol(stroke1, [stroke2])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke1.id, [stroke2])
      expect(oib.recognizer.replaceStrokes).toHaveBeenNthCalledWith(1, [stroke1.id], [stroke2])
    })
    test("replace stroke by shape", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await oib.replaceSymbol(stroke, [shape])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, stroke.id, [shape])
      expect(oib.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("replace shape by stroke", async () =>
    {
      const stroke = buildOIStroke()
      const shape = buildOICircle()
      await oib.replaceSymbol(shape, [stroke])
      expect(oib.model.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(oib.renderer.replaceSymbol).toHaveBeenNthCalledWith(1, shape.id, [stroke])
      expect(oib.recognizer.addStrokes).toHaveBeenNthCalledWith(1, [stroke], false)
    })
    test("change order symbol", async () =>
    {
      const stroke = buildOIStroke()
      await oib.changeOrderSymbol(stroke, "last")
      expect(oib.model.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke.id, "last")
      expect(oib.renderer.changeOrderSymbol).toHaveBeenNthCalledWith(1, stroke, "last")
    })
    test("not remove stroke if not in model", async () =>
    {
      const stroke = buildOIStroke()
      await oib.removeSymbol(stroke.id)
      expect(oib.model.removeSymbol).not.toHaveBeenCalled()
      expect(oib.renderer.removeSymbol).not.toHaveBeenCalled()
      expect(oib.recognizer.eraseStrokes).not.toHaveBeenCalled()
    })
    test("remove stroke", async () =>
    {
      const stroke = buildOIStroke()
      oib.model.symbols.push(stroke)
      await oib.removeSymbol(stroke.id)
      expect(oib.model.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(1, stroke.id)
      expect(oib.recognizer.eraseStrokes).toHaveBeenNthCalledWith(1, [stroke.id])
    })
    test("remove shape", async () =>
    {
      const shape = buildOICircle()
      oib.model.symbols.push(shape)
      await oib.removeSymbol(shape.id)
      expect(oib.model.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(oib.renderer.removeSymbol).toHaveBeenNthCalledWith(1, shape.id)
      expect(oib.recognizer.eraseStrokes).not.toHaveBeenCalled()
    })
  })

  describe("updateSymbolsStyle", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.renderer.drawSymbol = jest.fn()
    const div = document.createElement("div")
    const stroke1 = buildOIStroke()
    oib.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    oib.model.addSymbol(stroke2)
    test("should update symbol color and draw", async () =>
    {
      await oib.init(div)
      expect(oib.model.symbols[0].style.color).toEqual("#000000")
      oib.updateSymbolsStyle([stroke1.id], { color: "red" })
      expect(oib.model.symbols[0].style.color).toEqual("red")
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledWith(stroke1)
    })
    test("should update symbol width and draw", async () =>
    {
      await oib.init(div)
      expect(oib.model.symbols[1].style.width).toEqual(4)
      oib.updateSymbolsStyle([stroke2.id], { width: 42 })
      expect(oib.model.symbols[1].style.width).toEqual(42)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledWith(stroke2)
    })
  })

  describe("Writer", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.writer.start = jest.fn()
    oib.writer.continue = jest.fn()
    oib.writer.end = jest.fn()
    const div = document.createElement("div")
    const pointerId = 666
    test("should call writer.start on pointerdown", async () =>
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
      expect(oib.writer.start).toBeCalledTimes(1)
      expect(oib.writer.continue).toBeCalledTimes(0)
      expect(oib.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.continue on pointermove", async () =>
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
      expect(oib.writer.start).toBeCalledTimes(0)
      expect(oib.writer.continue).toBeCalledTimes(1)
      expect(oib.writer.end).toBeCalledTimes(0)
    })
    test("should call writer.end on pointerup", async () =>
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
      expect(oib.writer.start).toBeCalledTimes(0)
      expect(oib.writer.continue).toBeCalledTimes(0)
      expect(oib.writer.end).toBeCalledTimes(1)
    })
  })

  describe("Eraser", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.intention = Intention.Erase
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.eraser.start = jest.fn()
    oib.eraser.continue = jest.fn()
    oib.eraser.end = jest.fn()
    const div = document.createElement("div")
    const pointerId = 666
    test("should call eraseManager.start on pointerdown", async () =>
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
      expect(oib.eraser.start).toBeCalledTimes(1)
      expect(oib.eraser.continue).toBeCalledTimes(0)
      expect(oib.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.continue on pointermove", async () =>
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
      expect(oib.eraser.start).toBeCalledTimes(0)
      expect(oib.eraser.continue).toBeCalledTimes(1)
      expect(oib.eraser.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.end on pointerup", async () =>
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
      expect(oib.eraser.start).toBeCalledTimes(0)
      expect(oib.eraser.continue).toBeCalledTimes(0)
      expect(oib.eraser.end).toBeCalledTimes(1)
    })
  })

  describe("Selector", () =>
  {
    const layerInfo = document.createElement("div")
    const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
    oib.intention = Intention.Select
    oib.recognizer.init = jest.fn()
    oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
    oib.selector.start = jest.fn()
    oib.selector.continue = jest.fn()
    oib.selector.end = jest.fn()
    const div = document.createElement("div")
    const pointerId = 666
    test("should call eraseManager.start on pointerdown", async () =>
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
      expect(oib.selector.start).toBeCalledTimes(1)
      expect(oib.selector.continue).toBeCalledTimes(0)
      expect(oib.selector.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.continue on pointermove", async () =>
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
      expect(oib.selector.start).toBeCalledTimes(0)
      expect(oib.selector.continue).toBeCalledTimes(1)
      expect(oib.selector.end).toBeCalledTimes(0)
    })
    test("should call eraseManager.end on pointerup", async () =>
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
      expect(oib.selector.start).toBeCalledTimes(0)
      expect(oib.selector.continue).toBeCalledTimes(0)
      expect(oib.selector.end).toBeCalledTimes(1)
    })
  })

  describe("importPointsEvent", () =>
  {
    test("should call recognizer.addStrokes", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.grabber.attach = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.menu.render = jest.fn()
      oib.menu.update = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
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
      await oib.importPointEvents(pStrokes)
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
    })
    test("should add symbols to model and draw", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.grabber.attach = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.menu.render = jest.fn()
      oib.menu.update = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      expect(oib.model.symbols).toHaveLength(0)
      await oib.init(wrapperHTML)
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
      await oib.importPointEvents(pStrokes)
      expect(oib.model.symbols).toHaveLength(pStrokes.length)
      expect(oib.renderer.drawSymbol).toHaveBeenCalledTimes(2)
    })
  })

  describe("undo", () =>
  {
    test("should call recognizer.addStrokes & renderer.drawSymbol", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.clearElements = jest.fn()
      const stroke1 = buildOIStroke()
      const firstModel = oib.model.clone()
      firstModel.addSymbol(stroke1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      await oib.undo()
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.addStrokes).toBeCalledWith([stroke1], false)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.eraseStrokes & renderer.removeSymbol", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.clearElements = jest.fn()
      const stroke1 = buildOIStroke()
      oib.model.addSymbol(stroke1)
      const firstModel = new OIModel(1, 1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      await oib.undo()
      expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke1.id])
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should return next model", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.clearElements = jest.fn()
      const stroke1 = buildOIStroke()
      const firstModel = new OIModel(1, 1)
      firstModel.addSymbol(stroke1)
      oib.context.canUndo = true
      oib.context.stackIndex = 1
      oib.context.stack.unshift(firstModel)
      const modelReceive = await oib.undo()
      expect(modelReceive).toEqual(firstModel)
    })
    test("should do nothing if canUndo = false", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      expect(await oib.undo()).toEqual(oib.model)
    })
  })

  describe("redo", () =>
  {
    test("should call recognizer.addStrokes & renderer.drawSymbol", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.clearElements = jest.fn()
      const stroke1 = buildOIStroke()
      const secondModel = oib.model.clone()
      secondModel.addSymbol(stroke1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      await oib.redo()
      expect(oib.recognizer.addStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.addStrokes).toBeCalledWith([stroke1], false)
      expect(oib.renderer.drawSymbol).toBeCalledTimes(1)
      expect(oib.renderer.drawSymbol).toBeCalledWith(stroke1)
    })
    test("should call recognizer.eraseStrokes & renderer.removeSymbol", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      oib.renderer.clearElements = jest.fn()
      const stroke1 = buildOIStroke()
      oib.model.addSymbol(stroke1)
      const secondModel = new OIModel(1, 1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      await oib.redo()
      expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke1.id])
      expect(oib.renderer.removeSymbol).toBeCalledTimes(1)
      expect(oib.renderer.removeSymbol).toBeCalledWith(stroke1.id)
    })
    test("should return next model", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.selector.removeSelectedGroup = jest.fn()
      oib.svgDebugger.apply = jest.fn()
      oib.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
      oib.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.renderer.removeSymbol = jest.fn()
      oib.renderer.drawSymbol = jest.fn()
      const stroke1 = buildOIStroke()
      const secondModel = new OIModel(1, 1)
      secondModel.addSymbol(stroke1)
      oib.context.canRedo = true
      oib.context.stack.push(secondModel)
      const modelReceive = await oib.redo()
      expect(modelReceive).toEqual(secondModel)
    })
    test("should do nothing if canRedo = false", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      expect(await oib.redo()).toEqual(oib.model)
    })
  })

  describe("export", () =>
  {
    test("should call recognizer.export", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.export = jest.fn(() => Promise.resolve(jiixText))
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      await oib.export()
      await expect(oib.recognizer.export).toBeCalledTimes(1)
    })
    test("should reject if recognizer.export rejected", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.grabber.attach = jest.fn()
      oib.renderer.init = jest.fn()
      oib.internalEvent.emitError = jest.fn()
      oib.recognizer.send = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      oib.recognizer.export = jest.fn(() => Promise.reject("poney"))
      await oib.init(wrapperHTML)
      await oib.export()
      expect(oib.internalEvent.emitError).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize", () =>
  {
    test("should call renderer.resize", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.menu.style.update = jest.fn()
      oib.renderer.resize = jest.fn()
      oib.recognizer.init = jest.fn(() => Promise.resolve())
      await oib.init(wrapperHTML)
      await oib.resize(1, 2)
      await expect(oib.renderer.resize).toBeCalledTimes(1)
    })
    test("should update model", async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement("div")
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.menu.render = jest.fn()
      oib.menu.style.update = jest.fn()
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
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.svgDebugger.apply = jest.fn()
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(1)
    })
    test("should call recognizer.eraseStrokes", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.svgDebugger.apply = jest.fn()
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.clear()
      await expect(oib.recognizer.eraseStrokes).toBeCalledTimes(1)
      await expect(oib.recognizer.eraseStrokes).toBeCalledWith([stroke.id])
    })
    test("should clear model", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.svgDebugger.apply = jest.fn()
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      const stroke = buildOIStroke()
      oib.model.addSymbol(stroke)
      oib.clear()
      const newModel = await oib.clear()
      await expect(newModel.symbols).toHaveLength(0)
      await expect(oib.model.symbols).toHaveLength(0)
    })
    test("should do nothing if strokes empty", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.svgDebugger.apply = jest.fn()
      oib.renderer.clear = jest.fn()
      oib.recognizer.eraseStrokes = jest.fn()
      oib.recognizer.waitForIdle = jest.fn(() => Promise.resolve())
      oib.clear()
      await expect(oib.renderer.clear).toBeCalledTimes(0)
      await expect(oib.recognizer.eraseStrokes).toBeCalledTimes(0)
    })
  })

  describe("destroy", () =>
  {
    test("should call grabber.detach", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.grabber.detach).toBeCalledTimes(1)
    })

    test("should call renderer.destroy", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.renderer.destroy).toBeCalledTimes(1)
    })

    test("should call recognizer.destroy", async () =>
    {
      const layerInfo = document.createElement("div")
      const oib = new OIBehaviors(DefaultBehaviorsOptions, layerInfo)
      oib.grabber.detach = jest.fn()
      oib.renderer.destroy = jest.fn()
      oib.recognizer.close = jest.fn()
      oib.destroy()
      await expect(oib.recognizer.close).toBeCalledTimes(1)
      await expect(oib.recognizer.close).toBeCalledWith(1000, InternalEventType.WS_CLOSED)
    })

  })
})
