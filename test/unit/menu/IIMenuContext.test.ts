import { buildIIStroke } from "../helpers"
import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { IIMenuContext } from "@/menu/IIMenuContext"
import { IIJiixQueryManager } from "@/manager/interactive/IIJiixQueryManager"
import { IIMathManager } from "@/manager/interactive/IIMathManager"

const ONLY_MATH_MENU_CONFIG = {
  edit: false,
  decorator: false,
  reorder: false,
  export: false,
  convert: false,
  group: false,
  duplicate: false,
  remove: false,
  selectAll: false,
  math: true,
}

function buildCanvasWithRealJiixAndMath() {
  const canvas = createCanvasMock()
  const mutableCanvas = canvas as unknown as Record<string, unknown>
  mutableCanvas.jiix = new IIJiixQueryManager(asCanvas(canvas))
  mutableCanvas.math = new IIMathManager(asCanvas(canvas))
  return canvas
}

function mockBlockActions(
  canvas: ReturnType<typeof createCanvasMock>,
  perBlock: Record<string, { actions: string[]; variableCount: number; evaluableCount: number }>
) {
  canvas.client.getAvailableActions = jest.fn().mockImplementation(async (id: string) => perBlock[id]?.actions ?? [])
  canvas.client.getVariables = jest
    .fn()
    .mockImplementation(async (id: string) =>
      Array.from({ length: perBlock[id]?.variableCount ?? 0 }, (_, i) => ({ name: `v${i}`, value: i }))
    )
  canvas.client.getEvaluables = jest
    .fn()
    .mockImplementation(async (id: string) =>
      Array.from({ length: perBlock[id]?.evaluableCount ?? 0 }, (_, i) => ({ inputName: `x${i}`, outputName: `f${i}` }))
    )
}

async function updateAndFlush(menuContext: IIMenuContext) {
  menuContext.show()
  await (menuContext as unknown as { updateMathMenu(): Promise<void> }).updateMathMenu()
}

function getMathMenuElement(menuContext: IIMenuContext): HTMLElement {
  return menuContext.wrapper!.querySelector("#ms-menu-context-math") as HTMLElement
}

describe("IIMenuContext.ts", () => {
  describe("updateMathMenu - multi-block selection", () => {
    test("shows the Math menu with capabilities AND-aggregated across two fully-selected Math blocks", async () => {
      const canvas = buildCanvasWithRealJiixAndMath()
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke1.id }] },
            { id: "block-2", type: "Math" as never, items: [{ type: "stroke", id: "s2", "full-id": stroke2.id }] },
          ],
        },
      })
      canvas.jiix.invalidateIndex()
      canvas.model.selectSymbol(stroke1.id)
      canvas.model.selectSymbol(stroke2.id)
      mockBlockActions(canvas, {
        "block-1": { actions: ["numerical-computation"], variableCount: 1, evaluableCount: 0 },
        "block-2": { actions: [], variableCount: 1, evaluableCount: 0 },
      })

      const menuContext = new IIMenuContext(asCanvas(canvas), "ms-menu-context", ONLY_MATH_MENU_CONFIG)
      menuContext.render(canvas.layers.rendering)
      await updateAndFlush(menuContext)

      const mathMenu = getMathMenuElement(menuContext)
      expect(mathMenu.style.display).not.toBe("none")
      const editVariablesButton = mathMenu.querySelector("#ms-menu-context-math-variables") as HTMLButtonElement
      const computeButton = mathMenu.querySelector("#ms-menu-context-math-numerical-computation") as HTMLButtonElement
      expect(editVariablesButton.style.display).not.toBe("none") // true AND true
      expect(computeButton.style.display).toBe("none") // true AND false
    })

    test("hides the Math menu when a non-Math block is fully selected alongside a Math block", async () => {
      const canvas = buildCanvasWithRealJiixAndMath()
      const mathStroke = buildIIStroke()
      const textStroke = buildIIStroke()
      canvas.model.addSymbol(mathStroke)
      canvas.model.addSymbol(textStroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": mathStroke.id }] },
            {
              id: "block-2",
              type: "Text" as never,
              label: "hello",
              items: [{ type: "stroke", id: "s2", "full-id": textStroke.id }],
            },
          ],
        },
      })
      canvas.jiix.invalidateIndex()
      canvas.model.selectSymbol(mathStroke.id)
      canvas.model.selectSymbol(textStroke.id)
      mockBlockActions(canvas, {})

      const menuContext = new IIMenuContext(asCanvas(canvas), "ms-menu-context", ONLY_MATH_MENU_CONFIG)
      menuContext.render(canvas.layers.rendering)
      await updateAndFlush(menuContext)

      expect(getMathMenuElement(menuContext).style.display).toBe("none")
      expect(canvas.client.getAvailableActions).not.toHaveBeenCalled()
    })

    test("hides the Math menu when the selection includes a stroke outside any complete block", async () => {
      const canvas = buildCanvasWithRealJiixAndMath()
      const blockStroke = buildIIStroke()
      const looseStroke = buildIIStroke()
      canvas.model.addSymbol(blockStroke)
      canvas.model.addSymbol(looseStroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": blockStroke.id }] },
          ],
        },
      })
      canvas.jiix.invalidateIndex()
      canvas.model.selectSymbol(blockStroke.id)
      canvas.model.selectSymbol(looseStroke.id)
      mockBlockActions(canvas, {})

      const menuContext = new IIMenuContext(asCanvas(canvas), "ms-menu-context", ONLY_MATH_MENU_CONFIG)
      menuContext.render(canvas.layers.rendering)
      await updateAndFlush(menuContext)

      expect(getMathMenuElement(menuContext).style.display).toBe("none")
      expect(canvas.client.getAvailableActions).not.toHaveBeenCalled()
    })

    test("shows the Math menu for a single fully-selected Math block (regression)", async () => {
      const canvas = buildCanvasWithRealJiixAndMath()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.mergeExport({
        "application/vnd.myscript.jiix": {
          type: "Math",
          id: "MainBlock",
          version: "3",
          elements: [
            { id: "block-1", type: "Math" as never, items: [{ type: "stroke", id: "s1", "full-id": stroke.id }] },
          ],
        },
      })
      canvas.jiix.invalidateIndex()
      canvas.model.selectSymbol(stroke.id)
      mockBlockActions(canvas, {
        "block-1": { actions: ["numerical-computation"], variableCount: 0, evaluableCount: 1 },
      })

      const menuContext = new IIMenuContext(asCanvas(canvas), "ms-menu-context", ONLY_MATH_MENU_CONFIG)
      menuContext.render(canvas.layers.rendering)
      await updateAndFlush(menuContext)

      const mathMenu = getMathMenuElement(menuContext)
      expect(mathMenu.style.display).not.toBe("none")
      const computeButton = mathMenu.querySelector("#ms-menu-context-math-numerical-computation") as HTMLButtonElement
      const evaluateButton = mathMenu.querySelector("#ms-menu-context-math-evaluate") as HTMLButtonElement
      expect(computeButton.style.display).not.toBe("none")
      expect(evaluateButton.style.display).not.toBe("none")
    })

    test("hides the Math menu when nothing is selected", async () => {
      const canvas = buildCanvasWithRealJiixAndMath()
      mockBlockActions(canvas, {})

      const menuContext = new IIMenuContext(asCanvas(canvas), "ms-menu-context", ONLY_MATH_MENU_CONFIG)
      menuContext.render(canvas.layers.rendering)
      await updateAndFlush(menuContext)

      expect(getMathMenuElement(menuContext).style.display).toBe("none")
    })
  })
})
