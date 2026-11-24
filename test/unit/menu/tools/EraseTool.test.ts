import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { EraseTool, CanvasTool } from "@/iink"

describe("EraseTool.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a trigger and one size button per configured size", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))

    const wrapper = tool.getElement()

    expect(wrapper.querySelector("#ms-menu-tool-erase")).toBeTruthy()
    ;[5, 10, 20, 40].forEach((size) => {
      expect(wrapper.querySelector(`#ms-menu-tool-erase-${size}`)).toBeTruthy()
    })
  })

  test("should set canvas.tool to Erase and mark the trigger active on trigger click", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-erase") as HTMLButtonElement

    trigger.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.tool).toEqual(CanvasTool.Erase)
    expect(trigger.classList.contains("active")).toBe(true)
  })

  test("should toggle the size list open on trigger pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const trigger = wrapper.querySelector("#ms-menu-tool-erase") as HTMLButtonElement
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    expect(content.classList.contains("open")).toBe(false)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should set the eraser width, activate erase tool and close the list on size pick", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")
    const sizeButton = wrapper.querySelector("#ms-menu-tool-erase-20") as HTMLButtonElement

    sizeButton.dispatchEvent(new Event("click", { bubbles: true }))

    expect(canvas.eraser.eraserWidth).toEqual(20)
    expect(canvas.tool).toEqual(CanvasTool.Erase)
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should close the size list on outside pointerdown", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)
    const content = wrapper.querySelector(".sub-menu-content") as HTMLDivElement
    content.classList.add("open")

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))

    expect(content.classList.contains("open")).toBe(false)
  })

  test("should reflect the active tool and size on update()", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    const trigger = wrapper.querySelector("#ms-menu-tool-erase") as HTMLButtonElement
    const size10 = wrapper.querySelector("#ms-menu-tool-erase-10") as HTMLButtonElement
    const size20 = wrapper.querySelector("#ms-menu-tool-erase-20") as HTMLButtonElement

    canvas.tool = CanvasTool.Erase
    canvas.eraser.eraserWidth = 10
    tool.update()

    expect(trigger.classList.contains("active")).toBe(true)
    expect(size10.classList.contains("active")).toBe(true)
    expect(size20.classList.contains("active")).toBe(false)
  })

  test("should not throw and remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const tool = new EraseTool(asCanvas(canvas))
    const wrapper = tool.getElement()
    document.body.appendChild(wrapper)

    tool.destroy()

    expect(document.body.contains(wrapper)).toBe(false)
    expect(() => document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))).not.toThrow()
  })
})
