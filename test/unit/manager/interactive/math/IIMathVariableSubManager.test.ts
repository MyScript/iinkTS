import { createEditorMock, asEditor } from "../../../__mocks__/createEditorMock"
import { buildIIStroke } from "../../../helpers"
import { ColorPaletteManager } from "@/iink"
import { IIMathVariableSubManager } from "@/manager/interactive/math/IIMathVariableSubManager"
import { JIIXMathExpressionType } from "@/model/ExportMath"
import type { TJIIXMathExpression } from "@/model/ExportMath"
import type { TMathVariable } from "@/recognizer"
import type { TStroke } from "@/symbol"

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
    const editor = createEditorMock()
    const manager = new IIMathVariableSubManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  describe("enrichMathDependencies", () => {
    test("should keep non-BLOCK sourced variables as externalVariables", async () => {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor))
      const variables: TMathVariable[] = [
        { name: "x", value: 2, sourceType: "BLOCK", sourceId: "block-source" },
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
        { name: "pi", value: 3.14, sourceType: "PREDEFINED" },
        { name: "z", sourceType: "UNDEFINED" },
      ]
      editor.recognizer.getVariables = jest.fn().mockResolvedValue(variables)

      await manager.enrichMathDependencies("block-1")

      const deps = manager.getDependencies("block-1")
      expect(deps?.externalVariables).toEqual([
        { name: "k", value: 5, sourceType: "API_GLOBAL", isDefinition: false },
        { name: "pi", value: 3.14, sourceType: "PREDEFINED", isDefinition: false },
        { name: "z", sourceType: "UNDEFINED", isDefinition: false },
      ])
    })

    test("should exclude the block's own definition variable (e.g. writing \"c=3/2\")", async () => {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor))
      const variables: TMathVariable[] = [
        { name: "c", value: 1.5, sourceType: "UNDEFINED" },
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ]
      editor.recognizer.getVariables = jest.fn().mockResolvedValue(variables)
      editor.recognizer.asVariableDefinition = jest.fn().mockResolvedValue({ name: "c", value: 1.5 })

      await manager.enrichMathDependencies("block-1")

      const deps = manager.getDependencies("block-1")
      expect(deps?.externalVariables).toEqual([{ name: "k", value: 5, sourceType: "API_GLOBAL", isDefinition: false }])
    })

    test("should clear externalVariables once the block has no more variables", async () => {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor))
      editor.recognizer.getVariables = jest.fn().mockResolvedValue([{ name: "k", sourceType: "API_GLOBAL", value: 1 }])
      await manager.enrichMathDependencies("block-1")
      expect(manager.getDependencies("block-1")?.externalVariables).toHaveLength(1)

      editor.recognizer.getVariables = jest.fn().mockResolvedValue([])
      await manager.enrichMathDependencies("block-1")

      expect(manager.getDependencies("block-1")?.externalVariables).toEqual([])
    })
  })

  describe("onSymbolHover", () => {
    async function setupHoveredBlock(config: { showDependencyOnHover: boolean }, variables: TMathVariable[]) {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor), config)
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.recognizer.getVariables = jest.fn().mockResolvedValue(variables)
      await manager.enrichMathDependencies("block-1")
      return { editor, manager }
    }

    test("should show a centered encart for a hovered block with external variables", async () => {
      const { editor, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ])
      const swatchColor = ColorPaletteManager.getInstance().getColorForVariable("k")

      manager.onSymbolHover("block-1")

      expect(editor.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ name: "k", value: "5", typeLabel: "Global", typeColor: "var(--iink-primary)", swatchColor }],
        })
      )
    })

    test("should not show an encart when the block has no external variables", async () => {
      const { editor, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
        { name: "x", value: 2, sourceType: "BLOCK", sourceId: "src" },
      ])

      manager.onSymbolHover("block-1")

      expect(editor.overlays.showVariableEncart).not.toHaveBeenCalled()
    })

    test("should not show an encart when showDependencyOnHover is disabled", async () => {
      const { editor, manager } = await setupHoveredBlock({ showDependencyOnHover: false }, [
        { name: "k", value: 5, sourceType: "API_GLOBAL" },
      ])

      manager.onSymbolHover("block-1")

      expect(editor.overlays.showVariableEncart).not.toHaveBeenCalled()
    })

    test("should not crash when the server returns a null value instead of omitting it", async () => {
      // The recognizer sometimes sends `value: null` rather than leaving the field out,
      // even though TMathVariable types it as `number | undefined`.
      const nullValueVariable = { name: "k", value: null, sourceType: "API_GLOBAL" } as unknown as TMathVariable
      const { editor, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [nullValueVariable])

      expect(() => manager.onSymbolHover("block-1")).not.toThrow()
      expect(editor.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [expect.objectContaining({ name: "k", value: "undefined" })],
        })
      )
    })

    test("should highlight each variable occurrence found in the block's expressions", async () => {
      const { editor, manager } = await setupHoveredBlock({ showDependencyOnHover: true }, [
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
      editor.jiix.getElementForStroke = jest.fn().mockReturnValue({ expressions: [operatorExpression] })

      manager.onSymbolHover("block-1")

      expect(editor.overlays.highlightWithColor).toHaveBeenCalledWith(
        expect.objectContaining({ x: 0, y: 0 }),
        "block-1-extvar-k-occ0",
        "k"
      )
    })
  })

  describe("selectBlock", () => {
    test("should show a centered encart for a selected block with external variables", async () => {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor), { highlightOnSelect: true })
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.recognizer.getVariables = jest.fn().mockResolvedValue([{ name: "k", value: 5, sourceType: "API_GLOBAL" }])
      await manager.enrichMathDependencies("block-1")
      const swatchColor = ColorPaletteManager.getInstance().getColorForVariable("k")

      manager.selectBlock("block-1")

      expect(editor.overlays.showVariableEncart).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ name: "k", value: "5", typeLabel: "Global", typeColor: "var(--iink-primary)", swatchColor }],
        })
      )
    })

    test("should not show an encart when highlightOnSelect is disabled", async () => {
      const editor = createEditorMock()
      const manager = new IIMathVariableSubManager(asEditor(editor), { highlightOnSelect: false })
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)
      editor.recognizer.getVariables = jest.fn().mockResolvedValue([{ name: "k", value: 5, sourceType: "API_GLOBAL" }])
      await manager.enrichMathDependencies("block-1")

      manager.selectBlock("block-1")

      expect(editor.overlays.showVariableEncart).not.toHaveBeenCalled()
    })
  })
})
