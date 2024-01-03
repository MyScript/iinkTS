import
  {
    DefaultConfiguration,
    OIBehaviors,
    OIDecoratorUnderline,
    OILine,
    OIRotateManager,
    OIShapeCircle,
    OIShapePolygon,
    OIShapeRectangle,
    OIStroke,
    SvgElementRole,
    TBehaviorOptions,
    TPoint,
    rotatePoint,
  } from "../../../src/iink"

describe("OIRotateManager.ts", () =>
{
  const DefaultBehaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  DefaultBehaviorsOptions.configuration.offscreen = true
  DefaultBehaviorsOptions.configuration.recognition.type = "Raw Content"
  DefaultBehaviorsOptions.configuration.rendering.smartGuide.enable = false

  test("should create", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIRotateManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("Properties", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIRotateManager(behaviors)

    test("shoud have model", () =>
    {
      expect(manager.model).toBe(behaviors.model)
    })
    test("shoud have undoRedoManager", () =>
    {
      expect(manager.undoRedoManager).toBe(behaviors.undoRedoManager)
    })
    test("shoud have renderer", () =>
    {
      expect(manager.renderer).toBe(behaviors.renderer)
    })
    test("shoud have recognizer", () =>
    {
      expect(manager.recognizer).toBe(behaviors.recognizer)
    })
  })

  describe("should applyOnSymbol", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIRotateManager(behaviors)

    test("rotate stroke", () =>
    {
      const stroke = new OIStroke({}, 1)
      const origin: TPoint = { x: 0, y: 0 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 10, x: 10, y: 0 })
      manager.applyOnSymbol(stroke, origin, Math.PI / 2)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("-10")

    })
    test("rotate shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new OIShapeCircle({}, center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyOnSymbol(circle, origin, Math.PI / 2)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 4, y: -2 })
    })
    test("rotate shape Rectangle", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      const rect = new OIShapeRectangle({}, points)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(rect, origin, Math.PI / 2)
      expect(rect.points[0].x.toFixed(0)).toEqual("0")
      expect(rect.points[0].y.toFixed(0)).toEqual("0")
      expect(rect.points[1].x.toFixed(0)).toEqual("5")
      expect(rect.points[1].y.toFixed(0)).toEqual("0")
      expect(rect.points[2].x.toFixed(0)).toEqual("5")
      expect(rect.points[2].y.toFixed(0)).toEqual("-5")
      expect(rect.points[3].x.toFixed(0)).toEqual("0")
      expect(rect.points[3].y.toFixed(0)).toEqual("-5")

    })
    test("rotate shape with kind unknow", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      //@ts-ignore
      const rect = new OIShapePolygon({}, points, "pouet")
      const origin: TPoint = { x: 0, y: 0 }
      expect(() => manager.applyOnSymbol(rect, origin, Math.PI / 2)).toThrowError("Can't apply rotate on shape, kind unknow: pouet")
    })
    test("rotate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OILine({}, start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(line, origin, Math.PI / 2)
      expect(line.start.x.toFixed(0)).toEqual("0")
      expect(line.start.y.toFixed(0)).toEqual("0")
      expect(line.end.x.toFixed(0)).toEqual("5")
      expect(line.end.y.toFixed(0)).toEqual("0")
    })
    test("rotate Decorator", () =>
    {
      const stroke = new OIStroke({}, 1)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      const underline = new OIDecoratorUnderline({}, [stroke])
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(underline, origin, Math.PI / 2)
      expect(underline.vertices[0]).toEqual({ x: 1, y: 47 })
      expect(underline.vertices[1]).toEqual({ x: 21, y: 47 })
    })
  })

  describe("resize process on stroke", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.setTransformOrigin = jest.fn()
    behaviors.renderer.rotateElement = jest.fn()
    behaviors.renderer.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIRotateManager(behaviors)
    manager.applyOnSymbol = jest.fn()

    const stroke = new OIStroke({}, 1)
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotRotate = stroke.getClone()
    behaviors.model.addSymbol(stroke)

    const rotateCenter: TPoint = {
      x: (stroke.boundingBox.xMax + stroke.boundingBox.xMin) / 2,
      y: (stroke.boundingBox.yMin + stroke.boundingBox.yMax) / 2
    }
    const rotateOrigin: TPoint = {
      x: (stroke.boundingBox.xMax + stroke.boundingBox.xMin) / 2,
      y: stroke.boundingBox.yMax
    }

    const testDatas = [
      {
        rotateToPoint: rotatePoint(rotateCenter, rotateOrigin, Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: rotatePoint(rotateCenter, rotateOrigin, Math.PI / 2),
        angle: 90,
      },
      {
        rotateToPoint: rotatePoint(rotateCenter, rotateOrigin, -Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: rotatePoint(rotateCenter, rotateOrigin, -Math.PI / 2),
        angle: 270,
      },
    ]

    beforeAll(async () =>
    {
      await behaviors.init(divElement)
    })

    testDatas.forEach(data =>
    {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.Selected)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      rotateElement.setAttribute("cx", rotateOrigin.x.toString())
      rotateElement.setAttribute("cy", rotateOrigin.y.toString())
      group.appendChild(rotateElement)

      test(`should start with angle: "${ data.angle }° `, () =>
      {
        manager.start(rotateElement)

        expect(manager.wrapper).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        expect(behaviors.renderer.setTransformOrigin).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setTransformOrigin).toHaveBeenCalledWith(group.id, rotateCenter.x, rotateCenter.y)
      })
      test(`shoud continu with angle: "${ data.angle }°`, () =>
      {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        expect(behaviors.renderer.rotateElement).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.rotateElement).toHaveBeenCalledWith(group.id, data.angle)
      })
      test(`shoud end with angle: "${ data.angle }°`, async () =>
      {
        await manager.end(data.rotateToPoint)

        expect(manager.applyOnSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotRotate)
      })
    })
  })
})
