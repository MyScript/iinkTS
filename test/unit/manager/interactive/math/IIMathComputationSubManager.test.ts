import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import type { TSymbol, TJIIXMathElement, TJIIXMathNumber, TJIIXMathOperator, TJIIXMathPower, TJIIXStrokeItem } from "@/iink"
import {
  IIMathComputationSubManager,
  IIModel,
  JIIXElementType,
  JIIXMathExpressionType,
  MatrixTransform,
  StrokeUtil,
  isStroke,
} from "@/iink"

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

/** Lets `addSymbols` write to the model like the real canvas does, so the model holds the drawn result. */
function writeThroughAddSymbols(canvas: ReturnType<typeof createCanvasMock>): void {
  canvas.addSymbols = jest.fn().mockImplementation((symbols: TSymbol[]) => {
    symbols.forEach((s) => canvas.model.addSymbol(s))
    return Promise.resolve(symbols)
  })
}

describe("IIMathComputationSubManager.ts", () => {
  test("defaults to auto-computed ghost results, so a dependent block follows its variables", () => {
    const manager = new IIMathComputationSubManager(asCanvas(createCanvasMock()))
    expect(manager.getConfig()).toMatchObject({ autoCompute: true, resultMode: "ghost" })
  })

  describe("computeNumericalResult", () => {
    test("draw result is frozen: a later recompute must not query the client nor touch the model", async () => {
      const canvas = createCanvasMock()
      writeThroughAddSymbols(canvas)
      const manager = new IIMathComputationSubManager(asCanvas(canvas))

      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "draw")

      expect(canvas.client.getNumericalComputation).toHaveBeenCalledTimes(1)
      expect(canvas.addSymbols).toHaveBeenCalledTimes(1)

      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 7))

      const { wasRecomputed } = await manager.computeNumericalResult("block-1", "draw")

      expect(wasRecomputed).toBe(false)
      expect(canvas.client.getNumericalComputation).not.toHaveBeenCalled()
      expect(canvas.addSymbols).toHaveBeenCalledTimes(1)
    })

    test("draw result is frozen: ghost mode must not kick in either once a draw exists for the block", async () => {
      const canvas = createCanvasMock()
      writeThroughAddSymbols(canvas)
      const manager = new IIMathComputationSubManager(asCanvas(canvas))

      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "draw")

      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 7))
      await manager.computeNumericalResult("block-1", "ghost")

      expect(canvas.client.getNumericalComputation).not.toHaveBeenCalled()
      expect(manager.hasGhostStrokes("block-1")).toBe(false)
    })

    test("a drawn result undone out of the model is drawn again by the next compute", async () => {
      const canvas = createCanvasMock()
      writeThroughAddSymbols(canvas)
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "draw")
      const solverOutputs = () => canvas.model.symbols.filter((s) => isStroke(s) && s.isSolverOutput)
      solverOutputs().forEach((s) => canvas.model.removeSymbol(s.id))

      const { wasRecomputed } = await manager.computeNumericalResult("block-1", "draw")

      expect(wasRecomputed).toBe(true)
      expect(solverOutputs()).toHaveLength(1)
    })

    test("replacing a drawn result is one history step: old result erased, new result added", async () => {
      const model = new IIModel()
      const oldResult = StrokeUtil.createFromPartial({
        id: "solver-old",
        isSolverOutput: true,
        jiixBlockId: "block-1",
        pointers: [{ x: 0, y: 0, dt: 0, p: 1 }],
      })
      model.addSymbol(oldResult)
      const canvas = createCanvasMock({ model })
      canvas.removeSymbols = jest.fn().mockResolvedValue([oldResult])
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      await manager.computeNumericalResult("block-1", "draw")

      const [added] = (canvas.addSymbols as jest.Mock).mock.calls[0]
      expect(canvas.addSymbols).toHaveBeenCalledWith(added, false)
      expect(canvas.removeSymbols).toHaveBeenCalledWith(["solver-old"], false)
      expect(canvas.history.push).toHaveBeenCalledTimes(1)
      expect(canvas.history.push).toHaveBeenCalledWith({ erased: [oldResult], added })
    })

    test("no draw yet: recompute proceeds normally when the result changes", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))

      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      const { wasRecomputed } = await manager.computeNumericalResult("block-1", "draw")

      expect(wasRecomputed).toBe(true)
      expect(canvas.client.getNumericalComputation).toHaveBeenCalledTimes(1)
      expect(canvas.addSymbols).toHaveBeenCalledTimes(1)
    })
  })

  describe("solver output strokes", () => {
    const stroke = (id: string): TJIIXStrokeItem => ({ type: "stroke", id, X: [0, 1, 2], Y: [0, 1, 2] })

    test("takes every stroke under the first solver-output node, even from unflagged descendants", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      const mantissa: TSolverOutputExpression = {
        id: "mantissa",
        type: JIIXMathExpressionType.Number,
        label: "1.798",
        value: 1.798,
        "solver-output": true,
        items: [stroke("mantissa")],
      }
      const exponent: TSolverOutputExpression = {
        id: "exponent",
        type: JIIXMathExpressionType.Number,
        label: "308",
        value: 308,
        "solver-output": true,
        items: [stroke("308")],
      }
      const power: TJIIXMathPower & { "solver-output": true } = {
        id: "power",
        type: JIIXMathExpressionType.Power,
        "solver-output": true,
        operands: [
          { id: "base", type: JIIXMathExpressionType.Number, label: "10", value: 10, items: [stroke("10")] },
          exponent,
        ],
      }
      const times: TJIIXMathOperator & { "solver-output": true } = {
        id: "times",
        type: JIIXMathExpressionType.Multiply,
        "solver-output": true,
        items: [stroke("times-sign")],
        operands: [mantissa, power],
      }
      const approx: TJIIXMathOperator = {
        id: "approx",
        type: "≃",
        items: [stroke("user-sign")],
        operands: [
          { id: "user-2", type: JIIXMathExpressionType.Number, label: "2", value: 2, items: [stroke("user-2")] },
          times,
        ],
      }
      const result: TJIIXMathElement = { id: "block-1", type: JIIXElementType.Math, expressions: [approx] }
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(result)

      const { addedStrokesCount } = await manager.computeNumericalResult("block-1", "draw")

      expect(addedStrokesCount).toBe(4)
    })
  })

  describe("getGhostBounds / applyTransformToGhostStrokes", () => {
    test("getGhostBounds returns undefined when the block has no ghost", () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))

      expect(manager.getGhostBounds("block-1")).toBeUndefined()
    })

    test("getGhostBounds returns the merged bounds of the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))

      await manager.computeNumericalResult("block-1", "ghost")

      const bounds = manager.getGhostBounds("block-1")
      expect(bounds).toBeDefined()
      expect(bounds!.width).toBeGreaterThan(0)
    })

    test("applyTransformToGhostStrokes moves and redraws the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "ghost")
      const before = manager.getGhostBounds("block-1")!
      canvas.renderer.drawSymbol = jest.fn()

      const matrix = MatrixTransform.identity().translate(100, 200)
      manager.applyTransformToGhostStrokes("block-1", matrix)

      const after = manager.getGhostBounds("block-1")!
      expect(after.x).toBeCloseTo(before.x + 100)
      expect(after.y).toBeCloseTo(before.y + 200)
      expect(canvas.renderer.drawSymbol).toHaveBeenCalled()
    })

    test("applyTransformToGhostStrokes is a no-op when the block has no ghost", () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.renderer.drawSymbol = jest.fn()

      manager.applyTransformToGhostStrokes("block-1", MatrixTransform.identity().translate(10, 10))

      expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
    })

    test("getGhostStrokeIds returns the element ids of the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))
      canvas.client.getNumericalComputation = jest.fn().mockResolvedValue(buildSolverOutputResult("block-1", 4))
      await manager.computeNumericalResult("block-1", "ghost")

      expect(manager.getGhostStrokeIds("block-1")).toEqual(
        expect.arrayContaining([expect.stringMatching(/^ghost-stroke-/)])
      )
    })

    test("getGhostStrokeIds returns an empty array when the block has no ghost", () => {
      const canvas = createCanvasMock()
      const manager = new IIMathComputationSubManager(asCanvas(canvas))

      expect(manager.getGhostStrokeIds("block-1")).toEqual([])
    })
  })
})
