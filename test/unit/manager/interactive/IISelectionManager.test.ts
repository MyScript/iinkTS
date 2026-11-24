import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { LeftClickEventMock, RightClickEventMock } from "../../__mocks__/EventMock"
import { buildIICircle, buildIILine, buildIIStroke } from "../../helpers"
import { SymbolGeometry, IISelectionManager, MatrixTransform, OBBOps, TBox, SvgElementRole, ResizeDirection, TPointerInfo, TStroke, TEdgeArc, computePointOnEllipse, IIConnectorManager, EdgeUtil, ShapeUtil, TEdge, TBaseSymbol, TSymbol } from "@/iink"

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
        (OBBOps.toBox(SymbolGeometry.boundsOf(stroke)).x - (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("y")).toEqual(
        (OBBOps.toBox(SymbolGeometry.boundsOf(stroke)).y - (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("width")).toEqual(
        (SymbolGeometry.boundsOf(stroke).width + 2 * (stroke.style.width || 1)).toString()
      )
      expect(translateRect?.getAttribute("height")).toEqual(
        (SymbolGeometry.boundsOf(stroke).height + 2 * (stroke.style.width || 1)).toString()
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
      canvas.model.selectSymbol(stroke1.id)

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
      canvas.model.selectSymbol(stroke1.id)
      canvas.model.selectSymbol(stroke2.id)

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

      canvas.model.selectSymbol(stroke1.id)
      expect(manager.isMathBlockSelected("block-1")).toBe(false)

      canvas.model.selectSymbol(stroke2.id)
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
      canvas.model.selectSymbol(stroke1.id)

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
      canvas.model.selectSymbol(stroke1.id)

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
      canvas.model.selectSymbol(stroke1.id)

      manager.expandSelectionForMathBlocks()

      expect(canvas.model.selectedIds.has(stroke2.id)).toBe(false)
      expect(canvas.model.selectedIds.has(drawStroke.id)).toBe(false)
    })
  })

  describe("expandSelectionForBlocks", () => {
    test("selecting one stroke of a 3-stroke shape block selects all 3", () => {
      const canvas = createCanvasMock()
      const s1 = buildIIStroke()
      const s2 = buildIIStroke()
      const s3 = buildIIStroke()
      s1.jiixBlockId = "shape-block-1"
      s1.jiixBlockType = "Node"
      s2.jiixBlockId = "shape-block-1"
      s2.jiixBlockType = "Node"
      s3.jiixBlockId = "shape-block-1"
      s3.jiixBlockType = "Node"
      canvas.model.addSymbol(s1)
      canvas.model.addSymbol(s2)
      canvas.model.addSymbol(s3)
      canvas.model.selectSymbol(s1.id)
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([s1.id, s2.id, s3.id])

      const selector = new IISelectionManager(asCanvas(canvas))
      selector.expandSelectionForBlocks()

      expect(canvas.model.selectedIds.has(s2.id)).toBe(true)
      expect(canvas.model.selectedIds.has(s3.id)).toBe(true)
    })

    test("also expands Edge-type blocks the same way", () => {
      const canvas = createCanvasMock()
      const s1 = buildIIStroke()
      const s2 = buildIIStroke()
      s1.jiixBlockId = "edge-block-1"
      s1.jiixBlockType = "Edge"
      s2.jiixBlockId = "edge-block-1"
      s2.jiixBlockType = "Edge"
      canvas.model.addSymbol(s1)
      canvas.model.addSymbol(s2)
      canvas.model.selectSymbol(s1.id)
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([s1.id, s2.id])

      const selector = new IISelectionManager(asCanvas(canvas))
      selector.expandSelectionForBlocks()

      expect(canvas.model.selectedIds.has(s2.id)).toBe(true)
    })

    test("end(): finishing a drag-select over one stroke of a shape block also selects its siblings", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const s1 = buildIIStroke({ box: { height: 10, width: 10, x: 10, y: 10 } })
      const s2 = buildIIStroke({ box: { height: 10, width: 10, x: 100, y: 100 } })
      const s3 = buildIIStroke({ box: { height: 10, width: 10, x: 200, y: 200 } })
      s1.jiixBlockId = "shape-block-1"
      s1.jiixBlockType = "Node"
      s2.jiixBlockId = "shape-block-1"
      s2.jiixBlockType = "Node"
      s3.jiixBlockId = "shape-block-1"
      s3.jiixBlockType = "Node"
      canvas.model.addSymbol(s1)
      canvas.model.addSymbol(s2)
      canvas.model.addSymbol(s3)
      // getShapeSelectionGroups defaults to [] (see createCanvasMock), so continue() falls back
      // to per-stroke bounds overlap: only s1 (under the drag rect) gets selected there. The
      // sibling pull-in below must come from end()'s own expandSelectionForBlocks() call, not
      // from continue()'s group-overlap logic.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([s1.id, s2.id, s3.id])

      manager.start({ pointer: { x: 10, y: 10 } } as TPointerInfo)
      manager.end({ pointer: { x: 15, y: 15 } } as TPointerInfo)

      expect(canvas.model.selectedIds.has(s1.id)).toBe(true)
      expect(canvas.model.selectedIds.has(s2.id)).toBe(true)
      expect(canvas.model.selectedIds.has(s3.id)).toBe(true)
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

      const strokeBox = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
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

      const strokeBox = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
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

  /**
   * The regression this closes: `continue()`'s surround-select tested every symbol's raw (pre-move)
   * geometry against the drag box, so a symbol moved by a translate/rotate/resize was never selected
   * by a box drawn where it now actually sits.
   */
  describe("surrounding a translated symbol", () => {
    test("a stroke moved by a translate is selected at its new position", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      manager.drawSelectingRect = jest.fn()
      manager.renderer.updateSelectedState = jest.fn()

      // Raw pointers sit at [100,110]x[100,110]; translate(-90,-90) puts the stroke at [10,20]x[10,20].
      const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
      stroke.transform = MatrixTransform.identity().translate(-90, -90)
      manager.model.addSymbol(stroke)

      manager.start({ pointer: { x: 1, y: 2 } } as TPointerInfo)
      manager.continue({ pointer: { x: 20, y: 20 } } as TPointerInfo)

      expect(manager.model.selectedIds.has(stroke.id)).toBe(true)
    })

    test("the same stroke is not selected by a query drawn over its stale, pre-move position", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      manager.drawSelectingRect = jest.fn()
      manager.renderer.updateSelectedState = jest.fn()

      const stroke = buildIIStroke({ box: { x: 100, y: 100, width: 10, height: 10 } })
      stroke.transform = MatrixTransform.identity().translate(-90, -90)
      manager.model.addSymbol(stroke)

      manager.start({ pointer: { x: 95, y: 95 } } as TPointerInfo)
      manager.continue({ pointer: { x: 115, y: 115 } } as TPointerInfo)

      expect(manager.model.selectedIds.has(stroke.id)).toBe(false)
    })
  })

  describe("createEdgeResizeGroup — Arc handle drag", () => {
    function setup() {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, Math.PI, -Math.PI, 5, 5, 0)
      canvas.model.addSymbol(arc)
      const group = (
        manager as unknown as { createEdgeResizeGroup: (edge: TEdgeArc) => SVGGElement }
      ).createEdgeResizeGroup(arc)
      /** The drag commits a draft, so the local `arc` is a pre-drag snapshot: read the document. */
      const current = () => canvas.model.getSymbol(arc.id) as TEdgeArc
      return { canvas, arc, group, current }
    }

    function dragHandle(canvas: ReturnType<typeof createCanvasMock>, group: SVGGElement, index: number, target: { x: number; y: number }) {
      const el = group.children[index] as unknown as SVGCircleElement
      el.dispatchEvent(new LeftClickEventMock("pointerdown", { clientX: 0, clientY: 0, pointerType: "pen", pressure: 1 }))
      canvas.renderer.layer.dispatchEvent(
        new LeftClickEventMock("pointermove", { clientX: target.x, clientY: target.y, pointerType: "pen", pressure: 1 })
      )
      canvas.renderer.layer.dispatchEvent(
        new LeftClickEventMock("pointerup", { clientX: target.x, clientY: target.y, pointerType: "pen", pressure: 1 })
      )
    }

    /**
     * The regression this closes: this branch called `EdgeUtil.getArcResizePoints(arc)` directly,
     * bypassing `EdgeUtil` (and so the matrix) entirely — a translated arc's handles rendered at
     * its raw, pre-move position.
     */
    test("resize handles for a translated arc render at the moved position, not the raw one", () => {
      const canvas = createCanvasMock()
      const manager = new IISelectionManager(asCanvas(canvas))
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, Math.PI, -Math.PI, 5, 5, 0)
      arc.transform = MatrixTransform.identity().translate(100, 200)
      canvas.model.addSymbol(arc)
      const group = (
        manager as unknown as { createEdgeResizeGroup: (edge: TEdgeArc) => SVGGElement }
      ).createEdgeResizeGroup(arc)

      // `EdgeUtil.getArcResizePoints` picks arc.vertices[0], its middle index and its last index —
      // read directly here (the same stored field it reads), each shifted by the translate by hand.
      const arcVertices = EdgeUtil.getArcVertices(arc)
      const raw = [arcVertices[0], arcVertices[Math.floor(arcVertices.length / 2)], arcVertices[arcVertices.length - 1]]
      const handles = Array.from(group.children) as unknown as SVGCircleElement[]
      expect(handles.map((h) => [Number(h.getAttribute("cx")), Number(h.getAttribute("cy"))])).toEqual(
        raw.map((p) => [p.x + 100, p.y + 200])
      )
    })

    test("dragging the start handle keeps the end endpoint fixed", () => {
      const { canvas, arc, group, current } = setup()
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)

      dragHandle(canvas, group, 0, { x: 3, y: 4 })

      const endAfter = computePointOnEllipse(current().center, current().radiusX, current().radiusY, current().phi, current().startAngle + current().sweepAngle)
      expect(endAfter.x).toBeCloseTo(endBefore.x, 1)
      expect(endAfter.y).toBeCloseTo(endBefore.y, 1)
    })

    test("dragging the end handle keeps the start endpoint fixed", () => {
      const { canvas, arc, group } = setup()
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)

      dragHandle(canvas, group, 2, { x: -3, y: -4 })

      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      expect(startAfter.x).toBeCloseTo(startBefore.x, 1)
      expect(startAfter.y).toBeCloseTo(startBefore.y, 1)
    })

    test("dragging the middle handle keeps BOTH endpoints fixed (the reported bug)", () => {
      const { canvas, arc, group, current } = setup()
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle + arc.sweepAngle)
      const radiusYBefore = arc.radiusY

      dragHandle(canvas, group, 1, { x: 0, y: 20 })

      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endAfter = computePointOnEllipse(current().center, current().radiusX, current().radiusY, current().phi, current().startAngle + current().sweepAngle)
      expect(startAfter.x).toBeCloseTo(startBefore.x, 1)
      expect(startAfter.y).toBeCloseTo(startBefore.y, 1)
      expect(endAfter.x).toBeCloseTo(endBefore.x, 1)
      expect(endAfter.y).toBeCloseTo(endBefore.y, 1)
      // The bulge actually changed (not a no-op) — the fix moves curvature, not endpoints.
      expect(current().radiusY).not.toBeCloseTo(radiusYBefore, 1)
    })

    test("dragging the end handle out beyond the current ellipse stretches the radius and lands exactly on the drop point", () => {
      const { canvas, arc, group, current } = setup()
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const radiusYBefore = arc.radiusY

      dragHandle(canvas, group, 2, { x: 10, y: 0 })

      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endAfter = computePointOnEllipse(current().center, current().radiusX, current().radiusY, current().phi, current().startAngle + current().sweepAngle)
      expect(startAfter.x).toBeCloseTo(startBefore.x, 1)
      expect(startAfter.y).toBeCloseTo(startBefore.y, 1)
      expect(endAfter.x).toBeCloseTo(10, 1)
      expect(endAfter.y).toBeCloseTo(0, 1)
      // No longer locked to the original ellipse — the radius actually stretched.
      expect(current().radiusY).not.toBeCloseTo(radiusYBefore, 1)
    })

    test("dragging the end handle past the start handle (crossover) keeps start fixed and lands on the drop point, no crash", () => {
      const { canvas, arc, group, current } = setup()
      const startBefore = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)

      // start is at x=-5; drop end well past it, at x=-15.
      dragHandle(canvas, group, 2, { x: -15, y: 2 })

      expect(Number.isFinite(arc.radiusX)).toBe(true)
      expect(Number.isFinite(arc.radiusY)).toBe(true)
      const startAfter = computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, arc.startAngle)
      const endAfter = computePointOnEllipse(current().center, current().radiusX, current().radiusY, current().phi, current().startAngle + current().sweepAngle)
      expect(startAfter.x).toBeCloseTo(startBefore.x, 1)
      expect(startAfter.y).toBeCloseTo(startBefore.y, 1)
      expect(endAfter.x).toBeCloseTo(-15, 1)
      expect(endAfter.y).toBeCloseTo(2, 1)
    })

    test("dragging the end handle onto a shape anchors it and stretches the arc so the endpoint lands exactly on the shape's center", () => {
      const canvas = createCanvasMock()
      // Real connector: the stub would no-op findSymbolAtPoint/applyEndpointAnchor entirely.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const manager = new IISelectionManager(asCanvas(canvas))
      const arc = EdgeUtil.createArc({ x: 0, y: 0 }, Math.PI, -Math.PI, 5, 5, 0)
      canvas.model.addSymbol(arc)
      const circle = ShapeUtil.createCircle({ x: 50, y: 0 }, 20)
      canvas.model.addSymbol(circle)
      const group = (
        manager as unknown as { createEdgeResizeGroup: (edge: TEdgeArc) => SVGGElement }
      ).createEdgeResizeGroup(arc)
      const current = () => canvas.model.getSymbol(arc.id) as TEdgeArc

      dragHandle(canvas, group, 2, { x: 55, y: 5 })

      expect(current().endAnchor).toEqual(
        expect.objectContaining({ symbolId: circle.id, normalizedX: 0.5, normalizedY: 0.5 })
      )
      const endAfter = computePointOnEllipse(current().center, current().radiusX, current().radiusY, current().phi, current().startAngle + current().sweepAngle)
      expect(endAfter.x).toBeCloseTo(50, 1)
      expect(endAfter.y).toBeCloseTo(0, 1)
    })
  })
  describe("JIIX group sets", () => {
    // Guard for the shared helper the three getXxxGroupSets wrappers delegate to: the one thing a
    // behaviour-preserving extraction can get wrong is wiring a wrapper to the wrong getter or the
    // wrong configured level. Passes before and after the extraction, by design.
    test("should ask each JIIX getter for its own configured level", () => {
      const canvas = createCanvasMock()
      canvas.configuration.selection.textLevel = "word"
      canvas.configuration.selection.mathLevel = "operand"
      canvas.configuration.selection.shapeLevel = "element"
      const manager = new IISelectionManager(asCanvas(canvas))

      manager.start({ pointer: { x: 10, y: 10 } } as TPointerInfo)
      manager.end({ pointer: { x: 15, y: 15 } } as TPointerInfo)

      expect(canvas.jiix.getTextSelectionGroups).toHaveBeenCalledWith("word")
      expect(canvas.jiix.getMathSelectionGroups).toHaveBeenCalledWith("operand")
      expect(canvas.jiix.getShapeSelectionGroups).toHaveBeenCalledWith("element")
    })
  })

})

