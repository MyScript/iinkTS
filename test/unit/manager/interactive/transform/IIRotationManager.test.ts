import { createEditorMock, asEditor } from "../../../__mocks__/createEditorMock"
import { buildIIStroke } from "../../../helpers"
import {
  EdgeLineOps,
  IIRotationManager,
  OBBOps,
  ShapeCircleOps,
  ShapePolygonOps,
  StrokeOps,
  SvgElementRole,
  TPoint,
  computeRotatedPoint,
  convertDegreeToRadian,
  MatrixTransform,
} from "@/iink"

describe("IIRotationManager.ts", () => {
  test("should create", () => {
    const editor = createEditorMock()
    const manager = new IIRotationManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const editor = createEditorMock()
    editor.typeset.updateBounds = jest.fn()
    editor.renderer.setAttribute = jest.fn()
    const manager = new IIRotationManager(asEditor(editor))

    test("not rotate shape with kind unknown", () => {
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
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply rotate on shape, kind unknown: ") })
      )
    })
    test("rotate stroke", () => {
      const stroke = StrokeOps.create()
      const origin: TPoint = { x: 0, y: 0 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("10")
    })
    test("rotate a math solver-output (draw) stroke like a normal stroke", () => {
      const stroke = StrokeOps.create()
      stroke.isSolverOutput = true
      const origin: TPoint = { x: 0, y: 0 }
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("10")
    })
    test("rotate shape Circle", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeCircleOps.create(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(circle, matrix)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: -2, y: 6 })
    })
    test("rotate edge Line", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeLineOps.create(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(line, matrix)
      expect(line.start.x.toFixed(0)).toEqual("0")
      expect(line.start.y.toFixed(0)).toEqual("0")
      expect(line.end.x.toFixed(0)).toEqual("-5")
      expect(line.end.y.toFixed(0)).toEqual("0")
    })
  })

  describe("rotate process on stroke", () => {
    const editor = createEditorMock()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.transformRotate = jest.fn(() => Promise.resolve())
    editor.renderer.setAttribute = jest.fn()
    editor.renderer.drawSymbol = jest.fn()

    const manager = new IIRotationManager(asEditor(editor))
    manager.applyToSymbol = jest.fn()

    const stroke = StrokeOps.create({})
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 10, y: 50 })
    const strokeNotRotate = structuredClone(stroke)
    editor.model.addSymbol(stroke)
    editor.model.selectedIds.add(stroke.id)

    const rotateCenter: TPoint = {
      x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
      y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
    }
    const rotateOrigin: TPoint = {
      x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
      y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
    }

    const testDatas = [
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 2),
        angle: 270,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 2),
        angle: 90,
      },
    ]

    beforeAll(async () => {
      await editor.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      rotateElement.setAttribute("cx", rotateOrigin.x.toString())
      rotateElement.setAttribute("cy", rotateOrigin.y.toString())
      group.appendChild(rotateElement)

      test(`should start with angle: "${data.angle}° `, () => {
        manager.start(rotateElement, rotateOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform-origin",
          `${rotateCenter.x}px ${rotateCenter.y}px`
        )
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          stroke.id,
          "transform-origin",
          `${rotateCenter.x}px ${rotateCenter.y}px`
        )
      })
      test(`shoud continu with angle: "${data.angle}°`, () => {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `rotate(${data.angle})`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `rotate(${data.angle})`)
      })
      test(`shoud end with angle: "${data.angle}°`, async () => {
        await manager.end(data.rotateToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(editor.recognizer.transformRotate).toHaveBeenCalledTimes(1)
        expect(editor.recognizer.transformRotate).toHaveBeenCalledWith(
          [stroke.id],
          convertDegreeToRadian(data.angle),
          rotateCenter.x,
          rotateCenter.y
        )
        expect(stroke).not.toEqual(strokeNotRotate)
      })
    })
  })

  describe("ghost strokes follow a selected math block during rotation", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget(origin: TPoint) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      target.setAttribute("cx", origin.x.toString())
      target.setAttribute("cy", origin.y.toString())
      group.appendChild(target)
      return target
    }

    test("continue() live-rotates the block's ghost stroke element", () => {
      const editor = createEditorMock()
      editor.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      editor.renderer.setAttribute = jest.fn()
      const manager = new IIRotationManager(asEditor(editor))
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.model.selectedIds.add(stroke.id)

      const origin: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
      }
      const center: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
      }

      manager.start(setupTarget(origin), origin)
      manager.continue(computeRotatedPoint(origin, center, Math.PI / 2))

      expect(editor.renderer.setAttribute).toHaveBeenCalledWith("ghost-1", "transform", expect.stringContaining("rotate("))
    })

    test("end() permanently applies the matrix to the block's ghost strokes", async () => {
      const editor = createEditorMock()
      editor.recognizer.transformRotate = jest.fn(() => Promise.resolve())
      editor.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IIRotationManager(asEditor(editor))
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.model.selectedIds.add(stroke.id)

      const origin: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height,
      }
      const center: TPoint = {
        x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
        y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
      }

      manager.start(setupTarget(origin), origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      expect(editor.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })
})
