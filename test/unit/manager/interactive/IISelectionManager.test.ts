import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { LeftClickEventMock, RightClickEventMock } from "../../__mocks__/EventMock"
import { buildIIStroke } from "../../helpers"
import {
  IISelectionManager,
  OBBOps,
  TBox,
  SvgElementRole,
  ResizeDirection,
  TPointerInfo,
  TStroke,
  DecoratorOps,
  DecoratorKind,
} from "@/iink"

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
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  test("should draw selecting rect", () => {
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
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
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
    manager.renderer.clearElements = jest.fn()
    manager.clearSelectingRect()
    expect(manager.renderer.clearElements).toHaveBeenCalledTimes(1)
  })

  describe("selected group", () => {
    const canvas = createCanvasMock()
    canvas.menu.context.hide = jest.fn()
    const manager = new IISelectionManager(asCanvas(canvas))
    const stroke = buildIIStroke()

    beforeAll(async () => {
      await canvas.init()
      canvas.model.addSymbol(stroke)
      canvas.renderer.drawSymbol(stroke)
    })

    test("should draw selected group", () => {
      manager.drawSelectedGroup([stroke])
      const group = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
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
      let group = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      expect(group).not.toBeNull()
      manager.removeSelectedGroup()
      group = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      expect(group).toBeNull()
      expect(canvas.menu.context.hide).toHaveBeenCalledTimes(1)
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
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.selectedIds.add(stroke1.id)

      expect(manager.isMathBlockSelected("block-1")).toBe(true)
      expect(manager.getSelectedMathJiixBlockId()).toEqual("block-1")
    })

    test("returns false/undefined when the block has no selected strokes", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)

      expect(manager.isMathBlockSelected("block-1")).toBe(false)
      expect(manager.getSelectedMathJiixBlockId()).toBeUndefined()
    })

    test("supports multiple selected blocks at once", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-2")
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.selectedIds.add(stroke1.id)
      canvas.model.selectedIds.add(stroke2.id)

      expect(manager.isMathBlockSelected("block-1")).toBe(true)
      expect(manager.isMathBlockSelected("block-2")).toBe(true)
      expect(manager.getSelectedMathJiixBlockId()).toBeUndefined()
    })

    test("operand mode: block only qualifies when ALL its strokes are selected", () => {
      const canvas = createCanvasMock()
      canvas.configuration.selection.mathLevel = "operand"
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.jiix.getStrokesForElement = jest.fn().mockReturnValue([stroke1.id, stroke2.id])

      canvas.model.selectedIds.add(stroke1.id)
      expect(manager.isMathBlockSelected("block-1")).toBe(false)

      canvas.model.selectedIds.add(stroke2.id)
      expect(manager.isMathBlockSelected("block-1")).toBe(true)
    })
  })

  describe("expandSelectionForMathBlocks", () => {
    function buildMathStroke(jiixBlockId: string): TStroke {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    test("element mode: selecting one source stroke pulls in sibling strokes and the block's frozen draw result", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      const drawStroke = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.addSymbol(drawStroke)
      canvas.jiix.getStrokesForElement = jest.fn().mockReturnValue([stroke1.id, stroke2.id])
      canvas.math.getStoredSolverOutputs = jest.fn().mockReturnValue([drawStroke.id])
      canvas.model.selectedIds.add(stroke1.id)

      manager.expandSelectionForMathBlocks()

      expect(canvas.model.selectedIds.has(stroke2.id)).toBe(true)
      expect(canvas.model.selectedIds.has(drawStroke.id)).toBe(true)
    })

    test("element mode: no draw yet, only sibling source strokes are pulled in", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.jiix.getStrokesForElement = jest.fn().mockReturnValue([stroke1.id, stroke2.id])
      canvas.math.getStoredSolverOutputs = jest.fn().mockReturnValue(undefined)
      canvas.model.selectedIds.add(stroke1.id)

      manager.expandSelectionForMathBlocks()

      expect(canvas.model.selectedIds.has(stroke2.id)).toBe(true)
    })

    test("operand mode: does not expand the selection", () => {
      const canvas = createCanvasMock()
      canvas.configuration.selection.mathLevel = "operand"
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke1 = buildMathStroke("block-1")
      const stroke2 = buildMathStroke("block-1")
      const drawStroke = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      canvas.model.addSymbol(drawStroke)
      canvas.jiix.getStrokesForElement = jest.fn().mockReturnValue([stroke1.id, stroke2.id])
      canvas.math.getStoredSolverOutputs = jest.fn().mockReturnValue([drawStroke.id])
      canvas.model.selectedIds.add(stroke1.id)

      manager.expandSelectionForMathBlocks()

      expect(canvas.model.selectedIds.has(stroke2.id)).toBe(false)
      expect(canvas.model.selectedIds.has(drawStroke.id)).toBe(false)
    })
  })

  describe("selection rectangle includes ghost bounds", () => {
    function buildMathStroke(jiixBlockId: string): TStroke {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    test("element mode: merges the block's ghost bounds into the selection rectangle", async () => {
      const canvas = createCanvasMock()
      canvas.menu.context.hide = jest.fn()
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      await canvas.init()
      canvas.model.addSymbol(stroke)
      canvas.renderer.drawSymbol(stroke)

      const strokeBox = OBBOps.toBox(stroke.bounds)
      const ghostBox: TBox = {
        x: strokeBox.x + strokeBox.width + 50,
        y: strokeBox.y,
        width: 10,
        height: 10,
      }
      canvas.math.getGhostBounds = jest.fn().mockReturnValue(ghostBox)

      manager.drawSelectedGroup([stroke])

      const group = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      const translateRect = group?.querySelector(`[role=${SvgElementRole.Translate}]`)
      const rectX = Number(translateRect?.getAttribute("x"))
      const rectWidth = Number(translateRect?.getAttribute("width"))

      expect(rectX + rectWidth).toBeGreaterThanOrEqual(ghostBox.x + ghostBox.width)
    })

    test("operand mode: does not merge ghost bounds into the selection rectangle", async () => {
      const canvas = createCanvasMock()
      canvas.menu.context.hide = jest.fn()
      canvas.configuration.selection.mathLevel = "operand"
      const manager = new IISelectionManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      await canvas.init()
      canvas.model.addSymbol(stroke)
      canvas.renderer.drawSymbol(stroke)

      const strokeBox = OBBOps.toBox(stroke.bounds)
      const ghostBox: TBox = {
        x: strokeBox.x + strokeBox.width + 50,
        y: strokeBox.y,
        width: 10,
        height: 10,
      }
      canvas.math.getGhostBounds = jest.fn().mockReturnValue(ghostBox)

      manager.drawSelectedGroup([stroke])

      const group = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.InteractElementsGroup}]`) as SVGGElement
      const translateRect = group?.querySelector(`[role=${SvgElementRole.Translate}]`)
      const rectX = Number(translateRect?.getAttribute("x"))
      const rectWidth = Number(translateRect?.getAttribute("width"))

      expect(rectX + rectWidth).toBeLessThan(ghostBox.x + ghostBox.width)
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
    const canvas = createCanvasMock()
    canvas.transform.translate.start = jest.fn()
    canvas.transform.translate.continue = jest.fn()
    canvas.transform.translate.end = jest.fn()
    canvas.transform.rotation.start = jest.fn()
    canvas.transform.rotation.continue = jest.fn()
    canvas.transform.rotation.end = jest.fn()
    canvas.transform.resize.start = jest.fn()
    canvas.transform.resize.continue = jest.fn()
    canvas.transform.resize.end = jest.fn()
    const manager = new IISelectionManager(asCanvas(canvas))
    const stroke = buildIIStroke()

    beforeAll(async () => {
      await canvas.init()
      canvas.model.addSymbol(stroke)
      canvas.renderer.drawSymbol(stroke)
      manager.drawSelectedGroup([stroke])
    })

    test("should not call translate.start on right pointerdown on translateEl", () => {
      const translateEl = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.Translate}]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(canvas.transform.translate.start).not.toHaveBeenCalled()
    })
    test("should call translate.start on pointerdown on translateEl", () => {
      const translateEl = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.Translate}]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      translateEl?.dispatchEvent(pointerDown)
      expect(canvas.transform.translate.start).toHaveBeenNthCalledWith(1, translateEl, { x: 1, y: 2 })
    })
    test("should call translate.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerMove)
      expect(canvas.transform.translate.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call translate.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerUp)
      expect(canvas.transform.translate.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })

    test("should not call rotation.start on right pointerdown on rotateEl", () => {
      const rotateEl = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.Rotate}]`)
      const pointerDown = new RightClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(canvas.transform.rotation.start).not.toHaveBeenCalled()
    })
    test("should call rotation.start on pointerdown on rotateEl", () => {
      const rotateEl = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.Rotate}]`)
      const pointerDown = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 1,
        clientY: 2,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      rotateEl?.dispatchEvent(pointerDown)
      expect(canvas.transform.rotation.start).toHaveBeenNthCalledWith(1, rotateEl, { x: 1, y: 2 })
    })
    test("should call rotation.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerMove)
      expect(canvas.transform.rotation.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call rotation.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerUp)
      expect(canvas.transform.rotation.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })

    test("should not call resize.start on right pointerdown on north resizeEl", () => {
      const resizeEl = canvas.renderer.layer.querySelector(
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
      expect(canvas.transform.resize.start).not.toHaveBeenCalled()
    })
    test("should call resize.start on pointerdown on north resizeEl", () => {
      const resizeEl = canvas.renderer.layer.querySelector(
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
      expect(canvas.transform.resize.start).toHaveBeenNthCalledWith(1, resizeEl, { x: 6, y: 13 })
    })
    test("should call resize.continue on pointermove on render layer", () => {
      const pointerMove = new LeftClickEventMock("pointermove", {
        pointerType: "pen",
        clientX: 3,
        clientY: 4,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerMove)
      expect(canvas.transform.resize.continue).toHaveBeenNthCalledWith(1, { x: 3, y: 4 })
    })
    test("should call resize.end on pointerup on render layer", () => {
      const pointerUp = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 5,
        clientY: 6,
        pressure: 1,
        pointerId: 1,
      }) as PointerEvent
      canvas.renderer.layer.dispatchEvent(pointerUp)
      expect(canvas.transform.resize.end).toHaveBeenNthCalledWith(1, { x: 5, y: 6 })
    })
  })

  describe("process", () => {
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
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
      expect(canvas.event.emitSelected).toHaveBeenCalledTimes(1)
      expect(canvas.event.emitSelected).toHaveBeenCalledWith([strokeToSelect])
    })

    test("continue should throw error when no start before", () => {
      const info = {
        pointer: { x: 20, y: 20 },
      } as TPointerInfo
      expect(() => manager.continue(info)).toThrow("You need to call startSelectionByBox before")
    })
  })

  describe("standalone decorators are never directly selectable", () => {
    test("box selection over a decorated stroke selects the stroke, not the decorator", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      manager.drawSelectingRect = jest.fn()
      manager.renderer.updateSelectedState = jest.fn()

      const stroke = buildIIStroke({ box: { height: 10, width: 10, x: 10, y: 10 } })
      manager.model.addSymbol(stroke)
      const decorator = DecoratorOps.create(DecoratorKind.Surround, {}, [stroke.id], OBBOps.toBox(stroke.bounds))
      manager.model.addSymbol(decorator)

      manager.start({ pointer: { x: 1, y: 2 } } as TPointerInfo)
      manager.continue({ pointer: { x: 20, y: 20 } } as TPointerInfo)

      expect(manager.model.selectedIds.has(stroke.id)).toBe(true)
      expect(manager.model.selectedIds.has(decorator.id)).toBe(false)
      expect(manager.renderer.updateSelectedState).not.toHaveBeenCalledWith(decorator, true)
    })
  })
})
