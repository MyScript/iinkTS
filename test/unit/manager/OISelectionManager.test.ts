import { buildOIStroke } from "../helpers"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import
{
  OISelectionManager,
  TBoundingBox,
  SvgElementRole,
  ResizeDirection,
} from "../../../src/iink"
import { LeftClickEventMock, RightClickEventMock } from "../__mocks__/EventMock"

describe("OISelectionManager.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OISelectionManager(behaviors)
    expect(manager).toBeDefined()
  })

  test("should draw selecting rect", () =>
  {
    const behaviors = new OIBehaviorsMock()
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
    const behaviors = new OIBehaviorsMock()
    const manager = new OISelectionManager(behaviors)
    manager.renderer.clearElements = jest.fn()
    manager.clearSelectingRect()
    expect(manager.renderer.clearElements).toBeCalledTimes(1)
  })

  describe("selected group", () =>
  {
    Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      }),
    })
    const behaviors = new OIBehaviorsMock()
    behaviors.menu.context.hide = jest.fn()
    const manager = new OISelectionManager(behaviors)
    const stroke = buildOIStroke()

    beforeAll(async () =>
    {
      await behaviors.init()
      behaviors.model.addSymbol(stroke)
      behaviors.renderer.drawSymbol(stroke)
    })

    test("should draw selected group", () =>
    {
      manager.drawSelectedGroup([stroke])
      const group = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.InteractElementsGroup }]`) as SVGGElement
      expect(group).not.toBeNull()
      const translateRect = group?.querySelector(`[role=${ SvgElementRole.Translate }]`)
      expect(translateRect?.getAttribute("x")).toEqual((stroke.bounds.x - (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("y")).toEqual((stroke.bounds.y - (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("width")).toEqual((stroke.bounds.width + 2 * (stroke.style.width || 1)).toString())
      expect(translateRect?.getAttribute("height")).toEqual((stroke.bounds.height + 2 * (stroke.style.width || 1)).toString())

      const rotateCircles = group.querySelectorAll(`circle[role=${ SvgElementRole.Rotate }]`)
      expect(rotateCircles).toHaveLength(2)

      const cornerResizeElement = group.querySelectorAll(`circle[role=${ SvgElementRole.Resize }]`)
      expect(cornerResizeElement).toHaveLength(4)
      const edgeResizeElement = group.querySelectorAll(`line[role=${ SvgElementRole.Resize }]`)
      expect(edgeResizeElement).toHaveLength(4)
    })

    test("should remove selected group", () =>
    {
      let group = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.InteractElementsGroup }]`) as SVGGElement
      expect(group).not.toBeNull()
      manager.removeSelectedGroup()
      group = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.InteractElementsGroup }]`) as SVGGElement
      expect(group).toBeNull()
      expect(behaviors.menu.context.hide).toHaveBeenCalledTimes(1)
    })

    test("should reset selected group", () =>
    {
      manager.drawSelectedGroup = jest.fn()
      manager.removeSelectedGroup = jest.fn()
      manager.resetSelectedGroup([stroke])
      expect(manager.drawSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.removeSelectedGroup).toHaveBeenCalledTimes(1)
    })
  })

  describe("interact elements", () =>
  {
    Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10
      }),
    })
    const behaviors = new OIBehaviorsMock()
    behaviors.translator.start = jest.fn()
    behaviors.translator.continue = jest.fn()
    behaviors.translator.end = jest.fn()
    behaviors.rotator.start = jest.fn()
    behaviors.rotator.continue = jest.fn()
    behaviors.rotator.end = jest.fn()
    behaviors.resizer.start = jest.fn()
    behaviors.resizer.continue = jest.fn()
    behaviors.resizer.end = jest.fn()
    const manager = new OISelectionManager(behaviors)
    manager.resetSelectedGroup = jest.fn()
    const stroke = buildOIStroke()

    beforeAll(async () =>
    {
      await behaviors.init()
      behaviors.model.addSymbol(stroke)
      behaviors.renderer.drawSymbol(stroke)
      manager.drawSelectedGroup([stroke])
    })

    test("should not call translator.start on right pointerdown on translateEl", () =>
    {
      const translateEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Translate }]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(behaviors.translator.start).not.toHaveBeenCalled()
    })
    test("should call translator.start on pointerdown on translateEl", () =>
    {
      const translateEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Translate }]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(behaviors.translator.start).toHaveBeenNthCalledWith(1, translateEl, { x: 1, y: 2 })
    })
    test("should call translator.continue on pointermove on render layer", () =>
    {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerMove)
      expect(behaviors.translator.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call translator.end on pointerup on render layer", () =>
    {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerUp)
      expect(behaviors.translator.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
      expect(manager.resetSelectedGroup).toHaveBeenCalledTimes(1)
    })

    test("should not call rotator.start on right pointerdown on rotateEl", () =>
    {
      const rotateEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Rotate }]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(behaviors.rotator.start).not.toHaveBeenCalled()
    })
    test("should call rotator.start on pointerdown on rotateEl", () =>
    {
      const rotateEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Rotate }]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(behaviors.rotator.start).toHaveBeenNthCalledWith(1, rotateEl, { x: 1, y: 2 })
    })
    test("should call rotator.continue on pointermove on render layer", () =>
    {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerMove)
      expect(behaviors.rotator.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call rotator.end on pointerup on render layer", () =>
    {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerUp)
      expect(behaviors.rotator.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
      expect(manager.resetSelectedGroup).toHaveBeenCalledTimes(1)
    })

    test("should not call resizer.start on right pointerdown on north resizeEl", () =>
    {
      const resizeEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Resize }][resize-direction=${ResizeDirection.North}]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      resizeEl?.dispatchEvent(pointerDown)
      expect(behaviors.resizer.start).not.toHaveBeenCalled()
    })
    test("should call resizer.start on pointerdown on north resizeEl", () =>
    {
      const resizeEl = behaviors.renderer.layer.querySelector(`[role=${ SvgElementRole.Resize }][resize-direction=${ResizeDirection.North}]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      resizeEl?.dispatchEvent(pointerDown)
      expect(behaviors.resizer.start).toHaveBeenNthCalledWith(1, resizeEl, { x: 6, y: 13 })
    })
    test("should call resizer.continue on pointermove on render layer", () =>
    {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerMove)
      expect(behaviors.resizer.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call resizer.end on pointerup on render layer", () =>
    {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1
      }) as PointerEvent
      behaviors.renderer.layer.dispatchEvent(pointerUp)
      expect(behaviors.resizer.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
      expect(manager.resetSelectedGroup).toHaveBeenCalledTimes(1)
    })

  })

  describe("process", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const manager = new OISelectionManager(behaviors)
    const strokeToSelect = buildOIStroke({ box: { height: 10, width: 10, x: 10, y: 10 } })
    manager.model.addSymbol(strokeToSelect)
    const otherStroke = buildOIStroke({ box: { height: 10, width: 10, x: 100, y: 100 } })
    manager.model.addSymbol(otherStroke)
    manager.drawSelectingRect = jest.fn()
    manager.clearSelectingRect = jest.fn()
    manager.drawSelectedGroup = jest.fn()
    manager.renderer.drawSymbol = jest.fn()

    test("start", () =>
    {
      manager.start({ x: 1, y: 2 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
    })

    test("continue", () =>
    {
      manager.continue({ x: 20, y: 20 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
      expect(manager.renderer.drawSymbol).toBeCalledTimes(1)
      expect(manager.renderer.drawSymbol).toBeCalledWith(strokeToSelect)
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
    })

    test("end", () =>
    {
      manager.end({ x: 20, y: 20 })
      expect(manager.drawSelectingRect).toBeCalledTimes(1)
      expect(manager.clearSelectingRect).toBeCalledTimes(1)
      expect(manager.drawSelectedGroup).toBeCalledTimes(1)
      expect(manager.drawSelectedGroup).toBeCalledWith([strokeToSelect])
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
      expect(manager.behaviors.event.emitSelected).toBeCalledTimes(1)
      expect(manager.behaviors.event.emitSelected).toBeCalledWith([strokeToSelect])
    })

    test("continue should throw error when no start before", () =>
    {
      expect(() => manager.continue({ x: 20, y: 20 })).toThrowError("You need to call startSelectionByBox before")
    })
  })

})
