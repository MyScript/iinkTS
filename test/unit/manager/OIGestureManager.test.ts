import { buildOIStroke, buildOIText } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  DefaultConfiguration,
  TGesture,
  SurroundAction,
  TOISymbolChar,
  OIGestureManager
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
    const gestMan = new OIGestureManager(behaviors)
    gestMan.applyInsertGesture = jest.fn()
    gestMan.applyJoinGesture = jest.fn()
    gestMan.applyScratchGesture = jest.fn()
    gestMan.applyStrikeThroughGesture = jest.fn()
    gestMan.applySurroundGesture = jest.fn()
    gestMan.applyUnderlineGesture = jest.fn()
    gestMan.model.removeSymbol = jest.fn()
    gestMan.renderer.removeSymbol = jest.fn()

    const gestureStroke = buildOIStroke()
    test("should do nothing if no gestureStroke", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(undefined, gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should do nothing if no gesture", async () =>
    {
      await gestMan.apply(gestureStroke)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
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

    gestMan.behaviors.internalEvent.emitSelected = jest.fn()
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.selector.drawSelectedGroup = jest.fn()
    gestMan.undoRedoManager.push = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applySurroundGesture(gesture)
      expect(gestMan.behaviors.internalEvent.emitSelected).toHaveBeenCalledTimes(0)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.selector.drawSelectedGroup).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(0)
    })

    test("should have a selection as the default action on surround", () =>
    {
      expect(gestMan.surroundAction).toEqual(SurroundAction.Select)
    })

    test("should select", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applySurroundGesture(gesture)
      expect(gestMan.selector.drawSelectedGroup).toHaveBeenCalledTimes(1)
      expect(gestMan.selector.drawSelectedGroup).toHaveBeenCalledWith([stroke])
      expect(gestMan.behaviors.internalEvent.emitSelected).toHaveBeenCalledTimes(1)
      expect(gestMan.behaviors.internalEvent.emitSelected).toHaveBeenCalledWith([stroke])
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(0)
    })

    test("should show Highlight", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Highlight
      await gestMan.applySurroundGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({
        id: stroke.id,
      }))
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(1)
    })

    test("should show Surround", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      gestMan.surroundAction = SurroundAction.Surround
      await gestMan.applySurroundGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({
        id: stroke.id,
      }))
    })

    test("should log error if surroundAction is unknow", async () =>
    {
      console.error = jest.fn()
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      //@ts-ignore
      gestMan.surroundAction = "unknow"
      await gestMan.applySurroundGesture(gesture)
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
    manager.undoRedoManager.push = jest.fn()

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
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(manager.undoRedoManager.push).toHaveBeenCalledTimes(0)
    })

    test("should erase text symbol", async () =>
    {
      const chars: TOISymbolChar[] = [
        {
          boundingBox: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-1",
          label: "A"
        },
        {
          boundingBox: { height: 10, width: 5, x: 5, y: 10 },
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
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(manager.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(manager.texter.adjustText).toHaveBeenCalledTimes(1)
      expect(manager.undoRedoManager.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase text symbol", async () =>
    {
      const chars: TOISymbolChar[] = [
        {
          boundingBox: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-1",
          label: "A"
        },
        {
          boundingBox: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: 400,
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      behaviors.model.addSymbol(text)
      const gestureStroke = buildOIStroke({ box: chars[0].boundingBox })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratchGesture(gestureStroke, gesture)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.model.updateSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(manager.texter.adjustText).toHaveBeenCalledTimes(1)
      expect(manager.undoRedoManager.push).toHaveBeenCalledTimes(1)
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
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(manager.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.recognizer.eraseStrokes).toHaveBeenCalledTimes(1)
      expect(manager.undoRedoManager.push).toHaveBeenCalledTimes(1)
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
      expect(manager.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(manager.model.replaceSymbol).toHaveBeenCalledTimes(1)
      expect(manager.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(manager.renderer.replaceSymbol).toHaveBeenCalledTimes(1)
      expect(manager.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(manager.recognizer.replaceStrokes).toHaveBeenCalledTimes(1)
      expect(manager.undoRedoManager.push).toHaveBeenCalledTimes(1)
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
    gestMan.undoRedoManager.push = jest.fn()

    test("should join strokes if between 2 strokes", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translator.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translator.translate).toHaveBeenCalledWith([stroke12], stroke11.boundingBox.xMax - stroke12.boundingBox.xMin, 0)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and stroke in previous row", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translator.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translator.translate).toHaveBeenCalledWith([stroke21], stroke12.boundingBox.xMax - stroke21.boundingBox.xMin + 50, -rowHeight)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and stroke in previous row", async () =>
    {
      const stroke51 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 4.6 * rowHeight } })
      behaviors.model.addSymbol(stroke51)
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translator.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translator.translate).toHaveBeenCalledWith([stroke51], 0, -rowHeight)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(1)
    })

  })

  describe("applyInsertGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.renderer.removeSymbol = jest.fn()
    gestMan.recognizer.addStrokes = jest.fn((() => Promise.resolve(undefined)))
    gestMan.recognizer.eraseStrokes = jest.fn((() => Promise.resolve()))
    gestMan.recognizer.replaceStrokes = jest.fn((() => Promise.resolve()))
    gestMan.recognizer.translateStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.push = jest.fn()

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
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(1)
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
    gestMan.undoRedoManager.push = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyStrikeThroughGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.addSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(0)
    })

    test("should draw symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyStrikeThroughGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
    })
  })

  describe("applyUnderlineGesture", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.model.addSymbol = jest.fn()
    gestMan.model.updateSymbol = jest.fn()
    gestMan.undoRedoManager.push = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyUnderlineGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.addSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.updateSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.push).toHaveBeenCalledTimes(0)
    })

    test("should draw symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyUnderlineGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(stroke)
    })
  })
})
