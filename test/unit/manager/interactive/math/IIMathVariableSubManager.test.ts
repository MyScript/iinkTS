import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../../helpers"
import { ColorPaletteManager, IIMathVariableSubManager, JIIXMathExpressionType } from "@/iink"
import type { TJIIXMathExpression, TMathVariable, TStroke } from "@/iink"

describe("IIMathVariableSubManager.ts", () => {
  beforeEach(() => {
    ColorPaletteManager.getInstance().clear()
  })

  function buildMathStroke(jiixBlockId: string): TStroke {
    const stroke = buildIIStroke()
    stroke.jiixBlockType = "Math"
    stroke.jiixBlockId = jiixBlockId
    return stroke
  }

  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIMathVariableSubManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("enrichMathDependencies", () => {
    test("should keep non-BLOCK sourced variables as externalVariables", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      const variables: TMathVariable[] = [
        { name: "x", value: 2, sourceType: "BLOCK", sourceId: "block-source" },
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
        { name: "pi", value: 3.14, sourceType: "PREDEFINED" },
        { name: "z", sourceType: "UNDEFINED" },
      ]
      canvas.client.getVariables = jest.fn().mockResolvedValue(variables)

      await manager.enrichMathDependencies("block-1")

      const deps = manager.getDependencies("block-1")
      expect(deps?.externalVariables).toEqual([
        { name: "k", value: 5, sourceType: "API_GLOBAL", isDefinition: false },
        { name: "pi", value: 3.14, sourceType: "PREDEFINED", isDefinition: false },
        { name: "z", sourceType: "UNDEFINED", isDefinition: false },
      ])
    })

    test("should exclude the block's own definition variable (e.g. writing \"c=3/2\")", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      const variables: TMathVariable[] = [
        { name: "c", value: 1.5, sourceType: "UNDEFINED" },
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ]
      canvas.client.getVariables = jest.fn().mockResolvedValue(variables)
      canvas.client.asVariableDefinition = jest.fn().mockResolvedValue({ name: "c", value: 1.5 })

      await manager.enrichMathDependencies("block-1")

      const deps = manager.getDependencies("block-1")
      expect(deps?.externalVariables).toEqual([{ name: "k", value: 5, sourceType: "API_GLOBAL", isDefinition: false }])
    })

    test("should clear externalVariables once the block has no more variables", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "k", sourceType: "API_GLOBAL", value: 1 }])
      await manager.enrichMathDependencies("block-1")
      expect(manager.getDependencies("block-1")?.externalVariables).toHaveLength(1)

      canvas.client.getVariables = jest.fn().mockResolvedValue([])
      await manager.enrichMathDependencies("block-1")

      expect(manager.getDependencies("block-1")?.externalVariables).toEqual([])
    })

    test("should skip the backend call entirely when isStale() is already true before requesting", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "k", sourceType: "API_GLOBAL", value: 1 }])
      const invalidateCacheSpy = jest.spyOn(manager, "invalidateCache")

      await manager.enrichMathDependencies("block-1", () => true)

      expect(canvas.client.getVariables).not.toHaveBeenCalled()
      expect(manager.getDependencies("block-1")).toBeNull()
      // Cache still purged even though the fetch itself was skipped - it holds pre-change data.
      expect(invalidateCacheSpy).toHaveBeenCalledWith("block-1")
    })

    test("should discard the result instead of committing it when isStale() turns true while the backend is answering", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "k", sourceType: "API_GLOBAL", value: 1 }])
      // false on the pre-request check, true once the backend has responded.
      let calls = 0
      const isStale = () => ++calls > 1

      // Strokes kept coming in while this request was in flight (e.g. the block got
      // reclassified) - a fresh, correct enrichment is already queued to re-run.
      await manager.enrichMathDependencies("block-1", isStale)

      expect(canvas.client.getVariables).toHaveBeenCalled()
      expect(manager.getDependencies("block-1")).toBeNull()
    })

    test("should swallow (not throw) a backend error for a block that turned stale mid-request", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas))
      canvas.client.getVariables = jest.fn().mockRejectedValue(new Error("block is no longer math"))
      // false on the pre-request check, true by the time the backend rejects.
      let calls = 0
      const isStale = () => ++calls > 1

      await expect(manager.enrichMathDependencies("block-1", isStale)).resolves.toBeUndefined()
      expect(canvas.client.getVariables).toHaveBeenCalled()
      expect(manager.getDependencies("block-1")).toBeNull()
    })
  })

  describe("onSymbolHover", () => {
    async function setupHoveredBlock(config: { showDependencyOnHover: boolean }, variables: TMathVariable[]) {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas), config)
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.client.getVariables = jest.fn().mockResolvedValue(variables)
      await manager.enrichMathDependencies("block-1")
      return { canvas, manager }
    }

    test("should show a centered encart for a hovered block with external variables", async () => {
      const { canvas, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ])
      const swatchColor = ColorPaletteManager.getInstance().getColorForVariable("k")

      manager.onSymbolHover("block-1")

      expect(canvas.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ name: "k", value: "5", typeLabel: "Global", typeColor: "var(--ms-ink-primary)", swatchColor }],
        })
      )
    })

    test("should not show an encart when the block has no external variables", async () => {
      const { canvas, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
        { name: "x", value: 2, sourceType: "BLOCK", sourceId: "src" },
      ])

      manager.onSymbolHover("block-1")

      expect(canvas.overlays.showVariableEncart).not.toHaveBeenCalled()
    })

    test("should not show an encart when showDependencyOnHover is disabled", async () => {
      const { canvas, manager } = await setupHoveredBlock({ showDependencyOnHover: false }, [
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ])

      manager.onSymbolHover("block-1")

      expect(canvas.overlays.showVariableEncart).not.toHaveBeenCalled()
    })

    test("should not crash when the server returns a null value instead of omitting it", async () => {
      // The client sometimes sends `value: null` rather than leaving the field out,
      // even though TMathVariable types it as `number | undefined`.
      const nullValueVariable = { name: "k", value: null, sourceType: "API_GLOBAL" } as unknown as TMathVariable
      const { canvas, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [nullValueVariable])

      expect(() => manager.onSymbolHover("block-1")).not.toThrow()
      expect(canvas.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ name: "k", value: "undefined" })],
        })
      )
    })

    test("should highlight each variable occurrence found in the block's expressions", async () => {
      const { canvas, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ])
      const variableExpression: TJIIXMathExpression = {
        id: "v1",
        type: JIIXMathExpressionType.Variable,
        label: "k",
        "bounding-box": { x: 0, y: 0, width: 10, height: 10 },
      }
      const operatorExpression: TJIIXMathExpression = {
        id: "e1",
        type: "+",
        operands: [variableExpression],
      }
      canvas.jiix.getElementForStroke = jest.fn().mockReturnValue({ expressions: [operatorExpression] })

      manager.onSymbolHover("block-1")

      expect(canvas.overlays.highlightWithColor).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: 0 }),
        "block-1-extvar-k-occ0",
        "k"
      )
    })
  })

  describe("selectBlock", () => {
    test("should show a centered encart for a selected block with external variables", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas), { highlightOnSelect: true })
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "k", value: 5, sourceType: "API_GLOBAL" }])
      await manager.enrichMathDependencies("block-1")
      const swatchColor = ColorPaletteManager.getInstance().getColorForVariable("k")

      manager.selectBlock("block-1")

      expect(canvas.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ name: "k", value: "5", typeLabel: "Global", typeColor: "var(--ms-ink-primary)", swatchColor }],
        })
      )
    })

    test("should not show an encart when highlightOnSelect is disabled", async () => {
      const canvas = createCanvasMock()
      const manager = new IIMathVariableSubManager(asCanvas(canvas), { highlightOnSelect: false })
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.client.getVariables = jest.fn().mockResolvedValue([{ name: "k", value: 5, sourceType: "API_GLOBAL" }])
      await manager.enrichMathDependencies("block-1")

      manager.selectBlock("block-1")

      expect(canvas.overlays.showVariableEncart).not.toHaveBeenCalled()
    })
  })
})
