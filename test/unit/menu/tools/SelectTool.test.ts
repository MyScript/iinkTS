import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { SelectTool, CanvasTool } from "@/iink"

describe("SelectTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a square icon button", () => {
    const canvas = createCanvasMock()
    const tool = new SelectTool(asCanvas(canvas))

    const button = tool.getElement()

    expect(button.id).toEqual("ms-menu-tool-select")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should set canvas.tool to Select and mark itself active on click", () => {
    const canvas = createCanvasMock()
    const tool = new SelectTool(asCanvas(canvas))
    const button = tool.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Select)
    expect(button.classList.contains("active")).toBe(true)
  })

  test("should reflect canvas.tool on update()", () => {
    const canvas = createCanvasMock()
    const tool = new SelectTool(asCanvas(canvas))
    const button = tool.getElement()
    expect(button.classList.contains("active")).toBe(false)

    canvas.tool = CanvasTool.Select
    tool.update()
    expect(button.classList.contains("active")).toBe(true)

    canvas.tool = CanvasTool.Write
    tool.update()
    expect(button.classList.contains("active")).toBe(false)
  })
})
