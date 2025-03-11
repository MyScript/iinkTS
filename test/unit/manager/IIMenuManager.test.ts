import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import
{
  IIMenuManager,
  IIMenuStyle,
  IIMenuTool,
  IIMenuAction
} from "../../../src/iink"

describe("IIMenuManager.ts", () =>
{
  test("should instanciate", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIMenuManager(editor)
    expect(manager).toBeDefined()
  })

  describe("override", () =>
  {
    test("should override menu style", () =>
    {
      class CustomMenuStyle extends IIMenuStyle
      {
        name = "override-style"
      }
      const editor = new InteractiveInkEditorMock()
      //@ts-ignore
      const manager = new IIMenuManager(editor, { style: CustomMenuStyle })
      //@ts-ignore
      expect(manager.style.name).toEqual("override-style")
    })
    test("should override menu tool", () =>
    {
      class CustomMenuTool extends IIMenuTool
      {
        name = "override-tool"
      }
      const editor = new InteractiveInkEditorMock()
      //@ts-ignore
      const manager = new IIMenuManager(editor, { tool: CustomMenuTool })
      //@ts-ignore
      expect(manager.tool.name).toEqual("override-tool")
    })
    test("should override menu action", () =>
    {
      class CustomMenuAction extends IIMenuAction
      {
        name = "override-action"
      }
      const editor = new InteractiveInkEditorMock()
      //@ts-ignore
      const manager = new IIMenuManager(editor, { action: CustomMenuAction })
      //@ts-ignore
      expect(manager.action.name).toEqual("override-action")
    })
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const editor = new InteractiveInkEditorMock()
    //@ts-ignore
    const manager = new IIMenuManager(editor)
    manager.action.render = jest.fn()
    manager.style.render = jest.fn()
    manager.tool.render = jest.fn()
    test("should do nothing if configuration.menu.enable =  false", () =>
    {
      editor.configuration.menu.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.tool.render).toBeCalledTimes(0)
    })
    test("should render only action", () =>
    {
      editor.configuration.menu.enable = true
      editor.configuration.menu.action.enable = true
      editor.configuration.menu.style.enable = false
      editor.configuration.menu.tool.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(1)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.tool.render).toBeCalledTimes(0)
    })
    test("should render only style", () =>
    {
      editor.configuration.menu.enable = true
      editor.configuration.menu.action.enable = false
      editor.configuration.menu.style.enable = true
      editor.configuration.menu.tool.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(1)
      expect(manager.tool.render).toBeCalledTimes(0)
    })
    test("should render only tool", () =>
    {
      editor.configuration.menu.enable = true
      editor.configuration.menu.action.enable = false
      editor.configuration.menu.style.enable = false
      editor.configuration.menu.tool.enable = true
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.tool.render).toBeCalledTimes(1)
    })
  })

  describe("update", () =>
  {
    const editor = new InteractiveInkEditorMock()
    //@ts-ignore
    const manager = new IIMenuManager(editor)
    manager.action.update = jest.fn()
    manager.style.update = jest.fn()
    manager.tool.update = jest.fn()

    test("should update all menu", () =>
    {
      manager.update()
      expect(manager.action.update).toBeCalledTimes(1)
      expect(manager.style.update).toBeCalledTimes(1)
      expect(manager.tool.update).toBeCalledTimes(1)
    })
  })

  describe("show/hide", () =>
  {
    const editor = new InteractiveInkEditorMock()
    //@ts-ignore
    const manager = new IIMenuManager(editor)
    manager.action.show = jest.fn()
    manager.action.hide = jest.fn()
    manager.style.show = jest.fn()
    manager.style.hide = jest.fn()
    manager.tool.show = jest.fn()
    manager.tool.hide = jest.fn()

    test("should show all menu", () =>
    {
      manager.show()
      expect(manager.action.show).toBeCalledTimes(1)
      expect(manager.style.show).toBeCalledTimes(1)
      expect(manager.tool.show).toBeCalledTimes(1)
    })
    test("should hide all menu", () =>
    {
      manager.hide()
      expect(manager.action.hide).toBeCalledTimes(1)
      expect(manager.style.hide).toBeCalledTimes(1)
      expect(manager.tool.hide).toBeCalledTimes(1)
    })
  })

  describe("destroy", () =>
  {
    const editor = new InteractiveInkEditorMock()
    //@ts-ignore
    const manager = new IIMenuManager(editor)
    manager.action.destroy = jest.fn()
    manager.style.destroy = jest.fn()
    manager.tool.destroy = jest.fn()

    test("should destroy all menu", () =>
    {
      manager.destroy()
      expect(manager.action.destroy).toBeCalledTimes(1)
      expect(manager.style.destroy).toBeCalledTimes(1)
      expect(manager.tool.destroy).toBeCalledTimes(1)
    })
  })

})
