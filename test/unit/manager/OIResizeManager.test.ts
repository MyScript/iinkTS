import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  OIResizeManager,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon,
  OIStroke,
  OIText,
  ResizeDirection,
  SvgElementRole,
  TOISymbolChar,
  TPoint
} from "../../../src/iink"
import { buildOIStroke } from "../helpers"

describe("OIResizeManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIResizeManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("applyToSymbol", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIResizeManager(behaviors)
    test("should not resize symbol with type unknow", () =>
    {
      const stroke = buildOIStroke()
      //@ts-ignore
      stroke.type = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      expect(() => manager.applyToSymbol(stroke, origin, 2, 3)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on symbol, type unknow:") }))
    })
    test("should resize stroke", () =>
    {
      const stroke = new OIStroke()
      const origin: TPoint = { x: 1, y: 2 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 2 })
      stroke.addPointer({ p: 1, t: 10, x: 21, y: 42 })
      manager.applyToSymbol(stroke, origin, 2, 3)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("should not resize shape with kind unknow", () =>
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
      expect(() => manager.applyToSymbol(poly, origin, 2, 3)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on shape, kind unknow:") }))
    })
    test("should resize shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const shape = new OIShapeCircle(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyToSymbol(shape, origin, 2, 4)
      expect(shape.radius).toEqual(12)
      expect(shape.center).toEqual({ x: 9, y: 14 })
    })
    test("should resize shape Ellipse", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const radiusX = 50
      const radiusY = 10
      const orientation = 0
      const shape = new OIShapeEllipse(center, radiusX, radiusY, orientation)
      const scaleX = 2
      const scaleY = 4
      const origin: TPoint = { x: shape.bounds.xMin, y: shape.bounds.yMin }
      manager.applyToSymbol(shape, origin, scaleX, scaleY)
      expect(shape.radiusX).toEqual(radiusX * scaleX)
      expect(shape.radiusY).toEqual(radiusY * scaleY)
      expect(shape.center).toEqual({ x: 49.534, y: 29.931 })
    })
    test("should resize shape Polygon", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const shape = new OIShapePolygon(points)
      const scaleX = 2
      const scaleY = 4
      const origin: TPoint = { x: shape.bounds.xMin, y: shape.bounds.yMin }
      manager.applyToSymbol(shape, origin, scaleX, scaleY)
      expect(shape.points[0].x).toEqual(0)
      expect(shape.points[0].y).toEqual(0)
      expect(shape.points[1].x).toEqual(40)
      expect(shape.points[1].y).toEqual(0)
      expect(shape.points[2].x).toEqual(40)
      expect(shape.points[2].y).toEqual(40)
      expect(shape.points[3].x).toEqual(0)
      expect(shape.points[3].y).toEqual(40)
    })
    test("should not resize edge with kind unknow", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = new OIEdgeLine(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      expect(() => manager.applyToSymbol(edge, origin, 2, 3)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on edge, kind unknow:") }))
    })
    test("should resize edge Arc", () =>
    {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = -Math.PI
      const sweepAngle = Math.PI
      const radiusX = 50
      const radiusY = 10
      const phi = 0
      const edge = new OIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      const origin: TPoint = { x: edge.bounds.xMin, y: edge.bounds.yMin }
      const scaleX = 2
      const scaleY = 3
      manager.applyToSymbol(edge, origin, scaleX, scaleY)
      expect(edge.center).toEqual({ x: 55, y: 29.796 })
      expect(edge.radiusX).toEqual(radiusX * scaleX)
      expect(edge.radiusY).toEqual(radiusY * scaleY)
    })
    test("resize edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = new OIEdgeLine(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(edge, origin, 2, 3)
      expect(edge.start).toEqual({ x: 0, y: 0 })
      expect(edge.end).toEqual({ x: 0, y: 15 })
    })
    test("resize edge PolyEdge", () =>
    {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const edge = new OIEdgePolyLine(points)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(edge, origin, 2, 3)
      expect(edge.points[0].x).toEqual(0)
      expect(edge.points[0].y).toEqual(0)
      expect(edge.points[1].x).toEqual(40)
      expect(edge.points[1].y).toEqual(0)
      expect(edge.points[2].x).toEqual(40)
      expect(edge.points[2].y).toEqual(30)
      expect(edge.points[3].x).toEqual(0)
      expect(edge.points[3].y).toEqual(30)
    })
    test("resize edge Text", () =>
    {
      manager.behaviors.texter.updateBounds = jest.fn()
      const point: TPoint = { x: 0, y: 0 }
      const chars: TOISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 0 },
          color: "black",
          fontSize: 12,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        }
      ]
      const text = new OIText(chars, point, { height: 10, width: 5, x: 0, y: 0 })
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(text, origin, 2, 3)
      expect(text.point).toEqual({ x: 0, y: 0 })
      expect(chars[0].fontSize).toEqual(30)
      expect(manager.behaviors.texter.updateBounds).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize process on stroke without snap", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.transformScale = jest.fn(() => Promise.resolve())
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.selector.resetSelectedGroup = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.snaps.snapToGrid = false
    behaviors.snaps.snapToElement = false
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIResizeManager(behaviors)
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
        expect(behaviors.recognizer.transformScale).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.transformScale).toHaveBeenCalledWith([stroke.id], data.scale.x, data.scale.y, data.transformOrigin.x, data.transformOrigin.y)
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
