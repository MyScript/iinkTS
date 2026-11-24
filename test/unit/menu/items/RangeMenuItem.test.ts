import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { RangeMenuItem, TMenuRange } from "@/iink"

describe("RangeMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildConfig = (overrides: Partial<TMenuRange> = {}): TMenuRange => ({
    type: "range",
    id: "test-range",
    min: 0,
    max: 100,
    step: 10,
    onChange: jest.fn(),
    ...overrides,
  })

  test("should default the current value to initValue when given", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ initValue: 50 })
    const item = new RangeMenuItem(config, asCanvas(canvas))

    expect(item.getValue()).toEqual(50)
    expect((item.getElement().querySelector("input") as HTMLInputElement).value).toEqual("50")
  })

  test("should default the current value to min when initValue is not given", () => {
    const canvas = createCanvasMock()
    const config = buildConfig()
    const item = new RangeMenuItem(config, asCanvas(canvas))

    expect(item.getValue()).toEqual(0)
  })

  test("should update the value, output text and call onChange on input", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ unit: "px" })
    const item = new RangeMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    const input = wrapper.querySelector("input") as HTMLInputElement
    const output = wrapper.querySelector("output") as HTMLOutputElement

    input.value = "40"
    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(item.getValue()).toEqual(40)
    expect(output.innerHTML).toEqual("40px")
    expect(config.onChange).toHaveBeenCalledWith(40, asCanvas(canvas))
  })

  test("should update the input and output via setValue()", () => {
    const canvas = createCanvasMock()
    const config = buildConfig({ unit: "px" })
    const item = new RangeMenuItem(config, asCanvas(canvas))
    const wrapper = item.getElement()
    const input = wrapper.querySelector("input") as HTMLInputElement
    const output = wrapper.querySelector("output") as HTMLOutputElement

    item.setValue(70)

    expect(item.getValue()).toEqual(70)
    expect(input.value).toEqual("70")
    expect(output.innerHTML).toEqual("70px")
  })
})
