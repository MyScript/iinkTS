import { createCanvasMock, asEditor } from "../../../__mocks__/createCanvasMock"
import { IIMathComputationSubManager } from "@/manager/interactive/math/IIMathComputationSubManager"
import { JIIXElementType, JIIXMathExpressionType } from "@/model"
import type { TJIIXMathElement, TJIIXMathNumber } from "@/model"
import { MatrixTransform } from "@/transform"

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

describe("IIMathComputationSubManager.ts", () => {
  describe("computeNumericalResult", () => {
    test("draw result is frozen: a later recompute must not query the client nor touch the model", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))

      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "draw")

      expect(editor.client.getNumericalComputation).toHaveBeenCalledTimes(1)
      expect(editor.addSymbols).toHaveBeenCalledTimes(1)

      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 7))

      const { wasRecomputed } = await manager.computeNumericalResult("block-1", "draw")

      expect(wasRecomputed).toBe(false)
      expect(editor.client.getNumericalComputation).not.toHaveBeenCalled()
      expect(editor.addSymbols).toHaveBeenCalledTimes(1)
    })

    test("draw result is frozen: ghost mode must not kick in either once a draw exists for the block", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))

      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "draw")

      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 7))
      await manager.computeNumericalResult("block-1", "ghost")

      expect(editor.client.getNumericalComputation).not.toHaveBeenCalled()
      expect(manager.hasGhostStrokes("block-1")).toBe(false)
    })

    test("no draw yet: recompute proceeds normally when the result changes", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))

      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      const { wasRecomputed } = await manager.computeNumericalResult("block-1", "draw")

      expect(wasRecomputed).toBe(true)
      expect(editor.client.getNumericalComputation).toHaveBeenCalledTimes(1)
      expect(editor.addSymbols).toHaveBeenCalledTimes(1)
    })
  })

  describe("getGhostBounds / applyTransformToGhostStrokes", () => {
    test("getGhostBounds returns undefined when the block has no ghost", () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))

      expect(manager.getGhostBounds("block-1")).toBeUndefined()
    })

    test("getGhostBounds returns the merged bounds of the block's ghost strokes", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))
      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      await manager.computeNumericalResult("block-1", "ghost")

      const bounds = manager.getGhostBounds("block-1")
      expect(bounds).toBeDefined()
      expect(bounds!.width).toBeGreaterThan(0)
    })

    test("applyTransformToGhostStrokes moves and redraws the block's ghost strokes", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))
      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "ghost")
      const before = manager.getGhostBounds("block-1")!
      editor.renderer.drawSymbol = jest.fn()

      const matrix = MatrixTransform.identity().translate(100, 200)
      manager.applyTransformToGhostStrokes("block-1", matrix)

      const after = manager.getGhostBounds("block-1")!
      expect(after.x).toBeCloseTo(before.x + 100)
      expect(after.y).toBeCloseTo(before.y + 200)
      expect(editor.renderer.drawSymbol).toHaveBeenCalled()
    })

    test("applyTransformToGhostStrokes is a no-op when the block has no ghost", () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))
      editor.renderer.drawSymbol = jest.fn()

      manager.applyTransformToGhostStrokes("block-1", MatrixTransform.identity().translate(10, 10))

      expect(editor.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("getGhostStrokeIds returns the element ids of the block's ghost strokes", async () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))
      editor.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "ghost")

      expect(manager.getGhostStrokeIds("block-1")).toEqual(
        expect.arrayContaining([expect.stringMatching(/^ghost-stroke-/)])
      )
    })

    test("getGhostStrokeIds returns an empty array when the block has no ghost", () => {
      const editor = createCanvasMock()
      const manager = new IIMathComputationSubManager(asEditor(editor))

      expect(manager.getGhostStrokeIds("block-1")).toEqual([])
    })
  })
})
