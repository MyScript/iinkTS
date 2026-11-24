import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { GuideMenuAction } from "@/iink"

describe("GuideMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build enable checkbox, style select and size buttons by default", () => {
    const canvas = createCanvasMock()
    const item = new GuideMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-guide-enable-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-guide-type-input")).toBeTruthy()
    expect(wrapper.querySelector("#ms-menu-action-guide-size-50")).toBeTruthy()
  })

  test("should omit an item when disabled via itemsConfig", () => {
    const canvas = createCanvasMock()
    const item = new GuideMenuAction(asCanvas(canvas), "ms-menu-action", { size: false })

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-guide-size-50")).toBeNull()
    expect(wrapper.querySelector("#ms-menu-action-guide-enable-input")).toBeTruthy()
  })

  test("should toggle guide visibility and refresh the rendering configuration", () => {
    const canvas = createCanvasMock()
    const item = new GuideMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const checkbox = wrapper.querySelector("#ms-menu-action-guide-enable-input") as HTMLInputElement
    const wasEnabled = canvas.configuration.rendering.guides.enable

    checkbox.checked = !wasEnabled
    checkbox.dispatchEvent(new Event("change", { bubbles: true }))

    expect(canvas.configuration.rendering.guides.enable).toEqual(!wasEnabled)
    const renderingConfigurationSetter = Object.getOwnPropertyDescriptor(canvas, "renderingConfiguration")
      ?.set as jest.Mock
    expect(renderingConfigurationSetter).toHaveBeenCalledWith(canvas.configuration.rendering)
  })

  test("should set the guide gap from the size buttons", () => {
    const canvas = createCanvasMock()
    const item = new GuideMenuAction(asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const button = wrapper.querySelector("#ms-menu-action-guide-size-100") as HTMLButtonElement

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.configuration.rendering.guides.gap).toEqual(100)
  })
})
