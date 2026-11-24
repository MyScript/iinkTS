import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SelectMenuItem, TMenuSelect } from "@/iink"

describe("SelectMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuSelect> = {}): TMenuSelect => ({
    type: "select",
    id: "test-select",
    options: [
      { label: "A", value: "a" },
      { label: "B", value: "b" },
    ],
    getValue: jest.fn().mockReturnValue("a"),
    setValue: jest.fn(),
    ...overrides,
  })

  test("should build a select with one option per entry, marking the current value selected", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ getValue: jest.fn().mockReturnValue("b") })
    const item = new SelectMenuItem(config, asCanvas(canvas))

    const select = item.getElement().querySelector("select") as HTMLSelectElement

    expect(select.options).toHaveLength(2)
    expect(select.value).toEqual("b")
  })

  test("should call setValue when the selection changes", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SelectMenuItem(config, asCanvas(canvas))
    const select = item.getElement().querySelector("select") as HTMLSelectElement
    document.body.appendChild(select)

    select.value = "b"
    select.dispatchEvent(new Event("change", { bubbles: true }))

    expect(config.setValue).toHaveBeenCalledWith(asCanvas(canvas), "b")
  })

  test("should re-sync the selected value from getValue() on update()", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new SelectMenuItem(config, asCanvas(canvas))
    const select = item.getElement().querySelector("select") as HTMLSelectElement
    expect(select.value).toEqual("a")
    config.getValue = jest.fn().mockReturnValue("b")

    item.update()

    expect(select.value).toEqual("b")
  })

  test("should apply a static disabled config on creation", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ disabled: true })
    const item = new SelectMenuItem(config, asCanvas(canvas))

    const select = item.getElement().querySelector("select") as HTMLSelectElement

    expect(select.disabled).toBe(true)
  })
})
