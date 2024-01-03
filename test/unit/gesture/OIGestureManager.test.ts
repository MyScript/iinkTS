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
    gestMan.undoRedoManager.removeLastModelInStack = jest.fn()

    test("should do nothing if no gesture", async () =>
    {
      await gestMan.apply()
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(0)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from model/renderer & call applyUnderlineGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(1)
    })
    test("should remove strokeIds from model/renderer & call applyScratchGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from model/renderer & call applyJoinGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from model/renderer & call applyInsertGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "INSERT",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from model/renderer & call applyStrikeThroughGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratchGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
    test("should remove strokeIds from model/renderer & call applySurroundGesture", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.apply(gesture)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.removeLastModelInStack).toHaveBeenCalledTimes(1)
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
    gestMan.renderer.drawSelectedGroup = jest.fn()
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
      expect(gestMan.renderer.drawSelectedGroup).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should have a selection as the default action on surround", () => {
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
      expect(gestMan.renderer.drawSelectedGroup).toHaveBeenCalledTimes(1)
      expect(gestMan.renderer.drawSelectedGroup).toHaveBeenCalledWith([stroke])
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
        type: SymbolType.Decorator,
        kind: DecoratorKind.Highlight,
        parents: [stroke]
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
        type: SymbolType.Decorator,
        kind: DecoratorKind.Surround,
        parents: [stroke]
      }))
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
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
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.removeSymbol = jest.fn()
    gestMan.model.removeSymbol = jest.fn(id => [id])
    gestMan.recognizer.eraseStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyScratchGesture(gesture)
      expect(gestMan.renderer.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.model.removeSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should draw symbol", async () =>
    {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyScratchGesture(gesture)
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
    const stroke1 = buildOIStroke()
    behaviors.model.addSymbol(stroke1)
    const stroke2 = buildOIStroke()
    behaviors.model.addSymbol(stroke2)
    const gestMan = new OIGestureManager(behaviors)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.recognizer.translateStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()

    test("should do nothing if gesture as no strokeBeforeIds & no strokesAfter", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyJoinGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should join strokes if strokeBeforeIds & strokesAfter", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [stroke1.id],
        strokeAfterIds: [stroke2.id]
      }
      await gestMan.applyJoinGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if only strokesAfter", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [stroke2.id]
      }
      await gestMan.applyJoinGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(1)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(1)
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
    gestMan.recognizer.translateStrokes = jest.fn((() => Promise.resolve()))
    gestMan.undoRedoManager.addModelToStack = jest.fn()

    test("should do nothing if gesture as no strokeIds", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyInsertGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.addStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should do nothing if gesture as no subStrokes", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applyInsertGesture(gesture)
      expect(gestMan.renderer.drawSymbol).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.addStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.eraseStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.recognizer.translateStrokes).toHaveBeenCalledTimes(0)
      expect(gestMan.undoRedoManager.addModelToStack).toHaveBeenCalledTimes(0)
    })

    test("should split", async () =>
    {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [{ x: stroke.pointers.slice(2).map(p => p.x ), y: stroke.pointers.slice(2).map(p => p.y)}],
      }
      await gestMan.applyInsertGesture(gesture)
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
