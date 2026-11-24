import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ShapeTool, CanvasTool, CanvasWriteTool } from "@/iink"

describe("ShapeTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a trigger and one button per shape", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))

    const wrapper = tool.getElement()

    expect(wrapper.querySelector("#ms-menu-tool-write-shape")).toBeTruthy()
    ;[
      CanvasWriteTool.Rectangle,
      CanvasWriteTool.Circle,
      CanvasWriteTool.Ellipse,
      CanvasWriteTool.Triangle,
      CanvasWriteTool.Rhombus,
    ].forEach((shape) => {
      expect(wrapper.querySelector(`#ms-menu-tool-write-shape-${shape}`)).toBeTruthy()
    })
  })

  test("should select the shape writer tool, mirror its icon on the trigger and close the list on pick", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-shape") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")
    const circleButton = wrapper.querySelector(
      `#ms-menu-tool-write-shape-${CanvasWriteTool.Circle}`
    ) as HTMLButtonElement

    circleButton.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Circle)
    expect(trigger.innerHTML).toEqual(circleButton.innerHTML)
    expect(trigger.classList.contains("active")).toBe(true)
    expect(circleButton.classList.contains("active")).toBe(true)
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should toggle the shape list open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-shape") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the shape list on outside pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should mark the active shape button on update()", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-write-shape") as HTMLButtonElement
    const circleButton = wrapper.querySelector(
      `#ms-menu-tool-write-shape-${CanvasWriteTool.Circle}`
    ) as HTMLButtonElement

    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Circle
    tool.update()

    expect(trigger.classList.contains("active")).toBe(true)
    expect(circleButton.classList.contains("active")).toBe(true)
  })

  test("should clear all active state via update() when the tool is no longer a shape tool", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-write-shape") as HTMLButtonElement
    const circleButton = wrapper.querySelector(
      `#ms-menu-tool-write-shape-${CanvasWriteTool.Circle}`
    ) as HTMLButtonElement
    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Circle
    tool.update()
    expect(circleButton.classList.contains("active")).toBe(true)

    canvas.tool = CanvasTool.Select
    tool.update()

    expect(trigger.classList.contains("active")).toBe(false)
    expect(circleButton.classList.contains("active")).toBe(false)
  })

  test("should not leave a stale active button when update() switches between two shapes", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const circleButton = wrapper.querySelector(
      `#ms-menu-tool-write-shape-${CanvasWriteTool.Circle}`
    ) as HTMLButtonElement
    const rectangleButton = wrapper.querySelector(
      `#ms-menu-tool-write-shape-${CanvasWriteTool.Rectangle}`
    ) as HTMLButtonElement
    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Circle
    tool.update()
    expect(circleButton.classList.contains("active")).toBe(true)

    canvas.writer.tool = CanvasWriteTool.Rectangle
    tool.update()

    expect(rectangleButton.classList.contains("active")).toBe(true)
    expect(circleButton.classList.contains("active")).toBe(false)
  })

  test("should not throw and remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const tool = new ShapeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)

    tool.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
