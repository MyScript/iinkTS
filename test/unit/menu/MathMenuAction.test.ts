import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { MathMenuAction } from "@/iink"

describe("MathMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("does not build the removed select/delete result strokes buttons", () => {
    const canvas = createCanvasMock()
    const action = new MathMenuAction(asCanvas(canvas))
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-select-result-strokes")).toBeNull()
    expect(element.querySelector("#ms-menu-action-math-delete-result-strokes")).toBeNull()
  })

  test("clicking Force Compute all clears then recomputes all math blocks", async () => {
    const canvas = createCanvasMock()
    canvas.math.forceCompute = jest.fn().mockResolvedValue(undefined)
    const action = new MathMenuAction(asCanvas(canvas))
    const element = action.getElement()
    document.body.appendChild(element)

    const button = element.querySelector("#ms-menu-action-math-force-compute-all") as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.textContent).toBe("Force Compute all")

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()
    await Promise.resolve()

    expect(canvas.math.forceCompute).toHaveBeenCalledTimes(1)
    expect(canvas.math.forceCompute).toHaveBeenCalledWith()
  })

  test("does not build the Force Compute all button when disabled via config", () => {
    const canvas = createCanvasMock()
    const action = new MathMenuAction(asCanvas(canvas), "ms-menu-action", { forceComputeAll: false })
    const element = action.getElement()

    expect(element.querySelector("#ms-menu-action-math-force-compute-all")).toBeNull()
  })
})
