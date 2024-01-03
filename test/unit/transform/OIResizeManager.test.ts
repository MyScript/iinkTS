import
  {
    DefaultConfiguration,
    OIBehaviors,
    OIDecoratorUnderline,
    OILine,
    OIResizeManager,
    OIShapeCircle,
    OIShapePolygon,
    OIShapeRectangle,
    OIStroke,
    ResizeDirection,
    SvgElementRole,
    TBehaviorOptions,
    TPoint
  } from "../../../src/iink"

describe("OIResizeManager.ts", () =>
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
    const manager = new OIResizeManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("Properties", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIResizeManager(behaviors)

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
    const manager = new OIResizeManager(behaviors)

    test("resize stroke", () =>
    {
      const stroke = new OIStroke({}, 1)
      const origin: TPoint = { x: 1, y: 2 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      manager.applyOnSymbol(stroke, origin, 2, 3)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("resize shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new OIShapeCircle({}, center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyOnSymbol(circle, origin, 2, 4)
      expect(circle.radius).toEqual(12)
      expect(circle.center).toEqual({ x: 9, y: 14 })
    })
    test("resize shape Rectangle", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      const rect = new OIShapeRectangle({}, points)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(rect, origin, 2, 3)
      expect(rect.points[0]).toEqual({ x: 0, y: 0 })
      expect(rect.points[1]).toEqual({ x: 0, y: 15 })
      expect(rect.points[2]).toEqual({ x: 10, y: 15 })
      expect(rect.points[3]).toEqual({ x: 10, y: 0 })
    })
    test("resize shape with kind unknow", () =>
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
      expect(() => manager.applyOnSymbol(rect, origin, 2, 3)).toThrowError("Can't apply resize on shape, kind unknow: pouet")
    })
    test("resize edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OILine({}, start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(line, origin, 2, 3)
      expect(line.start).toEqual({ x: 0, y: 0 })
      expect(line.end).toEqual({ x: 0, y: 15 })
    })
    test("resize Decorator", () =>
    {
      const stroke = new OIStroke({}, 1)
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      const underline = new OIDecoratorUnderline({}, [stroke])
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyOnSymbol(underline, origin, 2, 3)
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
    behaviors.renderer.scaleElement = jest.fn()
    behaviors.renderer.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIResizeManager(behaviors)
    manager.applyOnSymbol = jest.fn()

    const stroke = new OIStroke({}, 1)
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = stroke.getClone()
    stroke.selected = true
    behaviors.model.addSymbol(stroke)

    const resizeToPoint: TPoint = {
      x: (stroke.boundingBox.xMax + stroke.boundingBox.xMin) / 4,
      y: (stroke.boundingBox.yMax + stroke.boundingBox.yMin) / 4
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        origin: {
          x: 0,
          y: stroke.boundingBox.yMax
        },
        scale: {
          x: 1,
          y: 1 + (stroke.boundingBox.yMin - resizeToPoint.y) / stroke.boundingBox.height
        }
      },
      {
        direction: ResizeDirection.East,
        origin: {
          x: stroke.boundingBox.xMin,
          y: 0
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.boundingBox.xMax) / stroke.boundingBox.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.South,
        origin: {
          x: 0,
          y: stroke.boundingBox.yMin
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - stroke.boundingBox.yMax) / stroke.boundingBox.height,
        }
      },
      {
        direction: ResizeDirection.West,
        origin: {
          x: stroke.boundingBox.xMax,
          y: 0
        },
        scale: {
          x: 1 + (stroke.boundingBox.xMin - resizeToPoint.x) / stroke.boundingBox.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.NorthEast,
        origin: {
          x: stroke.boundingBox.xMin,
          y: stroke.boundingBox.yMax
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.boundingBox.xMax) / stroke.boundingBox.width,
          y: 1 + (stroke.boundingBox.yMin - resizeToPoint.y) / stroke.boundingBox.height
        }
      },
      {
        direction: ResizeDirection.NorthWest,
        origin: {
          x: stroke.boundingBox.xMax,
          y: stroke.boundingBox.yMax
        },
        scale: {
          x: 1 + (stroke.boundingBox.xMin - resizeToPoint.x) / stroke.boundingBox.width,
          y: 1 + (stroke.boundingBox.yMin - resizeToPoint.y) / stroke.boundingBox.height
        }
      },
      {
        direction: ResizeDirection.SouthEast,
        origin: {
          x: stroke.boundingBox.xMin,
          y: stroke.boundingBox.yMin
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.boundingBox.xMax) / stroke.boundingBox.width,
          y: 1 + (resizeToPoint.y - stroke.boundingBox.yMax) / stroke.boundingBox.height,
        }
      },
      {
        direction: ResizeDirection.SouthWest,
        origin: {
          x: stroke.boundingBox.xMax,
          y: stroke.boundingBox.yMin
        },
        scale: {
          x: 1 + (stroke.boundingBox.xMin - resizeToPoint.x) / stroke.boundingBox.width,
          y: 1 + (resizeToPoint.y - stroke.boundingBox.yMax) / stroke.boundingBox.height,
        }
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
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", data.direction)
      group.appendChild(resizeElement)

      test(`should start with direction: "${ data.direction } `, () =>
      {
        manager.start(resizeElement)

        expect(manager.wrapper).toEqual(group)
        expect(manager.boundingBox).toEqual(stroke.boundingBox)
        expect(manager.direction).toEqual(data.direction)
        expect(manager.origin).toEqual(data.origin)
        expect(behaviors.renderer.setTransformOrigin).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setTransformOrigin).toHaveBeenCalledWith(group.id, data.origin.x, data.origin.y)
      })
      test(`shoud continu with direction: "${ data.direction }"`, () =>
      {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })

        expect(behaviors.renderer.scaleElement).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.scaleElement).toHaveBeenCalledWith(group.id, data.scale.x, data.scale.y)
      })
      test(`shoud end with direction: "${ data.direction }"`, async () =>
      {
        await manager.end(resizeToPoint)

        expect(manager.applyOnSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
