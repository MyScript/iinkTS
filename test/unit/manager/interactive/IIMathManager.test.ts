import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMathManager, IIModel, JIIXElementType, JIIXMathExpressionType, StrokeUtil } from "@/iink"
import type { TJIIXMathElement, TJIIXMathNumber } from "@/iink"

type TSolverOutputExpression = TJIIXMathNumber & { "solver-output": true }

function buildSolverOutputResult(blockId: string, value: number): TJIIXMathElement {
  const expression: TSolverOutputExpression = {
    id: `${blockId}-solver`,
    type: JIIXMathExpressionType.Number,
    label: String(value),
    value,
    "solver-output": true,
    items: [{ type: "stroke", id: "solver-stroke-src", X: [0, 1, 2], Y: [0, 1, 2] }],
  }
  return {
    id: blockId,
    type: JIIXElementType.Math,
    expressions: [expression],
  }
}

// JIIX the server sends for "3 + 2" written as a vertical operation: the result row is
// empty, so the last operand is null and the label ends with \end{array}, not "=" or "?"
const VERTICAL_OPERATION_JIIX = `{
  "type": "Raw Content",
  "elements": [{
    "id": "raw-content/33",
    "type": "Math",
    "label": "\\\\begin{array}{cc}\\n& 3 \\\\\\\\\\n+ & 2 \\\\\\\\\\n\\\\hline\\n& ? \\\\\\\\\\n\\\\end{array}",
    "expressions": [{
      "type": "vertical operation",
      "id": "raw-content/56",
      "operands": [{
        "type": "+",
        "id": "raw-content/55",
        "operands": [
          { "type": "number", "id": "raw-content/19", "label": "3", "value": 3 },
          { "type": "number", "id": "raw-content/46", "label": "2", "value": 2 }
        ]
      }, null]
    }]
  }],
  "id": "MainBlock",
  "version": "3"
}`

function createAutoComputeCanvas(actions: string[]) {
  const model = new IIModel()
  model.mergeExport({ "application/vnd.myscript.jiix": JSON.parse(VERTICAL_OPERATION_JIIX) })
  const canvas = createCanvasMock({ model })
  canvas.client.getAvailableActions = jest.fn().mockResolvedValue(actions)
  canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("raw-content/33", 5))
  return canvas
}

describe("IIMathManager.ts", () => {
  describe("tryAutoCompute", () => {
    test("computes a vertical operation the server can compute, though its label ends with neither = nor ?", async () => {
      const canvas = createAutoComputeCanvas(["numerical-computation"])
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.tryAutoCompute()

      expect(canvas.client.getNumericalComputation).toHaveBeenCalledWith("raw-content/33")
    })

    // A ghost is never recorded in the history: redo cannot bring it back, only a new compute can
    test.each([
      { resultMode: "draw", canRedo: false, computes: true },
      { resultMode: "draw", canRedo: true, computes: false },
      { resultMode: "ghost", canRedo: false, computes: true },
      { resultMode: "ghost", canRedo: true, computes: true },
    ] as const)("on sync in $resultMode mode with canRedo=$canRedo, computes: $computes", async ({ resultMode, canRedo, computes }) => {
      const canvas = createAutoComputeCanvas(["numerical-computation"])
      canvas.history.context = { canRedo } as typeof canvas.history.context
      new IIMathManager(asCanvas(canvas), { computation: { autoCompute: true, resultMode } })

      canvas.event.emitSynchronized()
      await new Promise((resolve) => setTimeout(resolve))

      expect((canvas.client.getNumericalComputation as jest.Mock).mock.calls.length > 0).toBe(computes)
    })

    test("leaves a block alone when the server does not offer numerical computation", async () => {
      const canvas = createAutoComputeCanvas([])
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.tryAutoCompute()

      expect(canvas.client.getNumericalComputation).not.toHaveBeenCalled()
    })
  })

  describe("getBlockCapabilities", () => {
    test("aggregates capabilities from the client for the given block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue(["numerical-computation"])
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "x", value: 1 }])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([{ inputName: "x", outputName: "f" }])

      const capabilities = await manager.getBlockCapabilities("block-1")

      expect(capabilities).toEqual({
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true,
        hasDrawSolverOutputs: false,
      })
    })

    test("caches the result across calls", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(1)
    })
  })

  describe("capabilities cache invalidation", () => {
    test("computeNumericalResult invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      await manager.getBlockCapabilities("block-1")
      await manager.computeNumericalResult("block-1", "draw")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })

    test("setVariableValue invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.setVariableValue("block-1", "x", 2)
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })

    test("enrichMathDependencies invalidates the capabilities cache for that block", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathManager(asCanvas(canvas))
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.enrichMathDependencies("block-1")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(2)
    })
  })

  describe("variable values in history", () => {
    const blockStroke = (id: string, jiixBlockId: string, isSolverOutput = false) =>
      StrokeUtil.createFromPartial({ id, jiixBlockId, isSolverOutput, pointers: [{ x: 0, y: 0, dt: 0, p: 1 }] })

    function createVariableCanvas() {
      const model = new IIModel()
      const written = blockStroke("written", "block-1")
      const result = blockStroke("result", "block-1", true)
      model.addSymbol(written)
      model.addSymbol(result)
      const canvas = createCanvasMock({ model })
      canvas.removeSymbols = jest.fn().mockResolvedValue([result])
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "x", value: 2 }])
      canvas.client.asVariableDefinition = jest.fn().mockResolvedValue(null)
      canvas.client.setVariableValue = jest.fn().mockResolvedValue(undefined)
      canvas.client.removeVariableValue = jest.fn().mockResolvedValue(undefined)
      return { canvas, model, written, result }
    }

    test("setting a value records it, with the result it clears, as one history step", async () => {
      const { canvas, result } = createVariableCanvas()
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.setVariableValue("block-1", "x", 4)

      expect(canvas.history.push).toHaveBeenCalledWith({
        variables: [{ strokeIds: ["written"], name: "x", before: 2, after: 4 }],
        erased: [result],
      })
    })

    test("removing a value records it as a history step", async () => {
      const { canvas } = createVariableCanvas()
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.removeVariable("block-1", "x")

      expect(canvas.history.push).toHaveBeenCalledWith({
        variables: [{ strokeIds: ["written"], name: "x", before: 2, after: undefined }],
      })
    })

    test("replay after sync sends the value to the block the strokes belong to now", async () => {
      const { canvas, model } = createVariableCanvas()
      const manager = new IIMathManager(asCanvas(canvas))

      manager.replayVariableChanges([{ strokeIds: ["written"], name: "x", before: undefined, after: 4 }], true)
      expect(canvas.client.setVariableValue).not.toHaveBeenCalled()
      const draft = model.draftSymbol("written")!
      Object.assign(draft, { jiixBlockId: "block-renamed" })
      model.commitSymbol(draft)
      canvas.event.emitSynchronized()
      await new Promise((resolve) => setTimeout(resolve))

      expect(canvas.client.setVariableValue).toHaveBeenCalledWith("block-renamed", "x", 4)
    })

    test("replaying back to no value removes the variable", async () => {
      const { canvas } = createVariableCanvas()
      const manager = new IIMathManager(asCanvas(canvas))

      await manager.replayVariableChanges([{ strokeIds: ["written"], name: "x", before: 4, after: undefined }], false)

      expect(canvas.client.removeVariableValue).toHaveBeenCalledWith("block-1", "x")
    })
  })
})
