import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { RemoveContextMenu } from "@/iink"

describe("RemoveContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a labeled button", () => {
    const canvas = createCanvasMock()
    const item = new RemoveContextMenu(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-context-remove")
    expect(button.textContent).toEqual("Remove")
  })

  test("should remove the selection group then the selected symbols on click", async () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const item = new RemoveContextMenu(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    await Promise.resolve()

    expect(canvas.selector.removeSelectedGroup).toHaveBeenCalledTimes(1)
    expect(canvas.removeSymbols).toHaveBeenCalledWith([stroke.id])
  })
})
