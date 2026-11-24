import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { FillColorStyle, DefaultStyle } from "@/iink"

describe("FillColorStyle.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should default the current color to canvas.penStyle when nothing is selected", () => {
    const canvas = createCanvasMock()
    canvas.penStyle = { ...DefaultStyle, color: "#123456" }
    const style = new FillColorStyle(asCanvas(canvas), ["#123456", "#654321"])

    const active = style.getElement().querySelector("button.active")?.querySelector(".color") as HTMLDivElement

    expect(active.style.backgroundColor).toEqual("rgb(18, 52, 86)")
  })

  test("should default the current color to the selection's uniform color", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke({ style: { ...DefaultStyle, color: "#654321" } })
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new FillColorStyle(asCanvas(canvas), ["#123456", "#654321"])

    const active = style.getElement().querySelector("button.active")?.querySelector(".color") as HTMLDivElement

    expect(active.style.backgroundColor).toEqual("rgb(101, 67, 33)")
  })

  test("should set canvas.penStyle.fill and update selected symbols on color pick", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new FillColorStyle(asCanvas(canvas), ["#123456", "#654321"])
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-fill-list-654321") as HTMLButtonElement
    button.dispatchEvent(new Event("click", { bubbles: true, cancelable: true }))

    expect(canvas.penStyle.fill).toEqual("#654321")
    expect(canvas.updateSymbols).toHaveBeenCalledWith([stroke.id], { style: { fill: "#654321" } })
  })

  test("should cascade destroy() to the nested ColorListMenuItem", () => {
    const canvas = createCanvasMock()
    const style = new FillColorStyle(asCanvas(canvas), ["#123456"])
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    expect(() => style.destroy()).not.toThrow()
    expect(document.body.contains(wrapper)).toBe(false)
  })
})
