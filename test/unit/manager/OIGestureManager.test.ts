import
{
  OIGestureManager,
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  TGesture,
  DecoratorKind,
  SymbolType,
  SurroundAction
} from "../../../src/iink"
import { buildOIStroke } from "../helpers"

describe("OIGestureManager.ts", () =>
{
  const behaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  const rowHeight = DefaultConfiguration.rendering.guides.gap
  behaviorsOptions.configuration.offscreen = true
  test("should create", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const gestMan = new OIGestureManager(behaviors)
    expect(gestMan).toBeDefined()
  })

  describe("apply", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
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
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)

    gestMan.behaviors.internalEvent.emitSelected = jest.fn()
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.selectionManager.drawSelectedGroup = jest.fn()
    gestMan.undoRedoManager.addModelToStack = jest.fn()

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
      expect(gestMan.selectionManager.drawSelectedGroup).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
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
      expect(gestMan.selectionManager.drawSelectedGroup).toHaveBeenCalledTimes(1)
      expect(gestMan.selectionManager.drawSelectedGroup).toHaveBeenCalledWith([stroke])
      expect(gestMan.behaviors.internalEvent.emitSelected).toHaveBeenCalledTimes(1)
      expect(gestMan.behaviors.internalEvent.emitSelected).toHaveBeenCalledWith([stroke])
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
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
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
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
  })

  describe("applyScratchGesture", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestureStroke = buildOIStroke()
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.removeSymbol = jest.fn()
    gestMan.model.removeSymbol = jest.fn(id => [id])
    gestMan.recognizer.eraseStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyScratchGesture(gestureStroke, gesture)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should draw symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyScratchGesture(gestureStroke, gesture)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.recognizer.eraseStrokes).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyJoinGesture", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke11 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
    behaviors.model.addSymbol(stroke11)
    const stroke12 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
    behaviors.model.addSymbol(stroke12)
    const stroke21 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
    behaviors.model.addSymbol(stroke21)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.translateManager.translate = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()
    gestMan.undoRedoManager.updateModelInStack = jest.fn()

    test("should join strokes if between 2 strokes", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translateManager.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translateManager.translate).toHaveBeenCalledWith([stroke12], stroke11.boundingBox.xMax - stroke12.boundingBox.xMin, 0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.updateModelInStack).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and stroke in previous row", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translateManager.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translateManager.translate).toHaveBeenCalledWith([stroke21], stroke12.boundingBox.xMax - stroke21.boundingBox.xMin + 50, -rowHeight)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.updateModelInStack).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and stroke in previous row", async () =>
    {
      const stroke51 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 4.6 * rowHeight } })
      behaviors.model.addSymbol(stroke51)
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture)
      expect(gestMan.translateManager.translate).toHaveBeenCalledTimes(1)
      expect(gestMan.translateManager.translate).toHaveBeenCalledWith([stroke51], 0, -rowHeight)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.updateModelInStack).toHaveBeenCalledTimes(1)
    })

  })

  describe("applyInsertGesture", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.renderer.removeSymbol = jest.fn()
    gestMan.recognizer.addStrokes = jest.fn((() => Promise.resolve(undefined)))
    gestMan.recognizer.eraseStrokes = jest.fn((() => Promise.resolve()))
    gestMan.recognizer.replaceStrokes = jest.fn((() => Promise.resolve()))
    gestMan.recognizer.translateStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()

    test("should split", async () =>
    {
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: strokeGesture.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [{ x: stroke.pointers.slice(2).map(p => p.x), y: stroke.pointers.slice(2).map(p => p.y) }],
      }
      await gestMan.applyInsertGesture(strokeGesture, gesture)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(2)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyStrikeThroughGesture", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.model.addSymbol = jest.fn()
    gestMan.model.updateSymbol = jest.fn()
    gestMan.undoRedoManager.addModelToStack = jest.fn()

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
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
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
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({
        type: SymbolType.Decorator,
        kind: DecoratorKind.Strikethrough,
        parents: [stroke]
      }))
    })
  })

  describe("applyUnderlineGesture", () =>
  {
    const behaviorsOptions: TBehaviorOptions = {
      configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
    }
    behaviorsOptions.configuration.offscreen = true
    const behaviors = new OIBehaviors(behaviorsOptions)
    const stroke = buildOIStroke()
    behaviors.model.addSymbol(stroke)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.model.addSymbol = jest.fn()
    gestMan.model.updateSymbol = jest.fn()
    gestMan.undoRedoManager.addModelToStack = jest.fn()

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
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
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
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledWith(expect.objectContaining({
        type: SymbolType.Decorator,
        kind: DecoratorKind.Underline,
        parents: [stroke]
      }))
    })
  })

})
