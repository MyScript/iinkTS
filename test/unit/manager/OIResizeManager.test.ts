import
{
  DefaultConfiguration,
  OIBehaviors,
  OIDecoratorUnderline,
  OIEdgeLine,
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

  describe("should applyToSymbol", () =>
  {
    const behaviors = new OIBehaviors(DefaultBehaviorsOptions)
    const manager = new OIResizeManager(behaviors)

    test("resize stroke", () =>
    {
      const stroke = new OIStroke({}, 1)
      const origin: TPoint = { x: 1, y: 2 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      manager.applyToSymbol(stroke, origin, 2, 3)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("resize shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new OIShapeCircle({}, center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyToSymbol(circle, origin, 2, 4)
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
      manager.applyToSymbol(rect, origin, 2, 3)
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
      expect(() => manager.applyToSymbol(rect, origin, 2, 3)).toThrowError("Can't apply resize on shape, kind unknow: pouet")
    })
    test("resize edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OIEdgeLine({}, start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(line, origin, 2, 3)
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
      manager.applyToSymbol(underline, origin, 2, 3)
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
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.selectionManager.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIResizeManager(behaviors)
    manager.applyToSymbol = jest.fn()

    const stroke = new OIStroke({}, 1)
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = stroke.clone()
    stroke.selected = true
    behaviors.model.addSymbol(stroke)

    const resizeToPoint: TPoint = {
      x: (stroke.boundingBox.xMax + stroke.boundingBox.xMin) / 4,
      y: (stroke.boundingBox.yMax + stroke.boundingBox.yMin) / 4
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        transformOrigin: {
          x: stroke.boundingBox.xMiddle,
          y: stroke.boundingBox.yMax
        },
        scale: {
          x: 1,
          y: 1 + (stroke.boundingBox.yMin - resizeToPoint.y) / stroke.boundingBox.height
        }
      },
      {
        direction: ResizeDirection.East,
        transformOrigin: {
          x: stroke.boundingBox.xMin,
          y: stroke.boundingBox.yMiddle
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.boundingBox.xMax) / stroke.boundingBox.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.South,
        transformOrigin: {
          x: stroke.boundingBox.xMiddle,
          y: stroke.boundingBox.yMin
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - stroke.boundingBox.yMax) / stroke.boundingBox.height,
        }
      },
      {
        direction: ResizeDirection.West,
        transformOrigin: {
          x: stroke.boundingBox.xMax,
          y: stroke.boundingBox.yMiddle
        },
        scale: {
          x: 1 + (stroke.boundingBox.xMin - resizeToPoint.x) / stroke.boundingBox.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.NorthEast,
        transformOrigin: {
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
        transformOrigin: {
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
        transformOrigin: {
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
        transformOrigin: {
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
      resizeElement.setAttribute("transform-origin", JSON.stringify(data.transformOrigin))
      group.appendChild(resizeElement)

      test(`should start with direction: "${ data.direction }" `, () =>
      {
        manager.start(resizeElement)

        expect(manager.wrapper).toEqual(group)
        expect(manager.boundingBox).toEqual(stroke.boundingBox)
        expect(manager.direction).toEqual(data.direction)
        expect(manager.transformOrigin).toEqual(data.transformOrigin)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledWith(group.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
      })
      test(`shoud continu with direction: "${ data.direction }"`, () =>
      {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })

        expect(behaviors.renderer.setAttribute).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.setAttribute).toHaveBeenCalledWith(group.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
      })
      test(`shoud end with direction: "${ data.direction }"`, async () =>
      {
        await manager.end(resizeToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.selectionManager.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.selectionManager.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
