import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ButtonListMenuItem, TMenuButtonList } from "@/iink"

describe("ButtonListMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuButtonList> = {}): TMenuButtonList => ({
    type: "buttonlist",
    id: "test-list",
    options: [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ],
    getValue: jest.fn().mockReturnValue("a"),
    setValue: jest.fn(),
    ...overrides,
  })

  test("should build one button per option, marking the current value active", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ButtonListMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()

    const buttonA = wrapper.querySelector("#test-list-a") as HTMLButtonElement
    const buttonB = wrapper.querySelector("#test-list-b") as HTMLButtonElement
    expect(buttonA).toBeTruthy()
    expect(buttonB).toBeTruthy()
    expect(buttonA.classList.contains("active")).toBe(true)
    expect(buttonB.classList.contains("active")).toBe(false)
  })

  test("should call setValue and move the active class when an option is clicked", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ButtonListMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)

    const buttonB = wrapper.querySelector("#test-list-b") as HTMLButtonElement
    buttonB.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(config.setValue).toHaveBeenCalledWith(asCanvas(canvas), "b")
    expect(buttonB.classList.contains("active")).toBe(true)
    expect((wrapper.querySelector("#test-list-a") as HTMLButtonElement).classList.contains("active")).toBe(false)
  })

  test("should re-sync the active button from getValue() on update()", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new ButtonListMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    config.getValue = jest.fn().mockReturnValue("b")

    item.update()

    expect((wrapper.querySelector("#test-list-a") as HTMLButtonElement).classList.contains("active")).toBe(false)
    expect((wrapper.querySelector("#test-list-b") as HTMLButtonElement).classList.contains("active")).toBe(true)
  })

  test("should apply a static disabled config to every button on creation", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ disabled: true })
    const item = new ButtonListMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()

    wrapper.querySelectorAll("button").forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
