import { SymbolGeometry, DefaultIIRendererConfiguration, TGesture, IIGestureManager, TStroke, TWebSocketClientMessageType, BoxOps, OBBOps, UnderlineAction } from "@/iink"
import { buildIICircle, buildIIMath, buildIIStroke, buildIIText } from "../../helpers"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"

describe("IIGestureManager.ts", () => {
  const rowHeight = DefaultIIRendererConfiguration.guides.gap

  test("should create", () => {
    const canvas = createCanvasMock()
    const gestMan = new IIGestureManager(asCanvas(canvas))
    expect(gestMan).toBeDefined()
  })

  describe("apply", () => {
    const canvas = createCanvasMock()
    canvas.overlays.apply = jest.fn()
    const gestMan = new IIGestureManager(asCanvas(canvas))
    // Handlers are now private - test behavior instead of implementation

    const gestureStroke = buildIIStroke()
    canvas.model.addSymbol(gestureStroke)
    test("should remove gestureStroke from renderer", async () => {
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: ["stroke-9d010566-ded8-44e0-a7cf-ad0d474f3b87"],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }
      await gestMan.apply(gesture)
      expect(canvas.removeSymbol).toHaveBeenNthCalledWith(1, gestureStroke.id, false)
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
      expect(canvas.removeSymbol).toHaveBeenCalled()
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
      expect(canvas.removeSymbol).toHaveBeenCalled()
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
      expect(canvas.removeSymbol).toHaveBeenCalled()
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
      expect(canvas.removeSymbol).toHaveBeenCalled()
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
      expect(canvas.removeSymbol).toHaveBeenCalled()
    })
  })

  describe("getGestureFromContextLess", () => {
    const canvas = createCanvasMock()
    // canvas.model.addSymbol(stroke)
    const gestMan = new IIGestureManager(asCanvas(canvas))

    beforeEach(() => {
      canvas.model.clear()
      canvas.configuration.recognition["raw-content"].gestures = [
        "underline",
        "scratch-out",
        "join",
        "insert",
        "strike-through",
        "surround",
      ]
    })

    test("should return undefined when recognizeGesture return nothing", async () => {
      gestMan.client.recognizeGesture = jest.fn()
      const gestureStroke = buildIIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    test("should return undefined when recognizeGesture return nothing", async () => {
      gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
        Promise.resolve({
          type: TWebSocketClientMessageType.ContextlessGesture,
          gestureType: "none",
          strokeId: stroke.id,
        })
      )
      const gestureStroke = buildIIStroke()
      expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
    })

    describe("surround", () => {
      beforeAll(() => {
        gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TWebSocketClientMessageType.ContextlessGesture,
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
        canvas.model.addSymbol(
          buildIICircle({
            center: BoxOps.getCenter(OBBOps.toBox(SymbolGeometry.boundsOf(gestureStroke))),
            radius: Math.max(SymbolGeometry.boundsOf(gestureStroke).width * 2, SymbolGeometry.boundsOf(gestureStroke).height * 2),
          })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture when the gesture stroke contains symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: 0 } })
        canvas.model.addSymbol(
          buildIICircle({
            center: BoxOps.getCenter(OBBOps.toBox(SymbolGeometry.boundsOf(gestureStroke))),
            radius: Math.min(SymbolGeometry.boundsOf(gestureStroke).width / 2, SymbolGeometry.boundsOf(gestureStroke).height / 2),
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
        gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TWebSocketClientMessageType.ContextlessGesture,
            gestureType: "left-right",
            strokeId: stroke.id,
          })
        )
      })
      beforeEach(() => {
        canvas.model.clear()
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        canvas.model.addSymbol(buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
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
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
            strokeIds: [text.id],
          })
        )
      })
      test("should return gesture underline on a math block when underlineAction is Thicken", async () => {
        gestMan.underlineAction = UnderlineAction.Thicken
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const math = buildIIMath("x", { boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(math)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "UNDERLINE",
            strokeIds: [math.id],
          })
        )
        gestMan.underlineAction = UnderlineAction.Draw
      })
      test("should ignore a math block when underlineAction is Draw", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(buildIIMath("x", { boundingBox: { height: 12, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
    })

    describe("scratch", () => {
      beforeAll(() => {
        gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TWebSocketClientMessageType.ContextlessGesture,
            gestureType: "scratch",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke does not match either the underline or the strikethrough of the symbols", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 50 } })
        canvas.model.addSymbol(buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 0 } }))
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture underline when the gesture stroke match symbol", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeIds: [text.id],
          })
        )
      })
      test("must return undefined when scratch-out is disabled in the recognition configuration", async () => {
        canvas.configuration.recognition["raw-content"].gestures = ["join"]
        const gestureStroke = buildIIStroke({ box: { height: 2, width: 10, x: 0, y: 10 } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: 0 } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
    })

    describe("bottom-top", () => {
      beforeAll(() => {
        gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TWebSocketClientMessageType.ContextlessGesture,
            gestureType: "bottom-top",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: rowHeight } })
        canvas.model.addSymbol(
          buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * rowHeight } })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture join when there is symbol in gesture row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 20, width: 10, x: 0, y: rowHeight } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: rowHeight } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toEqual(
          expect.objectContaining({
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
          })
        )
      })
      test("must return undefined when join is disabled in the recognition configuration", async () => {
        canvas.configuration.recognition["raw-content"].gestures = ["insert"]
        const gestureStroke = buildIIStroke({ box: { height: 20, width: 10, x: 0, y: rowHeight } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: rowHeight } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
    })

    describe("top-bottom", () => {
      beforeAll(() => {
        gestMan.client.recognizeGesture = jest.fn((stroke: TStroke) =>
          Promise.resolve({
            type: TWebSocketClientMessageType.ContextlessGesture,
            gestureType: "top-bottom",
            strokeId: stroke.id,
          })
        )
      })
      test("must return undefined when the gesture stroke has no symbols in row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 10, width: 10, x: 0, y: rowHeight } })
        canvas.model.addSymbol(
          buildIIText({ boundingBox: { height: 10, width: 10, x: 0, y: 2 * rowHeight } })
        )
        expect(await gestMan.getGestureFromContextLess(gestureStroke)).toBeUndefined()
      })
      test("should return gesture insert when there is symbol in gesture row", async () => {
        const gestureStroke = buildIIStroke({ box: { height: 20, width: 10, x: 0, y: rowHeight } })
        const text = buildIIText({ boundingBox: { height: 12, width: 10, x: 0, y: rowHeight } })
        canvas.model.addSymbol(gestureStroke)
        canvas.model.addSymbol(text)
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
