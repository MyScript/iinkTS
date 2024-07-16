import { buildOICircle, buildOIStroke, buildOIText } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  DefaultConfiguration,
  TGesture,
  SurroundAction,
  TOISymbolChar,
  OIGestureManager,
  Intention,
  DecoratorKind,
  StrikeThroughAction
} from "../../../src/iink"

describe("OIGestureManager.ts", () =>
{
  const rowHeight = DefaultConfiguration.rendering.guides.gap

  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const gestMan = new OIGestureManager(behaviors)
    expect(gestMan).toBeDefined()
  })

  describe("apply", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.svgDebugger.apply = jest.fn()
    const gestMan = new OIGestureManager(behaviors)
    gestMan.applyInsertGesture = jest.fn()
    gestMan.applyJoinGesture = jest.fn()
    gestMan.applyScratchGesture = jest.fn()
    gestMan.applyStrikeThroughGesture = jest.fn()
    gestMan.applySurroundGesture = jest.fn()
    gestMan.applyUnderlineGesture = jest.fn()

    const gestureStroke = buildOIStroke()
    test("should remove strokeIds from renderer & call applyUnderlineGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(1)
    })
    test("should remove strokeIds from renderer & call applyScratchGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from renderer & call join", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from renderer & call applyInsertGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "INSERT",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from renderer & call applyStrikeThroughGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from renderer & call applySurroundGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gestureStroke, gesture)
      expect(behaviors.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
  })

  describe("applySurroundGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)

    const gestMan = new OIGestureManager(behaviors)
    gestMan.behaviors.internalEvent.emitIntention = jest.fn()
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.history.push = jest.fn()

    test("should have a selection as the default action on surround", () =>
    {
      expect(gestMan.surroundAction).toEqual(SurroundAction.Select)
    })

    test("should do nothing if gestureStroke not contains symbols", async () =>
    {
      const gestureStroke = buildOIStroke({ box: { height: 2, width: 2, x: 500, y: 500 }})
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(gestMan.behaviors.select).toHaveBeenCalledTimes(0)
      expect(gestMan.history.push).toHaveBeenCalledTimes(0)
    })

    test("should select", async () =>
    {
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(gestMan.behaviors.internalEvent.emitIntention).toHaveBeenNthCalledWith(1, Intention.Select)
      expect(gestMan.behaviors.select).toHaveBeenNthCalledWith(1, [stroke.id])
      expect(gestMan.history.push).toHaveBeenCalledTimes(0)
    })

    test("should add Highlight and re-render symbol", async () =>
    {
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Highlight
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Highlight)).toBeUndefined()
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Highlight)).toBeDefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should remove Highlight and re-render symbol", async () =>
    {
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Highlight
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Highlight)).toBeDefined()
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Highlight)).toBeUndefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should add Surround and re-render symbol", async () =>
    {
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Surround
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Surround)).toBeUndefined()
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Surround)).toBeDefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should remove Surround and re-render symbol", async () =>
    {
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Surround
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Surround)).toBeDefined()
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Surround)).toBeUndefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should log error if surroundAction is unknow", async () =>
    {
      console.error = jest.fn()
      const gestureStroke = buildOIStroke({
        box: {
          height: stroke.bounds.height * 2,
          width: stroke.bounds.width * 2,
          x: stroke.bounds.x - stroke.bounds.width,
          y: stroke.bounds.y - stroke.bounds.height
        },
      })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      //@ts-ignore
      gestMan.surroundAction = "unknow"
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(console.error).toHaveBeenCalledTimes(1)
      expect(console.error).toHaveBeenCalledWith({ "error": ["Unknow surroundAction: unknow, values allowed are: highlight, select, surround"], "from": "GESTURE.applySurroundGesture" })
    })
  })

  describe("applyScratchGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OIGestureManager(behaviors)
    manager.texter.adjustText = jest.fn()
    manager.texter.updateTextBoundingBox = jest.fn()
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.removeSymbol = jest.fn()
    manager.renderer.replaceSymbol = jest.fn()
    manager.model.removeSymbol = jest.fn(id => [id])
    manager.model.updateSymbol = jest.fn(id => [id])
    manager.model.replaceSymbol = jest.fn(id => [id])
    manager.recognizer.eraseStrokes = jest.fn((() => Promise.resolve()))
    manager.recognizer.replaceStrokes = jest.fn((() => Promise.resolve()))
    manager.history.push = jest.fn()

    beforeEach(() =>
    {
      manager.model.clear()
    })

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gestureStroke = buildOIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(behaviors.updateSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.removeSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(0)
    })

    test("should erase shape symbol", async () =>
    {
      const circle = buildOICircle()
      behaviors.model.addSymbol(circle)
      const gestureStroke = buildOIStroke({ box: circle.bounds, nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [circle.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(behaviors.updateSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.removeSymbols).toHaveBeenNthCalledWith(1, [circle.id], false)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase text symbol", async () =>
    {
      const chars: TOISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      behaviors.model.addSymbol(text)
      const gestureStroke = buildOIStroke({ box: { height: 20, width: 20, x: -5, y: 5 }, nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(behaviors.updateSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.removeSymbols).toHaveBeenNthCalledWith(1, [text.id], false)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.texter.adjustText).toHaveBeenCalledTimes(1)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase text symbol", async () =>
    {
      const chars: TOISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      behaviors.model.addSymbol(text)
      const gestureStroke = buildOIStroke({ box: chars[0].bounds })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)

      expect(behaviors.updateSymbols).toHaveBeenNthCalledWith(1, [text], false)
      expect(behaviors.removeSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.texter.adjustText).toHaveBeenCalledTimes(1)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase stroke symbol", async () =>
    {
      const stroke = buildOIStroke()
      behaviors.model.addSymbol(stroke)
      const gestureStroke = buildOIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(behaviors.updateSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id], false)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase stroke symbol", async () =>
    {
      const stroke = buildOIStroke({ nbPoint: 50 })
      behaviors.model.addSymbol(stroke)
      const gestureStroke = buildOIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [{ fullStrokeId: stroke.id, x: stroke.pointers.slice(10, 25).map(p => p.x), y: stroke.pointers.slice(10, 25).map(p => p.y) }],
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(behaviors.updateSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.removeSymbols).toHaveBeenCalledTimes(0)
      expect(behaviors.replaceSymbols).toHaveBeenNthCalledWith(1, [stroke], expect.arrayContaining([expect.objectContaining({ "type": "stroke" }), expect.objectContaining({ "type": "stroke" })]), false)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyJoinGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke11 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
    behaviors.model.addSymbol(stroke11)
    const stroke12 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
    behaviors.model.addSymbol(stroke12)
    const stroke21 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
    behaviors.model.addSymbol(stroke21)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.translator.translate = jest.fn((() => Promise.resolve()))
    gestMan.history.push = jest.fn()

    test("should join and group strokes if between 2 strokes", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.behaviors.replaceSymbols).toHaveBeenCalledTimes(1)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and go after stroke in previous row", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke21], stroke12.bounds.xMax - stroke21.bounds.xMin + 50, -rowHeight, false)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and no stroke in previous row", async () =>
    {
      const stroke51 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 4.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      behaviors.model.addSymbol(stroke51)
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke51], 0, -rowHeight, false)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

  })

  describe("applyInsertGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.translator.translate = jest.fn((() => Promise.resolve()))
    gestMan.history.push = jest.fn()

    test("should split", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: strokeGesture.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [{ fullStrokeId: stroke.id, x: stroke.pointers.slice(2).map(p => p.x), y: stroke.pointers.slice(2).map(p => p.y) }],
      }
      await gestMan.applyInsertGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenCalledTimes(0)
      expect(behaviors.replaceSymbols).toHaveBeenNthCalledWith(1, [stroke], expect.arrayContaining([expect.objectContaining({ "type": "stroke" }), expect.objectContaining({ "type": "stroke" })]), false)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go down stroke", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: stroke.bounds.height, width: 5, x: stroke.bounds.xMin - 10, y: stroke.bounds.yMin } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: strokeGesture.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyInsertGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke], 0, 100, false)
      expect(behaviors.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyUnderlineGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)

    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.history.push = jest.fn()

    test("should add Underline and re-render symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Underline)).toBeUndefined()
      await gestMan.applyUnderlineGesture(stroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Underline)).toBeDefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should remove Underline and re-render symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Underline)).toBeDefined()
      await gestMan.applyUnderlineGesture(stroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Underline)).toBeUndefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })


  })

  describe("applyStrikeThroughGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.model.addSymbol = jest.fn()
    gestMan.model.updateSymbol = jest.fn()
    gestMan.history.push = jest.fn()

    test("should have a draw as the default action on strikethrought", () =>
    {
      expect(gestMan.strikeThroughAction).toEqual(StrikeThroughAction.Draw)
    })

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyStrikeThroughGesture(stroke, gesture)

      expect(gestMan.model.addSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.history.push).toHaveBeenCalledTimes(0)
    })

    test("should add Strikethrough and re-render symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.strikeThroughAction = StrikeThroughAction.Draw
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Strikethrough)).toBeUndefined()
      await gestMan.applyStrikeThroughGesture(stroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Strikethrough)).toBeDefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should remove Strikethrough and re-render symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.strikeThroughAction = StrikeThroughAction.Draw
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Strikethrough)).toBeDefined()
      await gestMan.applyStrikeThroughGesture(stroke, gesture)
      expect(stroke.decorators.find(d => d.kind === DecoratorKind.Strikethrough)).toBeUndefined()
      expect(gestMan.model.symbols).toContain(stroke)
      expect(gestMan.renderer.drawSymbol).toHaveBeenNthCalledWith(1, (expect.objectContaining({ id: stroke.id })))
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should remove Strikethrough and re-render symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.strikeThroughAction = StrikeThroughAction.Erase
      await gestMan.applyStrikeThroughGesture(stroke, gesture)
      expect(behaviors.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id])
    })
  })

})
