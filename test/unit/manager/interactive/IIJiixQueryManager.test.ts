import { buildIIStroke } from "../../helpers"
import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import { IIJiixQueryManager } from "@/iink"

describe("IIJiixQueryManager.ts", () => {
  describe("getBlocksForSymbols", () => {
    test("should return empty array when no exports", () => {
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      expect(jiix.getBlocksForSymbols([stroke])).toEqual([])
    })

    test("should return empty array when no symbol matches any block", () => {
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
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
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
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
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.mergeExport({
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
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      const stroke3 = buildIIStroke()
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.addSymbol(stroke3)
      editor.model.mergeExport({
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
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.selectSymbol(stroke.id)
      editor.model.mergeExport({
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
      expect(jiix.getBlocksForSymbols(editor.model.symbolsSelected).map((el) => el.id)).toEqual(["block-selected"])
    })

    test("should return empty when no symbols selected", () => {
      const editor = createCanvasMock()
      const jiix = new IIJiixQueryManager(asEditor(editor))
      const stroke = buildIIStroke()
      editor.model.addSymbol(stroke)
      editor.model.mergeExport({
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
      expect(jiix.getBlocksForSymbols(editor.model.symbolsSelected)).toEqual([])
    })
  })
})
