import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke, buildIIText } from "../../helpers"
import { FontSizeStyle } from "@/iink"

describe("FontSizeStyle.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const sizeList: { label: string; value: "auto" | number }[] = [
    { label: "Auto", value: "auto" },
    { label: "16", value: 16 },
  ]
  const rowHeight = 10

  test("should default the active size to canvas.configuration.fontStyle.size", () => {
    const canvas = createCanvasMock()
    canvas.configuration.fontStyle.size = 16
    const style = new FontSizeStyle(asCanvas(canvas), sizeList, rowHeight)

    const active = style.getElement().querySelector("button.active") as HTMLButtonElement

    expect(active.id).toEqual("ms-menu-style-font-size-16")
  })

  test("should set the configuration and update only text symbols on a numeric pick", () => {
    const canvas = createCanvasMock()
    const text = buildIIText()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(text)
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(text.id)
    canvas.model.selectSymbol(stroke.id)
    const style = new FontSizeStyle(asCanvas(canvas), sizeList, rowHeight)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-font-size-16") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.configuration.fontStyle.size).toEqual(16)
    expect(canvas.updateSymbols).toHaveBeenCalledWith([text.id], { font: { size: 16 * rowHeight } })
    expect(canvas.selector.redrawSelectedGroup).toHaveBeenCalledTimes(1)
  })

  test("should not update text style or redraw when picking 'auto'", () => {
    const canvas = createCanvasMock()
    const style = new FontSizeStyle(asCanvas(canvas), sizeList, rowHeight)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    const button = wrapper.querySelector("#ms-menu-style-font-size-auto") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.configuration.fontStyle.size).toEqual("auto")
    expect(canvas.updateSymbols).not.toHaveBeenCalled()
    expect(canvas.selector.redrawSelectedGroup).not.toHaveBeenCalled()
  })

  test("should cascade destroy() to the nested ButtonListMenuItem", () => {
    const canvas = createCanvasMock()
    const style = new FontSizeStyle(asCanvas(canvas), sizeList, rowHeight)
    const wrapper = style.getElement()
    document.body.appendChild(wrapper)

    expect(() => style.destroy()).not.toThrow()
    expect(document.body.contains(wrapper)).toBe(false)
  })
})
