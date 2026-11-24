import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ClearMenuAction } from "@/iink"

describe("ClearMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build an icon-only button", () => {
    const canvas = createCanvasMock()
    const item = new ClearMenuAction(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-action-clear")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should call canvas.clear() on click", () => {
    const canvas = createCanvasMock()
    const item = new ClearMenuAction(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.clear).toHaveBeenCalledTimes(1)
  })

  test("should be disabled when the history context is empty", () => {
    const canvas = createCanvasMock()
    canvas.history.context = { empty: true, canUndo: false, canRedo: false, stackIndex: 0, possibleUndoCount: 0 }
    const item = new ClearMenuAction(asCanvas(canvas))

    expect(item.getElement().disabled).toBe(true)
  })

  test("should be enabled when the history context is not empty", () => {
    const canvas = createCanvasMock()
    canvas.history.context = { empty: false, canUndo: true, canRedo: false, stackIndex: 1, possibleUndoCount: 1 }
    const item = new ClearMenuAction(asCanvas(canvas))

    expect(item.getElement().disabled).toBe(false)
  })
})
