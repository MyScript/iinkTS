import { buildOILine } from "../helpers"
import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OISnapManager,
  TSegment,
  TPoint,
  TSnapNudge,
} from "../../../src/iink"

describe("OISnapManager.ts", () =>
{
  const behaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  behaviorsOptions.configuration.offscreen = true
  behaviorsOptions.configuration.rendering.guides.gap = 10
  test("should create", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISnapManager(behaviors)
    expect(manager).toBeDefined()
  })

  test("should call renderer.drawLine when drawSnapToElementLines", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISnapManager(behaviors)
    manager.renderer.drawLine = jest.fn()
    const lines: TSegment[] = [
      { p1: { x: 0, y: 0 }, p2: { x: 0, y: 20 } },
      { p1: { x: 20, y: 0 }, p2: { x: 20, y: 20 } }
    ]
    manager.drawSnapToElementLines(lines)
    expect(manager.renderer.drawLine).toBeCalledTimes(2)
    expect(manager.renderer.drawLine).toHaveBeenNthCalledWith(1, lines[0].p1, lines[0].p2, expect.objectContaining({
      role: "snap-to-element",
      "marker-start": `url(#${ manager.renderer.crossMarker })`,
      "marker-end": `url(#${ manager.renderer.crossMarker })`
    }))
    expect(manager.renderer.drawLine).toHaveBeenNthCalledWith(2, lines[1].p1, lines[1].p2, expect.objectContaining({
      role: "snap-to-element",
      "marker-start": `url(#${ manager.renderer.crossMarker })`,
      "marker-end": `url(#${ manager.renderer.crossMarker })`
    }))
  })

  test("should call renderer.clearElements when clearSnapToElementLines", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISnapManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.clearSnapToElementLines()
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
    expect(manager.renderer.clearElements).toBeCalledWith({ attrs: { role: "snap-to-element" } })
  })

  describe("snapResize", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const behaviors = new OIBehaviors(behaviorsOptions)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    const manager = new OISnapManager(behaviors)
    manager.renderer.drawLine = jest.fn()
    manager.renderer.clearElements = jest.fn()

    beforeAll(async () =>
    {
      await behaviors.init(wrapperHTML)
    })

    test("should do nothing if snapToElement & snapToGrid are equal to false", () =>
    {
      manager.snapToGrid = false
      manager.snapToElement = false
      expect(manager.snapResize({ x: 10, y: 10 })).toEqual({ x: 10, y: 10 })
      expect(manager.renderer.clearElements).toBeCalledTimes(1)
    })

    test("should return guide point when snapToGrid is equal to true", () =>
    {
      manager.snapToGrid = true
      manager.snapToElement = false
      expect(manager.snapResize({ x: 12, y: 32 })).toEqual({ x: 10, y: 30 })
      expect(manager.renderer.clearElements).toBeCalledTimes(1)
    })

    describe("snapToElement", () =>
    {
      beforeEach(async () =>
      {
        manager.snapToGrid = false
        manager.snapToElement = true
      })
      afterEach(() =>
      {
        behaviors.model.clear()
      })
      test("should return origin point if no symbol into model", () =>
      {
        expect(manager.snapResize({ x: 10, y: 10 })).toEqual({ x: 10, y: 10 })
        expect(manager.renderer.clearElements).toBeCalledTimes(1)
      })
      test("should return the original point if point.x - symbol.x > snapThreshold & point.y - symbol.y > snapThreshold", () =>
      {
        const point: TPoint = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: point.x + 2 * manager.snapThreshold,
          y: point.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: point.x + 3 * manager.snapThreshold,
          y: point.y + 4 * manager.snapThreshold
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapResize(point)).toEqual(point)
        expect(manager.renderer.clearElements).toBeCalledTimes(1)
      })
      test("should return the closest symbol in x, then call renderer.drawLine", () =>
      {
        const point: TPoint = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: point.x + 2 * manager.snapThreshold,
          y: point.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: point.x + manager.snapThreshold / 2,
          y: point.y + 4 * manager.snapThreshold
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapResize(point)).toEqual({ x: end.x, y: point.y })
        expect(manager.renderer.drawLine).toBeCalledTimes(1)
      })
      test("should return the closest symbol in y, then call renderer.drawLine", () =>
      {
        const point: TPoint = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: point.x + 2 * manager.snapThreshold,
          y: point.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: point.x + 3 * manager.snapThreshold,
          y: point.y + manager.snapThreshold / 2
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapResize(point)).toEqual({ x: point.x, y: end.y })
        expect(manager.renderer.drawLine).toBeCalledTimes(1)
      })
      test("should return the closest symbols in x and y, then call renderer.drawLine twice", () =>
      {
        const point: TPoint = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: point.x + manager.snapThreshold / 3,
          y: point.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: point.x + 3 * manager.snapThreshold,
          y: point.y + manager.snapThreshold / 2
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapResize(point)).toEqual({ x: start.x, y: end.y })
        expect(manager.renderer.drawLine).toBeCalledTimes(2)
      })
    })
  })

  describe("snapTranslate", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const behaviors = new OIBehaviors(behaviorsOptions)
    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    const manager = new OISnapManager(behaviors)
    const selectionSnapPointMock = { x: 25, y: 30 }
    Object.defineProperty(manager, "selectionSnapPoints",
      {
        get: jest.fn(() => [selectionSnapPointMock])
      })
    manager.renderer.drawLine = jest.fn()
    manager.renderer.clearElements = jest.fn()

    beforeAll(async () =>
    {
      await behaviors.init(wrapperHTML)
    })

    test("should do nothing if snapToElement & snapToGrid are equal to false", () =>
    {
      manager.snapToGrid = false
      manager.snapToElement = false
      expect(manager.snapTranslate(10, 12)).toEqual({ x: 10, y: 12 })
      expect(manager.renderer.clearElements).toBeCalledTimes(1)
    })

    test("should return a nudge to the nearest guide point when snapToGrid equals true", () =>
    {
      manager.snapToGrid = true
      manager.snapToElement = false
      expect(manager.snapTranslate(30, 22)).toEqual({ x: 25, y: 20 })
      expect(manager.renderer.clearElements).toBeCalledTimes(1)
    })

    describe("snapToElement", () =>
    {
      beforeEach(async () =>
      {
        manager.snapToGrid = false
        manager.snapToElement = true
      })
      afterEach(() =>
      {
        behaviors.model.clear()
      })

      test("should return origin nudge if no symbol into model", () =>
      {
        expect(manager.snapTranslate(10, 10)).toEqual({ x: 10, y: 10 })
        expect(manager.renderer.clearElements).toBeCalledTimes(1)
      })
      test("should return the original snap if the closest symbol.x and symbol.y is further than snapThreshold", () =>
      {
        const nudge: TSnapNudge = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: nudge.x + 2 * manager.snapThreshold,
          y: nudge.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: nudge.x + 3 * manager.snapThreshold,
          y: nudge.y + 4 * manager.snapThreshold
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapTranslate(nudge.x, nudge.y)).toEqual(nudge)
        expect(manager.renderer.clearElements).toBeCalledTimes(1)
      })
      test("should return closest symbol x and drawLine", () =>
      {
        const nudge: TSnapNudge = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: selectionSnapPointMock.x + nudge.x + 2 * manager.snapThreshold,
          y: selectionSnapPointMock.y + nudge.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: selectionSnapPointMock.x + nudge.x + manager.snapThreshold / 2,
          y: selectionSnapPointMock.y + nudge.y + 4 * manager.snapThreshold
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapTranslate(nudge.x, nudge.y)).toEqual({ x: (end.x - selectionSnapPointMock.x), y: nudge.y })
        expect(manager.renderer.drawLine).toBeCalledTimes(1)
      })
      test("should return closest symbol y and drawLine", () =>
      {
        const nudge: TSnapNudge = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: selectionSnapPointMock.x + nudge.x + 2 * manager.snapThreshold,
          y: selectionSnapPointMock.y + nudge.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: selectionSnapPointMock.x + nudge.x + 3 * manager.snapThreshold,
          y: selectionSnapPointMock.y + nudge.y +  manager.snapThreshold / 4
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapTranslate(nudge.x, nudge.y)).toEqual({ x: nudge.x, y: (end.y - selectionSnapPointMock.y) })
        expect(manager.renderer.drawLine).toBeCalledTimes(1)
      })
      test("should return closest symbol x & y and 2 drawLine", () =>
      {
        const nudge: TSnapNudge = {
          x: 42,
          y: 51
        }
        const start: TPoint = {
          x: selectionSnapPointMock.x + nudge.x +  manager.snapThreshold / 3,
          y: selectionSnapPointMock.y + nudge.y + 2 * manager.snapThreshold
        }
        const end: TPoint = {
          x: selectionSnapPointMock.x + nudge.x + 3 * manager.snapThreshold,
          y: selectionSnapPointMock.y + nudge.y +  manager.snapThreshold / 2
        }
        const line = buildOILine({ start, end })
        behaviors.model.addSymbol(line)
        expect(manager.snapTranslate(nudge.x, nudge.y)).toEqual({ x: (start.x - selectionSnapPointMock.x), y: (end.y - selectionSnapPointMock.y) })
        expect(manager.renderer.drawLine).toBeCalledTimes(2)
      })
    })
  })

  describe("snapRotation", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISnapManager(behaviors)

    test("should do nothing if snapToElement & snapToGrid are equal to false", () =>
    {
      manager.snapAngle = 0
      expect(manager.snapRotation(12)).toEqual(12)
    })

    test("should return guide point when snapToGrid is equal to true", () =>
    {
      manager.snapAngle = 20
      expect(manager.snapRotation(12)).toEqual(20)
    })

  })

})
