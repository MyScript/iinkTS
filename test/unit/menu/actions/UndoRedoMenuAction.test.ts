import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { UndoRedoMenuAction } from "@/iink"

const buildContext = (canUndo: boolean, canRedo: boolean) => ({
  canUndo,
  canRedo,
  empty: false,
  stackIndex: 1,
  possibleUndoCount: 1,
})

describe("UndoRedoMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build undo/redo buttons reflecting the initial history context", () => {
    const canvas = createCanvasMock()
    canvas.history.context = buildContext(true, false)
    const item = new UndoRedoMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect((wrapper.querySelector("#ms-menu-action-undoredo-undo") as HTMLButtonElement).disabled).toBe(false)
    expect((wrapper.querySelector("#ms-menu-action-undoredo-redo") as HTMLButtonElement).disabled).toBe(true)
  })

  test("should call canvas.undo()/redo() on click", () => {
    const canvas = createCanvasMock()
    canvas.history.context = buildContext(true, true)
    const item = new UndoRedoMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const undoButton = wrapper.querySelector("#ms-menu-action-undoredo-undo") as HTMLButtonElement
    const redoButton = wrapper.querySelector("#ms-menu-action-undoredo-redo") as HTMLButtonElement

    undoButton.dispatchEvent(new Event("pointerup", { bubbles: true }))
    expect(canvas.undo).toHaveBeenCalledTimes(1)

    redoButton.dispatchEvent(new Event("pointerup", { bubbles: true }))
    expect(canvas.redo).toHaveBeenCalledTimes(1)
  })

  test("should route a failing undo/redo through manageError instead of leaving it unhandled", async () => {
    const canvas = createCanvasMock()
    canvas.history.context = buildContext(true, true)
    const undoBoom = new Error("backend undo refused")
    const redoBoom = new Error("backend redo refused")
    canvas.undo = jest.fn().mockRejectedValue(undoBoom)
    canvas.redo = jest.fn().mockRejectedValue(redoBoom)
    const item = new UndoRedoMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    ;(wrapper.querySelector("#ms-menu-action-undoredo-undo") as HTMLButtonElement).dispatchEvent(
      new Event("pointerup", { bubbles: true })
    )
    await Promise.resolve()
    await Promise.resolve()
    expect(canvas.manageError).toHaveBeenCalledWith(undoBoom)

    ;(wrapper.querySelector("#ms-menu-action-undoredo-redo") as HTMLButtonElement).dispatchEvent(
      new Event("pointerup", { bubbles: true })
    )
    await Promise.resolve()
    await Promise.resolve()
    expect(canvas.manageError).toHaveBeenCalledWith(redoBoom)
  })

  test("should re-sync both buttons from the history context on update()", () => {
    const canvas = createCanvasMock()
    canvas.history.context = buildContext(false, false)
    const item = new UndoRedoMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    const undoButton = wrapper.querySelector("#ms-menu-action-undoredo-undo") as HTMLButtonElement
    const redoButton = wrapper.querySelector("#ms-menu-action-undoredo-redo") as HTMLButtonElement
    expect(undoButton.disabled).toBe(true)
    expect(redoButton.disabled).toBe(true)

    canvas.history.context = buildContext(true, true)
    item.update()

    expect(undoButton.disabled).toBe(false)
    expect(redoButton.disabled).toBe(false)
  })
})
