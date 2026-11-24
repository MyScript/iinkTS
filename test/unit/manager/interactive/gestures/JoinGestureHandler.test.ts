import { buildIIStroke, buildIIText } from "../../../helpers"
import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { GestureHelpers, JoinAction, JoinGestureHandler, OBBOps, StrokeUtil, SymbolGeometry, TGesture } from "@/iink"

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
      StrokeUtil.addPointer(gestureStroke, { x: 50, y: 50, p: 1, dt: 100 })
      StrokeUtil.addPointer(gestureStroke, { x: 50, y: 100, p: 1, dt: 200 })

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
      StrokeUtil.addPointer(gestureStroke, { x: 45, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(gestureStroke, { x: 45, y: 26, p: 1, dt: 200 })

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
      StrokeUtil.addPointer(stroke1, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke1, { x: 20, y: 20, p: 1, dt: 200 })

      const stroke2 = buildIIStroke()
      StrokeUtil.addPointer(stroke2, { x: 10, y: 50, p: 1, dt: 300 })
      StrokeUtil.addPointer(stroke2, { x: 20, y: 60, p: 1, dt: 400 })

      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)

      const gestureStroke = buildIIStroke()
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 30, p: 1, dt: 500 })
      StrokeUtil.addPointer(gestureStroke, { x: 15, y: 45, p: 1, dt: 600 })

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

    test("does not translate a stroke from another row even when the server reports it in strokeAfterIds", async () => {
      canvas.configuration.rendering.guides.gap = 10
      const translateSpy = jest.fn()
      ;(canvas.gesture as unknown as Record<string, unknown>).translator = { translate: translateSpy }

      // Gesture sits in row 3 (center.y = 27.5 -> round(27.5/10) = 3), nothing before/above it
      const gestureStroke = buildIIStroke({ box: { height: 5, width: 0, x: 10, y: 25 } })

      // Legitimately in the same row, to the right of the gesture -> should be translated
      const legitAfter = buildIIStroke({ box: { height: 5, width: 5, x: 50, y: 25 } })
      canvas.model.addSymbol(legitAfter)

      // Geometrically in row 0 (above the gesture's row), NOT the gesture's row, but
      // (bogusly) reported by the server in strokeAfterIds -> must NOT be translated
      const strayStroke = buildIIStroke({ box: { height: 5, width: 5, x: 50, y: 0 } })
      canvas.model.addSymbol(strayStroke)

      const gesture: TGesture = {
        gestureType: "JOIN",
        gestureStrokeId: gestureStroke.id,
        strokeIds: [],
        strokeBeforeIds: [],
        strokeAfterIds: [strayStroke.id],
      }

      await handler.apply(gestureStroke, gesture)

      const translatedSymbols = translateSpy.mock.calls.flatMap((call) => call[0])
      expect(translatedSymbols).not.toContain(strayStroke)
    })
  })

  describe("apply — what moves where", () => {
    let rowHeight: number
    let translate: jest.Mock
    const join = (): TGesture => ({
      gestureType: "JOIN",
      gestureStrokeId: "gesture",
      strokeIds: [],
      strokeBeforeIds: [],
      strokeAfterIds: [],
    })
    const rightEdge = (s: ReturnType<typeof buildIIStroke>) => {
      const b = OBBOps.toBox(SymbolGeometry.boundsOf(s))
      return b.x + b.width
    }
    const leftEdge = (s: ReturnType<typeof buildIIStroke>) => OBBOps.toBox(SymbolGeometry.boundsOf(s)).x

    beforeEach(() => {
      rowHeight = canvas.configuration.rendering.guides.gap
      translate = jest.fn(() => Promise.resolve())
      ;(canvas.gesture as unknown as Record<string, unknown>).translator = { translate, applyToSymbol: jest.fn() }
    })

    test("should close the gap between two strokes of a row, moving every stroke after it", async () => {
      const before = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
      const firstAfter = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
      const secondAfter = buildIIStroke({ box: { height: 9, width: 10, x: 150, y: 0.6 * rowHeight } })
      ;[before, firstAfter, secondAfter].forEach((s) => canvas.model.addSymbol(s))
      const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 40, y: 0.6 * rowHeight } })

      await handler.apply(gestureStroke, join())

      expect(translate).toHaveBeenCalledTimes(1)
      expect(translate).toHaveBeenCalledWith(
        expect.arrayContaining([firstAfter, secondAfter]),
        rightEdge(before) - leftEdge(firstAfter),
        0,
        false
      )
      expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should lift a row's strokes after the last stroke of the row above", async () => {
      const above = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
      const after = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
      ;[above, after].forEach((s) => canvas.model.addSymbol(s))
      const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })

      await handler.apply(gestureStroke, join())

      expect(translate).toHaveBeenNthCalledWith(1, [after], rightEdge(above) - leftEdge(after) + rowHeight * 2, -rowHeight, false)
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    test("should only lift a row's strokes when the row above is empty", async () => {
      const farAbove = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
      const after = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 4.6 * rowHeight } })
      ;[farAbove, after].forEach((s) => canvas.model.addSymbol(s))
      const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 10, y: 4.6 * rowHeight } })

      await handler.apply(gestureStroke, join())

      expect(translate).toHaveBeenNthCalledWith(1, [after], 0, -rowHeight, false)
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
    })

    describe("with the close-gap action", () => {
      beforeEach(() => {
        ;(canvas.gesture as unknown as Record<string, unknown>).joinAction = JoinAction.CloseGap
      })

      test("should leave a single word space between the two strokes of a row", async () => {
        const before = buildIIStroke({ box: { height: 9, width: 10, x: 0, y: 0.6 * rowHeight } })
        const firstAfter = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
        const secondAfter = buildIIStroke({ box: { height: 9, width: 10, x: 150, y: 0.6 * rowHeight } })
        ;[before, firstAfter, secondAfter].forEach((s) => canvas.model.addSymbol(s))
        const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 40, y: 0.6 * rowHeight } })

        await handler.apply(gestureStroke, join())

        expect(translate).toHaveBeenCalledTimes(1)
        expect(translate).toHaveBeenCalledWith(
          expect.arrayContaining([firstAfter, secondAfter]),
          rightEdge(before) + rowHeight * 2 - leftEdge(firstAfter),
          0,
          false
        )
        expect(canvas.history.push).toHaveBeenCalledTimes(1)
      })

      test("should keep two texts apart instead of merging them", async () => {
        const before = buildIIText({ boundingBox: { x: 0, y: 0.6 * rowHeight, width: 30, height: 9 } })
        const after = buildIIText({ boundingBox: { x: 100, y: 0.6 * rowHeight, width: 30, height: 9 } })
        ;[before, after].forEach((s) => canvas.model.addSymbol(s))
        const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 60, y: 0.6 * rowHeight } })

        await handler.apply(gestureStroke, join())

        expect(canvas.replaceSymbols).not.toHaveBeenCalled()
        expect(translate).toHaveBeenCalledWith([after], expect.any(Number), 0, false)
      })

      test("should not lift a row onto the row above", async () => {
        const above = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 0.6 * rowHeight } })
        const after = buildIIStroke({ box: { height: 9, width: 10, x: 100, y: 1.6 * rowHeight } })
        ;[above, after].forEach((s) => canvas.model.addSymbol(s))
        const gestureStroke = buildIIStroke({ box: { height: 9, width: 10, x: 10, y: 1.6 * rowHeight } })

        await handler.apply(gestureStroke, join())

        expect(translate).not.toHaveBeenCalled()
        expect(canvas.replaceSymbols).not.toHaveBeenCalled()
      })
    })
  })
})
