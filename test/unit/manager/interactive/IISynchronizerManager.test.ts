import { buildIIStroke } from "../../helpers"
import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IISynchronizerManager, JIIXEdgeKind, JIIXElementType, TJIIXEdgeElement, TJIIXElement, TJIIXExport, TJIIXMathElement, TJIIXNodeElement, TJIIXTextElement, TStroke } from "@/iink"

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

function buildEdgeElement(id: string, strokeId: string, connected?: string[], ports?: number[]): TJIIXEdgeElement {
  return {
    type: JIIXElementType.Edge,
    id,
    kind: JIIXEdgeKind.Line,
    x1: 0,
    y1: 0,
    x2: 10,
    y2: 0,
    connected,
    ports,
    items: [{ type: "stroke", id: `item-${id}`, "full-id": strokeId }],
  } as unknown as TJIIXEdgeElement
}

function buildNodeElement(id: string, strokeId: string): TJIIXNodeElement {
  return {
    type: JIIXElementType.Node,
    id,
    kind: "rectangle",
    x: 100,
    y: -10,
    width: 20,
    height: 20,
    items: [{ type: "stroke", id: `item-${id}`, "full-id": strokeId }],
  } as unknown as TJIIXNodeElement
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
    const canvas = createCanvasMock()
    const manager = new IISynchronizerManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("synchronize()", () => {
    function setup(strokeCount: number) {
      const canvas = createCanvasMock()
      const strokes: TStroke[] = []
      for (let i = 0; i < strokeCount; i++) {
        const stroke = buildIIStroke()
        canvas.model.addSymbol(stroke)
        strokes.push(stroke)
      }
      const elements = strokes.map((stroke, i) => buildTextElement(`block-${i}`, stroke.id))
      const jiixExport = buildJiixExport(elements)
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixExport })
      })

      const rafSpy = jest.fn().mockImplementation((cb: FrameRequestCallback) => {
        setTimeout(() => cb(0), 0)
        return 0
      })
      const originalRaf = globalThis.requestAnimationFrame
      globalThis.requestAnimationFrame = rafSpy

      const manager = new IISynchronizerManager(asCanvas(canvas))
      return { canvas, manager, strokes, rafSpy, restoreRaf: () => (globalThis.requestAnimationFrame = originalRaf) }
    }

    test("should assign jiixBlockId/jiixBlockType to every stroke referenced by the export", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(5)
      await manager.synchronize()
      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
        expect(newStroke.jiixBlockType).toBe("Text")
      })
      restoreRaf()
    })

    test("should yield to the event loop once its time budget is spent, instead of one blocking pass", async () => {
      const budget = IISynchronizerManager.SYNC_YIELD_BUDGET_MS
      const { canvas, manager, strokes, rafSpy, restoreRaf } = setup(5)
      let now = 0
      const clock = jest.spyOn(performance, "now").mockImplementation(() => now)
      // Each element costs a little over half the budget: the budget runs out every second element
      jest.mocked(canvas.jiix.updateTextMetadata).mockImplementation(() => {
        now += budget / 2 + 1
      })

      await manager.synchronize()

      // Out after elements 2 and 4; element 5 alone fits
      expect(rafSpy).toHaveBeenCalledTimes(2)
      // Yielding must not skip or duplicate work.
      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
      })
      clock.mockRestore()
      restoreRaf()
    })

    test("should not yield on a large document whose pass fits in the budget", async () => {
      const { manager, rafSpy, restoreRaf } = setup(200)
      await manager.synchronize()
      rafSpy.mockClear()
      const clock = jest.spyOn(performance, "now").mockReturnValue(0)

      await manager.synchronize()

      // Yielding every N elements cost one frame per N even when there was nothing to do
      expect(rafSpy).not.toHaveBeenCalled()
      clock.mockRestore()
      restoreRaf()
    })

    test("should not yield at all when there are fewer elements than one chunk", async () => {
      const { manager, rafSpy, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(rafSpy).not.toHaveBeenCalled()
      restoreRaf()
    })

    test("should wait for an in-progress stroke to finish before processing synchronized data", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      canvas.startOperation("Writing")

      const syncPromise = manager.synchronize()
      await new Promise((resolve) => setTimeout(resolve, 20))
      strokes.forEach((stroke) => expect(stroke.jiixBlockId).toBeUndefined())

      canvas.endOperation("Writing")
      await syncPromise

      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
      })
      restoreRaf()
    })

    test("should wait for an in-progress transform gesture (e.g. translating) to finish too", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      canvas.startOperation("Translating")

      const syncPromise = manager.synchronize()
      await new Promise((resolve) => setTimeout(resolve, 20))
      strokes.forEach((stroke) => expect(stroke.jiixBlockId).toBeUndefined())

      canvas.endOperation("Translating")
      await syncPromise

      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
      })
      restoreRaf()
    })

    test("should re-check gesture-idle right after export() resolves, before processing JIIX elements (closes a race where a stroke starts mid round-trip)", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      const originalExport = canvas.export
      canvas.export = jest.fn().mockImplementation(async (...args: unknown[]) => {
        // Simulate a new stroke starting while export()'s own network round-trip was in flight.
        canvas.startOperation("Writing")
        return (originalExport as (...a: unknown[]) => Promise<unknown>)(...args)
      })

      const syncPromise = manager.synchronize()
      await new Promise((resolve) => setTimeout(resolve, 20))
      strokes.forEach((stroke) => expect(stroke.jiixBlockId).toBeUndefined())

      canvas.endOperation("Writing")
      await syncPromise

      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
      })
      restoreRaf()
    })

    test("should skip reprocessing a block whose content is unchanged since the last sync", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)

      const [firstModificationDate] = strokes.map((s) => s.modificationDate)

      await manager.synchronize()
      // Same export content again - nothing changed, nothing should be reprocessed.
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)
      expect(strokes[0].modificationDate).toBe(firstModificationDate)
      restoreRaf()
    })

    test("should not copy a single stroke on a sync where nothing changed", async () => {
      const { canvas, manager, restoreRaf } = setup(3)
      await manager.synchronize()
      const draftSymbol = jest.spyOn(canvas.model, "draftSymbol")

      await manager.synchronize()

      // A draft is a structuredClone: on a large, already-synced document, drafting every stroke
      // just to read its jiixBlockId cost a full copy of the document on every sync
      expect(draftSymbol).not.toHaveBeenCalled()
      restoreRaf()
    })

    test("should reprocess a block whose stroke lost its jiixBlockId even though content is unchanged (e.g. a history snapshot restored by undo() after clear())", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)

      // Simulate undo() swapping in strokes cloned from a history snapshot taken before
      // this block's jiixBlockId was ever assigned - same export content as before.
      const staleStroke = canvas.model.draftSymbol(strokes[0].id) as TStroke
      staleStroke.jiixBlockId = undefined
      staleStroke.jiixBlockType = undefined
      canvas.model.updateSymbol(staleStroke)

      await manager.synchronize()

      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(4)
      strokes.forEach((stroke, i) => {
        const newStroke = canvas.model.getSymbol(stroke.id) as TStroke
        expect(newStroke.jiixBlockId).toBe(`block-${i}`)
      })
      restoreRaf()
    })

    test("should not record an element as synced when its text-metadata write threw", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(1)

      // A first successful sync persists jiixBlockId, so the `needsMetadata` escape hatch is
      // closed from here on: only the snapshot bookkeeping decides whether this element is
      // reprocessed. That is what makes this shape of failure permanent rather than transient.
      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(1)

      // The content changes, so the snapshot gate opens on the next sync.
      const changed = buildTextElement("block-0", strokes[0].id)
      changed.label = "b"
      changed.words = [{ label: "b", items: changed.words![0].items }]
      const changedExport = buildJiixExport([changed])
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": changedExport })
      })

      // ...and the text-metadata write for that new content fails.
      ;(canvas.jiix.updateTextMetadata as jest.Mock).mockImplementationOnce(() => {
        throw new Error("text metadata write failed")
      })

      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(2)

      // Same content again: the lost write must be retried, not silently treated as done for
      // the rest of the session.
      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)
      restoreRaf()
    })

    test("should keep synchronizing the remaining elements after one of them threw", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      ;(canvas.jiix.updateTextMetadata as jest.Mock).mockImplementationOnce(() => {
        throw new Error("metadata write failed")
      })

      await manager.synchronize()

      expect((canvas.model.getSymbol(strokes[1].id) as TStroke).jiixBlockId).toBe("block-1")
      expect((canvas.model.getSymbol(strokes[2].id) as TStroke).jiixBlockId).toBe("block-2")
      restoreRaf()
    })

    test("should reprocess a block whose content actually changed since the last sync", async () => {
      const { canvas, manager, strokes, restoreRaf } = setup(3)
      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(3)

      // model.exports is cleared again by the updateSymbol calls the sync above just made
      // (#markDirty invalidates it), so rebuild the export fresh rather than reading it back.
      const changedElement = buildTextElement("block-0", strokes[0].id)
      changedElement.label = "b"
      changedElement.words = [{ label: "b", items: changedElement.words![0].items }]
      const unchangedElements = strokes.slice(1).map((stroke, i) => buildTextElement(`block-${i + 1}`, stroke.id))
      const changedExport = buildJiixExport([changedElement, ...unchangedElements])
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": changedExport })
      })

      await manager.synchronize()
      expect(canvas.jiix.updateTextMetadata).toHaveBeenCalledTimes(4)
      restoreRaf()
    })
  })

  describe("retry", () => {
    test("should retry a failed export and resolve once one succeeds", async () => {
      const canvas = createCanvasMock()
      canvas.export = jest
        .fn()
        .mockRejectedValueOnce(new Error("first"))
        .mockRejectedValueOnce(new Error("second"))
        .mockResolvedValue(undefined)
      const manager = new IISynchronizerManager(asCanvas(canvas))

      await expect(manager.synchronize()).resolves.toBeUndefined()
      expect(canvas.export).toHaveBeenCalledTimes(3)
    })

    test("should give up after MAX_RETRY_ATTEMPTS with the last error", async () => {
      const canvas = createCanvasMock()
      canvas.export = jest
        .fn()
        .mockRejectedValueOnce(new Error("first"))
        .mockRejectedValueOnce(new Error("second"))
        .mockRejectedValueOnce(new Error("last"))
      const manager = new IISynchronizerManager(asCanvas(canvas))

      await expect(manager.synchronize()).rejects.toThrow("last")
      expect(canvas.export).toHaveBeenCalledTimes(IISynchronizerManager.MAX_RETRY_ATTEMPTS)
    })
  })

  describe("math dependency enrichment", () => {
    function setupMath(mathBlockIds: string[]) {
      const canvas = createCanvasMock()
      const jiixExport = buildJiixExport(mathBlockIds.map(buildMathElement))
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixExport })
      })
      const manager = new IISynchronizerManager(asCanvas(canvas))
      return { canvas, manager }
    }

    test("should call enrichMathDependencies for every math block with a staleness callback", async () => {
      const { canvas, manager } = setupMath(["math-0", "math-1"])

      await manager.synchronize()

      expect(canvas.math.enrichMathDependencies).toHaveBeenCalledWith("math-0", expect.any(Function))
      expect(canvas.math.enrichMathDependencies).toHaveBeenCalledWith("math-1", expect.any(Function))
    })

    test("should cancel each enrichment's timeout once the enrichment settles", async () => {
      const { manager } = setupMath(["math-0", "math-1"])
      const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout")
      const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout")

      await manager.synchronize()

      const enrichTimers = setTimeoutSpy.mock.calls
        .map((call, i) => ({ delay: call[1], id: setTimeoutSpy.mock.results[i].value }))
        .filter(({ delay }) => delay === IISynchronizerManager.ENRICH_TIMEOUT_MS)
      // Left running, each one fired 5 s later for an enrichment long since done, on every sync
      expect(enrichTimers).toHaveLength(2)
      enrichTimers.forEach(({ id }) => expect(clearTimeoutSpy).toHaveBeenCalledWith(id))
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    })

    test("should report stale once a new synchronize() is queued mid-enrichment, then resolve fresh on the redo pass", async () => {
      const { canvas, manager } = setupMath(["math-0"])
      let triggeredRedo = false
      const isStaleResultsPerPass: boolean[] = []

      canvas.math.enrichMathDependencies = jest.fn().mockImplementation(async (_blockId: string, isStale: () => boolean) => {
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

  describe("synchronize() — edge connections", () => {
    test("edge element with connected[] → strokes get startAnchor/endAnchor", async () => {
      const canvas = createCanvasMock()
      const edgeStroke = buildIIStroke()
      // Edge's own endpoints are extracted from its JIIX geometry (x1=0,y1=0 → x2=10mm,y2=0 →
      // ~37.8px). Position the node's live bounds near the edge's *end* point so the
      // nearest-endpoint resolution in resolveConnectionAnchors deterministically picks "end".
      const nodeStroke = buildIIStroke({ box: { x: 35, y: -2, width: 6, height: 6 } })
      canvas.model.addSymbol(edgeStroke)
      canvas.model.addSymbol(nodeStroke)

      const nodeEl = buildNodeElement("node-1", nodeStroke.id)
      const edgeEl = buildEdgeElement("edge-1", edgeStroke.id, ["node-1"], [0])
      const jiixExport = buildJiixExport([nodeEl, edgeEl])
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixExport })
      })
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id: string) =>
        id === "node-1" ? [nodeStroke.id] : []
      )

      const manager = new IISynchronizerManager(asCanvas(canvas))
      await manager.synchronize()

      const updatedEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(updatedEdgeStroke.endAnchor?.symbolId).toBe("node-1")
      expect(updatedEdgeStroke.startAnchor).toBeUndefined()
    })

    test("should not rewrite an edge stroke whose anchors did not change", async () => {
      const canvas = createCanvasMock()
      const edgeStroke = buildIIStroke()
      const nodeStroke = buildIIStroke({ box: { x: 35, y: -2, width: 6, height: 6 } })
      canvas.model.addSymbol(edgeStroke)
      canvas.model.addSymbol(nodeStroke)
      const jiixExport = buildJiixExport([
        buildNodeElement("node-1", nodeStroke.id),
        buildEdgeElement("edge-1", edgeStroke.id, ["node-1"], [0]),
      ])
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixExport })
      })
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id: string) =>
        id === "node-1" ? [nodeStroke.id] : []
      )
      const manager = new IISynchronizerManager(asCanvas(canvas))
      await manager.synchronize()
      const draftSymbol = jest.spyOn(canvas.model, "draftSymbol")
      const commitSymbol = jest.spyOn(canvas.model, "commitSymbol")

      await manager.synchronize()

      expect(draftSymbol).not.toHaveBeenCalled()
      expect(commitSymbol).not.toHaveBeenCalled()
      expect((canvas.model.getSymbol(edgeStroke.id) as TStroke).endAnchor?.symbolId).toBe("node-1")
    })

    test("edge element with no connected[] clears any previously-set anchor (live-truth overwrite)", async () => {
      const canvas = createCanvasMock()
      const edgeStroke = buildIIStroke()
      edgeStroke.endAnchor = { symbolId: "stale-block", normalizedX: 0.5, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStroke)

      const edgeEl = buildEdgeElement("edge-1", edgeStroke.id)
      const jiixExport = buildJiixExport([edgeEl])
      canvas.export = jest.fn().mockImplementation(async () => {
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixExport })
      })

      const manager = new IISynchronizerManager(asCanvas(canvas))
      await manager.synchronize()

      const updatedEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(updatedEdgeStroke.startAnchor).toBeUndefined()
      expect(updatedEdgeStroke.endAnchor).toBeUndefined()
    })

    test("connected[] changes between syncs → anchor is not sticky, reflects the latest JIIX truth", async () => {
      const canvas = createCanvasMock()
      const edgeStroke = buildIIStroke()
      // Both node targets sit near the edge's *end* point (see the first test's comment for why),
      // so each sync deterministically resolves to endAnchor - only the targetId should change.
      const nodeAStroke = buildIIStroke({ box: { x: 35, y: -2, width: 6, height: 6 } })
      const nodeBStroke = buildIIStroke({ box: { x: 35, y: -2, width: 6, height: 6 } })
      canvas.model.addSymbol(edgeStroke)
      canvas.model.addSymbol(nodeAStroke)
      canvas.model.addSymbol(nodeBStroke)

      const nodeAEl = buildNodeElement("node-a", nodeAStroke.id)
      const nodeBEl = buildNodeElement("node-b", nodeBStroke.id)
      // Same edge element id and same edge stroke across both syncs - only `connected` differs.
      const edgeElConnectedToA = buildEdgeElement("edge-1", edgeStroke.id, ["node-a"], [0])
      const edgeElConnectedToB = buildEdgeElement("edge-1", edgeStroke.id, ["node-b"], [0])

      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id: string) => {
        if (id === "node-a") return [nodeAStroke.id]
        if (id === "node-b") return [nodeBStroke.id]
        return []
      })

      canvas.export = jest
        .fn()
        .mockImplementationOnce(async () => {
          canvas.model.mergeExport({
            "application/vnd.myscript.jiix": buildJiixExport([nodeAEl, edgeElConnectedToA]),
          })
        })
        .mockImplementationOnce(async () => {
          canvas.model.mergeExport({
            "application/vnd.myscript.jiix": buildJiixExport([nodeBEl, edgeElConnectedToB]),
          })
        })

      const manager = new IISynchronizerManager(asCanvas(canvas))

      await manager.synchronize()
      expect((canvas.model.getSymbol(edgeStroke.id) as TStroke).endAnchor?.symbolId).toBe("node-a")

      // Second sync: same edge element id/content fingerprint (label/words/chars/lines are all
      // absent on Edge elements, and jiixBlockId is already set) - the pre-existing
      // metadata-caching gate would treat this as "unchanged" and skip re-processing, which is
      // exactly why #syncEdgeConnections must run unconditionally, outside that gate.
      await manager.synchronize()
      const updatedEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(updatedEdgeStroke.endAnchor?.symbolId).toBe("node-b")
      expect(updatedEdgeStroke.startAnchor).toBeUndefined()
    })
  })
})
