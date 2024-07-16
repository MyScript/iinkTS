import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OIEdgeLine,
  OIResizeManager,
  OIShapeCircle,
  OIShapePolygon,
  OIStroke,
  ResizeDirection,
  SvgElementRole,
  TPoint
} from "../../../src/iink"

describe("OIResizeManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIResizeManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIResizeManager(behaviors)

    test("resize stroke", () =>
    {
      const stroke = new OIStroke()
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
      const circle = new OIShapeCircle(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyToSymbol(circle, origin, 2, 4)
      expect(circle.radius).toEqual(12)
      expect(circle.center).toEqual({ x: 9, y: 14 })
    })
    test("resize shape with kind unknow", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 }
      ]
      const poly = new OIShapePolygon(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      expect(() => manager.applyToSymbol(poly, origin, 2, 3)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on shape, kind unknow:")}))
    })
    test("resize edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OIEdgeLine(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(line, origin, 2, 3)
      expect(line.start).toEqual({ x: 0, y: 0 })
      expect(line.end).toEqual({ x: 0, y: 15 })
    })
  })

  describe("resize process on stroke without snap", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.selector.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIResizeManager(behaviors)
    manager.snaps.snapToGrid = false
    manager.snaps.snapToElement = false
    manager.applyToSymbol = jest.fn()

    const stroke = new OIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = stroke.clone()
    stroke.selected = true
    behaviors.model.addSymbol(stroke)

    const resizeToPoint: TPoint = {
      x: (stroke.bounds.xMax + stroke.bounds.xMin) / 4,
      y: (stroke.bounds.yMax + stroke.bounds.yMin) / 4
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        transformOrigin: {
          x: stroke.bounds.xMid,
          y: stroke.bounds.yMax
        },
        scale: {
          x: 1,
          y: 1 + (stroke.bounds.yMin - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.East,
        transformOrigin: {
          x: stroke.bounds.xMin,
          y: stroke.bounds.yMid
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.bounds.xMax) / stroke.bounds.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.South,
        transformOrigin: {
          x: stroke.bounds.xMid,
          y: stroke.bounds.yMin
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - stroke.bounds.yMax) / stroke.bounds.height,
        }
      },
      {
        direction: ResizeDirection.West,
        transformOrigin: {
          x: stroke.bounds.xMax,
          y: stroke.bounds.yMid
        },
        scale: {
          x: 1 + (stroke.bounds.xMin - resizeToPoint.x) / stroke.bounds.width,
          y: 1
        }
      },
      {
        direction: ResizeDirection.NorthEast,
        transformOrigin: {
          x: stroke.bounds.xMin,
          y: stroke.bounds.yMax
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.bounds.xMax) / stroke.bounds.width,
          y: 1 + (stroke.bounds.yMin - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.NorthWest,
        transformOrigin: {
          x: stroke.bounds.xMax,
          y: stroke.bounds.yMax
        },
        scale: {
          x: 1 + (stroke.bounds.xMin - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (stroke.bounds.yMin - resizeToPoint.y) / stroke.bounds.height
        }
      },
      {
        direction: ResizeDirection.SouthEast,
        transformOrigin: {
          x: stroke.bounds.xMin,
          y: stroke.bounds.yMin
        },
        scale: {
          x: 1 + (resizeToPoint.x - stroke.bounds.xMax) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - stroke.bounds.yMax) / stroke.bounds.height,
        }
      },
      {
        direction: ResizeDirection.SouthWest,
        transformOrigin: {
          x: stroke.bounds.xMax,
          y: stroke.bounds.yMin
        },
        scale: {
          x: 1 + (stroke.bounds.xMin - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - stroke.bounds.yMax) / stroke.bounds.height,
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
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", data.direction)
      group.appendChild(resizeElement)

      test(`should start with direction: "${ data.direction }" `, () =>
      {
        manager.start(resizeElement, data.transformOrigin)
        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.boundingBox).toEqual(stroke.bounds)
        expect(manager.direction).toEqual(data.direction)
        expect(manager.transformOrigin).toEqual(data.transformOrigin)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
      })
      test(`shoud continu with direction: "${ data.direction }"`, () =>
      {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
      })
      test(`shoud end with direction: "${ data.direction }"`, async () =>
      {
        await manager.end(resizeToPoint)
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
