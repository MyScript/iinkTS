import { asCanvas, createCanvasMock } from "../__mocks__/createCanvasMock"
import { StubMenuItem } from "../helpers"
import { BaseMenuItem, CanvasLayer, IIAbstractMenu, IIMenuAction, IIMenuContext, IIMenuStyle, IIMenuTool, LayoutManager, TLayoutConfiguration, TMenuItemOptions, TMenuLayoutConfig, TMenuZone } from "@/iink"

class TestMenu extends IIAbstractMenu<{ items: { key: string; options?: TMenuItemOptions }[] } & TMenuLayoutConfig> {
  readonly defaultZone: TMenuZone = "dropdown"
  dropdown?: { element: HTMLDivElement; content: HTMLDivElement }

  render(layer: HTMLElement): void {
    this.wrapper = document.createElement("div")
    this.config.items.forEach(({ key, options }) =>
      this.addItem(key, new StubMenuItem(key, this.canvas), options)
    )
    layer.appendChild(this.wrapper)
  }

  protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement {
    if (zone === "bar") {
      return wrapper
    }
    const column = document.createElement("div")
    this.dropdown = this.createDropdown(document.createElement("button"), column, "bottom-left")
    wrapper.appendChild(this.dropdown.element)
    return column
  }

  get rendered(): Map<string, BaseMenuItem> {
    return this.items
  }

  addOutsideRender(key: string): void {
    this.addItem(key, new StubMenuItem(key, this.canvas))
  }
}

describe("IIAbstractMenu.ts", () => {
  function setup(items: { key: string; options?: TMenuItemOptions }[] = [{ key: "first" }]) {
    const canvas = createCanvasMock()
    const layer = document.createElement("div")
    document.body.appendChild(layer)
    const menu = new TestMenu(asCanvas(canvas), "test-menu", { items })
    menu.render(layer)
    return { menu, layer }
  }

  test("should put an item in the default zone when it names none", () => {
    const { menu } = setup()
    expect(menu.dropdown?.content.contains(menu.rendered.get("first")!.getElement())).toBe(true)
  })

  test("should put an item in the zone it names", () => {
    const { menu } = setup([{ key: "first", options: { zone: "bar" } }])
    expect(menu.wrapper?.contains(menu.rendered.get("first")!.getElement())).toBe(true)
  })

  test("should build a zone only once an item goes to it", () => {
    const { menu } = setup([{ key: "first", options: { zone: "bar" } }])
    // No dropdown item: no empty dropdown, no document listener
    expect(menu.dropdown).toBeUndefined()
  })

  test("should build each zone once, whatever the number of items", () => {
    const { menu } = setup([{ key: "first" }, { key: "second" }])
    expect(menu.wrapper?.querySelectorAll(".sub-menu")).toHaveLength(1)
    expect(menu.dropdown?.content.querySelectorAll("button")).toHaveLength(2)
  })

  test("should refuse an item added before render() set the wrapper", () => {
    const menu = new TestMenu(asCanvas(createCanvasMock()), "test-menu", { items: [] })
    expect(() => menu.addOutsideRender("early")).toThrow("test-menu: items are added during render()")
  })

  test("should update every item", () => {
    const { menu } = setup()
    const update = jest.spyOn(menu.rendered.get("first")!, "update")
    menu.update()
    expect(update).toHaveBeenCalledTimes(1)
  })

  test("should toggle the dropdown from its trigger and close it on a pointerdown outside", () => {
    const { menu } = setup()
    const { element, content } = menu.dropdown!
    const trigger = element.querySelector("button")!

    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)
    expect(content.classList.contains("bottom-left")).toBe(true)

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(false)
  })

  test("should show and hide through the wrapper's visibility", () => {
    const { menu } = setup()
    menu.hide()
    expect(menu.wrapper?.style.visibility).toBe("hidden")
    menu.show()
    expect(menu.wrapper?.style.visibility).toBe("visible")
  })

  test("should destroy its items, detach its wrapper and stop listening to the document", () => {
    const { menu, layer } = setup()
    const destroy = jest.spyOn(menu.rendered.get("first")!, "destroy")
    const removeListener = jest.spyOn(document, "removeEventListener")
    const { content } = menu.dropdown!

    menu.destroy()

    expect(destroy).toHaveBeenCalledTimes(1)
    expect(menu.rendered.size).toBe(0)
    expect(menu.wrapper).toBeUndefined()
    expect(layer.children).toHaveLength(0)
    expect(removeListener).toHaveBeenCalledWith("pointerdown", expect.any(Function))
    // The listener is gone: an outside pointerdown no longer reaches the destroyed dropdown
    content.classList.add("open")
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.classList.contains("open")).toBe(true)
    removeListener.mockRestore()
  })

  test("should start over when rendered again without a destroy, refusing nothing", () => {
    const { menu } = setup([{ key: "first" }, { key: "second", options: { zone: "bar" } }])
    const otherLayer = document.createElement("div")

    menu.render(otherLayer)

    // Same keys again: the previous render's items belong to the previous wrapper, not to this one
    expect(otherLayer.querySelectorAll("button#first, button#second")).toHaveLength(2)
    expect(menu.rendered.size).toBe(2)
  })

  test("should build its zones again after a destroy", () => {
    const { menu, layer } = setup()
    menu.destroy()
    menu.render(layer)
    expect(menu.wrapper?.querySelectorAll(".sub-menu")).toHaveLength(1)
  })
})

