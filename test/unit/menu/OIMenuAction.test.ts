import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { OIMenuAction } from "../../../src/iink"

describe("OIMenuAction.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 })

  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuAction(behaviors)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should render menu action", () =>
    {
      expect(layer.querySelector("#ms-menu-action")).not.toBeNull()
    })
    test("should render menu gesture", () =>
    {
      expect(layer.querySelector("#ms-menu-action-gesture")).not.toBeNull()
    })
    test("should render menu guide", () =>
    {
      expect(layer.querySelector("#ms-menu-action-guide")).not.toBeNull()
    })
    test("should render menu snap", () =>
    {
      expect(layer.querySelector("#ms-menu-action-snap")).not.toBeNull()
    })
    test("should render menu debug", () =>
    {
      expect(layer.querySelector("#ms-menu-action-debug")).not.toBeNull()
    })
    test("should render menu clear", () =>
    {
      expect(layer.querySelector("#ms-menu-action-clear")).not.toBeNull()
    })
    test("should render menu language", () =>
    {
      expect(layer.querySelector("#ms-menu-action-language")).not.toBeNull()
    })
    test("should render menu undo", () =>
    {
      expect(layer.querySelector("#ms-menu-action-undo")).not.toBeNull()
    })
    test("should render menu redo", () =>
    {
      expect(layer.querySelector("#ms-menu-action-redo")).not.toBeNull()
    })
    test("should render menu convert", () =>
    {
      expect(layer.querySelector("#ms-menu-action-convert")).not.toBeNull()
    })
  })


  describe("show/hide", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should hide", () =>
    {
      expect(menu.wrapper?.style.visibility).toEqual("visible")
      menu.hide()
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
    })
    test("should show", () =>
    {
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
      menu.show()
      expect(menu.wrapper?.style.visibility).toEqual("visible")
    })
  })

  describe("destroy", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should remove elements", () =>
    {
      expect(layer.childElementCount).toEqual(1)
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(layer.childElementCount).toEqual(0)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
