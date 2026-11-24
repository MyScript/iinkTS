import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { OverlayMenuAction } from "@/iink"

describe("OverlayMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a checkbox and 4 range controls by default", () => {
    const canvas = createCanvasMock()
    const item = new OverlayMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-overlay-show-block-overlays-input")).toBeTruthy()
    ;["badge-size", "border-width", "label-max-chars", "label-font-size"].forEach((id) => {
      expect(wrapper.querySelector(`#ms-menu-action-overlay-${id}-input`)).toBeTruthy()
    })
  })

  test("should omit an item when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new OverlayMenuAction(asCanvas(canvas), "ms-menu-action", { badgeSize: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-overlay-badge-size-input")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-action-overlay-show-block-overlays-input")).toBeTruthy()
  })

  test("should default the badge size range to the current overlay config", () => {
    const canvas = createCanvasMock()
    const item = new OverlayMenuAction(asCanvas(canvas))

    const input = item.getElement().querySelector("#ms-menu-action-overlay-badge-size-input") as HTMLInputElement

    expect(input.value).toEqual("20")
  })

  test("should toggle showBlockOverlays via the checkbox", () => {
    const canvas = createCanvasMock()
    const item = new OverlayMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-overlay-show-block-overlays-input") as HTMLInputElement

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.overlays.updateConfig).toHaveBeenCalledWith({ showBlockOverlays: true })
  })

  test("should update the badge size via the range control", () => {
    const canvas = createCanvasMock()
    const item = new OverlayMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const input = wrapper.querySelector("#ms-menu-action-overlay-badge-size-input") as HTMLInputElement

    input.value = "30"
    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(canvas.overlays.updateConfig).toHaveBeenCalledWith({ badgeSize: 30 })
  })
})
