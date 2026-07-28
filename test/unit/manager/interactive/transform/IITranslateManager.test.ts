import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import {
  DecoratorKind,
  DecoratorOps,
  EdgeLineOps,
  IITranslateManager,
  OBBOps,
  ShapeCircleOps,
  ShapePolygonOps,
  StrokeOps,
  TPoint,
  SvgElementRole,
  MatrixTransform,
} from "@/iink"

describe("IITranslateManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))

    test("translate stroke", () => {
      const stroke = StrokeOps.create()
      StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 1, y: 1 })
      StrokeOps.addPointer(stroke, { p: 1, t: 10, x: 10, y: 0 })
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 11, y: 16 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 20, y: 15 }))
    })
    test("translate shape Circle", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeCircleOps.create(center, radius)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(circle, matrix)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 15, y: 20 })
    })
    test("translate shape with kind unknown", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapePolygonOps.create(points)
      //@ts-ignore
      poly.kind = "pouet"
      const matrix = MatrixTransform.identity().translate(10, 15)
      expect(() => manager.applyToSymbol(poly, matrix)).toThrow(
        expect.objectContaining({ message: expect.stringContaining("Can't apply translate on shape, kind unknown:") })
      )
    })
    test("translate edge Line", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeLineOps.create(start, end)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(line, matrix)
      expect(line.start).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(line.end).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
  })

  describe("translate process on stroke without snap", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration.guide = false
    canvas.snaps.snapConfiguration.symbol = false
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()

    const manager = new IITranslateManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const stroke = StrokeOps.create({})
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 0, y: 0 })
    StrokeOps.addPointer(stroke, { p: 1, t: 1, x: 10, y: 50 })
    const strokeNotTranslate = structuredClone(stroke)
    canvas.model.addSymbol(stroke)
    canvas.model.selectedIds.add(stroke.id)

    const translationOrigin: TPoint = {
      x: OBBOps.toBox(stroke.bounds).x + stroke.bounds.width / 2,
      y: OBBOps.toBox(stroke.bounds).y + stroke.bounds.height / 2,
    }

    const testDatas = [
      {
        translateToPoint: { x: translationOrigin.x, y: translationOrigin.y + 10 },
        tx: 0,
        ty: 10,
      },
      {
        translateToPoint: { x: translationOrigin.x + 10, y: translationOrigin.y },
        tx: 10,
        ty: 0,
      },
      {
        translateToPoint: { x: translationOrigin.x + 20, y: translationOrigin.y + 25 },
        tx: 20,
        ty: 25,
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const translateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(translateElement)

      test(`should start with tx: "${data.tx} & ty ${data.ty}`, () => {
        manager.start(translateElement, translationOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.transformOrigin).toEqual(translationOrigin)
        expect(canvas.startOperation).toHaveBeenCalledWith("Translating")
      })
      test(`shoud continu with tx: "${data.tx} & ty ${data.ty}`, () => {
        expect(manager.continue(data.translateToPoint)).toEqual({ tx: data.tx, ty: data.ty })

        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          1,
          group.id,
          "transform",
          `translate(${data.tx},${data.ty})`
        )
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(
          2,
          stroke.id,
          "transform",
          `translate(${data.tx},${data.ty})`
        )
      })
      test(`shoud end with tx: "${data.tx} & ty ${data.ty}`, async () => {
        const endPromise = manager.end(data.translateToPoint)
        // Must be ended synchronously, before the backend round-trip below even resolves -
        // IISynchronizerManager's write-idle gate polls this same flag.
        expect(canvas.endOperation).toHaveBeenCalledWith("Translating")
        await endPromise

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(canvas.client.transformTranslate).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformTranslate).toHaveBeenCalledWith([stroke.id], data.tx, data.ty)
        expect(stroke).not.toEqual(strokeNotTranslate)
      })
    })
  })

  describe("ghost strokes follow a selected math block during translate", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget() {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(target)
      return target
    }

    test("continue() live-translates the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)

      manager.start(setupTarget(), { x: 0, y: 0 })
      manager.continue({ x: 10, y: 20 })

      expect(canvas.renderer.setAttribute).toHaveBeenCalledWith("ghost-1", "transform", "translate(10,20)")
    })

    test("translate() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)

      await manager.translate([stroke], 10, 20, false)

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("standalone decorator bounds follow translated targets", () => {
    test("translate() recomputes the decorator's bounds from its (moved) target symbols", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorOps.create(DecoratorKind.Highlight, {}, [stroke.id], OBBOps.toBox(stroke.bounds))
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.bounds.center }

      await manager.translate([stroke], 10, 20, false)

      expect(decorator.bounds.center).toEqual(
        expect.objectContaining({ x: centerBefore.x + 10, y: centerBefore.y + 20 })
      )
    })

    test("translate() leaves other decorators (not targeting a moved symbol) untouched", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const movedStroke = buildIIStroke()
      const otherStroke = buildIIStroke()
      canvas.model.addSymbol(movedStroke)
      canvas.model.addSymbol(otherStroke)
      const decorator = DecoratorOps.create(
        DecoratorKind.Highlight,
        {},
        [otherStroke.id],
        OBBOps.toBox(otherStroke.bounds)
      )
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.bounds.center }

      await manager.translate([movedStroke], 10, 20, false)

      expect(decorator.bounds.center).toEqual(centerBefore)
    })

    test("translate() shifts the decorator's baseline vertically along with its target stroke", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorOps.create(DecoratorKind.Underline, {}, [stroke.id], OBBOps.toBox(stroke.bounds))
      decorator.baseline = 100
      decorator.xHeight = 8
      canvas.model.addSymbol(decorator)

      await manager.translate([stroke], 0, 50, false)

      expect(decorator.baseline).toBe(150)
    })
  })
})
