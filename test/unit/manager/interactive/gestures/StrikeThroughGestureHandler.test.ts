import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import { StrikeThroughGestureHandler, GestureHelpers, TGesture, StrikeThroughAction } from "@/iink"

describe("StrikeThroughGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: StrikeThroughGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new StrikeThroughGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("STRIKETHROUGH")
  })

  describe("apply", () => {
    test("should warn and do nothing when there are no target strokes", async () => {
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.removeSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).not.toHaveBeenCalled()
    })

    test("should erase the target strokes when strikeThroughAction is Erase", async () => {
      canvas.gesture.strikeThroughAction = StrikeThroughAction.Erase
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.removeSymbols).toHaveBeenCalledWith([stroke.id])
    })

    test("should push a history entry when strikeThroughAction is Draw", async () => {
      canvas.gesture.strikeThroughAction = StrikeThroughAction.Draw
      const stroke = buildIIStroke()
      // avoid the multi-second "wait for pending classification" delay in IIGestureAnnotationProcessor
      stroke.jiixBlockType = "Text"
      canvas.model.addSymbol(stroke)
      const gestureStroke = buildIIStroke()
      const gesture: TGesture = {
        gestureType: "STRIKETHROUGH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      expect(canvas.history.push).toHaveBeenCalledTimes(1)
      expect(canvas.removeSymbols).not.toHaveBeenCalled()
    })
  })
})
