import { buildIIStroke } from "../../helpers"
import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import {
  IISynchronizerManager,
  JIIXElementType,
  TJIIXElement,
  TJIIXExport,
  TJIIXMathElement,
  TJIIXTextElement,
  TStroke,
} from "@/iink"

function buildMathElement(id: string): TJIIXMathElement {
  return { type: JIIXElementType.Math, id }
}

function buildTextElement(id: string, strokeId: string): TJIIXTextElement {
  return {
    type: JIIXElementType.Text,
    id,
    label: "a",
    words: [
      {
        label: "a",
        items: [{ type: "stroke", id: `item-${id}`, "full-id": strokeId }],
      },
    ],
  }
}

function buildJiixExport(elements: TJIIXElement[]): TJIIXExport {
  return {
    type: "Text",
    id: "root",
    version: "3",
    elements,
  }
}

describe("IISynchronizerManager.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const manager = new IISynchronizerManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("synchronize()", () => {
    function setup(strokeCount: number) {
      const editor = createCanvasMock()
      const strokes: TStroke[] = []
      for (let i = 0; i < strokeCount; i++) {
        const stroke = buildIIStroke()
        editor.model.addSymbol(stroke)
        strokes.push(stroke)
      }
      const elements = strokes.map((stroke, i) => buildTextElement(`block-${i}`, stroke.id))
      const jiixExport = buildJiixExport(elements)
      editor.export = jest.fn().mockImplementation(async () => {
        editor.model.exports = { "application/vnd.myscript.jiix": jiixExport }
      })

      const rafSpy = jest.fn().mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(0), 0)
        return 0
      })
      const originalRaf = globalThis.requestAnimationFrame
      globalThis.requestAnimationFrame = rafSpy

      const manager = new IISynchronizerManager(asEditor(editor))
      return { editor, manager, strokes, rafSpy, restoreRaf: () => (globalThis.requestAnimationFrame = originalRaf) }
    }

    test("should assign jiixBlockId/jiixBlockType to every stroke referenced by the export", async () => {
      const { manager, strokes, restoreRaf } = setup(5)
      await manager.synchronize()
      strokes.forEach((stroke, i) => {
        expect(stroke.jiixBlockId).toBe(`block-${i}`)
        expect(stroke.jiixBlockType).toBe("Text")
      })
      restoreRaf()
    })

    test("should yield to the event loop periodically instead of processing every element in one blocking pass", async () => {
      const chunkSize = IISynchronizerManager.SYNC_YIELD_CHUNK_SIZE
      const { manager, strokes, rafSpy, restoreRaf } = setup(chunkSize * 2 + 1)
      await manager.synchronize()

      // One yield after each full chunk (here: 2 chunks completed mid-loop).
      expect(rafSpy).toHaveBeenCalledTimes(2)
      // Yielding must not skip or duplicate work.
      strokes.forEach((stroke, i) => {
        expect(stroke.jiixBlockId).toBe(`block-${i}`)
      })
      restoreRaf()
    })

    test("should not yield at all when there are fewer elements than one chunk", async () => {
      const { manager, rafSpy, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(rafSpy).not.toHaveBeenCalled()
      restoreRaf()
    })

    test("should wait for an in-progress stroke to finish before processing synchronized data", async () => {
      const { editor, manager, strokes, restoreRaf } = setup(3)
      editor.writer.currentSymbol = buildIIStroke()

      const syncPromise = manager.synchronize()
      await new Promise((resolve) => setTimeout(resolve, 20))
      strokes.forEach((stroke) => expect(stroke.jiixBlockId).toBeUndefined())

      editor.writer.currentSymbol = undefined
      await syncPromise

      strokes.forEach((stroke, i) => expect(stroke.jiixBlockId).toBe(`block-${i}`))
      restoreRaf()
    })

    test("should skip reprocessing a block whose content is unchanged since the last sync", async () => {
      const { editor, manager, strokes, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(editor.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)

      const [firstModificationDate] = strokes.map((s) => s.modificationDate)

      await manager.synchronize()
      // Same export content again - nothing changed, nothing should be reprocessed.
      expect(editor.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)
      expect(strokes[0].modificationDate).toBe(firstModificationDate)
      restoreRaf()
    })

    test("should reprocess a block whose content actually changed since the last sync", async () => {
      const { editor, manager, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(editor.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)

      const changedExport = editor.model.exports!["application/vnd.myscript.jiix"] as TJIIXExport
      const changedElement = changedExport.elements![0] as TJIIXTextElement
      changedElement.label = "b"
      changedElement.words = [{ label: "b", items: changedElement.words![0].items }]
      editor.export = jest.fn().mockImplementation(async () => {
        editor.model.exports = { "application/vnd.myscript.jiix": changedExport }
      })

      await manager.synchronize()
      expect(editor.jiix.updateTextMetadata).toHaveBeenCalledTimes(4)
      restoreRaf()
    })
  })

  describe("math dependency enrichment", () => {
    function setupMath(mathBlockIds: string[]) {
      const editor = createCanvasMock()
      const jiixExport = buildJiixExport(mathBlockIds.map(buildMathElement))
      editor.export = jest.fn().mockImplementation(async () => {
        editor.model.exports = { "application/vnd.myscript.jiix": jiixExport }
      })
      const manager = new IISynchronizerManager(asEditor(editor))
      return { editor, manager }
    }

    test("should call enrichMathDependencies for every math block with a staleness callback", async () => {
      const { editor, manager } = setupMath(["math-0", "math-1"])

      await manager.synchronize()

      expect(editor.math.enrichMathDependencies).toHaveBeenCalledWith("math-0", expect.any(Function))
      expect(editor.math.enrichMathDependencies).toHaveBeenCalledWith("math-1", expect.any(Function))
    })

    test("should report stale once a new synchronize() is queued mid-enrichment, then resolve fresh on the redo pass", async () => {
      const { editor, manager } = setupMath(["math-0"])
      let triggeredRedo = false
      const isStaleResultsPerPass: boolean[] = []

      editor.math.enrichMathDependencies = jest.fn().mockImplementation(async (_blockId: string, isStale: () => boolean) => {
        if (!triggeredRedo) {
          triggeredRedo = true
          expect(isStale()).toBe(false)
          // A stroke came in mid-enrichment: queue a fresh pass (not awaited - it can
          // only complete once this one, and its redo, are done).
          void manager.synchronize()
          expect(isStale()).toBe(true)
        }
        isStaleResultsPerPass.push(isStale())
      })

      await manager.synchronize()

      // First pass: superseded before the backend answered - discarded.
      // Redo pass (triggered by #dirtyDuringSync): fresh, nothing pending after it.
      expect(isStaleResultsPerPass).toEqual([true, false])
    })
  })
})