/**
 * `createEdgeTranslatePath` carried a fourth `switch` on `edge.kind`, calling the same three `Ops`
 * that `EdgeUtil`'s kind table has called since IIC-2002. IIC-2008 deleted it. These tests hold the
 * property that made the deletion safe: the hit path is the edge's own path, for every kind.
 *
 * It matters beyond tidiness — the hit area follows the edge's geometry rather than its bounding
 * box, which on a diagonal edge would be a far larger clickable rectangle than the edge itself.
 */
describe("IISelectionManager edge translate hit path", () => {
  const EDGES: Record<string, () => TEdge> = {
    line: () => buildIILine({ start: { x: 0, y: 0 }, end: { x: 40, y: 30 } }),
    polyedge: () =>
      EdgeUtil.createPolyLine([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
      ]),
    arc: () => EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 30, 20, 0),
  }

  test.each(Object.entries(EDGES))("%s should be drawn from the edge's own path", async (_kind, build) => {
    // A canvas per case: `drawSelectedGroup` appends to the layer, so a shared one would make the
    // query depend on the order the cases ran in.
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
    await canvas.init()
    const edge = build()
    canvas.model.addSymbol(edge)
    canvas.renderer.drawSymbol(edge)
    manager.drawSelectedGroup([edge])

    const el = canvas.renderer.layer.querySelector(`[role=${SvgElementRole.Translate}]`)
    expect(el?.tagName).toBe("path")
    expect(el?.getAttribute("d")).toBe(EdgeUtil.getSVGPath(edge))
    expect(el?.getAttribute("d")).toBeTruthy()
  })
})

