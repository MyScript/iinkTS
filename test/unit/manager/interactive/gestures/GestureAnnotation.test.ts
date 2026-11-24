import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"
import { DecoratorKind, DefaultStyle, IIGestureAnnotationProcessor, OBBOps, StrokeUtil, SymbolGeometry, TDecorator, TGestureAnnotation, TMath, TStroke, TSymbolChar, TText, isStroke } from "@/iink"

describe("GestureAnnotation.ts", () => {
  describe("IIGestureAnnotationProcessor.apply (decorator)", () => {
    test("waits for a still-unclassified target stroke to be recognized before giving up", async () => {
      const canvas = createCanvasMock()
      const processor = new IIGestureAnnotationProcessor(asCanvas(canvas))

      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      // Not classified yet — mirrors a freshly-written stroke whose own recognition
      // round-trip hasn't resolved yet (jiixBlockType assigned later, asynchronously).
      canvas.model.addSymbol(stroke)

      setTimeout(() => {
        // The document holds frozen records, so classify by committing a draft.
        const draft = canvas.model.draftSymbol(stroke.id)
        if (draft && isStroke(draft)) {
          draft.jiixBlockType = "Text"
          canvas.model.updateSymbol(draft)
        }
      }, 50)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes?.added).toHaveLength(1)
      const decorator = canvas.model.symbols.find((s) => s.type === "decorator")
      expect(decorator).toBeDefined()
      expect((decorator as { targetIds: string[] }).targetIds).toContain(stroke.id)
    })

    test("gives up if the target stroke is never classified as text", async () => {
      const canvas = createCanvasMock()
      const processor = new IIGestureAnnotationProcessor(asCanvas(canvas))

      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      canvas.model.addSymbol(stroke)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes).toBeUndefined()
      expect(canvas.model.symbols.find((s) => s.type === "decorator")).toBeUndefined()
    }, 10000)
  })
  /**
   * Where the decorator is *drawn*. `targetBounds` is an input — a decorator holds no coordinates
   * of its own — so if nothing writes it here the underline has no box and renders at the origin.
   * Nothing covered this, which is why removing the two writers below looked free.
   */
  describe("IIGestureAnnotationProcessor.apply (decorator placement)", () => {
    function buildRecognizedStroke() {
      const stroke = buildIIStroke()
      StrokeUtil.addPointer(stroke, { x: 10, y: 10, p: 1, dt: 100 })
      StrokeUtil.addPointer(stroke, { x: 20, y: 20, p: 1, dt: 200 })
      stroke.jiixBlockType = "Text"
      return stroke
    }

    const applySurround = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      new IIGestureAnnotationProcessor(asCanvas(canvas)).apply([id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

    const decoratorIn = (canvas: ReturnType<typeof createCanvasMock>) =>
      canvas.model.symbols.find((sym) => sym.type === "decorator") as TDecorator | undefined

    test("takes the recognizer's word box when JIIX has one, in preference to the strokes' own", async () => {
      const canvas = createCanvasMock()
      const stroke = buildRecognizedStroke()
      canvas.model.addSymbol(stroke)
      // Deliberately unlike the stroke's own box: a word box is the recognizer's, tighter than the
      // union of the strokes it covers and not computable from them. Asserting a box that differs
      // is what distinguishes "took the word box" from "fell back to the targets".
      const wordBox = { x: 100, y: 200, width: 60, height: 12 }
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue({
        wordKey: "word-1",
        allStrokeIds: [stroke.id],
        wordBounds: wordBox,
        baseline: 210,
        xHeight: 8,
      })

      await applySurround(canvas, stroke.id)

      const decorator = decoratorIn(canvas)
      expect(decorator?.targetBounds).toEqual(OBBOps.fromBox(wordBox))
      expect(decorator?.targetBounds).not.toEqual(SymbolGeometry.boundsOf(stroke))
      expect(decorator?.baseline).toBe(210)
      expect(decorator?.xHeight).toBe(8)
    })

    test("falls back to the union of its targets' boxes when JIIX has not answered yet", async () => {
      const canvas = createCanvasMock()
      const stroke = buildRecognizedStroke()
      canvas.model.addSymbol(stroke)
      canvas.jiix.getWordGroupForStroke = jest.fn().mockReturnValue(undefined)

      await applySurround(canvas, stroke.id)

      expect(decoratorIn(canvas)?.targetBounds).toEqual(SymbolGeometry.boundsOf(stroke))
    })
  })

  describe("IIGestureAnnotationProcessor.apply (thicken)", () => {
    // The default thickness and font weight menus, "auto" left out
    const levels: TGestureAnnotation = { kind: "thicken", widths: [1, 2, 4, 8], fontWeights: ["normal", "bold"] }
    const char = (fontWeight: "normal" | "bold"): TSymbolChar => ({
      id: `char-${fontWeight}`,
      label: "a",
      color: "#000000",
      fontSize: 16,
      fontWeight,
      bounds: { x: 0, y: 0, width: 10, height: 16 },
    })
    const setup = () => {
      const canvas = createCanvasMock()
      return { canvas, processor: new IIGestureAnnotationProcessor(asCanvas(canvas)) }
    }
    const widthOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      (canvas.model.getSymbol(id) as TStroke).style.width
    const weightsOf = (canvas: ReturnType<typeof createCanvasMock>, id: string) =>
      (canvas.model.getSymbol(id) as TText).chars.map((c) => c.fontWeight)

    test.each([
      [1, 2],
      [2, 4],
      [4, 8],
      [3, 4],
    ])("moves a stroke of width %p to the next thickness, %p", async (width, expected) => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width } })
      canvas.model.addSymbol(stroke)

      await processor.apply([stroke.id], levels)

      expect(widthOf(canvas, stroke.id)).toBe(expected)
    })

    test.each([8, 12])("brings a stroke of width %p, at or past the last thickness, back to the first", async (width) => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width } })
      canvas.model.addSymbol(stroke)

      await processor.apply([stroke.id], levels)

      expect(widthOf(canvas, stroke.id)).toBe(1)
    })

    test("steps a converted text through the font weights, back to the first past the last", async () => {
      const { canvas, processor } = setup()
      const text = buildIIText({ chars: [char("normal")] })
      canvas.model.addSymbol(text)

      await processor.apply([text.id], levels)
      expect(weightsOf(canvas, text.id)).toEqual(["bold"])

      await processor.apply([text.id], levels)
      expect(weightsOf(canvas, text.id)).toEqual(["normal"])
    })

    test("steps a math block through the font weights, back to the first past the last", async () => {
      const { canvas, processor } = setup()
      const math = buildIIMath("x")
      canvas.model.addSymbol(math)
      const weights = () => (canvas.model.getSymbol(math.id) as TMath).elements.map((e) => e.fontWeight)

      await processor.apply([math.id], levels)
      expect(weights()).toEqual(["bold"])

      await processor.apply([math.id], levels)
      expect(weights()).toEqual(["normal"])
    })

    test("moves each target from its own level, in one updateSymbols call", async () => {
      const { canvas, processor } = setup()
      const thin = buildIIStroke({ style: { ...DefaultStyle, width: 2 } })
      const thick = buildIIStroke({ style: { ...DefaultStyle, width: 8 } })
      const text = buildIIText({ chars: [char("bold"), char("normal")] })
      canvas.model.addSymbol(thin)
      canvas.model.addSymbol(thick)
      canvas.model.addSymbol(text)

      await processor.apply([thin.id, thick.id, text.id], levels)

      expect(widthOf(canvas, thin.id)).toBe(4)
      expect(widthOf(canvas, thick.id)).toBe(1)
      expect(weightsOf(canvas, text.id)).toEqual(["bold", "bold"])
      expect(canvas.updateSymbols).toHaveBeenCalledTimes(1)
    })

    test("leaves a kind with no level as it is", async () => {
      const { canvas, processor } = setup()
      const stroke = buildIIStroke({ style: { ...DefaultStyle, width: 2 } })
      const text = buildIIText({ chars: [char("normal")] })
      canvas.model.addSymbol(stroke)
      canvas.model.addSymbol(text)

      await processor.apply([stroke.id, text.id], { kind: "thicken", widths: [], fontWeights: ["normal", "bold"] })

      expect(widthOf(canvas, stroke.id)).toBe(2)
      expect(weightsOf(canvas, text.id)).toEqual(["bold"])
      expect(canvas.updateSymbols).toHaveBeenCalledWith([text.id], expect.any(Function))
    })
  })
})
