import { createCanvasMock, asEditor } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import {
  EdgeArcOps,
  EdgeLineOps,
  EdgePolyLineOps,
  IIResizeManager,
  ShapeCircleOps,
  ShapeEllipseOps,
  ShapePolygonOps,
  StrokeOps,
  ResizeDirection,
  SvgElementRole,
  TSymbolChar,
  TPoint,
  TextOps,
  MatrixTransform,
  OBBOps,
} from "@/iink"

describe("IIResizeManager.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const manager = new IIResizeManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("applyToSymbol", () => {
    const editor = createCanvasMock()
    const manager = new IIResizeManager(asEditor(editor))
    test("should not resize symbol with type unknown", () => {
      const stroke = buildIIStroke()
      //@ts-ignore
      stroke.type = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(stroke, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply resize on symbol, type unknown:") })
      )
    })
    test("should resize stroke", () => {
      const stroke = StrokeOps.create()
      const origin: TPoint = { x: 1, y: 2 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 2 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 21, y: 42 })
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("should resize a math solver-output (draw) stroke like a normal stroke", () => {
      const stroke = StrokeOps.create()
      stroke.isSolverOutput = true
      const origin: TPoint = { x: 1, y: 2 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 2 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 21, y: 42 })
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 1, y: 2 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 41, y: 122 }))
    })
    test("should not resize shape with kind unknown", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapePolygonOps.create(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply resize on shape, kind unknown:") })
      )
    })
    test("should resize shape Circle", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const shape = ShapeCircleOps.create(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().scale(2, 4, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.radius).toEqual(12)
      expect(shape.center).toEqual({ x: 9, y: 14 })
    })
    test("should resize shape Ellipse", () => {
      const center: TPoint = { x: 0, y: 0 }
      const radiusX = 50
      const radiusY = 10
      const orientation = 0
      const shape = ShapeEllipseOps.create(center, radiusX, radiusY, orientation)
      const scaleX = 2
      const scaleY = 4
      const shapeBoundsBox = OBBOps.toBox(shape.bounds)
      const origin: TPoint = { x: shapeBoundsBox.x, y: shapeBoundsBox.y }
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.radiusX).toEqual(radiusX * scaleX)
      expect(shape.radiusY).toEqual(radiusY * scaleY)
      expect(shape.center).toEqual({ x: 49.534, y: 29.931 })
    })
    test("should resize shape Polygon", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const shape = ShapePolygonOps.create(points)
      const scaleX = 2
      const scaleY = 4
      const polyBoundsBox = OBBOps.toBox(shape.bounds)
      const origin: TPoint = { x: polyBoundsBox.x, y: polyBoundsBox.y }
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.points[0].x).toEqual(0)
      expect(shape.points[0].y).toEqual(0)
      expect(shape.points[1].x).toEqual(40)
      expect(shape.points[1].y).toEqual(0)
      expect(shape.points[2].x).toEqual(40)
      expect(shape.points[2].y).toEqual(40)
      expect(shape.points[3].x).toEqual(0)
      expect(shape.points[3].y).toEqual(40)
    })
    test("should not resize edge with kind unknown", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeLineOps.create(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(edge, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply resize on edge, kind unknown:") })
      )
    })
    test("should resize edge Arc", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = -Math.PI
      const sweepAngle = Math.PI
      const radiusX = 50
      const radiusY = 10
      const phi = 0
      const edge = EdgeArcOps.create(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      const edgeBoundsBox = OBBOps.toBox(edge.bounds)
      const origin: TPoint = { x: edgeBoundsBox.x, y: edgeBoundsBox.y }
      const scaleX = 2
      const scaleY = 3
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.center).toEqual({ x: 55, y: 29.796 })
      expect(edge.radiusX).toEqual(radiusX * scaleX)
      expect(edge.radiusY).toEqual(radiusY * scaleY)
    })
    test("resize edge Line", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeLineOps.create(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.start).toEqual({ x: 0, y: 0 })
      expect(edge.end).toEqual({ x: 0, y: 15 })
    })
    test("resize edge PolyEdge", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const edge = EdgePolyLineOps.create(points)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.points[0].x).toEqual(0)
      expect(edge.points[0].y).toEqual(0)
      expect(edge.points[1].x).toEqual(40)
      expect(edge.points[1].y).toEqual(0)
      expect(edge.points[2].x).toEqual(40)
      expect(edge.points[2].y).toEqual(30)
      expect(edge.points[3].x).toEqual(0)
      expect(edge.points[3].y).toEqual(30)
    })
    test("resize edge Text", () => {
      const point: TPoint = { x: 0, y: 0 }
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 0 },
          color: "black",
          fontSize: 12,
          fontWeight: "normal",
          id: "char-1",
          label: "A",
        },
      ]
      const text = TextOps.create(chars, point, { height: 10, width: 5, x: 0, y: 0 })
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(text, matrix)
      expect(text.point).toEqual({ x: 0, y: 0 })
      expect(chars[0].fontSize).toEqual(30)
      expect(text.bounds).toEqual(OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 30 }))
    })
  })

  describe("resize process on stroke without snap", () => {
    const editor = createCanvasMock()
    editor.client.init = jest.fn(() => Promise.resolve())
    editor.client.transformScale = jest.fn(() => Promise.resolve())
    editor.renderer.setAttribute = jest.fn()
    editor.renderer.drawSymbol = jest.fn()
    editor.snaps.snapConfiguration.guide = false
    editor.snaps.snapConfiguration.symbol = false

    const manager = new IIResizeManager(asEditor(editor))
    manager.applyToSymbol = jest.fn()

    const stroke = StrokeOps.create({})
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 10, y: 50 })
    const strokeNotResized = structuredClone(stroke)
    editor.model.addSymbol(stroke)
    editor.model.selectedIds.add(stroke.id)

    const sb = OBBOps.toBox(stroke.bounds)
    const resizeToPoint: TPoint = {
      x: (sb.x + stroke.bounds.width + sb.x) / 4,
      y: (sb.y + stroke.bounds.height + sb.y) / 4,
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        transformOrigin: {
          x: sb.x + stroke.bounds.width / 2,
          y: sb.y + stroke.bounds.height,
        },
        scale: {
          x: 1,
          y: 1 + (sb.y - resizeToPoint.y) / stroke.bounds.height,
        },
      },
      {
        direction: ResizeDirection.East,
        transformOrigin: {
          x: sb.x,
          y: sb.y + stroke.bounds.height / 2,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1,
        },
      },
      {
        direction: ResizeDirection.South,
        transformOrigin: {
          x: sb.x + stroke.bounds.width / 2,
          y: sb.y,
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - (sb.y + stroke.bounds.height)) / stroke.bounds.height,
        },
      },
      {
        direction: ResizeDirection.West,
        transformOrigin: {
          x: sb.x + stroke.bounds.width,
          y: sb.y + stroke.bounds.height / 2,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1,
        },
      },
      {
        direction: ResizeDirection.NorthEast,
        transformOrigin: {
          x: sb.x,
          y: sb.y + stroke.bounds.height,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1 + (sb.y - resizeToPoint.y) / stroke.bounds.height,
        },
      },
      {
        direction: ResizeDirection.NorthWest,
        transformOrigin: {
          x: sb.x + stroke.bounds.width,
          y: sb.y + stroke.bounds.height,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (sb.y - resizeToPoint.y) / stroke.bounds.height,
        },
      },
      {
        direction: ResizeDirection.SouthEast,
        transformOrigin: {
          x: sb.x,
          y: sb.y,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + stroke.bounds.width)) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - (sb.y + stroke.bounds.height)) / stroke.bounds.height,
        },
      },
      {
        direction: ResizeDirection.SouthWest,
        transformOrigin: {
          x: sb.x + stroke.bounds.width,
          y: sb.y,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / stroke.bounds.width,
          y: 1 + (resizeToPoint.y - (sb.y + stroke.bounds.height)) / stroke.bounds.height,
        },
      },
    ]

    beforeAll(async () => {
      await editor.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", data.direction)
      group.appendChild(resizeElement)

      test(`should start with direction: "${data.direction}" `, () => {
        manager.start(resizeElement, data.transformOrigin)
        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.boundingBox).toEqual(OBBOps.toBox(stroke.bounds))
        expect(manager.direction).toEqual(data.direction)
        expect(manager.transformOrigin).toEqual(data.transformOrigin)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform-origin",
          `${data.transformOrigin.x}px ${data.transformOrigin.y}px`
        )
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          stroke.id,
          "transform-origin",
          `${data.transformOrigin.x}px ${data.transformOrigin.y}px`
        )
      })
      test(`shoud continu with direction: "${data.direction}"`, () => {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform",
          `scale(${data.scale.x},${data.scale.y})`
        )
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          stroke.id,
          "transform",
          `scale(${data.scale.x},${data.scale.y})`
        )
      })
      test(`shoud end with direction: "${data.direction}"`, async () => {
        await manager.end(resizeToPoint)
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(editor.client.transformScale).toHaveBeenCalledTimes(1)
        expect(editor.client.transformScale).toHaveBeenCalledWith(
          [stroke.id],
          data.scale.x,
          data.scale.y,
          data.transformOrigin.x,
          data.transformOrigin.y
        )
        expect(stroke).not.toEqual(strokeNotResized)
      })
    })
  })

  describe("ghost strokes follow a selected math block during resize", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget() {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "line")
      target.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(target)
      return target
    }

    test("continue() live-scales the block's ghost stroke element", () => {
      const editor = createCanvasMock()
      editor.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      editor.renderer.setAttribute = jest.fn()
      const manager = new IIResizeManager(asEditor(editor))
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.model.selectedIds.add(stroke.id)

      const sb = OBBOps.toBox(stroke.bounds)
      manager.start(setupTarget(), { x: sb.x, y: sb.y + stroke.bounds.height / 2 })
      manager.continue({ x: sb.x + stroke.bounds.width * 2, y: sb.y + stroke.bounds.height / 2 })

      expect(editor.renderer.setAttribute).toHaveBeenCalledWith("ghost-1", "transform", expect.stringContaining("scale("))
    })

    test("end() permanently applies the matrix to the block's ghost strokes", async () => {
      const editor = createCanvasMock()
      editor.client.transformScale = jest.fn(() => Promise.resolve())
      editor.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IIResizeManager(asEditor(editor))
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.model.selectedIds.add(stroke.id)

      const sb = OBBOps.toBox(stroke.bounds)
      manager.start(setupTarget(), { x: sb.x, y: sb.y + stroke.bounds.height / 2 })
      await manager.end({ x: sb.x + stroke.bounds.width * 2, y: sb.y + stroke.bounds.height / 2 })

      expect(editor.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })
})
