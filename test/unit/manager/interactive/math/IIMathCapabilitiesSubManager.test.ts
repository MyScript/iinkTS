import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import {
  IIMathCapabilitiesSubManager,
  IIMathVariableSubManager,
  IIMathComputationSubManager,
  IIMathFunctionEvaluationSubManager
} from "@/iink"

describe("IIMathCapabilitiesSubManager.ts", () => {
  function buildManager() {
    const canvas = createCanvasMock()
    const realCanvas = asCanvas(canvas)
    const variables = new IIMathVariableSubManager(realCanvas)
    const computation = new IIMathComputationSubManager(realCanvas)
    const evaluation = new IIMathFunctionEvaluationSubManager(realCanvas)
    const manager = new IIMathCapabilitiesSubManager(realCanvas, variables, computation, evaluation)
    return { canvas, manager, variables, computation, evaluation }
  }

  describe("getBlockCapabilities", () => {
    test("aggregates canEditVariables/canCompute/canEvaluate/hasDrawSolverOutputs from the block's actions/variables/evaluables", async () => {
      const { canvas, manager } = buildManager()
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

    test("caches the result: a second call for the same block does not re-fetch", async () => {
      const { canvas, manager } = buildManager()
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue(["numerical-computation"])
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "x", value: 1 }])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([{ inputName: "x", outputName: "f" }])

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-1")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(1)
    })
  })

  describe("invalidateCache", () => {
    test("clears the cache for one block only, leaving other blocks cached", async () => {
      const { canvas, manager } = buildManager()
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-2")
      manager.invalidateCache("block-1")

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-2")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(3)
    })

    test("clears the whole cache when called with an empty block id", async () => {
      const { canvas, manager } = buildManager()
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])
      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      canvas.client.getEvaluables = jest.fn().mockResolvedValue([])

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-2")
      manager.invalidateCache("")

      await manager.getBlockCapabilities("block-1")
      await manager.getBlockCapabilities("block-2")

      expect(canvas.client.getAvailableActions).toHaveBeenCalledTimes(4)
    })
  })
})
