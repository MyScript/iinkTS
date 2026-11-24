import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { ConvertContextMenu } from "@/iink"

describe("ConvertContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a labeled button", () => {
    const canvas = createCanvasMock()
    const item = new ConvertContextMenu(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-context-convert")
    expect(button.textContent).toEqual("Convert")
  })

  test("should convert the selected symbols on click", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const item = new ConvertContextMenu(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.convert).toHaveBeenCalledWith([stroke])
  })
})
