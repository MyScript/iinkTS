import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMathManager } from "@/manager/interactive/IIMathManager"
import { JIIXElementType, JIIXMathExpressionType } from "@/model"
import type { TJIIXMathElement, TJIIXMathNumber } from "@/model"

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

describe("IIMathManager.ts", () => {
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
})
