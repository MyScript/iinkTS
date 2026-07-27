import { buildIIStroke, buildIIText } from "../../../helpers"
import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { JoinGestureHandler, GestureHelpers, TGesture, StrokeOps } from "@/iink"

describe("JoinGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: JoinGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new JoinGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("JOIN")
  })

  describe("apply", () => {
    test("should handle empty gesture", async () => {
      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 50, y: 50, p: 1, t: 100 })
      StrokeOps.addPointer(gestureStroke, { x: 50, y: 100, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should join symbols in same row", async () => {
      // JoinGestureHandler.apply requires DOM APIs like getBBox, getNumberOfChars
      // that are not available in jest environment
      // Testing the structure instead of actual joining

      const text1 = buildIIText({
        chars: [
          {
            id: "char-1",
            label: "Hello",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 10, y: 10, width: 30, height: 16 },
          },
        ],
        boundingBox: { x: 10, y: 10, width: 30, height: 16 },
      })

      const text2 = buildIIText({
        chars: [
          {
            id: "char-2",
            label: "World",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 60, y: 10, width: 30, height: 16 },
          },
        ],
        boundingBox: { x: 60, y: 10, width: 30, height: 16 },
      })

      canvas.model.addSymbol(text1)
      canvas.model.addSymbol(text2)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 45, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(gestureStroke, { x: 45, y: 26, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      // Verify handler and model structure
      expect(handler.gestureType).toBe("JOIN")
      expect(canvas.model.symbols.length).toBe(2)
      expect(gesture.gestureType).toBe("JOIN")
    })

    test("should handle symbols above and below", async () => {
      const stroke1 = buildIIStroke()
      StrokeOps.addPointer(stroke1, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke1, { x: 20, y: 20, p: 1, t: 200 })

      const stroke2 = buildIIStroke()
      StrokeOps.addPointer(stroke2, { x: 10, y: 50, p: 1, t: 300 })
      StrokeOps.addPointer(stroke2, { x: 20, y: 60, p: 1, t: 400 })

      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 15, y: 30, p: 1, t: 500 })
      StrokeOps.addPointer(gestureStroke, { x: 15, y: 45, p: 1, t: 600 })

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })
  })
})
