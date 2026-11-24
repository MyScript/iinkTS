import { buildIIStroke } from "../../helpers"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIJiixQueryManager } from "@/iink"

describe("IIJiixQueryManager.ts", () => {
  describe("getBlocksForSymbols", () => {
    test("should return empty array when no exports", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      expect(jiix.getBlocksForSymbols([stroke])).toEqual([])
    })

    test("should return empty array when no symbol matches any block", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": "other-id" }] },
          ],
        },
      })
      jiix.invalidateIndex()
      expect(jiix.getBlocksForSymbols([stroke])).toEqual([])
    })

    test("should return block when all its strokes are in symbols", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] },
          ],
        },
      })
      jiix.invalidateIndex()
      const result = jiix.getBlocksForSymbols([stroke])
      expect(result.map((el) => el.id)).toEqual(["block-1"])
    })

    test("should not return block when only some strokes are in symbols", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            {
              id: "block-1",
              type: "Math" as never,
              items: [
                { type: "stroke", id: "s1", "full-id": stroke1.id },
                { type: "stroke", id: "s2", "full-id": stroke2.id },
              ],
            },
          ],
        },
      })
      jiix.invalidateIndex()
      expect(jiix.getBlocksForSymbols([stroke1])).toEqual([])
    })

    test("should return only fully-covered blocks among multiple", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const stroke3 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.addSymbol(stroke3)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-full", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke1.id }] },
            {
              id: "block-partial",
              type: "Math" as never,
              items: [
                { type: "stroke", id: "s2", "full-id": stroke2.id },
                { type: "stroke", id: "s3", "full-id": stroke3.id },
              ],
            },
          ],
        },
      })
      jiix.invalidateIndex()
      const result = jiix.getBlocksForSymbols([stroke1, stroke2])
      expect(result.map((el) => el.id)).toEqual(["block-full"])
    })
  })

  describe("destroy", () => {
    test("should drop the text metadata it accumulated", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      jiix.updateTextMetadata(stroke, {
        type: "Text" as never,
        id: "block-1",
        label: "a",
        words: [{ label: "a", items: [{ type: "stroke", id: "i1", "full-id": stroke.id }] }],
      } as never)
      expect(jiix.getTextMetadata(stroke.id)).toBeDefined()

      jiix.destroy()

      // The map keys strokes of a document this manager no longer belongs to; keeping it alive
      // retains that document for as long as the manager is referenced.
      expect(jiix.getTextMetadata(stroke.id)).toBeUndefined()
    })
  })

  describe("getStrokesGroupedByWord / getStrokesGroupedByChar", () => {
    const setup = () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Text",
          id: "MainBlock",
          version: "3",
          elements: [
            {
              id: "block-1",
              type: "Text" as never,
              label: "hi",
              words: [{ label: "hi", items: [{ type: "stroke", id: "i1", "full-id": stroke.id }] }],
              chars: [
                { label: "h", word: 0, grid: [], items: [{ type: "stroke", id: "i1", "full-id": stroke.id }] },
                { label: "i", word: 0, grid: [], items: [{ type: "stroke", id: "i1", "full-id": stroke.id }] },
              ],
            },
          ],
        },
      })
      jiix.invalidateIndex()
      return { canvas, jiix, stroke }
    }

    test("should group a text element's strokes by word", () => {
      const { jiix, stroke } = setup()
      expect(jiix.getStrokesGroupedByWord("block-1")).toEqual([{ label: "hi", strokeIds: [stroke.id] }])
    })

    test("should group a text element's strokes by char", () => {
      const { jiix, stroke } = setup()
      expect(jiix.getStrokesGroupedByChar("block-1")).toEqual([
        { label: "h", strokeIds: [stroke.id], wordIndex: 0 },
        { label: "i", strokeIds: [stroke.id], wordIndex: 0 },
      ])
    })

    test("should keep resolving the element after model.exports is transiently cleared", () => {
      const { canvas, jiix, stroke } = setup()
      expect(jiix.getStrokesGroupedByWord("block-1")).toHaveLength(1)

      // updateSymbol clears model.exports and bumps the version. ensureIndexValid deliberately
      // keeps the existing index for exactly this case ("Exports cleared transiently"), so the
      // element must still resolve — through the index, not by re-scanning the exports.
      // Committed records are frozen, so the update has to go through a draft.
      const draft = canvas.model.draftSymbol(stroke.id)
      expect(draft).toBeDefined()
      canvas.model.updateSymbol(draft!)

      expect(jiix.getStrokesGroupedByWord("block-1")).toEqual([{ label: "hi", strokeIds: [stroke.id] }])
      expect(jiix.getStrokesGroupedByChar("block-1")).toHaveLength(2)
    })
  })

  describe("getStrokeIdsForBlock", () => {
    test("returns the stroke ids belonging to the given block", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            {
              id: "block-1",
              type: "Math" as never,
              items: [
                { type: "stroke", id: "s1", "full-id": stroke1.id },
                { type: "stroke", id: "s2", "full-id": stroke2.id },
              ],
            },
          ],
        },
      })
      jiix.invalidateIndex()
      expect(jiix.getStrokeIdsForBlock("block-1")).toEqual([stroke1.id, stroke2.id])
    })

    test("returns an empty array for an unknown block id", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      expect(jiix.getStrokeIdsForBlock("unknown-block")).toEqual([])
    })
  })

  describe("getBlocksForSymbols with selected symbols", () => {
    test("should return blocks for selected symbols", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            {
              id: "block-selected",
              type: "Math" as never,
              items: [{ type: "stroke", id: "s1", "full-id": stroke.id }],
            },
          ],
        },
      })
      jiix.invalidateIndex()
      expect(jiix.getBlocksForSymbols(canvas.model.symbolsSelected).map((el) => el.id)).toEqual(["block-selected"])
    })

    test("should return empty when no symbols selected", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] },
          ],
        },
      })
      jiix.invalidateIndex()
      expect(jiix.getBlocksForSymbols(canvas.model.symbolsSelected)).toEqual([])
    })
  })

  describe("getLineCenterYForStroke", () => {
    test("should return the containing line's bounding-box center-y converted to pixels, not the baseline", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Text",
          id: "MainBlock",
          version: "3",
          elements: [
            {
              id: "block-1",
              type: "Text" as never,
              label: "hello",
              words: [
                {
                  label: "hello",
                  "first-char": 0,
                  "last-char": 4,
                  items: [{ type: "stroke", id: "s1", "full-id": stroke.id }],
                },
              ],
              chars: [
                { label: "h", word: 0, grid: [], items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] },
              ],
              lines: [
                {
                  "first-char": 0,
                  "last-char": 4,
                  // Deliberately far from the bounding-box center to prove the center, not the
                  // baseline, drives the result (baseline sits low in a line, center doesn't).
                  "baseline-y": 40,
                  "x-height": 5,
                  "bounding-box": { x: 0, y: 20.4, width: 30, height: 10 },
                },
              ],
            },
          ],
        },
      })
      jiix.invalidateIndex()

      expect(jiix.getLineCenterYForStroke(stroke.id)).toBeCloseTo(96, 2)
    })

    test("should return null when the stroke isn't part of any recognized word", () => {
      const canvas = createCanvasMock()
      const jiix = new IIJiixQueryManager(asCanvas(canvas))
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      expect(jiix.getLineCenterYForStroke(stroke.id)).toBeNull()
    })
  })
})
