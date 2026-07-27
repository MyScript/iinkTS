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
