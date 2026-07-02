import { createEditorMock, asEditor } from "../../__mocks__/createEditorMock"
import { LeftClickEventMock, RightClickEventMock } from "../../__mocks__/EventMock"
import { buildIIStroke } from "../../helpers"
import { IISelectionManager, OBBOps, TBox, SvgElementRole, ResizeDirection, TPointerInfo, TStroke } from "@/iink"

describe("IISelectionManager.ts", () => {
  Object.defineProperty(global.SVGElement.prototype, "getBBox", {
    writable: true,
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    }),
  })

  Object.defineProperty(global.SVGElement.prototype, "getScreenCTM", {
    writable: true,
    value: jest.fn().mockReturnValue({
      a: 1,
      b: 0,
      c: 0,
      d: 1,
      e: 0,
      f: 0,
      inverse: jest.fn().mockReturnValue({
        a: 1,
        b: 0,
        c: 0,
        d: 1,
        e: 0,
        f: 0,
      }),
    }),
  })

  Object.defineProperty(global.SVGElement.prototype, "createSVGPoint", {
    writable: true,
    value: jest.fn().mockReturnValue({
      x: 0,
      y: 0,
      matrixTransform: jest.fn(function (this: { x: number; y: number }, _matrix: unknown) {
        return {
          x: this.x,
          y: this.y,
        }
      }),
    }),
  })
  test("should create", () => {
    const editor = createEditorMock()
    const manager = new IISelectionManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  test("should draw selecting rect", () => {
    const editor = createEditorMock()
    const manager = new IISelectionManager(asEditor(editor))
    manager.renderer.clearElements = jest.fn()
    manager.renderer.appendElement = jest.fn()
    const box: TBox = {
      height: 10,
      width: 20,
      x: 1,
      y: 2,
    }
    manager.drawSelectingRect(box)
    expect(manager.renderer.clearElements).toHaveBeenCalledTimes(1)
    expect(manager.renderer.appendElement).toHaveBeenCalledTimes(1)
  })

  test("should clear selecting rect", () => {
    const editor = createEditorMock()
    const manager = new IISelectionManager(asEditor(editor))
    manager.renderer.clearElements = jest.fn()
    manager.clearSelectingRect()
    expect(manager.renderer.clearElements).toHaveBeenCalledTimes(1)
  })

  describe("selected group", () => {
    const editor = createEditorMock()
    editor.menu.context.hide = jest.fn()
    const manager = new IISelectionManager(asEditor(editor))
    const stroke = buildIIStroke()

    beforeAll(async () => {
      await editor.init()
      editor.model.addSymbol(stroke)
      editor.renderer.drawSymbol(stroke)
    })

    test("should draw selected group", () => {
      manager.drawSelectedGroup([stroke])
      const group = editor.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      expect(group).not.toBeNull()
      const translateRect = group?.querySelector(`[role=${SvgElementRole.Translate}]`)
      expect(translateRect?.getAttribute("x")).toEqual(
        (OBBOps.toBox(stroke.bounds).x - (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("y")).toEqual(
        (OBBOps.toBox(stroke.bounds).y - (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("width")).toEqual(
        (stroke.bounds.width + 2 * (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("height")).toEqual(
        (stroke.bounds.height + 2 * (stroke.style.width || 1)).toString()
      )

      const rotateCircles = group.querySelectorAll(`circle[role=${SvgElementRole.Rotate}]`)
      expect(rotateCircles).toHaveLength(2)

      const cornerResizeElement = group.querySelectorAll(`circle[role=${SvgElementRole.Resize}]`)
      expect(cornerResizeElement).toHaveLength(4)
      const edgeResizeElement = group.querySelectorAll(`line[role=${SvgElementRole.Resize}]`)
      expect(edgeResizeElement).toHaveLength(4)
    })

    test("should remove selected group", () => {
      let group = editor.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      expect(group).not.toBeNull()
      manager.removeSelectedGroup()
      group = editor.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      expect(group).toBeNull()
      expect(editor.menu.context.hide).toHaveBeenCalledTimes(1)
    })
  })

  describe("isMathBlockSelected / getSelectedMathJiixBlockId", () => {
    function buildMathStroke(jiixBlockId: string): TStroke {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    test("element mode: block qualifies as soon as one of its strokes is selected", () => {
      const editor = createEditorMock()
      const manager = new IISelectionManager(asEditor(editor))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.selectedIds.add(stroke1.id)

      expect(manager.isMathBlockSelected("block-1")).toBe(true)
      expect(manager.getSelectedMathJiixBlockId()).toEqual("block-1")
    })

    test("returns false/undefined when the block has no selected strokes", () => {
      const editor = createEditorMock()
      const manager = new IISelectionManager(asEditor(editor))
      const stroke = buildMathStroke("block-1")
      editor.model.addSymbol(stroke)

      expect(manager.isMathBlockSelected("block-1")).toBe(false)
      expect(manager.getSelectedMathJiixBlockId()).toBeUndefined()
    })

    test("supports multiple selected blocks at once", () => {
      const editor = createEditorMock()
      const manager = new IISelectionManager(asEditor(editor))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-2")
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.model.selectedIds.add(stroke1.id)
      editor.model.selectedIds.add(stroke2.id)

      expect(manager.isMathBlockSelected("block-1")).toBe(true)
      expect(manager.isMathBlockSelected("block-2")).toBe(true)
      expect(manager.getSelectedMathJiixBlockId()).toBeUndefined()
    })

    test("operand mode: block only qualifies when ALL its strokes are selected", () => {
      const editor = createEditorMock()
      editor.configuration.mathSelectionLevel = "operand"
      const manager = new IISelectionManager(asEditor(editor))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      editor.model.addSymbol(stroke1)
      editor.model.addSymbol(stroke2)
      editor.jiix.getStrokesForElement = jest.fn().mockReturnValue([stroke1.id, stroke2.id])

      editor.model.selectedIds.add(stroke1.id)
      expect(manager.isMathBlockSelected("block-1")).toBe(false)

      editor.model.selectedIds.add(stroke2.id)
      expect(manager.isMathBlockSelected("block-1")).toBe(true)
    })
  })

  describe("interact elements", () => {
    Object.defineProperty(global.SVGElement.prototype, "getBBox", {
      writable: true,
      value: jest.fn().mockReturnValue({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    })
    const editor = createEditorMock()
    editor.transform.translate.start = jest.fn()
    editor.transform.translate.continue = jest.fn()
    editor.transform.translate.end = jest.fn()
    editor.transform.rotation.start = jest.fn()
    editor.transform.rotation.continue = jest.fn()
    editor.transform.rotation.end = jest.fn()
    editor.transform.resize.start = jest.fn()
    editor.transform.resize.continue = jest.fn()
    editor.transform.resize.end = jest.fn()
    const manager = new IISelectionManager(asEditor(editor))
    const stroke = buildIIStroke()

    beforeAll(async () => {
      await editor.init()
      editor.model.addSymbol(stroke)
      editor.renderer.drawSymbol(stroke)
      manager.drawSelectedGroup([stroke])
    })

    test("should not call translate.start on right pointerdown on translateEl", () => {
      const translateEl = editor.renderer.layer.querySelector(`[role=${SvgElementRole.Translate}]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(editor.transform.translate.start).not.toHaveBeenCalled()
    })
    test("should call translate.start on pointerdown on translateEl", () => {
      const translateEl = editor.renderer.layer.querySelector(`[role=${SvgElementRole.Translate}]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(editor.transform.translate.start).toHaveBeenNthCalledWith(1, translateEl, { x: 1, y: 2 })
    })
    test("should call translate.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerMove)
      expect(editor.transform.translate.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call translate.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerUp)
      expect(editor.transform.translate.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })

    test("should not call rotation.start on right pointerdown on rotateEl", () => {
      const rotateEl = editor.renderer.layer.querySelector(`[role=${SvgElementRole.Rotate}]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(editor.transform.rotation.start).not.toHaveBeenCalled()
    })
    test("should call rotation.start on pointerdown on rotateEl", () => {
      const rotateEl = editor.renderer.layer.querySelector(`[role=${SvgElementRole.Rotate}]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(editor.transform.rotation.start).toHaveBeenNthCalledWith(1, rotateEl, { x: 1, y: 2 })
    })
    test("should call rotation.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerMove)
      expect(editor.transform.rotation.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call rotation.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerUp)
      expect(editor.transform.rotation.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })

    test("should not call resize.start on right pointerdown on north resizeEl", () => {
      const resizeEl = editor.renderer.layer.querySelector(
        `[role=${SvgElementRole.Resize}][resize-direction=${ResizeDirection.North}]`
      )
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      resizeEl?.dispatchEvent(pointerDown)
      expect(editor.transform.resize.start).not.toHaveBeenCalled()
    })
    test("should call resize.start on pointerdown on north resizeEl", () => {
      const resizeEl = editor.renderer.layer.querySelector(
        `[role=${SvgElementRole.Resize}][resize-direction=${ResizeDirection.North}]`
      )
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      resizeEl?.dispatchEvent(pointerDown)
      expect(editor.transform.resize.start).toHaveBeenNthCalledWith(1, resizeEl, { x: 6, y: 13 })
    })
    test("should call resize.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerMove)
      expect(editor.transform.resize.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call resize.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      editor.renderer.layer.dispatchEvent(pointerUp)
      expect(editor.transform.resize.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })
  })

  describe("process", () => {
    const editor = createEditorMock()
    const manager = new IISelectionManager(asEditor(editor))
    const strokeToSelect = buildIIStroke({ box: { height: 10, width: 10, x: 10, y: 10 } })
    manager.model.addSymbol(strokeToSelect)
    const otherStroke = buildIIStroke({ box: { height: 10, width: 10, x: 100, y: 100 } })
    manager.model.addSymbol(otherStroke)
    manager.drawSelectingRect = jest.fn()
    manager.clearSelectingRect = jest.fn()
    manager.drawSelectedGroup = jest.fn()
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.updateSelectedState = jest.fn()

    test("start", () => {
      const info = {
        pointer: { x: 1, y: 2 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.drawSelectingRect).toHaveBeenCalledTimes(1)
    })

    test("continue", () => {
      const info = {
        pointer: { x: 20, y: 20 },
      } as TPointerInfo
      manager.continue(info)
      expect(manager.drawSelectingRect).toHaveBeenCalledTimes(1)
      expect(manager.renderer.updateSelectedState).toHaveBeenCalledTimes(1)
      expect(manager.renderer.updateSelectedState).toHaveBeenCalledWith(strokeToSelect, true)
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
    })

    test("end", async () => {
      const info = {
        pointer: { x: 20, y: 20 },
      } as TPointerInfo
      manager.end(info)
      expect(manager.drawSelectingRect).toHaveBeenCalledTimes(1)
      expect(manager.clearSelectingRect).toHaveBeenCalledTimes(1)
      expect(manager.drawSelectedGroup).toHaveBeenCalledTimes(1)
      expect(manager.drawSelectedGroup).toHaveBeenCalledWith([strokeToSelect])
      expect(manager.model.symbolsSelected).toEqual([strokeToSelect])
      // emitSelected is deferred via setTimeout(0)
      await new Promise((resolve) => setTimeout(resolve, 0))
      expect(editor.event.emitSelected).toHaveBeenCalledTimes(1)
      expect(editor.event.emitSelected).toHaveBeenCalledWith([strokeToSelect])
    })

    test("continue should throw error when no start before", () => {
      const info = {
        pointer: { x: 20, y: 20 },
      } as TPointerInfo
      expect(() => manager.continue(info)).toThrow("You need to call startSelectionByBox before")
    })
  })
})
