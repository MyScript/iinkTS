import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OIEdgeLine,
  OITranslateManager,
  OIShapeCircle,
  OIShapePolygon,
  OIStroke,
  TPoint,
  SvgElementRole,
} from "../../../src/iink"

describe("OITranslateManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITranslateManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OITranslateManager(behaviors)

    test("translate stroke", () =>
    {
      const stroke = new OIStroke()
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
      const circle = new OIShapeCircle(center, radius)
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
      const poly = new OIShapePolygon(points)
      //@ts-ignore
      poly.kind = "pouet"
      expect(() => manager.applyToSymbol(poly, 10, 15)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply translate on shape, kind unknow:")}))
    })
    test("translate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OIEdgeLine(start, end)
      manager.applyToSymbol(line, 10, 15)
      expect(line.start).toEqual(expect.objectContaining({ x: 10, y: 15 }))
      expect(line.end).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
  })

  describe("translate process on stroke without snap", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.snaps.snapToGrid = false
    behaviors.snaps.snapToElement = false
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.transformTranslate = jest.fn(() => Promise.resolve())
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OITranslateManager(behaviors)
    manager.applyToSymbol = jest.fn()

    const stroke = new OIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotTranslate = stroke.clone()
    behaviors.model.addSymbol(stroke)

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
      await behaviors.init()
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

        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `translate(${ data.tx },${ data.ty })`)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `translate(${ data.tx },${ data.ty })`)
      })
      test(`shoud end with tx: "${ data.tx } & ty ${ data.ty }`, async () =>
      {
        await manager.end(data.translateToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.transformTranslate).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.transformTranslate).toHaveBeenCalledWith([stroke.id], data.tx, data.ty)
        expect(stroke).not.toEqual(strokeNotTranslate)
      })
    })
  })
})
