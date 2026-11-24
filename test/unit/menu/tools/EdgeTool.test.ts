import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { EdgeTool, CanvasTool, CanvasWriteTool } from "@/iink"

describe("EdgeTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a trigger and one button per edge type", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))

    const wrapper = tool.getElement()

    expect(wrapper.querySelector("#ms-menu-tool-write-edge")).toBeTruthy()
    ;[CanvasWriteTool.Line, CanvasWriteTool.Arrow, CanvasWriteTool.DoubleArrow].forEach((edge) => {
      expect(wrapper.querySelector(`#ms-menu-tool-write-edge-${edge}`)).toBeTruthy()
    })
  })

  test("should select the edge writer tool, mirror its icon on the trigger and close the list on pick", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-edge") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")
    const arrowButton = wrapper.querySelector(`#ms-menu-tool-write-edge-${CanvasWriteTool.Arrow}`) as HTMLButtonElement

    arrowButton.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Write)
    expect(canvas.writer.tool).toEqual(CanvasWriteTool.Arrow)
    expect(trigger.innerHTML).toEqual(arrowButton.innerHTML)
    expect(trigger.classList.contains("active")).toBe(true)
    expect(arrowButton.classList.contains("active")).toBe(true)
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should toggle the edge list open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-write-edge") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the edge list on outside pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should mark the active edge button on update()", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-write-edge") as HTMLButtonElement
    const arrowButton = wrapper.querySelector(`#ms-menu-tool-write-edge-${CanvasWriteTool.Arrow}`) as HTMLButtonElement

    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Arrow
    tool.update()

    expect(trigger.classList.contains("active")).toBe(true)
    expect(arrowButton.classList.contains("active")).toBe(true)
  })

  test("should clear all active state via update() when the tool is no longer an edge tool", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-write-edge") as HTMLButtonElement
    const arrowButton = wrapper.querySelector(`#ms-menu-tool-write-edge-${CanvasWriteTool.Arrow}`) as HTMLButtonElement
    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Arrow
    tool.update()
    expect(arrowButton.classList.contains("active")).toBe(true)

    canvas.tool = CanvasTool.Select
    tool.update()

    expect(trigger.classList.contains("active")).toBe(false)
    expect(arrowButton.classList.contains("active")).toBe(false)
  })

  test("should not leave a stale active button when update() switches between two edge types", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const lineButton = wrapper.querySelector(`#ms-menu-tool-write-edge-${CanvasWriteTool.Line}`) as HTMLButtonElement
    const arrowButton = wrapper.querySelector(`#ms-menu-tool-write-edge-${CanvasWriteTool.Arrow}`) as HTMLButtonElement
    canvas.tool = CanvasTool.Write
    canvas.writer.tool = CanvasWriteTool.Line
    tool.update()
    expect(lineButton.classList.contains("active")).toBe(true)

    canvas.writer.tool = CanvasWriteTool.Arrow
    tool.update()

    expect(arrowButton.classList.contains("active")).toBe(true)
    expect(lineButton.classList.contains("active")).toBe(false)
  })

  test("should not throw and remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const tool = new EdgeTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)

    tool.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
