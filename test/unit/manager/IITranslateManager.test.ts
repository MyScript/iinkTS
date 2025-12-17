import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import
{
  IIEdgeLine,
  IITranslateManager,
  IIShapeCircle,
  IIShapePolygon,
  IIStroke,
  TPoint,
  SvgElementRole,
} from "../../../src/iink"

describe("IITranslateManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITranslateManager(editor)
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IITranslateManager(editor)

    test("translate stroke", () =>
    {
      const stroke = new IIStroke()
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 10, x: 10, y: 0 })
      manager.applyToSymbol(stroke, 10, 15)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 11, y: 16 }))
      expect(stroke.pointers[1]).toEqual(expect.objectContaining({ x: 20, y: 15 }))
    })
    test("translate shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new IIShapeCircle(center, radius)
      manager.applyToSymbol(circle, 10, 15)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 15, y: 20 })
    })
    test("translate shape with kind unknow", () =>
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
      expect(() => manager.applyToSymbol(poly, 10, 15)).toThrow(expect.objectContaining({ message: expect.stringContaining("Can't apply translate on shape, kind unknow:")}))
    })
    test("translate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new IIEdgeLine(start, end)
      manager.applyToSymbol(line, 10, 15)
      expect(line.start).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(line.end).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
  })

  describe("translate process on stroke without snap", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.snaps.configuration.guide = false
    editor.snaps.configuration.symbol = false
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.transformTranslate = jest.fn(() => Promise.resolve())
    editor.renderer.setAttribute = jest.fn()
    editor.renderer.drawSymbol = jest.fn()

    const manager = new IITranslateManager(editor)
    manager.applyToSymbol = jest.fn()

    const stroke = new IIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotTranslate = stroke.clone()
    editor.model.addSymbol(stroke)

    const translationOrigin: TPoint = {
      x: (stroke.bounds.xMax + stroke.bounds.xMin) / 2,
      y: (stroke.bounds.yMin + stroke.bounds.yMax) / 2
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
      await editor.init()
    })

    testDatas.forEach(data =>
    {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const translateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(translateElement)

      test(`should start with tx: "${ data.tx } & ty ${ data.ty }`, () =>
      {
        manager.start(translateElement, translationOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.transformOrigin).toEqual(translationOrigin)
      })
      test(`shoud continu with tx: "${ data.tx } & ty ${ data.ty }`, () =>
      {
        expect(manager.continue(data.translateToPoint)).toEqual({ tx: data.tx, ty: data.ty })

        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `translate(${ data.tx },${ data.ty })`)
        expect(editor.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `translate(${ data.tx },${ data.ty })`)
      })
      test(`shoud end with tx: "${ data.tx } & ty ${ data.ty }`, async () =>
      {
        await manager.end(data.translateToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(editor.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(editor.recognizer.transformTranslate).toHaveBeenCalledTimes(1)
        expect(editor.recognizer.transformTranslate).toHaveBeenCalledWith([stroke.id], data.tx, data.ty)
        expect(stroke).not.toEqual(strokeNotTranslate)
      })
    })
  })
})
