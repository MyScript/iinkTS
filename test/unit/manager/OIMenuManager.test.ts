import { OIBehaviorsTest } from "../OIBehaviorsTest"
import
{
  OIMenuManager,
  OIMenuStyle,
  OIMenuIntention,
  OIMenuAction
} from "../../../src/iink"

describe("OIMenuManager.ts", () =>
{
  test("should instanciate", () =>
  {
    const behaviors = new OIBehaviorsTest()
    const manager = new OIMenuManager(behaviors)
    expect(manager).toBeDefined()
  })

  describe("override", () =>
  {
    test("should override menu style", () =>
    {
      class CustomMenuStyle extends OIMenuStyle
      {
        name = "override-style"
      }
      const behaviors = new OIBehaviorsTest()
      //@ts-ignore
      const manager = new OIMenuManager(behaviors, { style: CustomMenuStyle })
      //@ts-ignore
      expect(manager.style.name).toEqual("override-style")
    })
    test("should override menu intention", () =>
    {
      class CustomMenuIntention extends OIMenuIntention
      {
        name = "override-intention"
      }
      const behaviors = new OIBehaviorsTest()
      //@ts-ignore
      const manager = new OIMenuManager(behaviors, { intention: CustomMenuIntention })
      //@ts-ignore
      expect(manager.intention.name).toEqual("override-intention")
    })
    test("should override menu action", () =>
    {
      class CustomMenuAction extends OIMenuAction
      {
        name = "override-action"
      }
      const behaviors = new OIBehaviorsTest()
      //@ts-ignore
      const manager = new OIMenuManager(behaviors, { action: CustomMenuAction })
      //@ts-ignore
      expect(manager.action.name).toEqual("override-action")
    })
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsTest()
    //@ts-ignore
    const manager = new OIMenuManager(behaviors)
    manager.action.render = jest.fn()
    manager.style.render = jest.fn()
    manager.intention.render = jest.fn()
    test("should do nothing if configuration.menu.enable =  false", () =>
    {
      behaviors.configuration.menu.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.intention.render).toBeCalledTimes(0)
    })
    test("should render only action", () =>
    {
      behaviors.configuration.menu.enable = true
      behaviors.configuration.menu.action.enable = true
      behaviors.configuration.menu.style.enable = false
      behaviors.configuration.menu.intention.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(1)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.intention.render).toBeCalledTimes(0)
    })
    test("should render only style", () =>
    {
      behaviors.configuration.menu.enable = true
      behaviors.configuration.menu.action.enable = false
      behaviors.configuration.menu.style.enable = true
      behaviors.configuration.menu.intention.enable = false
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(1)
      expect(manager.intention.render).toBeCalledTimes(0)
    })
    test("should render only intention", () =>
    {
      behaviors.configuration.menu.enable = true
      behaviors.configuration.menu.action.enable = false
      behaviors.configuration.menu.style.enable = false
      behaviors.configuration.menu.intention.enable = true
      manager.render(layer)
      expect(manager.action.render).toBeCalledTimes(0)
      expect(manager.style.render).toBeCalledTimes(0)
      expect(manager.intention.render).toBeCalledTimes(1)
    })
  })

  describe("update", () =>
  {
    const behaviors = new OIBehaviorsTest()
    //@ts-ignore
    const manager = new OIMenuManager(behaviors)
    manager.action.update = jest.fn()
    manager.style.update = jest.fn()
    manager.intention.update = jest.fn()

    test("should update all menu", () =>
    {
      manager.update()
      expect(manager.action.update).toBeCalledTimes(1)
      expect(manager.style.update).toBeCalledTimes(1)
      expect(manager.intention.update).toBeCalledTimes(1)
    })
  })

  describe("show/hide", () =>
  {
    const behaviors = new OIBehaviorsTest()
    //@ts-ignore
    const manager = new OIMenuManager(behaviors)
    manager.action.show = jest.fn()
    manager.action.hide = jest.fn()
    manager.style.show = jest.fn()
    manager.style.hide = jest.fn()
    manager.intention.show = jest.fn()
    manager.intention.hide = jest.fn()

    test("should show all menu", () =>
    {
      manager.show()
      expect(manager.action.show).toBeCalledTimes(1)
      expect(manager.style.show).toBeCalledTimes(1)
      expect(manager.intention.show).toBeCalledTimes(1)
    })
    test("should hide all menu", () =>
    {
      manager.hide()
      expect(manager.action.hide).toBeCalledTimes(1)
      expect(manager.style.hide).toBeCalledTimes(1)
      expect(manager.intention.hide).toBeCalledTimes(1)
    })
  })

  describe("destroy", () =>
  {
    const behaviors = new OIBehaviorsTest()
    //@ts-ignore
    const manager = new OIMenuManager(behaviors)
    manager.action.destroy = jest.fn()
    manager.style.destroy = jest.fn()
    manager.intention.destroy = jest.fn()

    test("should destroy all menu", () =>
    {
      manager.destroy()
      expect(manager.action.destroy).toBeCalledTimes(1)
      expect(manager.style.destroy).toBeCalledTimes(1)
      expect(manager.intention.destroy).toBeCalledTimes(1)
    })
  })

})
