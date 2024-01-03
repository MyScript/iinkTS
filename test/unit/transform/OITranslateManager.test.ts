import
  {
    DefaultConfiguration,
    OIBehaviors,
    OIDecoratorUnderline,
    OILine,
    OITranslateManager,
    OIShapeCircle,
    OIShapePolygon,
    OIShapeRectangle,
    OIStroke,
    TBehaviorOptions,
    TPoint,
    SvgElementRole,
  } from "../../../src/iink"

describe("OITranslateManager.ts", () =>
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
    const manager = new OITranslateManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("Properties", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OITranslateManager(behaviors)

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
    const manager = new OITranslateManager(behaviors)

    test("translate stroke", () =>
    {
      const stroke = new OIStroke({}, 1)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 10, x: 10, y: 0 })
      manager.applyOnSymbol(stroke, 10, 15)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 11, y: 16 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 20, y: 15 }))
    })
    test("translate shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new OIShapeCircle({}, center, radius)
      manager.applyOnSymbol(circle, 10, 15)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 15, y: 20 })
    })
    test("translate shape Rectangle", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      const rect = new OIShapeRectangle({}, points)
      manager.applyOnSymbol(rect, 10, 15)
      expect(rect.points[0]).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(rect.points[1]).toEqual(expect.objectContaining({ x: 10, y: 20 }))
      expect(rect.points[2]).toEqual(expect.objectContaining({ x: 15, y: 20 }))
      expect(rect.points[3]).toEqual(expect.objectContaining({ x: 15, y: 15 }))

    })
    test("translate shape with kind unknow", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      //@ts-ignore
      const rect = new OIShapePolygon({}, points, "pouet")
      expect(() => manager.applyOnSymbol(rect, 10, 15)).toThrowError("Can't apply translate on shape, kind unknow: pouet")
    })
    test("translate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OILine({}, start, end)
      manager.applyOnSymbol(line, 10, 15)
      expect(line.start).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(line.end).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
    test("translate Decorator", () =>
    {
      const stroke = new OIStroke({}, 1)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      const underline = new OIDecoratorUnderline({}, [stroke])
      manager.applyOnSymbol(underline, 10, 15)
      expect(underline.vertices[0]).toEqual({ x: 1, y: 47 })
      expect(underline.vertices[1]).toEqual({ x: 21, y: 47 })
    })
  })

  describe("translate process on stroke", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.translateStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.setTransformOrigin = jest.fn()
    behaviors.renderer.translateElement = jest.fn()
    behaviors.renderer.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OITranslateManager(behaviors)
    manager.applyOnSymbol = jest.fn()

    const stroke = new OIStroke({}, 1)
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotTranslate = stroke.getClone()
    behaviors.model.addSymbol(stroke)

    const translationOrigin: TPoint = {
      x: (stroke.boundingBox.xMax + stroke.boundingBox.xMin) / 2,
      y: (stroke.boundingBox.yMin + stroke.boundingBox.yMax) / 2
    }

    const testDatas = [
      {
        translateToPoint: { x: translationOrigin.x, y: translationOrigin.y + 10 },
        tx: 0,
        ty: 10
      },
      {
        translateToPoint: { x: translationOrigin.x + 10, y: translationOrigin.y },
        tx: 10,
        ty: 0
      },
      {
        translateToPoint: { x: translationOrigin.x + 20, y: translationOrigin.y + 25 },
        tx: 20,
        ty: 25,
      }
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
      const translateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(translateElement)

      test(`should start with tx: "${ data.tx } & ty ${ data.ty }`, () =>
      {
        manager.start(translateElement, translationOrigin)

        expect(manager.wrapper).toEqual(group)
        expect(manager.origin).toEqual(translationOrigin)
      })
      test(`shoud continu with tx: "${ data.tx } & ty ${ data.ty }`, () =>
      {
        expect(manager.continue(data.translateToPoint)).toEqual({ tx: data.tx, ty: data.ty })

        expect(behaviors.renderer.translateElement).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.translateElement).toHaveBeenCalledWith(group.id, data.tx, data.ty)
      })
      test(`shoud end with tx: "${ data.tx } & ty ${ data.ty }`, async () =>
      {
        await manager.end(data.translateToPoint)

        expect(manager.applyOnSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.translateStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.translateStrokes).toHaveBeenCalledWith([stroke.id], data.tx, data.ty)
        expect(stroke).not.toEqual(strokeNotTranslate)
      })
    })
  })
})
