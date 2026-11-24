import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { MinimapMenuAction } from "@/iink"

describe("MinimapMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build an icon-only button and attach a hidden minimap to the layer", () => {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    const item = new MinimapMenuAction(asCanvas(canvas), layer)

    const button = item.getElement()

    expect(button.id).toEqual("ms-menu-action-minimap")
    expect(button.classList.contains("square")).toBe(true)
    const minimapEl = layer.querySelector(".ms-menu-minimap") as HTMLElement
    expect(minimapEl).toBeTruthy()
    expect(minimapEl.style.display).toEqual("none")
  })

  test("should toggle the minimap visibility and its own active state on click", () => {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    const item = new MinimapMenuAction(asCanvas(canvas), layer)
    const button = item.getElement()
    document.body.appendChild(button)
    const minimapEl = layer.querySelector(".ms-menu-minimap") as HTMLElement

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    expect(minimapEl.style.display).toEqual("block")
    expect(button.classList.contains("active")).toBe(true)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    expect(minimapEl.style.display).toEqual("none")
    expect(button.classList.contains("active")).toBe(false)
  })

  test("should preserve the active state through update()", () => {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    const item = new MinimapMenuAction(asCanvas(canvas), layer)
    const button = item.getElement()
    document.body.appendChild(button)
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))
    expect(button.classList.contains("active")).toBe(true)

    item.update()

    expect(button.classList.contains("active")).toBe(true)
  })

  test("should not throw on destroy()", () => {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    const item = new MinimapMenuAction(asCanvas(canvas), layer)
    const button = item.getElement()
    document.body.appendChild(button)

    expect(() => item.destroy()).not.toThrow()
    expect(document.body.contains(button)).toBe(false)
  })
})
