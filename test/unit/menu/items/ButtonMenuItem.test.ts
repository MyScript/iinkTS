import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ButtonMenuItem, TMenuButton } from "@/iink"

describe("ButtonMenuItem.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a button with the configured id and label", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = {
      type: "button",
      id: "test-button",
      label: "Click me",
      action: jest.fn(),
    }
    const item = new ButtonMenuItem(config, asCanvas(canvas))

    const button = item.getElement()

    expect(button.id).toEqual("test-button")
    expect(button.textContent).toEqual("Click me")
  })

  test("should build an icon-only button with the 'square' class", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = {
      type: "button",
      id: "test-button",
      icon: "<svg></svg>",
      action: jest.fn(),
    }
    const item = new ButtonMenuItem(config, asCanvas(canvas))

    const button = item.getElement()

    expect(button.innerHTML).toEqual("<svg></svg>")
    expect(button.classList.contains("square")).toBe(true)
  })

  test("should call the configured action on pointerup", () => {
    const canvas = createCanvasMock()
    const action = jest.fn()
    const config: TMenuButton = { type: "button", id: "test-button", action }
    const item = new ButtonMenuItem(config, asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(action).toHaveBeenCalledWith(asCanvas(canvas))
  })

  test("should apply a static disabled config on creation", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = { type: "button", id: "test-button", action: jest.fn(), disabled: true }
    const item = new ButtonMenuItem(config, asCanvas(canvas))

    expect(item.getElement().disabled).toBe(true)
  })

  test("should apply a disabled predicate on creation", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = {
      type: "button",
      id: "test-button",
      action: jest.fn(),
      disabled: () => true,
    }
    const item = new ButtonMenuItem(config, asCanvas(canvas))

    expect(item.getElement().disabled).toBe(true)
  })

  test("should re-evaluate the disabled predicate on update()", () => {
    const canvas = createCanvasMock()
    let isDisabled = false
    const config: TMenuButton = {
      type: "button",
      id: "test-button",
      action: jest.fn(),
      disabled: () => isDisabled,
    }
    const item = new ButtonMenuItem(config, asCanvas(canvas))
    const button = item.getElement()
    expect(button.disabled).toBe(false)

    isDisabled = true
    item.update()

    expect(button.disabled).toBe(true)
  })

  test("should re-evaluate the visible predicate on update()", () => {
    const canvas = createCanvasMock()
    let isVisible = true
    const config: TMenuButton = {
      type: "button",
      id: "test-button",
      action: jest.fn(),
      visible: () => isVisible,
    }
    const item = new ButtonMenuItem(config, asCanvas(canvas))
    const button = item.getElement()
    expect(button.style.display).toEqual("")

    isVisible = false
    item.update()

    expect(button.style.display).toEqual("none")
  })

  test("should cache the element across getElement() calls", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = { type: "button", id: "test-button", action: jest.fn() }
    const item = new ButtonMenuItem(config, asCanvas(canvas))

    expect(item.getElement()).toBe(item.getElement())
  })

  test("should remove the element on destroy()", () => {
    const canvas = createCanvasMock()
    const config: TMenuButton = { type: "button", id: "test-button", action: jest.fn() }
    const item = new ButtonMenuItem(config, asCanvas(canvas))
    const button = item.getElement()
    document.body.appendChild(button)

    item.destroy()

    expect(document.body.contains(button)).toBe(false)
  })
})
