import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { IIMenuManager, IIMenuStyle, IIMenuTool, IIMenuAction } from "@/iink"

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
      //@ts-ignore
      const manager = new IIMenuManager(asCanvas(canvas), { style: CustomMenuStyle })
      //@ts-ignore
      expect(manager.style.name).toEqual("override-style")
    })
    test("should override menu tool", () => {
      class CustomMenuTool extends IIMenuTool {
        name = "override-tool"
      }
      const canvas = createCanvasMock()
      //@ts-ignore
      const manager = new IIMenuManager(asCanvas(canvas), { tool: CustomMenuTool })
      //@ts-ignore
      expect(manager.tool.name).toEqual("override-tool")
    })
    test("should override menu action", () => {
      class CustomMenuAction extends IIMenuAction {
        name = "override-action"
      }
      const canvas = createCanvasMock()
      //@ts-ignore
      const manager = new IIMenuManager(asCanvas(canvas), { action: CustomMenuAction })
      //@ts-ignore
      expect(manager.action.name).toEqual("override-action")
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
