import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { CheckboxMenuItem, TMenuCheckbox } from "@/iink"

describe("CheckboxMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuCheckbox> = {}): TMenuCheckbox => ({
    type: "checkbox",
    id: "test-checkbox",
    getValue: jest.fn().mockReturnValue(false),
    setValue: jest.fn(),
    ...overrides,
  })

  test("should build a checkbox input reflecting the initial value", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ getValue: jest.fn().mockReturnValue(true) })
    const item = new CheckboxMenuItem(config, asCanvas(canvas))

    const input = item.getElement().querySelector("#test-checkbox-input") as HTMLInputElement

    expect(input).toBeTruthy()
    expect(input.checked).toBe(true)
  })

  test("should call setValue when the checkbox changes", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new CheckboxMenuItem(config, asCanvas(canvas))
    const input = item.getElement().querySelector("#test-checkbox-input") as HTMLInputElement
    document.body.appendChild(input)

    input.checked = true
    input.dispatchEvent(new Event("change", { bubbles: true }))

    expect(config.setValue).toHaveBeenCalledWith(asCanvas(canvas), true)
  })

  test("should re-sync the checked state from getValue() on update()", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new CheckboxMenuItem(config, asCanvas(canvas))
    const input = item.getElement().querySelector("#test-checkbox-input") as HTMLInputElement
    expect(input.checked).toBe(false)
    config.getValue = jest.fn().mockReturnValue(true)

    item.update()

    expect(input.checked).toBe(true)
  })

  test("should apply a static disabled config on creation", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ disabled: true })
    const item = new CheckboxMenuItem(config, asCanvas(canvas))

    const input = item.getElement().querySelector("#test-checkbox-input") as HTMLInputElement

    expect(input.disabled).toBe(true)
  })
})
