import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SelectionMenuAction } from "@/iink"

describe("SelectionMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build text/math/shape level selects by default", () => {
    const canvas = createCanvasMock()
    const item = new SelectionMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-selection-text-level-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-selection-math-level-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-selection-shape-level-input")).toBeTruthy()
  })

  test("should omit an item when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new SelectionMenuAction(asCanvas(canvas), "ms-menu-action", { math: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-selection-math-level-input")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-action-selection-text-level-input")).toBeTruthy()
  })

  test("should set canvas.configuration.selection.textLevel from the text select", () => {
    const canvas = createCanvasMock()
    const item = new SelectionMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const select = wrapper.querySelector("#ms-menu-action-selection-text-level-input") as HTMLSelectElement

    select.value = "word"
    select.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.configuration.selection.textLevel).toEqual("word")
  })
})
