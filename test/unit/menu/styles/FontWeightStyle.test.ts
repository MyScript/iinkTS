import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../helpers"
import { FontWeightStyle } from "@/iink"

describe("FontWeightStyle.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const weightList: { label: string; value: "auto" | "normal" | "bold" }[] = [
    { label: "Auto", value: "auto" },
    { label: "Normal", value: "normal" },
    { label: "Bold", value: "bold" },
  ]

  test("should default the active weight to canvas.configuration.fontStyle.weight", () => {
    const canvas = createCanvasMock()
    canvas.configuration.fontStyle.weight = "bold"
    const style = new FontWeightStyle(asCanvas(canvas), weightList)

    const active = style.getElement().querySelector("button.active") as HTMLButtonElement

    expect(active.id).toEqual("ms-menu-style-font-weight-bold")
  })

  test("should set the configuration and update only text symbols on pick", () => {
    const canvas = createCanvasMock()
    const text = buildIIText()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(text)
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(text.id)
    canvas.model.selectSymbol(stroke.id)
    const style = new FontWeightStyle(asCanvas(canvas), weightList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-font-weight-bold") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.configuration.fontStyle.weight).toEqual("bold")
    expect(canvas.updateSymbols).toHaveBeenCalledWith([text.id], { font: { weight: "bold" } })
    expect(canvas.selector.redrawSelectedGroup).toHaveBeenCalledTimes(1)
  })

  test("should not update text style or redraw when picking 'auto'", () => {
    const canvas = createCanvasMock()
    const style = new FontWeightStyle(asCanvas(canvas), weightList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-font-weight-auto") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.configuration.fontStyle.weight).toEqual("auto")
    expect(canvas.updateSymbols).not.toHaveBeenCalled()
    expect(canvas.selector.redrawSelectedGroup).not.toHaveBeenCalled()
  })

  test("should cascade destroy() to the nested ButtonListMenuItem", () => {
    const canvas = createCanvasMock()
    const style = new FontWeightStyle(asCanvas(canvas), weightList)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    expect(() => style.destroy()).not.toThrow()
    expect(document.body.contains(wrapper)).toBe(false)
  })
})
