import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import
{
  IIEdgeArc,
  IIEdgeLine,
  IIEdgePolyLine,
  IIResizeManager,
  IIShapeCircle,
  IIShapeEllipse,
  IIShapePolygon,
  IIStroke,
  IIText,
  ResizeDirection,
  SvgElementRole,
  TIISymbolChar,
  TPoint
} from "../../../src/iink"
import { buildOIStroke } from "../helpers"

describe("IIResizeManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIResizeManager(editor)
    expect(manager).toBeDefined()
  })

  describe("applyToSymbol", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIResizeManager(editor)
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
      const stroke = new IIStroke()
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
      const poly = new IIShapePolygon(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      expect(() => manager.applyToSymbol(poly, origin, 2, 3)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply resize on shape, kind unknow:") }))
    })
    test("should resize shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const shape = new IIShapeCircle(center, radius)
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
      const shape = new IIShapeEllipse(center, radiusX, radiusY, orientation)
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
      const shape = new IIShapePolygon(points)
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
      const edge = new IIEdgeLine(start, end)
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
      const edge = new IIEdgeArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
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
      const edge = new IIEdgeLine(start, end)
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
      const edge = new IIEdgePolyLine(points)
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
      manager.editor.texter.updateBounds = jest.fn()
      const point: TPoint = { x: 0, y: 0 }
      const chars: TIISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 0 },
          color: "black",
          fontSize: 12,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        }
      ]
      const text = new IIText(chars, point, { height: 10, width: 5, x: 0, y: 0 })
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(text, origin, 2, 3)
      expect(text.point).toEqual({ x: 0, y: 0 })
      expect(chars[0].fontSize).toEqual(30)
      expect(manager.editor.texter.updateBounds).toHaveBeenCalledTimes(1)
    })
  })

  describe("resize process on stroke without snap", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.transformScale = jest.fn(() => Promise.resolve())
    editor.renderer.setAttribute = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.snaps.configuration.guide = false
    editor.snaps.configuration.symbol = false

    const manager = new IIResizeManager(editor)
    manager.applyToSymbol = jest.fn()

    const stroke = new IIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = stroke.clone()
    stroke.selected = true
    editor.model.addSymbol(stroke)

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
      await editor.init()
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
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform-origin", `${ data.transformOrigin.x }px ${ data.transformOrigin.y }px`)
      })
      test(`shoud continu with direction: "${ data.direction }"`, () =>
      {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `scale(${ data.scale.x },${ data.scale.y })`)
      })
      test(`shoud end with direction: "${ data.direction }"`, async () =>
      {
        await manager.end(resizeToPoint)
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(editor.recognizer.transformScale).toHaveBeenCalledTimes(1)
        expect(editor.recognizer.transformScale).toHaveBeenCalledWith([stroke.id], data.scale.x, data.scale.y, data.transformOrigin.x, data.transformOrigin.y)
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

})
