import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { BaseMenuItem, TGenericMenuItem } from "@/iink"

class TestMenuItem extends BaseMenuItem<HTMLDivElement> {
  createElement(): HTMLDivElement {
    const div = document.createElement("div")
    const input = document.createElement("input")
    div.appendChild(input)
    return div
  }
  update(): void {
    this.updateDisabled()
    this.updateVisible()
  }
}

describe("BaseMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should expose dom as a convenience getter for canvas.dom", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item" }
    const item = new TestMenuItem(config, asCanvas(canvas))

    // @ts-expect-error dom is protected, accessed here only to verify the delegation
    expect(item.dom).toBe(canvas.dom)
  })

  test("should create the element lazily and cache it across getElement() calls", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item" }
    const item = new TestMenuItem(config, asCanvas(canvas))

    expect(item.getElement()).toBe(item.getElement())
  })

  test("should not throw when update() runs before the element is created", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item", disabled: () => true, visible: () => false }
    const item = new TestMenuItem(config, asCanvas(canvas))

    expect(() => item.update()).not.toThrow()
  })

  test("should disable the nested input when the element is not a button", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item", disabled: () => true }
    const item = new TestMenuItem(config, asCanvas(canvas))
    const element = item.getElement()

    item.update()

    expect(element.querySelector("input")?.disabled).toBe(true)
  })

  test("should toggle visibility via the element's style.display", () => {
    const canvas = createCanvasMock()
    let isVisible = true
    const config: TGenericMenuItem = { type: "test", id: "test-item", visible: () => isVisible }
    const item = new TestMenuItem(config, asCanvas(canvas))
    const element = item.getElement()
    expect(element.style.display).toEqual("")

    isVisible = false
    item.update()

    expect(element.style.display).toEqual("none")
  })

  test("should remove the element and allow a fresh one to be created after destroy()", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item" }
    const item = new TestMenuItem(config, asCanvas(canvas))
    const firstElement = item.getElement()
    document.body.appendChild(firstElement)

    item.destroy()

    expect(document.body.contains(firstElement)).toBe(false)
    expect(item.getElement()).not.toBe(firstElement)
  })

  test("should not throw when destroy() is called before any element was created", () => {
    const canvas = createCanvasMock()
    const config: TGenericMenuItem = { type: "test", id: "test-item" }
    const item = new TestMenuItem(config, asCanvas(canvas))

    expect(() => item.destroy()).not.toThrow()
  })
})