describe("IIAbstractMenu in its layout slot", () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ result: {} }) })) as jest.Mock
  const POSITIONS = ["top", "top-left", "top-right", "left", "left-top", "right", "right-top", "bottom", "bottom-left", "bottom-right"]

  function canvasIn(layout?: TLayoutConfiguration) {
    const layers = new CanvasLayer(document.createElement("div"))
    const canvas = createCanvasMock({
      layers,
      layout: new LayoutManager(layers, ["action", "style", "tool", "state", "minimap"], layout),
    })
    return asCanvas(canvas)
  }

  /** The position class of each sub-menu content under `root`, outermost first */
  function positionsIn(root: Element | null | undefined): string[] {
    return Array.from(root?.querySelectorAll(".sub-menu-content") ?? []).map(
      (content) => POSITIONS.find((position) => content.classList.contains(position)) ?? "none"
    )
  }

  /** The action menu's own dropdown (☰) and the sub-menus of the items in its column */
  function actionPositions(menu: IIMenuAction): { dropdown: string; column: string[] } {
    const dropdown = menu.wrapper?.querySelector(":scope > .sub-menu > .sub-menu-content")
    const [own, ...column] = positionsIn(dropdown?.parentElement)
    return { dropdown: own, column: Array.from(new Set(column)) }
  }

  test("should open as before in the default slots", () => {
    const canvas = canvasIn()
    const tool = new IIMenuTool(canvas)
    tool.render(document.createElement("div"))
    const action = new IIMenuAction(canvas)
    action.render(document.createElement("div"))

    expect(new Set(positionsIn(tool.wrapper))).toEqual(new Set(["top"]))
    expect(actionPositions(action)).toEqual({ dropdown: "bottom-right", column: ["right-top"] })
    expect(tool.orientation).toBe("horizontal")
  })

  test("should open up and inwards from the bottom-right corner", () => {
    const action = new IIMenuAction(canvasIn({ "bottom-right": ["action"] }))
    action.render(document.createElement("div"))
    expect(actionPositions(action)).toEqual({ dropdown: "top-left", column: ["left-top"] })
  })

  test("should stand vertical and open rightwards on the left side", () => {
    const tool = new IIMenuTool(canvasIn({ "middle-left": ["tool"] }))
    tool.render(document.createElement("div"))
    expect(tool.orientation).toBe("vertical")
    expect(tool.wrapper?.classList.contains("ms-menu-column")).toBe(true)
    expect(new Set(positionsIn(tool.wrapper))).toEqual(new Set(["right-top"]))
  })

  test("should follow the menu's own orientation and openTowards over its slot's", () => {
    const tool = new IIMenuTool(canvasIn({ "middle-left": ["tool"] }), "ms-menu-tool", {
      orientation: "horizontal",
      openTowards: "down",
    })
    tool.render(document.createElement("div"))
    expect(tool.wrapper?.classList.contains("ms-menu-row")).toBe(true)
    expect(new Set(positionsIn(tool.wrapper))).toEqual(new Set(["bottom-right"]))
  })

  test("should fold the style panel in a shared horizontal slot, unless told otherwise", () => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 1200 })
    const alone = new IIMenuStyle(canvasIn())
    const shared = new IIMenuStyle(canvasIn({ "bottom-center": ["style", "tool"] }))
    const forced = new IIMenuStyle(canvasIn({ "bottom-center": ["style", "tool"] }), "ms-menu-style", { collapsed: false })
    expect(alone.collapsed).toBe(false)
    expect(shared.collapsed).toBe(true)
    expect(forced.collapsed).toBe(false)
  })

  function renderedTool(layout?: TLayoutConfiguration): IIMenuTool {
    const canvas = canvasIn(layout)
    canvas.layout.render()
    const tool = new IIMenuTool(canvas)
    tool.render(canvas.layout.host("tool") ?? document.createElement("div"))
    return tool
  }

  test("should fold its host away when it hides in a shared slot, and bring it back", () => {
    const tool = renderedTool({ "bottom-center": ["action", "tool"] })
    const host = tool.wrapper?.parentElement

    tool.hide()
    expect(host?.classList.contains("ms-layout-host-hidden")).toBe(true)
    // The host folds, so the menu itself stays as it is
    expect(tool.wrapper?.style.visibility).toBe("")

    tool.show()
    expect(host?.classList.contains("ms-layout-host-hidden")).toBe(false)
  })

  test("should just turn invisible when it hides alone in its slot, keeping its room", () => {
    const tool = renderedTool()
    tool.hide()
    expect(tool.wrapper?.style.visibility).toBe("hidden")
    expect(tool.wrapper?.parentElement?.classList.contains("ms-layout-host-hidden")).toBe(false)
    tool.show()
    expect(tool.wrapper?.style.visibility).toBe("visible")
  })

  test("should leave the directions of a menu outside the layout to its items", () => {
    const context = new IIMenuContext(canvasIn())
    expect(context.slot).toBeUndefined()
    expect(context.openTowards).toBeUndefined()
  })
})
