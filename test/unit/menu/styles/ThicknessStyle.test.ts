import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { ThicknessStyle, DefaultStyle } from "@/iink"

describe("ThicknessStyle.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const thicknessList = [
    { label: "Thin", value: 2 },
    { label: "Thick", value: 8 },
  ]

  test("should default the active thickness to canvas.penStyle.width", () => {
    const canvas = createCanvasMock()
    canvas.penStyle = { ...DefaultStyle, width: 8 }
    const style = new ThicknessStyle(asCanvas(canvas), thicknessList)

    const active = style.getElement().querySelector("button.active") as HTMLButtonElement

    expect(active.id).toEqual("ms-menu-style-thickness-8")
  })

  test("should default the active thickness to the selection's uniform width", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke({ style: { ...DefaultStyle, width: 2 } })
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new ThicknessStyle(asCanvas(canvas), thicknessList)

    const active = style.getElement().querySelector("button.active") as HTMLButtonElement

    expect(active.id).toEqual("ms-menu-style-thickness-2")
  })

  test("should set canvas.penStyle.width, update selected symbols and redraw the selection on pick", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const style = new ThicknessStyle(asCanvas(canvas), thicknessList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-thickness-8") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.penStyle.width).toEqual(8)
    expect(canvas.updateSymbols).toHaveBeenCalledWith([stroke.id], { style: { width: 8 } })
    expect(canvas.selector.redrawSelectedGroup).toHaveBeenCalledTimes(1)
  })

  test("should not update symbols or redraw when nothing is selected", () => {
    const canvas = createCanvasMock()
    const style = new ThicknessStyle(asCanvas(canvas), thicknessList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-thickness-8") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.updateSymbols).not.toHaveBeenCalled()
    expect(canvas.selector.redrawSelectedGroup).not.toHaveBeenCalled()
  })

  test("should cascade destroy() to the nested ButtonListMenuItem", () => {
    const canvas = createCanvasMock()
    const style = new ThicknessStyle(asCanvas(canvas), thicknessList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    expect(() => style.destroy()).not.toThrow()
    expect(document.body.contains(wrapper)).toBe(false)
  })
})
