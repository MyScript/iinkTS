import
{
  DefaultConfiguration,
  OIBehaviors,
  OIEdgeLine,
  OIRotationManager,
  OIShapeCircle,
  OIShapePolygon,
  OIShapeRectangle,
  OIStroke,
  SvgElementRole,
  TBehaviorOptions,
  TPoint,
  rotatePoint,
} from "../../../src/iink"

describe("OIRotationManager.ts", () =>
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
    const manager = new OIRotationManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIRotationManager(behaviors)
    manager.texter.updateTextBoundingBox = jest.fn()
    manager.renderer.setAttribute = jest.fn()

    test("rotate stroke", () =>
    {
      const stroke = new OIStroke({}, 1)
      const origin: TPoint = { x: 0, y: 0 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 10, x: 10, y: 0 })
      manager.applyToSymbol(stroke, origin, Math.PI / 2)
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
      manager.applyToSymbol(circle, origin, Math.PI / 2)
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
      manager.applyToSymbol(rect, origin, Math.PI / 2)
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
      expect(() => manager.applyToSymbol(rect, origin, Math.PI / 2)).toThrowError("Can't apply rotate on shape, kind unknow: pouet")
    })
    test("rotate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OIEdgeLine({}, start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(line, origin, Math.PI / 2)
      expect(line.start.x.toFixed(0)).toEqual("0")
      expect(line.start.y.toFixed(0)).toEqual("0")
      expect(line.end.x.toFixed(0)).toEqual("5")
      expect(line.end.y.toFixed(0)).toEqual("0")
    })
  })

  describe("resize process on stroke", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.selector.resetSelectedGroup = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIRotationManager(behaviors)
    manager.applyToSymbol = jest.fn()

    const stroke = new OIStroke({}, 1)
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotRotate = stroke.clone()
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
        rotateToPoint: rotatePoint(rotateOrigin, rotateCenter, Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: rotatePoint(rotateOrigin, rotateCenter, Math.PI / 2),
        angle: 90,
      },
      {
        rotateToPoint: rotatePoint(rotateOrigin, rotateCenter, -Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: rotatePoint(rotateOrigin, rotateCenter, -Math.PI / 2),
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
        manager.start(rotateElement, rotateOrigin)

        expect(manager.wrapper).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledWith(group.id, "transform-origin", `${ rotateCenter.x }px ${ rotateCenter.y }px`)
      })
      test(`shoud continu with angle: "${ data.angle }°`, () =>
      {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        expect(behaviors.renderer.setAttribute).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledWith(group.id, "transform", `rotate(${ data.angle })`)
      })
      test(`shoud end with angle: "${ data.angle }°`, async () =>
      {
        await manager.end(data.rotateToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotRotate)
      })
    })
  })
})
