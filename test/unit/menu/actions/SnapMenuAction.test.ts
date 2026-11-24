import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SnapMenuAction } from "@/iink"

describe("SnapMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildSnapConfig = () => ({ guide: false, symbol: false, angle: 0 })

  test("should build guide/element checkboxes and an angle select by default", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration = buildSnapConfig()
    const item = new SnapMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-snap-to-guide-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-snap-to-element-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-snap-angle-input")).toBeTruthy()
  })

  test("should omit an item when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration = buildSnapConfig()
    const item = new SnapMenuAction(asCanvas(canvas), "ms-menu-action", { angle: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-snap-angle-input")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-action-snap-to-guide-input")).toBeTruthy()
  })

  test("should toggle canvas.snaps.snapConfiguration.guide from the checkbox", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration = buildSnapConfig()
    const item = new SnapMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-snap-to-guide-input") as HTMLInputElement

    checkbox.checked = true
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.snaps.snapConfiguration.guide).toBe(true)
  })

  test("should set canvas.snaps.snapConfiguration.angle as a number from the select", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration = buildSnapConfig()
    const item = new SnapMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const select = wrapper.querySelector("#ms-menu-action-snap-angle-input") as HTMLSelectElement

    select.value = "45"
    select.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.snaps.snapConfiguration.angle).toEqual(45)
  })
})
