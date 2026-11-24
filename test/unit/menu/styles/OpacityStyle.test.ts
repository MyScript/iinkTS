import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { OpacityStyle, DefaultStyle } from "@/iink"

describe("OpacityStyle.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should default the current opacity to canvas.penStyle (as a 0-100 percentage)", () => {
    const canvas = createCanvasMock()
    canvas.penStyle = { ...DefaultStyle, opacity: 0.5 }
    const style = new OpacityStyle(asCanvas(canvas))

    const input = style.getElement().querySelector("input") as HTMLInputElement

    expect(input.value).toEqual("50")
  })

  test("should default to 100 when penStyle has no opacity set", () => {
    const canvas = createCanvasMock()
    const style = new OpacityStyle(asCanvas(canvas))

    const input = style.getElement().querySelector("input") as HTMLInputElement

    expect(input.value).toEqual("100")
  })

  test("should default the current opacity to the selection's uniform opacity", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke({ style: { ...DefaultStyle, opacity: 0.25 } })
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new OpacityStyle(asCanvas(canvas))

    const input = style.getElement().querySelector("input") as HTMLInputElement

    expect(input.value).toEqual("25")
  })

  test("should set canvas.penStyle.opacity and update selected symbols on change", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new OpacityStyle(asCanvas(canvas))
    const input = style.getElement().querySelector("input") as HTMLInputElement

    input.value = "40"
    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(canvas.penStyle.opacity).toEqual(0.4)
    expect(canvas.updateSymbols).toHaveBeenCalledWith([stroke.id], { style: { opacity: 0.4 } })
  })

  test("should not call updateSymbols when nothing is selected", () => {
    const canvas = createCanvasMock()
    const style = new OpacityStyle(asCanvas(canvas))
    const input = style.getElement().querySelector("input") as HTMLInputElement

    input.value = "40"
    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(canvas.updateSymbols).not.toHaveBeenCalled()
  })

  test("should cascade destroy() to the nested RangeMenuItem", () => {
    const canvas = createCanvasMock()
    const style = new OpacityStyle(asCanvas(canvas))
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    expect(() => style.destroy()).not.toThrow()
    expect(document.body.contains(wrapper)).toBe(false)
  })
})
