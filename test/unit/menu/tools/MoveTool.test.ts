import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { MoveTool, CanvasTool } from "@/iink"

describe("MoveTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a square icon button", () => {
    const canvas = createCanvasMock()
    const tool = new MoveTool(asCanvas(canvas))

    const button = tool.getElement()

    expect(button.id).toEqual("ms-menu-tool-move")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should set canvas.tool to Move and mark itself active on click", () => {
    const canvas = createCanvasMock()
    const tool = new MoveTool(asCanvas(canvas))
    const button = tool.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Move)
    expect(button.classList.contains("active")).toBe(true)
  })

  test("should unselect sibling menu items within the closest .ms-menu on click", () => {
    const canvas = createCanvasMock()
    const menu = document.createElement("div")
    menu.className = "ms-menu"
    const sibling = document.createElement("button")
    sibling.classList.add("active")
    menu.appendChild(sibling)
    const tool = new MoveTool(asCanvas(canvas))
    const button = tool.getElement()
    menu.appendChild(button)
    document.body.appendChild(menu)

    button.dispatchEvent(new Event("click", { bubbles: true }))

    expect(sibling.classList.contains("active")).toBe(false)
  })

  test("should reflect canvas.tool on update()", () => {
    const canvas = createCanvasMock()
    const tool = new MoveTool(asCanvas(canvas))
    const button = tool.getElement()
    expect(button.classList.contains("active")).toBe(false)

    canvas.tool = CanvasTool.Move
    tool.update()
    expect(button.classList.contains("active")).toBe(true)

    canvas.tool = CanvasTool.Write
    tool.update()
    expect(button.classList.contains("active")).toBe(false)
  })
})
