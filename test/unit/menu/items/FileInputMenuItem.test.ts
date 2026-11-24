import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { FileInputMenuItem, TMenuFileInput } from "@/iink"

const setInputFiles = (input: HTMLInputElement, files: File[]): void => {
  Object.defineProperty(input, "files", { value: files, configurable: true })
}

describe("FileInputMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuFileInput> = {}): TMenuFileInput => ({
    type: "fileinput",
    id: "test-upload",
    action: jest.fn(),
    ...overrides,
  })

  test("should build a disabled upload button until a file is selected", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new FileInputMenuItem(config, asCanvas(canvas))

    const wrapper = item.getElement()
    const button = wrapper.querySelector("button") as HTMLButtonElement

    expect(button.disabled).toBe(true)
  })

  test("should enable the upload button once a file is selected", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new FileInputMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    const input = wrapper.querySelector("#test-upload-input") as HTMLInputElement
    const button = wrapper.querySelector("button") as HTMLButtonElement

    setInputFiles(input, [new File(["content"], "test.txt")])
    input.dispatchEvent(new Event("change"))

    expect(button.disabled).toBe(false)
  })

  test("should call action with the selected files, then reset, on button click", async () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new FileInputMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    document.body.appendChild(wrapper)
    const input = wrapper.querySelector("#test-upload-input") as HTMLInputElement
    const button = wrapper.querySelector("button") as HTMLButtonElement
    const file = new File(["content"], "test.txt")
    setInputFiles(input, [file])
    input.dispatchEvent(new Event("change"))
    const closeListener = jest.fn()
    wrapper.addEventListener("ms-menu-close", closeListener)

    button.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(config.action).toHaveBeenCalledWith(asCanvas(canvas), input.files)
    expect(button.disabled).toBe(true)
    expect(closeListener).toHaveBeenCalledTimes(1)
  })

  test("should not call action when clicked with no file selected", async () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new FileInputMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    const button = wrapper.querySelector("button") as HTMLButtonElement

    button.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))
    await Promise.resolve()

    expect(config.action).not.toHaveBeenCalled()
  })
})
