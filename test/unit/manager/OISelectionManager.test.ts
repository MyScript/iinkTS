import { buildOIStroke } from "../helpers"
import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OISelectionManager,
  TBoundingBox,
  SvgElementRole,
} from "../../../src/iink"


describe("OISelectionManager.ts", () =>
{
  const behaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  behaviorsOptions.configuration.offscreen = true
  test("should create", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    expect(manager).toBeDefined()
  })

  test("should draw selecting rect", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.renderer.appendElement = jest.fn()
    const box: TBoundingBox = {
      height: 10,
      width: 20,
      x: 1,
      y: 2
    }
    manager.drawSelectingRect(box)
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
    expect(manager.renderer.appendElement).toBeCalledTimes(1)
  })

  test("should clear selecting rect", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.clearSelectingRect()
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
  })

  describe("selected group", () =>
  {
    const wrapperHTML: HTMLElement = document.createElement("div")
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OISelectionManager(behaviors)
    const stroke = buildOIStroke()

    behaviors.recognizer.init = jest.fn(() => Promise.resolve())
    behaviors.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
    behaviors.renderer.getElementBounds = jest.fn(() => stroke.boundingBox)

    beforeAll(async () =>
    {
      await behaviors.init(wrapperHTML)
      behaviors.model.addSymbol(stroke)
      behaviors.renderer.drawSymbol(stroke)
    })

    test("should draw selected group", () =>
    {
      manager.drawSelectedGroup([stroke])
      const group = behaviors.renderer.layer.querySelector("[role=\"selected\"]") as SVGGElement
      expect(group).not.toBeNull()
      const translateRect = group?.querySelector(`[role=${ SvgElementRole.Translate }]`)
      expect(translateRect?.getAttribute("x")).toEqual((stroke.boundingBox.x).toString())
      expect(translateRect?.getAttribute("y")).toEqual((stroke.boundingBox.y).toString())
      expect(translateRect?.getAttribute("width")).toEqual((stroke.boundingBox.width).toString())
      expect(translateRect?.getAttribute("height")).toEqual((stroke.boundingBox.height).toString())

      const rotateCircles = group.querySelectorAll(`circle[role=${ SvgElementRole.Rotate }]`)
      expect(rotateCircles).toHaveLength(2)

      const cornerResizeElement = group.querySelectorAll(`circle[role=${ SvgElementRole.Resize }]`)
      expect(cornerResizeElement).toHaveLength(4)
      const edgeResizeElement = group.querySelectorAll(`line[role=${ SvgElementRole.Resize }]`)
      expect(edgeResizeElement).toHaveLength(4)

      const strokePath = group.querySelectorAll(`[id=${ stroke.id }]`)
      expect(strokePath).toHaveLength(1)
    })

  })

})
