import { buildOIStroke } from "../helpers"
import { OISVGSelectionUtils, OISVGStrokeUtil, SELECTION_MARGIN, SvgElementRole, TBoundingBox } from "../../../src/iink"

describe("OISVGSelectionUtils.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const selectionUtils = new OISVGSelectionUtils(selectionFilterId)

  test("should get selecting rect", () =>
  {
    const box: TBoundingBox = {
      height: 10,
      width: 20,
      x: 1,
      y: 2
    }
    const rectEl = selectionUtils.getSelectingRect(box)
    expect(rectEl).toBeDefined()
    expect(rectEl.getAttribute("fill")).toEqual("transparent")
    expect(rectEl.getAttribute("stroke")).toEqual("grey")
    expect(rectEl.getAttribute("opacity")).toEqual("0.25")
    expect(rectEl.getAttribute("role")).toEqual(SvgElementRole.Selecting)
    expect(rectEl.getAttribute("x")).toEqual(box.x.toString())
    expect(rectEl.getAttribute("y")).toEqual(box.y.toString())
    expect(rectEl.getAttribute("width")).toEqual(box.width.toString())
    expect(rectEl.getAttribute("height")).toEqual(box.height.toString())
    expect(rectEl.tagName).toEqual("rect")
  })

  test("should get the selected group", () =>
  {
    const renderer = new OISVGStrokeUtil(selectionFilterId)

    const stroke = buildOIStroke()
    const strokeEl = renderer.getSVGElement(stroke)
    //@ts-ignore
    window.SVGElement.prototype.getBBox = () => stroke.boundingBox

    const group = selectionUtils.wrapElements([strokeEl]) as SVGGElement
    expect(group).not.toBeNull()
    expect(group.getAttribute("role")).toEqual(SvgElementRole.Selected)
    const translateRect = group?.querySelector(`[role=${ SvgElementRole.Translate}]`)
    expect(translateRect?.getAttribute("x")).toEqual((stroke.boundingBox.x - SELECTION_MARGIN).toString())
    expect(translateRect?.getAttribute("y")).toEqual((stroke.boundingBox.y  - SELECTION_MARGIN).toString())
    expect(translateRect?.getAttribute("width")).toEqual((stroke.boundingBox.width + 2 * SELECTION_MARGIN).toString())
    expect(translateRect?.getAttribute("height")).toEqual((stroke.boundingBox.height + 2 * SELECTION_MARGIN).toString())

    const rotateCircles = group.querySelectorAll(`[role=${ SvgElementRole.Rotate}]`)
    expect(rotateCircles).toHaveLength(2)

    const resizeElements = group.querySelectorAll(`[role=${ SvgElementRole.Resize}]`)
    expect(resizeElements).toHaveLength(8)

    const strokePath = group.querySelectorAll(`[id=${ stroke.id}]`)
    expect(strokePath).toHaveLength(1)
  })
})