/**
 * `EdgeUtil.getEdgeResizePoints` was an `if/else` dispatcher over the three edge kinds, with this
 * manager as its only caller. IIC-2009 replaced it with `getResizePoints` on the contract, answered
 * from `EdgeUtil`'s kind table.
 *
 * Nothing covered the handles before: making the util report none at all left this whole suite
 * green. These are what hold them.
 */
describe("IISelectionManager edge resize handles", () => {
  const EDGES: Record<string, () => TEdge> = {
    line: () => buildIILine({ start: { x: 0, y: 0 }, end: { x: 40, y: 30 } }),
    polyedge: () =>
      EdgeUtil.createPolyLine([
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
      ]),
  }

  // The arc is deliberately absent: this manager branches on `isArcEdge` before reaching the util,
  // to bind start/mid/end handles to arc-specific drag behaviour. The dispatcher's own arc branch
  // was therefore dead code, and deleting it changed nothing for arcs.

  test.each(Object.entries(EDGES))("%s should offer one handle per point the util reports", async (_kind, build) => {
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
    await canvas.init()
    const edge = build()
    canvas.model.addSymbol(edge)
    canvas.renderer.drawSymbol(edge)
    manager.drawSelectedGroup([edge])

    const expected = new EdgeUtil().getResizePoints(edge)
    expect(expected.length).toBeGreaterThan(1)

    const handles = Array.from(canvas.renderer.layer.querySelectorAll(`circle[role=${SvgElementRole.Resize}]`))
    expect(handles).toHaveLength(expected.length)
    expect(handles.map((h) => [Number(h.getAttribute("cx")), Number(h.getAttribute("cy"))])).toEqual(
      expected.map(({ point }) => [point.x, point.y])
    )
  })

  test("a symbol whose util reports no handles should get none", () => {
    // The contract's default. Most symbols resize by their bounding box alone.
    expect(new ShapeUtil().getResizePoints(buildIICircle())).toEqual([])
  })

  /**
   * The regression this closes: resize handles rendered at a moved edge's raw (pre-move) vertices,
   * because `getResizePoints` neither carried the util's result through the matrix nor (for arcs)
   * even reached the util at all.
   */
  test("a translated line's resize handles land on the moved geometry, not the raw one", async () => {
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))
    await canvas.init()
    const edge = buildIILine({ start: { x: 0, y: 0 }, end: { x: 40, y: 30 } })
    edge.transform = MatrixTransform.identity().translate(5, 7)
    canvas.model.addSymbol(edge)
    canvas.renderer.drawSymbol(edge)
    manager.drawSelectedGroup([edge])

    // Hand-computed: EdgeUtil.getLineResizePoints returns [start, end] = [(0,0),(40,30)]; translate(5,7)
    // adds (5,7) to each raw coordinate.
    const handles = Array.from(canvas.renderer.layer.querySelectorAll(`circle[role=${SvgElementRole.Resize}]`))
    expect(handles.map((h) => [Number(h.getAttribute("cx")), Number(h.getAttribute("cy"))])).toEqual([
      [5, 7],
      [45, 37],
    ])
  })
})

describe("createInteractElementsGroup skips unregistered symbol types", () => {
  /**
   * `selectAll()` selects every symbol in the model with no render or registry check ahead of it,
   * then draws the selection outline through this path — a custom symbol type missing its util
   * must not abort building that outline for the whole selection.
   */
  test("does not throw when a selected symbol has no registered util, and still frames the rest", () => {
    const canvas = createCanvasMock()
    const manager = new IISelectionManager(asCanvas(canvas))

    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.renderer.drawSymbol(stroke)

    const orphan = {
      ...(buildIIStroke() as unknown as TBaseSymbol),
      type: "no-such-type",
      id: "orphan-1",
    } as unknown as TSymbol
    canvas.model.addSymbol(orphan)

    expect(() => manager.drawSelectedGroup([stroke, orphan])).not.toThrow()
    expect(manager.selectedGroup).toBeDefined()
  })
})
