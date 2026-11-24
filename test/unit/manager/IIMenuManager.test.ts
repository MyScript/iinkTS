import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { BaseMenuItem, CanvasLayer, IIMenuManager, IIMenuStyle, IIMenuTool, IIMenuAction, IIMenuContext, LayoutManager, TInteractiveInkCanvas, TMenuItemRegistration } from "@/iink"
import { StubMenuItem } from "../helpers"

describe("IIMenuManager.ts", () => {
  test("should instanciate", () => {
    const canvas = createCanvasMock()
    const manager = new IIMenuManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("override", () => {
    test("should override menu style", () => {
      class CustomMenuStyle extends IIMenuStyle {
        name = "override-style"
      }
      const canvas = createCanvasMock()
      const manager = new IIMenuManager(asCanvas(canvas), { style: CustomMenuStyle })
      //@ts-ignore
      expect(manager.style.name).toEqual("override-style")
    })
    test("should override menu tool", () => {
      class CustomMenuTool extends IIMenuTool {
        name = "override-tool"
      }
      const canvas = createCanvasMock()
      const manager = new IIMenuManager(asCanvas(canvas), { tool: CustomMenuTool })
      //@ts-ignore
      expect(manager.tool.name).toEqual("override-tool")
    })
    test("should override menu action", () => {
      class CustomMenuAction extends IIMenuAction {
        name = "override-action"
      }
      const canvas = createCanvasMock()
      const manager = new IIMenuManager(asCanvas(canvas), { action: CustomMenuAction })
      //@ts-ignore
      expect(manager.action.name).toEqual("override-action")
    })
  })

  describe("override classes", () => {
    class CustomMenuStyle extends IIMenuStyle {}
    class CustomMenuTool extends IIMenuTool {}
    class CustomMenuAction extends IIMenuAction {}
    class CustomMenuContext extends IIMenuContext {}
    const custom = {
      style: CustomMenuStyle,
      tool: CustomMenuTool,
      action: CustomMenuAction,
      context: CustomMenuContext,
    }

    test("should keep the override classes across setConfig", () => {
      const canvas = createCanvasMock()
      const manager = new IIMenuManager(asCanvas(canvas), custom)
      // setConfig only rebuilds once rendered (it has a layer); menus disabled, nothing is drawn
      manager.layer = document.createElement("div")
      canvas.configuration.menu.enable = false

      manager.setConfig({ action: { clear: false } })

      // setConfig rebuilt the menus with the base classes, dropping the integrator's
      expect(manager.style).toBeInstanceOf(CustomMenuStyle)
      expect(manager.tool).toBeInstanceOf(CustomMenuTool)
      expect(manager.action).toBeInstanceOf(CustomMenuAction)
      expect(manager.context).toBeInstanceOf(CustomMenuContext)
      manager.destroy()
    })

    test("should construct an override class with its id and configuration, like the base one", () => {
      const canvas = createCanvasMock()
      const manager = new IIMenuManager(asCanvas(canvas), custom)
      const builtIn = new IIMenuManager(asCanvas(canvas))

      for (const menu of ["style", "tool", "action", "context"] as const) {
        expect(manager[menu].id).toEqual(builtIn[menu].id)
        expect(manager[menu].config).toEqual(builtIn[menu].config)
      }
    })
  })

  describe("render", () => {
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    const manager = new IIMenuManager(asCanvas(canvas))
    manager.action.render = jest.fn()
    manager.style.render = jest.fn()
    manager.tool.render = jest.fn()
    test("should do nothing if configuration.menu.enable =  false", () => {
      canvas.configuration.menu.enable = false
      manager.render(layer)
      expect(manager.action.render).toHaveBeenCalledTimes(0)
      expect(manager.style.render).toHaveBeenCalledTimes(0)
      expect(manager.tool.render).toHaveBeenCalledTimes(0)
    })
    test("should render only action", () => {
      canvas.configuration.menu.enable = true
      canvas.configuration.menu.action.enable = true
      canvas.configuration.menu.style.enable = false
      canvas.configuration.menu.tool.enable = false
      manager.render(layer)
      expect(manager.action.render).toHaveBeenCalledTimes(1)
      expect(manager.style.render).toHaveBeenCalledTimes(0)
      expect(manager.tool.render).toHaveBeenCalledTimes(0)
    })
    test("should render only style", () => {
      canvas.configuration.menu.enable = true
      canvas.configuration.menu.action.enable = false
      canvas.configuration.menu.style.enable = true
      canvas.configuration.menu.tool.enable = false
      manager.render(layer)
      expect(manager.action.render).toHaveBeenCalledTimes(0)
      expect(manager.style.render).toHaveBeenCalledTimes(1)
      expect(manager.tool.render).toHaveBeenCalledTimes(0)
    })
    test("should render only tool", () => {
      canvas.configuration.menu.enable = true
      canvas.configuration.menu.action.enable = false
      canvas.configuration.menu.style.enable = false
      canvas.configuration.menu.tool.enable = true
      manager.render(layer)
      expect(manager.action.render).toHaveBeenCalledTimes(0)
      expect(manager.style.render).toHaveBeenCalledTimes(0)
      expect(manager.tool.render).toHaveBeenCalledTimes(1)
    })
  })

  describe("update", () => {
    const canvas = createCanvasMock()
    const manager = new IIMenuManager(asCanvas(canvas))
    manager.action.update = jest.fn()
    manager.style.update = jest.fn()
    manager.tool.update = jest.fn()

    test("should update all menu", () => {
      manager.update()
      expect(manager.action.update).toHaveBeenCalledTimes(1)
      expect(manager.style.update).toHaveBeenCalledTimes(1)
      expect(manager.tool.update).toHaveBeenCalledTimes(1)
    })
  })

  describe("show/hide", () => {
    const canvas = createCanvasMock()
    const manager = new IIMenuManager(asCanvas(canvas))
    manager.action.show = jest.fn()
    manager.action.hide = jest.fn()
    manager.style.show = jest.fn()
    manager.style.hide = jest.fn()
    manager.tool.show = jest.fn()
    manager.tool.hide = jest.fn()

    test("should show all menu", () => {
      manager.show()
      expect(manager.action.show).toHaveBeenCalledTimes(1)
      expect(manager.style.show).toHaveBeenCalledTimes(1)
      expect(manager.tool.show).toHaveBeenCalledTimes(1)
    })
    test("should hide all menu", () => {
      manager.hide()
      expect(manager.action.hide).toHaveBeenCalledTimes(1)
      expect(manager.style.hide).toHaveBeenCalledTimes(1)
      expect(manager.tool.hide).toHaveBeenCalledTimes(1)
    })
  })

  describe("destroy", () => {
    const canvas = createCanvasMock()
    const manager = new IIMenuManager(asCanvas(canvas))
    manager.action.destroy = jest.fn()
    manager.style.destroy = jest.fn()
    manager.tool.destroy = jest.fn()

    test("should destroy all menu", () => {
      manager.destroy()
      expect(manager.action.destroy).toHaveBeenCalledTimes(1)
      expect(manager.style.destroy).toHaveBeenCalledTimes(1)
      expect(manager.tool.destroy).toHaveBeenCalledTimes(1)
    })
  })
})

describe("IIMenuManager registry", () => {
  function setup() {
    const canvas = createCanvasMock()
    canvas.configuration.menu.enable = true
    // The action menu fetches the language list on render: not what these tests are about
    canvas.configuration.menu.action.enable = false
    // Showing the context menu asks the math manager about the selection: not what these tests are about either
    canvas.configuration.menu.context.math = false
    const manager = new IIMenuManager(asCanvas(canvas))
    const layer = document.createElement("div")
    return { canvas, manager, layer }
  }

  function button(id: string): HTMLButtonElement {
    const element = document.createElement("button")
    element.id = id
    return element
  }

  function itemsOf(manager: IIMenuManager, menu: "tool" | "context"): Map<string, BaseMenuItem> {
    return (manager[menu] as unknown as { items: Map<string, BaseMenuItem> }).items
  }

  test("should add a raw element to a rendered menu, in its default zone", () => {
    const { manager, layer } = setup()
    manager.render(layer)

    manager.addItem("tool", "extra", () => button("extra"))

    expect(manager.tool.wrapper?.querySelector("#extra")).not.toBeNull()
  })

  test("should add a BaseMenuItem and update it with the menu", () => {
    const { canvas, manager, layer } = setup()
    const item = new StubMenuItem("extra", asCanvas(canvas))
    const update = jest.spyOn(item, "update")
    manager.render(layer)

    manager.addItem("tool", "extra", () => item, { zone: "dropdown" })
    manager.update()

    expect(manager.tool.wrapper?.querySelector("#ms-menu-tool-more")).not.toBeNull()
    expect(update).toHaveBeenCalled()
  })

  test("should render an item registered before the menus were rendered", () => {
    const { manager, layer } = setup()
    manager.addItem("tool", "extra", () => button("extra"))

    manager.render(layer)

    expect(layer.querySelector("#extra")).not.toBeNull()
  })

  test("should keep an item across setConfig, built anew on each render", () => {
    const { manager, layer } = setup()
    const factory = jest.fn(() => button("extra"))
    manager.render(layer)
    manager.addItem("tool", "extra", factory)

    manager.setConfig({ tool: { erase: false } })

    expect(layer.querySelectorAll("#extra")).toHaveLength(1)
    expect(factory).toHaveBeenCalledTimes(2)
  })

  test("should refuse a key already registered for that menu", () => {
    const { manager } = setup()
    manager.addItem("tool", "extra", () => button("extra"))
    expect(() => manager.addItem("tool", "extra", () => button("extra"))).toThrow(
      '"extra" is already registered in the tool menu'
    )
    // The same key in another menu is another item
    expect(() => manager.addItem("context", "extra", () => button("extra-context"))).not.toThrow()
  })

  test("should remove an item it added, and say whether there was one", () => {
    const { manager, layer } = setup()
    manager.render(layer)
    manager.addItem("tool", "extra", () => button("extra"))

    expect(manager.removeItem("tool", "extra")).toBe(true)
    expect(layer.querySelector("#extra")).toBeNull()
    expect(manager.removeItem("tool", "extra")).toBe(false)
  })

  test("should replace a built-in item in its place only when asked to", () => {
    const { manager, layer } = setup()
    manager.render(layer)
    const builtInSelect = itemsOf(manager, "tool").get("select")!.getElement()
    const position = Array.from(manager.tool.wrapper!.children).indexOf(builtInSelect)

    manager.addItem("tool", "select", () => button("not-replacing"))
    expect(layer.querySelector("#not-replacing")).toBeNull()

    manager.removeItem("tool", "select")
    manager.addItem("tool", "select", () => button("my-select"), { replace: true })
    const mySelect = layer.querySelector("#my-select")
    expect(mySelect).not.toBeNull()
    expect(Array.from(manager.tool.wrapper!.children).indexOf(mySelect as HTMLElement)).toBe(position)
  })

  test("should place an item next to the one it names, or at the end of its zone when that one is missing", () => {
    const { manager, layer } = setup()
    manager.render(layer)

    manager.addItem("tool", "before-move", () => button("before-move"), { before: "move" })
    manager.addItem("tool", "after-move", () => button("after-move"), { after: "move" })
    manager.addItem("tool", "orphan", () => button("orphan"), { after: "missing" })

    const move = itemsOf(manager, "tool").get("move")!.getElement()
    expect(move.previousElementSibling?.id).toBe("before-move")
    expect(move.nextElementSibling?.id).toBe("after-move")
    expect(manager.tool.wrapper?.lastElementChild?.id).toBe("orphan")
  })

  test("should keep rendering the other items when a factory throws", () => {
    const { manager, layer } = setup()
    manager.addItem("tool", "broken", () => {
      throw new Error("boom")
    })
    manager.addItem("tool", "fine", () => button("fine"))

    manager.render(layer)

    expect(layer.querySelector("#fine")).not.toBeNull()
  })

  test("should keep an open context menu open, where it was, when an item is added to it", () => {
    const { manager, layer } = setup()
    manager.render(layer)
    manager.context.position = { x: 40, y: 60 }
    manager.context.show()

    manager.addItem("context", "quick", () => button("quick"), { zone: "bar" })

    expect(manager.context.wrapper?.style.display).toBe("block")
    expect(manager.context.position).toEqual({ x: 40, y: 60 })
    expect(manager.context.wrapper?.querySelector(".ms-menu-context-bar #quick")).not.toBeNull()
  })
})

describe("IIMenuManager in the layout", () => {
  function setup(items: TMenuItemRegistration[] = []) {
    const layers = new CanvasLayer(document.createElement("div"))
    const layout = new LayoutManager<TInteractiveInkCanvas>(layers, ["action", "style", "tool", "state", "minimap"])
    const canvas = createCanvasMock({ layers, layout })
    canvas.configuration.menu.enable = true
    // The action menu fetches the language list on render: not what these tests are about
    canvas.configuration.menu.action.enable = false
    canvas.configuration.menu.context.math = false
    const manager = new IIMenuManager(asCanvas(canvas), undefined, items)
    layout.render()
    manager.render(layers.ui.root)
    return { canvas, layout, manager, layers }
  }

  test("should show an item declared at load from the first render, built with the canvas", () => {
    const factory = jest.fn(() => {
      const element = document.createElement("button")
      element.id = "declared"
      return element
    })
    const { canvas, manager } = setup([{ menu: "tool", key: "declared", factory }])

    expect(manager.tool.wrapper?.querySelector("#declared")).not.toBeNull()
    expect(factory).toHaveBeenCalledTimes(1)
    expect(factory).toHaveBeenCalledWith(asCanvas(canvas))
  })

  test("should rebuild a menu the layout moves, for its new slot", () => {
    const { layout, manager } = setup()
    layout.set({ "middle-left": ["tool"] })

    expect(manager.tool.wrapper?.parentElement).toBe(layout.host("tool"))
    expect(layout.host("tool")?.parentElement?.classList.contains("ms-layout-middle-left")).toBe(true)
    expect(manager.tool.wrapper?.classList.contains("ms-menu-column")).toBe(true)
  })

  test("should render nowhere a menu the layout places nowhere", () => {
    const { layout, layers } = setup()
    layout.set({ "bottom-center": [] })
    expect(layers.ui.root.querySelector(".ms-menu-tool")).toBeNull()
  })
})
