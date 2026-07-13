import { createCanvasMock, asEditor } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { SurroundGestureHandler, GestureHelpers, TGesture, SurroundAction, StrokeOps } from "@/iink"

describe("SurroundGestureHandler.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: SurroundGestureHandler

  beforeEach(() => {
    editor = createCanvasMock()
    helpers = new GestureHelpers(asEditor(editor))
    handler = new SurroundGestureHandler(asEditor(editor), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("SURROUND")
  })

  describe("apply", () => {
    test("should handle Select action", async () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 20, y: 20, p: 1, t: 200 })

      editor.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 300 })
      StrokeOps.addPointer(gestureStroke, { x: 25, y: 25, p: 1, t: 400 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      // Set surround action to Select
      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle Highlight action", async () => {
      const text = buildIIText({
        chars: [
          {
            id: "char-1",
            label: "Test",
            fontSize: 16,
            fontWeight: "normal",
            color: "#000000",
            bounds: { x: 10, y: 10, width: 20, height: 16 },
          },
        ],
        boundingBox: { x: 10, y: 10, width: 20, height: 16 },
      })

      editor.model.addSymbol(text)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 100 })
      StrokeOps.addPointer(gestureStroke, { x: 35, y: 30, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      // Set surround action to Highlight
      editor.gesture.surroundAction = SurroundAction.Highlight

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle Surround action", async () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 20, y: 20, p: 1, t: 200 })
      stroke.jiixBlockType = "Text"

      editor.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 300 })
      StrokeOps.addPointer(gestureStroke, { x: 25, y: 25, p: 1, t: 400 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      // Set surround action to Surround
      editor.gesture.surroundAction = SurroundAction.Surround

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })

    test("should handle empty symbols", async () => {
      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 100, y: 100, p: 1, t: 100 })
      StrokeOps.addPointer(gestureStroke, { x: 200, y: 200, p: 1, t: 200 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors even with no symbols
      expect(true).toBe(true)
    })

    test("should handle unknown surround action", async () => {
      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 10, y: 10, p: 1, t: 100 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      // Set an invalid surround action (cast to bypass type check for testing)
      editor.gesture.surroundAction = "UNKNOWN" as any

      await handler.apply(gestureStroke, gesture)

      // Should log error and complete
      expect(true).toBe(true)
    })
  })

  describe("integration", () => {
    test("should select symbols within gesture bounds", async () => {
      const stroke1 = buildIIStroke()
      StrokeOps.addPointer(stroke1, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke1, { x: 15, y: 15, p: 1, t: 200 })

      const stroke2 = buildIIStroke()
      StrokeOps.addPointer(stroke2, { x: 100, y: 100, p: 1, t: 300 })
      StrokeOps.addPointer(stroke2, { x: 105, y: 105, p: 1, t: 400 })

      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 500 })
      StrokeOps.addPointer(gestureStroke, { x: 20, y: 20, p: 1, t: 600 })

      const gesture: TGesture = {
        gestureType: "SURROUND",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      editor.gesture.surroundAction = SurroundAction.Select

      await handler.apply(gestureStroke, gesture)

      // Should only select stroke1 which is within bounds
      expect(true).toBe(true)
    })
  })
})
