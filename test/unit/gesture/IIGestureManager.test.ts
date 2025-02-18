import { buildOICircle, buildOIStroke, buildOIText } from "../helpers"
import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import
{
    DefaulTIIRendererConfiguration,
  TGesture,
  SurroundAction,
  TIISymbolChar,
  IIGestureManager,
  EditorTool,
  DecoratorKind,
  StrikeThroughAction,
  IIStroke,
  TInteractiveInkMessageType
} from "../../../src/iink"

describe("IIGestureManager.ts", () =>
{
  const rowHeight = DefaulTIIRendererConfiguration.guides.gap

  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const gestMan = new IIGestureManager(editor)
    expect(gestMan).toBeDefined()
  })

  describe("apply", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.svgDebugger.apply = jest.fn()
    const gestMan = new IIGestureManager(editor)
    gestMan.applyInsertGesture = jest.fn()
    gestMan.applyJoinGesture = jest.fn()
    gestMan.applyScratch = jest.fn()
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(0)
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(1)
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(0)
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(0)
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(0)
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
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
      expect(gestMan.applyInsertGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyJoinGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applyScratch).toHaveBeenCalledTimes(0)
      expect(gestMan.applyStrikeThroughGesture).toHaveBeenCalledTimes(0)
      expect(gestMan.applySurroundGesture).toHaveBeenCalledTimes(1)
      expect(gestMan.applyUnderlineGesture).toHaveBeenCalledTimes(0)
    })
  })

  describe("applySurroundGesture", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const stroke = buildOIStroke()
    editor.model.addSymbol(stroke)

    const gestMan = new IIGestureManager(editor)
    gestMan.renderer.drawSymbol = jest.fn()
    gestMan.history.push = jest.fn()

    test("should have a selection as the default action on surround", () =>
    {
      expect(gestMan.surroundAction).toEqual(SurroundAction.Select)
    })

    test("should do nothing if gestureStroke not contains symbols", async () =>
    {
      const gestureStroke = buildOIStroke({ box: { height: 2, width: 2, x: 500, y: 500 } })
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await gestMan.applySurroundGesture(gestureStroke, gesture)
      expect(gestMan.editor.select).toHaveBeenCalledTimes(0)
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
      expect(gestMan.editor.event.emitToolChanged).toHaveBeenNthCalledWith(1, EditorTool.Select)
      expect(gestMan.editor.select).toHaveBeenNthCalledWith(1, [stroke.id])
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
      expect(console.error).toHaveBeenCalledWith({ "level": "error",  message: ["Unknow surroundAction: unknow, values allowed are: highlight, select, surround"], "from": "GESTURE.applySurroundGesture" })
    })
  })

  describe("applyScratchGesture", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIGestureManager(editor)
    manager.texter.updateBounds = jest.fn()
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
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(0)
    })

    test("should erase shape symbol", async () =>
    {
      const circle = buildOICircle()
      editor.model.addSymbol(circle)
      const gestureStroke = buildOIStroke({ box: circle.bounds, nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [circle.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [circle.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase text symbol", async () =>
    {
      const chars: TIISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      editor.model.addSymbol(text)
      const gestureStroke = buildOIStroke({ box: { height: 20, width: 20, x: -5, y: 5 }, nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [text.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase text symbol", async () =>
    {
      const chars: TIISymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A"
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-2",
          label: "b"
        }
      ]
      const text = buildOIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      editor.model.addSymbol(text)
      const gestureStroke = buildOIStroke({ box: chars[0].bounds })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratch(gestureStroke, gesture)

      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(1)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase stroke symbol", async () =>
    {
      const stroke = buildOIStroke()
      editor.model.addSymbol(stroke)
      const gestureStroke = buildOIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: []
      }
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase stroke symbol", async () =>
    {
      const stroke = buildOIStroke({ nbPoint: 50 })
      editor.model.addSymbol(stroke)
      const gestureStroke = buildOIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [{ fullStrokeId: stroke.id, x: stroke.pointers.slice(10, 25).map(p => p.x), y: stroke.pointers.slice(10, 25).map(p => p.y) }],
      }
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenNthCalledWith(1, [stroke], expect.arrayContaining([expect.objectContaining({ "type": "stroke" }), expect.objectContaining({ "type": "stroke" })]), false)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyJoinGesture", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const stroke11 = buildOIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
    editor.model.addSymbol(stroke11)
    const stroke12 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
    editor.model.addSymbol(stroke12)
    const stroke21 = buildOIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
    editor.model.addSymbol(stroke21)
    const gestMan = new IIGestureManager(editor)
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
      expect(gestMan.editor.replaceSymbols).toHaveBeenCalledTimes(1)
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
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke21], stroke12.bounds.xMax - stroke21.bounds.xMin + rowHeight * 2, -rowHeight, false)
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
      editor.model.addSymbol(stroke51)
      const strokeGesture = buildOIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke51], 0, -rowHeight, false)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

  })

  describe("applyInsertGesture", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const stroke = buildOIStroke()
    editor.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(editor)
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
      expect(editor.replaceSymbols).toHaveBeenNthCalledWith(1, [stroke], expect.arrayContaining([expect.objectContaining({ "type": "stroke" }), expect.objectContaining({ "type": "stroke" })]), false)
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
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke], 0, gestMan.rowHeight, false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })
  })

  describe("applyUnderlineGesture", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const stroke = buildOIStroke()
    editor.model.addSymbol(stroke)

    const gestMan = new IIGestureManager(editor)
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
    const editor = new InteractiveInkEditorMock()
    const stroke = buildOIStroke()
    editor.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(editor)
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
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id])
    })
  })

  describe("getGestureFromContextLess", () =>
  {
    const editor = new InteractiveInkEditorMock()
    // editor.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(editor)

    beforeEach(() => {
      editor.model.clear()
    })

    test("should return undefined when recognizeGesture return nothing", async () =>
    {
      gestMan.recognizer.recognizeGesture = jest.fn()
      const gestureStroke = buildOIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    test("should return undefined when recognizeGesture return nothing", async () =>
    {
      gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
        type: TInteractiveInkMessageType.ContextlessGesture,
        gestureType: "none",
        strokeId: stroke.id
      }))
      const gestureStroke = buildOIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    describe("surround", () =>
    {

      beforeAll(() =>
      {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
          type: TInteractiveInkMessageType.ContextlessGesture,
          gestureType: "surround",
          strokeId: stroke.id
        }))
      })

      test("should return undefined when there is no symbols", async () =>
      {
        const gestureStroke = buildOIStroke()
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return undefined when the gesture stroke contains no symbols", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(buildOICircle({ center: gestureStroke.bounds.center, radius: Math.max(gestureStroke.bounds.width * 2, gestureStroke.bounds.height * 2) }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture when the gesture stroke contains symbol", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(buildOICircle({ center: gestureStroke.bounds.center, radius: Math.min(gestureStroke.bounds.width / 2, gestureStroke.bounds.height / 2) }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "SURROUND",
          gestureStrokeId: gestureStroke.id
        }))
      })
    })

    describe("left-right", () =>
    {
      beforeAll(() =>
      {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
          type: TInteractiveInkMessageType.ContextlessGesture,
          gestureType: "left-right",
          strokeId: stroke.id
        }))
      })
      beforeEach(() => {
        editor.model.clear()
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        editor.model.addSymbol(buildOIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildOIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "UNDERLINE",
          gestureStrokeId: gestureStroke.id,
          strokeIds: [text.id],
        }))
      })
      test("should return gesture strikethrough when the gesture stroke match symbol", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 2, width: 10, x: 0, y: 5 } })
        const text = buildOIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "STRIKETHROUGH",
          gestureStrokeId: gestureStroke.id,
          strokeIds: [text.id],
        }))
      })
    })

    describe("scratch", () =>
    {

      beforeAll(() =>
      {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
          type: TInteractiveInkMessageType.ContextlessGesture,
          gestureType: "scratch",
          strokeId: stroke.id
        }))
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        editor.model.addSymbol(buildOIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildOIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "SCRATCH",
          gestureStrokeId: gestureStroke.id,
          strokeIds: [text.id],
        }))
      })
    })

    describe("bottom-top", () =>
    {
      beforeAll(() =>
      {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
          type: TInteractiveInkMessageType.ContextlessGesture,
          gestureType: "bottom-top",
          strokeId: stroke.id
        }))
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(buildOIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * editor.model.rowHeight } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture join when there is symbol in gesture row", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 20, width: 10, x: 0, y: editor.model.rowHeight } })
        const text = buildOIText({ boundingBox: { height: 12, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "JOIN",
          gestureStrokeId: gestureStroke.id,
        }))
      })
    })

    describe("top-bottom", () =>
    {
      beforeAll(() =>
      {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: IIStroke) => Promise.resolve({
          type: TInteractiveInkMessageType.ContextlessGesture,
          gestureType: "top-bottom",
          strokeId: stroke.id
        }))
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 10, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(buildOIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * editor.model.rowHeight } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture insert when there is symbol in gesture row", async () =>
      {
        const gestureStroke = buildOIStroke({ box: { height: 20, width: 10, x: 0, y: editor.model.rowHeight } })
        const text = buildOIText({ boundingBox: { height: 12, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(expect.objectContaining({
          gestureType: "INSERT",
          gestureStrokeId: gestureStroke.id,
        }))
      })
    })

  })

})
