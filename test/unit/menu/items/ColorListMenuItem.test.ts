import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ColorListMenuItem, TMenuColorList } from "@/iink"

describe("ColorListMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuColorList> = {}): TMenuColorList => ({
    type: "colorlist",
    id: "test-colors",
    colors: ["#ff0000", "#00ff00"],
    fill: true,
    onChange: jest.fn(),
    ...overrides,
  })

  test("should build one button per color, marking initValue active", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ initValue: "#00ff00" })
    const item = new ColorListMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()

    const redButton = wrapper.querySelector("#test-colors-ff0000") as HTMLButtonElement
    const greenButton = wrapper.querySelector("#test-colors-00ff00") as HTMLButtonElement
    expect(redButton).toBeTruthy()
    expect(greenButton.classList.contains("active")).toBe(true)
    expect(redButton.classList.contains("active")).toBe(false)
  })

  test("should default the active color to the first color when initValue is not given", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ColorListMenuItem(config, asCanvas(canvas))

    expect(item.getValue()).toEqual("#ff0000")
  })

  test("should call onChange and move the active class when a color is clicked", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ColorListMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    const greenButton = wrapper.querySelector("#test-colors-00ff00") as HTMLButtonElement
    greenButton.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))

    expect(config.onChange).toHaveBeenCalledWith("#00ff00", asCanvas(canvas))
    expect(item.getValue()).toEqual("#00ff00")
    expect(greenButton.classList.contains("active")).toBe(true)
  })

  test("should move the active class via setValue()", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ColorListMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()

    item.setValue("#00ff00")

    expect(item.getValue()).toEqual("#00ff00")
    expect((wrapper.querySelector("#test-colors-00ff00") as HTMLButtonElement).classList.contains("active")).toBe(true)
    expect((wrapper.querySelector("#test-colors-ff0000") as HTMLButtonElement).classList.contains("active")).toBe(false)
  })
})
