import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { WriteTool, CanvasTool, CanvasWriteTool } from "@/iink"

describe("WriteTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a square icon button", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))

    const button = tool.getElement()

    expect(button.id).toEqual("ms-menu-tool-write-pencil")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should set canvas.tool to Write, select the pencil writer tool and mark itself active on click", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const button = tool.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
    expect(button.classList.contains("active")).toBe(true)
  })

  test("should only be active on update() when both canvas.tool and canvas.writer.tool match", () => {
    const canvas = createCanvasMock()
    const tool = new WriteTool(asCanvas(canvas))
    const button = tool.getElement()

    canvas.tool = CanvasTool.Write
    canvas.writer.tool = "eraser" as CanvasWriteTool
    tool.update()
    expect(button.classList.contains("active")).toBe(false)

    canvas.writer.tool = CanvasWriteTool.Pencil
    tool.update()
    expect(button.classList.contains("active")).toBe(true)
  })
})
