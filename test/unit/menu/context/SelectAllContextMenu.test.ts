import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SelectAllContextMenu } from "@/iink"

describe("SelectAllContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a labeled button", () => {
    const canvas = createCanvasMock()
    const item = new SelectAllContextMenu(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-context-select-all")
    expect(button.textContent).toEqual("Select all")
  })

  test("should call canvas.selectAll() on click", () => {
    const canvas = createCanvasMock()
    const item = new SelectAllContextMenu(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.selectAll).toHaveBeenCalledTimes(1)
  })
})
