import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { UnderlineGestureHandler, GestureHelpers, TGesture, TText, UnderlineAction } from "@/iink"

describe("UnderlineGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: UnderlineGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new UnderlineGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("UNDERLINE")
  })

  describe("apply", () => {
    test("should warn and do nothing when there are no target strokes", async () => {
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.updateSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).not.toHaveBeenCalled()
    })

    test("should move the stroke to the next width of the thickness menu when underlineAction is Thicken", async () => {
      canvas.gesture.underlineAction = UnderlineAction.Thicken
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      // updateSymbols records the history itself
      expect(canvas.updateSymbols).toHaveBeenCalledWith([stroke.id], expect.any(Function))
      // DefaultStyle's width 2 is M in the thickness menu, L is 4
      expect(canvas.model.getSymbol(stroke.id)?.style.width).toBe(4)
    })

    test("should move a converted text to the next weight of the font weight menu when underlineAction is Thicken", async () => {
      canvas.gesture.underlineAction = UnderlineAction.Thicken
      const text = buildIIText({
        chars: [
          {
            id: "char-a",
            label: "a",
            color: "#000000",
            fontSize: 16,
            fontWeight: "normal",
            bounds: { x: 0, y: 0, width: 10, height: 16 },
          },
        ],
      })
      canvas.model.addSymbol(text)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect((canvas.model.getSymbol(text.id) as TText).chars[0].fontWeight).toBe("bold")
    })

    test("should push a history entry when underlineAction is Draw", async () => {
      canvas.gesture.underlineAction = UnderlineAction.Draw
      const stroke = buildIIStroke()
      // avoid the multi-second "wait for pending classification" delay in IIGestureAnnotationProcessor
      stroke.jiixBlockType = "Text"
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "UNDERLINE",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.history.push).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbols).not.toHaveBeenCalled()
    })
  })
})
