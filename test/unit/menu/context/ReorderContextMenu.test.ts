import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { ReorderContextMenu } from "@/iink"

describe("ReorderContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build one button per default reorder action", () => {
    const canvas = createCanvasMock()
    const item = new ReorderContextMenu(asCanvas(canvas))

    const wrapper = item.getElement()

    ;["first", "forward", "backward", "last"].forEach((id) => {
      expect(wrapper.querySelector(`#ms-menu-context-reorder-${id}`)).toBeTruthy()
    })
  })

  test("should omit a button when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new ReorderContextMenu(asCanvas(canvas), "ms-menu-context", { front: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-context-reorder-first")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-context-reorder-forward")).toBeTruthy()
  })

  test("should bring the selection to front on 'Bring to front' click", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const item = new ReorderContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const button = wrapper.querySelector("#ms-menu-context-reorder-first") as HTMLButtonElement

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.changeOrderSymbols).toHaveBeenCalledWith([stroke], "last")
    expect(canvas.selector.redrawSelectedGroup).toHaveBeenCalledTimes(1)
  })

  test("should send the reversed selection to back on 'Send to back' click", () => {
    const canvas = createCanvasMock()
    const strokeA = buildIIStroke()
    const strokeB = buildIIStroke()
    canvas.model.addSymbol(strokeA)
    canvas.model.addSymbol(strokeB)
    canvas.model.selectSymbol(strokeA.id)
    canvas.model.selectSymbol(strokeB.id)
    const item = new ReorderContextMenu(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const button = wrapper.querySelector("#ms-menu-context-reorder-last") as HTMLButtonElement

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.changeOrderSymbols).toHaveBeenCalledWith([strokeB, strokeA], "first")
  })
})
