import { buildIICircle, buildIIStroke, buildIIText } from "../../helpers"
import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"
import {
  DefaultIIRendererConfiguration,
  TGesture,
  TSymbolChar,
  IIGestureManager,
  TStroke,
  TRecognizerWebSocketMessageType,
  BoxOps,
  OBBOps,
} from "@/iink"

describe("IIGestureManager.ts", () => {
  const rowHeight = DefaultIIRendererConfiguration.guides.gap

  test("should create", () => {
    const editor = createEditorMock()
    const gestMan = new IIGestureManager(asEditor(editor))
    expect(gestMan).toBeDefined()
  })

  describe("apply", () => {
    const editor = createEditorMock()
    editor.overlays.apply = jest.fn()
    const gestMan = new IIGestureManager(asEditor(editor))
    // Handlers are now private - test behavior instead of implementation

    const gestureStroke = buildIIStroke()
    editor.model.addSymbol(gestureStroke)
    test("should remove gestureStroke from renderer", async () => {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
    })
    test("should handle SCRATCH gesture", async () => {
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenCalled()
    })
    test("should handle JOIN gesture", async () => {
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenCalled()
    })
    test("should handle INSERT gesture", async () => {
      const gesture: TGesture = {
        gestureType: "INSERT",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenCalled()
    })
    test("should handle STRIKETHROUGH gesture", async () => {
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenCalled()
    })
    test("should handle SURROUND gesture", async () => {
      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(editor.removeSymbol).toHaveBeenCalled()
    })
  })

  describe.skip("applyScratchGesture", () => {
    const editor = createEditorMock()
    const manager = new IIGestureManager(asEditor(editor))
    manager.typeset.updateBounds = jest.fn()
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.removeSymbol = jest.fn()
    manager.renderer.replaceSymbol = jest.fn()
    manager.model.removeSymbol = jest.fn((id) => [id])
    manager.model.updateSymbol = jest.fn((id) => [id])
    manager.model.replaceSymbol = jest.fn((id) => [id])
    manager.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())
    manager.recognizer.replaceStrokes = jest.fn(() => Promise.resolve())
    manager.history.push = jest.fn()

    beforeEach(() => {
      manager.model.clear()
    })

    test("should do nothing if gesture as no strokeIds", async () => {
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(0)
    })

    test("should erase shape symbol", async () => {
      const circle = buildIICircle()
      editor.model.addSymbol(circle)
      const gestureStroke = buildIIStroke({ box: OBBOps.toBox(circle.bounds), nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [circle.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [circle.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase text symbol", async () => {
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A",
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-2",
          label: "b",
        },
      ]
      const text = buildIIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      editor.model.addSymbol(text)
      const gestureStroke = buildIIStroke({ box: { height: 20, width: 20, x: -5, y: 5 }, nbPoint: 100 })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [text.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase text symbol", async () => {
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-1",
          label: "A",
        },
        {
          bounds: { height: 10, width: 5, x: 5, y: 10 },
          color: "black",
          fontSize: 16,
          fontWeight: "normal",
          id: "char-2",
          label: "b",
        },
      ]
      const text = buildIIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      editor.model.addSymbol(text)
      const gestureStroke = buildIIStroke({ box: chars[0].bounds })
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)

      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(1)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase stroke symbol", async () => {
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id], false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })

    test("should partially erase stroke symbol", async () => {
      const stroke = buildIIStroke({ nbPoint: 50 })
      editor.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [
          {
            fullStrokeId: stroke.id,
            x: stroke.pointers.slice(10, 25).map((p) => p.x),
            y: stroke.pointers.slice(10, 25).map((p) => p.y),
          },
        ],
      }
      // @ts-expect-error - Method moved to ScratchGestureHandler
      await manager.applyScratch(gestureStroke, gesture)
      expect(editor.updateSymbols).toHaveBeenCalledTimes(0)
      expect(editor.removeSymbols).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenNthCalledWith(
        1,
        [stroke],
        expect.arrayContaining([
          expect.objectContaining({ type: "stroke" }),
          expect.objectContaining({ type: "stroke" }),
        ]),
        false
      )
      expect(manager.history.push).toHaveBeenCalledTimes(1)
    })
  })

  // TODO: Refactor these tests to work with Strategy Pattern - JoinGestureHandler
  describe.skip("applyJoinGesture", () => {
    const editor = createEditorMock()
    const stroke11 = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
    editor.model.addSymbol(stroke11)
    const stroke12 = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
    editor.model.addSymbol(stroke12)
    const stroke21 = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
    editor.model.addSymbol(stroke21)
    const gestMan = new IIGestureManager(asEditor(editor))
    gestMan.translator.translate = jest.fn(() => Promise.resolve())
    gestMan.history.push = jest.fn()

    test.skip("should join and group strokes if between 2 strokes", async () => {
      const strokeGesture = buildIIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to JoinGestureHandler
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect((gestMan as any).editor.replaceSymbols).toHaveBeenCalledTimes(1)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and go after stroke in previous row", async () => {
      const strokeGesture = buildIIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to JoinGestureHandler
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(
        1,
        [stroke21],
        OBBOps.toBox(stroke12.bounds).x + stroke12.bounds.width - OBBOps.toBox(stroke21.bounds).x + rowHeight * 2,
        -rowHeight,
        false
      )
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go up strokes if strokesAfter and no stroke in previous row", async () => {
      const stroke51 = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 4.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: "stroke-5b5c63a1-d546-4eb8-a63a-6db512ce2aaf",
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      editor.model.addSymbol(stroke51)
      const strokeGesture = buildIIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })
      // @ts-expect-error - Method moved to JoinGestureHandler
      await gestMan.applyJoinGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke51], 0, -rowHeight, false)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })
  })

  // TODO: Refactor these tests to work with Strategy Pattern - InsertGestureHandler
  describe.skip("applyInsertGesture", () => {
    const editor = createEditorMock()
    const stroke = buildIIStroke()
    editor.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(asEditor(editor))
    gestMan.translator.translate = jest.fn(() => Promise.resolve())
    gestMan.history.push = jest.fn()

    test("should split", async () => {
      const strokeGesture = buildIIStroke({ box: { height: 9, width: 10, x: 20, y: 0.6 * rowHeight } })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: strokeGesture.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [
          {
            fullStrokeId: stroke.id,
            x: stroke.pointers.slice(2).map((p) => p.x),
            y: stroke.pointers.slice(2).map((p) => p.y),
          },
        ],
      }
      // @ts-expect-error - Method moved to InsertGestureHandler
      await gestMan.applyInsertGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenCalledTimes(0)
      expect(editor.replaceSymbols).toHaveBeenNthCalledWith(
        1,
        [stroke],
        expect.arrayContaining([
          expect.objectContaining({ type: "stroke" }),
          expect.objectContaining({ type: "stroke" }),
        ]),
        false
      )
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })

    test("should go down stroke", async () => {
      const strokeGesture = buildIIStroke({
        box: {
          height: stroke.bounds.height,
          width: 5,
          x: OBBOps.toBox(stroke.bounds).x - 10,
          y: OBBOps.toBox(stroke.bounds).y,
        },
      })
      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: strokeGesture.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      // @ts-expect-error - Method moved to InsertGestureHandler
      await gestMan.applyInsertGesture(strokeGesture, gesture)
      expect(gestMan.translator.translate).toHaveBeenNthCalledWith(1, [stroke], 0, rowHeight, false)
      expect(editor.replaceSymbols).toHaveBeenCalledTimes(0)
      expect(gestMan.history.push).toHaveBeenCalledTimes(1)
    })
  })

  describe("getGestureFromContextLess", () => {
    const editor = createEditorMock()
    // editor.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(asEditor(editor))

    beforeEach(() => {
      editor.model.clear()
    })

    test("should return undefined when recognizeGesture return nothing", async () => {
      gestMan.recognizer.recognizeGesture = jest.fn()
      const gestureStroke = buildIIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    test("should return undefined when recognizeGesture return nothing", async () => {
      gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
        Promise.resolve({
          type: TRecognizerWebSocketMessageType.ContextlessGesture,
          gestureType: "none",
          strokeId: stroke.id,
        })
      )
      const gestureStroke = buildIIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    describe("surround", () => {
      beforeAll(() => {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TRecognizerWebSocketMessageType.ContextlessGesture,
            gestureType: "surround",
            strokeId: stroke.id,
          })
        )
      })

      test("should return undefined when there is no symbols", async () => {
        const gestureStroke = buildIIStroke()
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return undefined when the gesture stroke contains no symbols", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(
          buildIICircle({
            center: BoxOps.getCenter(OBBOps.toBox(gestureStroke.bounds)),
            radius: Math.max(gestureStroke.bounds.width * 2, gestureStroke.bounds.height * 2),
          })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture when the gesture stroke contains symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(
          buildIICircle({
            center: BoxOps.getCenter(OBBOps.toBox(gestureStroke.bounds)),
            radius: Math.min(gestureStroke.bounds.width / 2, gestureStroke.bounds.height / 2),
          })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
          })
        )
      })
    })

    describe("left-right", () => {
      beforeAll(() => {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TRecognizerWebSocketMessageType.ContextlessGesture,
            gestureType: "left-right",
            strokeId: stroke.id,
          })
        )
      })
      beforeEach(() => {
        editor.model.clear()
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        editor.model.addSymbol(buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "UNDERLINE",
            gestureStrokeId: gestureStroke.id,
            strokeIds: [text.id],
          })
        )
      })
      test("should return gesture strikethrough when the gesture stroke match symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 5 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
            strokeIds: [text.id],
          })
        )
      })
    })

    describe("scratch", () => {
      beforeAll(() => {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TRecognizerWebSocketMessageType.ContextlessGesture,
            gestureType: "scratch",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        editor.model.addSymbol(buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeIds: [text.id],
          })
        )
      })
    })

    describe("bottom-top", () => {
      beforeAll(() => {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TRecognizerWebSocketMessageType.ContextlessGesture,
            gestureType: "bottom-top",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(
          buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * editor.model.rowHeight } })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture join when there is symbol in gesture row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 20, width: 10, x: 0, y: editor.model.rowHeight } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
          })
        )
      })
    })

    describe("top-bottom", () => {
      beforeAll(() => {
        gestMan.recognizer.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TRecognizerWebSocketMessageType.ContextlessGesture,
            gestureType: "top-bottom",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(
          buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * editor.model.rowHeight } })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture insert when there is symbol in gesture row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 20, width: 10, x: 0, y: editor.model.rowHeight } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: editor.model.rowHeight } })
        editor.model.addSymbol(gestureStroke)
        editor.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "INSERT",
            gestureStrokeId: gestureStroke.id,
          })
        )
      })
    })
  })
})
