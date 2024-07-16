import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OIEdgeLine,
  OIRotationManager,
  OIShapeCircle,
  OIShapePolygon,
  OIStroke,
  SvgElementRole,
  TPoint,
  computeRotatedPoint,
} from "../../../src/iink"

describe("OIRotationManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIRotationManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIRotationManager(behaviors)
    manager.texter.updateTextBoundingBox = jest.fn()
    manager.renderer.setAttribute = jest.fn()

    test("rotate stroke", () =>
    {
      const stroke = new OIStroke()
      const origin: TPoint = { x: 0, y: 0 }
      stroke.addPointer({ p: 1, t: 1, x: 1, y: 1 })
      stroke.addPointer({ p: 1, t: 10, x: 10, y: 0 })
      manager.applyToSymbol(stroke, origin, Math.PI / 2)
      expect(stroke.pointers[0].x.toFixed(0)).toEqual("1")
      expect(stroke.pointers[0].y.toFixed(0)).toEqual("-1")
      expect(stroke.pointers[1].x.toFixed(0)).toEqual("0")
      expect(stroke.pointers[1].y.toFixed(0)).toEqual("-10")

    })
    test("rotate shape Circle", () =>
    {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = new OIShapeCircle(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      manager.applyToSymbol(circle, origin, Math.PI / 2)
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual({ x: 4, y: -2 })
    })
    test("rotate shape with kind unknow", () =>
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
      expect(() => manager.applyToSymbol(poly, origin, Math.PI / 2)).toThrowError(expect.objectContaining({ message: expect.stringContaining("Can't apply rotate on shape, kind unknow: ") }))
    })
    test("rotate edge Line", () =>
    {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = new OIEdgeLine(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      manager.applyToSymbol(line, origin, Math.PI / 2)
      expect(line.start.x.toFixed(0)).toEqual("0")
      expect(line.start.y.toFixed(0)).toEqual("0")
      expect(line.end.x.toFixed(0)).toEqual("5")
      expect(line.end.y.toFixed(0)).toEqual("0")
    })
  })

  describe("rotate process on stroke", () =>
  {
    const divElement: HTMLDivElement = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    behaviors.renderer.setAttribute = jest.fn()
    behaviors.renderer.drawSymbol = jest.fn()
    behaviors.selector.resetSelectedGroup = jest.fn()
    behaviors.setPenStyle = jest.fn(() => Promise.resolve())
    behaviors.setTheme = jest.fn(() => Promise.resolve())
    behaviors.setPenStyleClasses = jest.fn(() => Promise.resolve())

    const manager = new OIRotationManager(behaviors)
    manager.applyToSymbol = jest.fn()

    const stroke = new OIStroke({})
    stroke.addPointer({ p: 1, t: 1, x: 0, y: 0 })
    stroke.addPointer({ p: 1, t: 1, x: 10, y: 50 })
    stroke.selected = true
    const strokeNotRotate = stroke.clone()
    behaviors.model.addSymbol(stroke)

    const rotateCenter: TPoint = {
      x: (stroke.bounds.xMax + stroke.bounds.xMin) / 2,
      y: (stroke.bounds.yMin + stroke.bounds.yMax) / 2
    }
    const rotateOrigin: TPoint = {
      x: (stroke.bounds.xMax + stroke.bounds.xMin) / 2,
      y: stroke.bounds.yMax
    }

    const testDatas = [
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 2),
        angle: 90,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 2),
        angle: 270,
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
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      rotateElement.setAttribute("cx", rotateOrigin.x.toString())
      rotateElement.setAttribute("cy", rotateOrigin.y.toString())
      group.appendChild(rotateElement)

      test(`should start with angle: "${ data.angle }° `, () =>
      {
        manager.start(rotateElement, rotateOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform-origin", `${ rotateCenter.x }px ${ rotateCenter.y }px`)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform-origin", `${ rotateCenter.x }px ${ rotateCenter.y }px`)
      })
      test(`shoud continu with angle: "${ data.angle }°`, () =>
      {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", `rotate(${ data.angle })`)
        expect(behaviors.renderer.setAttribute).toHaveBeenNthCalledWith(2, stroke.id, "transform", `rotate(${ data.angle })`)
      })
      test(`shoud end with angle: "${ data.angle }°`, async () =>
      {
        await manager.end(data.rotateToPoint)

        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledTimes(1)
        expect(behaviors.selector.resetSelectedGroup).toHaveBeenCalledWith([stroke])
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledTimes(1)
        expect(behaviors.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
        expect(behaviors.recognizer.replaceStrokes).toHaveBeenCalledWith([stroke.id], [stroke])
        expect(stroke).not.toEqual(strokeNotRotate)
      })
    })
  })
})
