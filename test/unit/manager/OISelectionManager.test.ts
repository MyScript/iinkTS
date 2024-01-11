import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OISelectionManager,
  TBoundingBox
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

  // test("should get the selected group", () =>
  // {
  //   const removalFilterId = "removalFilterId"
  //   const renderer = new OISVGStrokeUtil(selectionFilterId, removalFilterId)

  //   const stroke = buildOIStroke()
  //   const strokeEl = renderer.getSVGElement(stroke)
  //   //@ts-ignore
  //   window.SVGElement.prototype.getBBox = () => stroke.boundingBox

  //   const group = selectionUtils.wrapElements([strokeEl]) as SVGGElement
  //   expect(group).not.toBeNull()
  //   expect(group.getAttribute("role")).toEqual(SvgElementRole.Selected)
  //   const translateRect = group?.querySelector(`[role=${ SvgElementRole.Translate }]`)
  //   expect(translateRect?.getAttribute("x")).toEqual((stroke.boundingBox.x - SELECTION_MARGIN).toString())
  //   expect(translateRect?.getAttribute("y")).toEqual((stroke.boundingBox.y - SELECTION_MARGIN).toString())
  //   expect(translateRect?.getAttribute("width")).toEqual((stroke.boundingBox.width + 2 * SELECTION_MARGIN).toString())
  //   expect(translateRect?.getAttribute("height")).toEqual((stroke.boundingBox.height + 2 * SELECTION_MARGIN).toString())

  //   const rotateCircles = group.querySelectorAll(`circle[role=${ SvgElementRole.Rotate }]`)
  //   expect(rotateCircles).toHaveLength(2)

  //   const cornerResizeElement = group.querySelectorAll(`circle[role=${ SvgElementRole.Resize }]`)
  //   expect(cornerResizeElement).toHaveLength(4)
  //   const edgeResizeElement = group.querySelectorAll(`line[role=${ SvgElementRole.Resize }]`)
  //   expect(edgeResizeElement).toHaveLength(4)

  //   const strokePath = group.querySelectorAll(`[id=${ stroke.id }]`)
  //   expect(strokePath).toHaveLength(1)
  // })
})
