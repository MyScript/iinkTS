import { createEditorMock, asEditor } from "../__mocks__/createEditorMock"
import { MathMenuAction } from "@/menu/actions/MathMenuAction"

describe("MathMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("does not build the removed select/delete result strokes buttons", () => {
    const editor = createEditorMock()
    const action = new MathMenuAction(asEditor(editor))
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-select-result-strokes")).toBeNull()
    expect(element.querySelector("#ms-menu-action-math-delete-result-strokes")).toBeNull()
  })

  test("clicking Force Compute all clears then recomputes all math blocks", async () => {
    const editor = createEditorMock()
    editor.math.clearAllSolverOutputs = jest.fn().mockResolvedValue(undefined)
    editor.math.computeAllNumericalResults = jest.fn().mockResolvedValue(undefined)
    const action = new MathMenuAction(asEditor(editor))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-action-math-force-compute-all") as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.textContent).toBe("Force Compute all")

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()

    expect(editor.math.clearAllSolverOutputs).toHaveBeenCalledTimes(1)
    expect(editor.math.computeAllNumericalResults).toHaveBeenCalledTimes(1)
  })

  test("does not build the Force Compute all button when disabled via config", () => {
    const editor = createEditorMock()
    const action = new MathMenuAction(asEditor(editor), "ms-menu-action", { forceComputeAll: false })
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-force-compute-all")).toBeNull()
  })
})
