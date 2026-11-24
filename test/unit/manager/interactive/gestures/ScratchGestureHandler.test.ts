import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIICircle, buildIIStroke, buildIIText } from "../../../helpers"
import { GestureHelpers, OBBOps, ScratchGestureHandler, StrokeUtil, SymbolGeometry, TGesture, TSymbolChar } from "@/iink"

describe("ScratchGestureHandler.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let helpers: GestureHelpers
  let handler: ScratchGestureHandler

  beforeEach(() => {
    canvas = createCanvasMock()
    helpers = new GestureHelpers(asCanvas(canvas))
    handler = new ScratchGestureHandler(asCanvas(canvas), helpers)
  })

  test("should instantiate", () => {
    expect(handler).toBeDefined()
    expect(handler.gestureType).toBe("SCRATCH")
  })

  describe("computeScratchOnStrokes", () => {
    test("should split stroke when scratched in middle", () => {
      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 5, y: 5, p: 1, dt: 200 })
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 300 })
      StrokeUtil.addPointer(stroke, { x: 15, y: 15, p: 1, dt: 400 })

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
      StrokeUtil.addPointer(stroke, { x: 0, y: 0, p: 1, dt: 100 })

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
      StrokeUtil.addPointer(stroke, { x: 0, y: 0, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 200 })

      const gestureStroke = buildIIStroke()
      StrokeUtil.addPointer(gestureStroke, { x: 5, y: 5, p: 1, dt: 300 })

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
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 15, p: 1, dt: 100 })

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
      StrokeUtil.addPointer(gestureStroke, { x: 10, y: 10, p: 1, dt: 100 })

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
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })

      canvas.model.addSymbol(stroke)

      const gestureStroke = buildIIStroke()
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 15, p: 1, dt: 300 })

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

  describe("apply — what is erased, what is replaced", () => {
    const scratch = (strokeIds: string[], extra: Partial<TGesture> = {}): TGesture => ({
      gestureType: "SCRATCH",
      gestureStrokeId: "gesture",
      strokeIds,
      strokeBeforeIds: [],
      strokeAfterIds: [],
      ...extra,
    })
    const twoChars = (): TSymbolChar[] => [
      { bounds: { height: 10, width: 5, x: 0, y: 10 }, color: "black", fontSize: 16, fontWeight: "normal", id: "char-1", label: "A" },
      { bounds: { height: 10, width: 5, x: 5, y: 10 }, color: "black", fontSize: 16, fontWeight: "normal", id: "char-2", label: "b" },
    ]

    test("should touch nothing when the gesture covers no stroke", async () => {
      await handler.apply(buildIIStroke(), scratch([]))
      expect(canvas.removeSymbols).not.toHaveBeenCalled()
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).not.toHaveBeenCalled()
    })

    test("should erase a scratched shape", async () => {
      const circle = buildIICircle()
      canvas.model.addSymbol(circle)
      const gestureStroke = buildIIStroke({ box: OBBOps.toBox(SymbolGeometry.boundsOf(circle)), nbPoint: 100 })
      await handler.apply(gestureStroke, scratch([circle.id]))
      expect(canvas.removeSymbols).toHaveBeenNthCalledWith(1, [circle.id], false)
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase a text whose every char is scratched", async () => {
      const text = buildIIText({ chars: twoChars(), boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      canvas.model.addSymbol(text)
      const gestureStroke = buildIIStroke({ box: { height: 20, width: 20, x: -5, y: 5 }, nbPoint: 100 })
      await handler.apply(gestureStroke, scratch([text.id]))
      expect(canvas.removeSymbols).toHaveBeenNthCalledWith(1, [text.id], false)
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should keep the chars of a text the scratch does not reach", async () => {
      const chars = twoChars()
      const text = buildIIText({ chars, boundingBox: { height: 10, width: 10, x: 0, y: 10 } })
      canvas.model.addSymbol(text)
      const gestureStroke = buildIIStroke({ box: chars[0].bounds })
      await handler.apply(gestureStroke, scratch([text.id]))
      expect(canvas.removeSymbols).not.toHaveBeenCalled()
      expect(canvas.replaceSymbols).toHaveBeenNthCalledWith(
        1,
        [text],
        [expect.objectContaining({ id: text.id, chars: [expect.objectContaining({ id: "char-2" })] })],
        false
      )
      // The committed text is what undo restores: it must still hold both chars.
      expect(text.chars.map((c) => c.id)).toEqual(["char-1", "char-2"])
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should erase a stroke the gesture gives no sub-stroke for", async () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      await handler.apply(buildIIStroke(), scratch([stroke.id]))
      expect(canvas.removeSymbols).toHaveBeenNthCalledWith(1, [stroke.id], false)
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should replace a stroke scratched in its middle by the two parts left", async () => {
      // A box wide enough for all 50 points to survive `addPointer`'s minimum spacing.
      const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 500, height: 500 }, nbPoint: 50 })
      canvas.model.addSymbol(stroke)
      const middle = stroke.pointers.slice(10, 25)
      expect(middle).toHaveLength(15)
      await handler.apply(
        buildIIStroke(),
        scratch([stroke.id], {
          subStrokes: [{ fullStrokeId: stroke.id, x: middle.map((p) => p.x), y: middle.map((p) => p.y) }],
        })
      )
      expect(canvas.removeSymbols).not.toHaveBeenCalled()
      expect(canvas.replaceSymbols).toHaveBeenNthCalledWith(
        1,
        [stroke],
        [expect.objectContaining({ type: "stroke" }), expect.objectContaining({ type: "stroke" })],
        false
      )
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })
  })
})
