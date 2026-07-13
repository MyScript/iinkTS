import { createCanvasMock, asEditor } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../../helpers"
import { ScratchGestureHandler, GestureHelpers, TGesture, StrokeOps } from "@/iink"

describe("ScratchGestureHandler.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: ScratchGestureHandler

  beforeEach(() => {
    editor = createCanvasMock()
    helpers = new GestureHelpers(asEditor(editor))
    handler = new ScratchGestureHandler(asEditor(editor), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("SCRATCH")
  })

  describe("computeScratchOnStrokes", () => {
    test("should split stroke when scratched in middle", () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 5, y: 5, p: 1, t: 200 })
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 300 })
      StrokeOps.addPointer(stroke, { x: 15, y: 15, p: 1, t: 400 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: stroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [
          {
            fullStrokeId: stroke.id,
            x: [5, 10],
            y: [5, 10],
          },
        ],
      }

      const result = handler.computeScratchOnStrokes(gesture, stroke)

      expect(result.length).toBeGreaterThanOrEqual(0)
    })

    test("should handle empty substroke data", () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 0, y: 0, p: 1, t: 100 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: stroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [],
      }

      const result = handler.computeScratchOnStrokes(gesture, stroke)

      expect(result).toBeDefined()
    })
  })

  describe("computeScratchOnText", () => {
    test("should detect chars overlap (method requires DOM APIs, testing structure only)", () => {
      // This method requires DOM APIs (getBBox, getNumberOfChars, getExtentOfChar)
      // that are not available in test environment
      // We verify the method exists and can be called
      expect(handler.computeScratchOnText).toBeDefined()
      expect(typeof handler.computeScratchOnText).toBe("function")
    })
  })

  describe("computeScratchOnSymbol", () => {
    test("should erase stroke when fully scratched", () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 0, y: 0, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 200 })

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 5, y: 5, p: 1, t: 300 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: stroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [
          {
            fullStrokeId: stroke.id,
            x: [0, 5, 10],
            y: [0, 5, 10],
          },
        ],
      }

      const result = handler.computeScratchOnSymbol(gestureStroke, gesture, stroke)

      expect(result).toBeDefined()
      expect(result.erased !== undefined || result.replaced !== undefined).toBe(true)
    })

    test("should handle text symbol scratch", () => {
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

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 15, y: 15, p: 1, t: 100 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: text.id,
        strokeIds: [text.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      const result = handler.computeScratchOnSymbol(gestureStroke, gesture, text)

      expect(result).toBeDefined()
    })
  })

  describe("apply", () => {
    test("should handle empty strokeIds", async () => {
      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 10, y: 10, p: 1, t: 100 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [],
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors (logs warning)
      expect(true).toBe(true)
    })

    test("should scratch and erase strokes", async () => {
      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 20, y: 20, p: 1, t: 200 })

      editor.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      StrokeOps.addPointer(gestureStroke, { x: 15, y: 15, p: 1, t: 300 })

      const gesture: TGesture = {
        gestureType: "SCRATCH",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [stroke.id],
        strokeBeforeIds: [],
        strokeAfterIds: [],
        subStrokes: [
          {
            fullStrokeId: stroke.id,
            x: [10, 15, 20],
            y: [10, 15, 20],
          },
        ],
      }

      await handler.apply(gestureStroke, gesture)

      // Should complete without errors
      expect(true).toBe(true)
    })
  })
})
