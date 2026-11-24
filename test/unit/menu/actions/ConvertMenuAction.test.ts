import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { ConvertMenuAction } from "@/iink"

describe("ConvertMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build an icon-only button", () => {
    const canvas = createCanvasMock()
    const item = new ConvertMenuAction(asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-action-convert")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should call canvas.convert() on click", () => {
    const canvas = createCanvasMock()
    const item = new ConvertMenuAction(asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.convert).toHaveBeenCalledWith()
  })

  test("should be disabled when the model has no strokes", () => {
    const canvas = createCanvasMock()
    const item = new ConvertMenuAction(asCanvas(canvas))

    expect(item.getElement().disabled).toBe(true)
  })

  test("should be enabled when the model has at least one stroke", () => {
    const canvas = createCanvasMock()
    canvas.model.addSymbol(buildIIStroke())
    const item = new ConvertMenuAction(asCanvas(canvas))

    expect(item.getElement().disabled).toBe(false)
  })
})
