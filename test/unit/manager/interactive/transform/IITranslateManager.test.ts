import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"
import { BoxOps, DecoratorKind, DecoratorUtil, DefaultHistoryConfiguration, EdgeUtil, Geometry2d, IIConnectorManager, IIHistoryManager, IITranslateManager, MatrixTransform, OBBOps, Polygon2d, ShapeUtil, StrokeUtil, SvgElementRole, SymbolGeometry, SymbolUtil, TBaseSymbol, TDecorator, TDraft, TEdgeLine, TMath, TPartialDeep, TPoint, TStroke, TSymbol, TText, TTransformContext, applyMatrixToPoint, symbolRegistry } from "@/iink"

describe("IITranslateManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const canvas = createCanvasMock()
    const manager = new IITranslateManager(asCanvas(canvas))

    test("translate stroke composes the matrix rather than moving its pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 10, x: 10, y: 0 })
      const pointersBefore = stroke.pointers.map((p) => ({ ...p }))
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
      expect(stroke.pointers).toEqual(pointersBefore)
    })
    test("translate shape Circle composes the matrix rather than moving its centre", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeUtil.createCircle(center, radius)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(circle, matrix)
      expect(circle.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual(center)
    })
    test("translate shape with kind unknown no longer throws, since translate no longer resolves a kind", () => {
      // IIC-2011 moved the refusal from the manager's switch to the family util's kind table; Task
      // 11 then made translate/rotate/resize matrix-only, so the family util's own dispatch —
      // `resolveKind`, the thing that threw — is no longer on this path at all. A symbol whose
      // geometry cannot be computed can still have its matrix composed.
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapeUtil.createPolygon(points)
      //@ts-ignore
      poly.kind = "pouet"
      const matrix = MatrixTransform.identity().translate(10, 15)
      expect(() => manager.applyToSymbol(poly, matrix)).not.toThrow()
      expect(poly.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
    })
    test("translate edge with kind unknown no longer throws, for the same reason", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeUtil.createLine(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const matrix = MatrixTransform.identity().translate(10, 15)
      expect(() => manager.applyToSymbol(edge, matrix)).not.toThrow()
      expect(edge.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
    })
    test("translate edge Line composes the matrix rather than moving its endpoints", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeUtil.createLine(start, end)
      const matrix = MatrixTransform.identity().translate(10, 15)
      manager.applyToSymbol(line, matrix)
      expect(line.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
    })
  })

  describe("translate process on stroke without snap", () => {
    const canvas = createCanvasMock()
    canvas.snaps.snapConfiguration.guide = false
    canvas.snaps.snapConfiguration.symbol = false
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()
    canvas.renderer.setSymbolTransform = jest.fn()

    const manager = new IITranslateManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const strokeOrigin = StrokeUtil.createEmpty({})
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 0, y: 0 })
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 10, y: 50 })
    canvas.model.addSymbol(strokeOrigin)
    canvas.model.selectSymbol(strokeOrigin.id)

    const translationOrigin: TPoint = {
      x: OBBOps.toBox(SymbolGeometry.boundsOf(strokeOrigin)).x + SymbolGeometry.boundsOf(strokeOrigin).width / 2,
      y: OBBOps.toBox(SymbolGeometry.boundsOf(strokeOrigin)).y + SymbolGeometry.boundsOf(strokeOrigin).height / 2,
    }

    const testDatas = [
      {
        translateToPoint: { x: translationOrigin.x, y: translationOrigin.y + 10 },
        tx: 0,
        ty: 10,
      },
      {
        translateToPoint: { x: translationOrigin.x + 10, y: translationOrigin.y },
        tx: 10,
        ty: 0,
      },
      {
        translateToPoint: { x: translationOrigin.x + 20, y: translationOrigin.y + 25 },
        tx: 20,
        ty: 25,
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const translateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(translateElement)

      test(`should start with tx: "${data.tx} & ty ${data.ty}`, () => {
        manager.start(translateElement, translationOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.transformOrigin).toEqual(translationOrigin)
        expect(canvas.startOperation).toHaveBeenCalledWith("Translating")
      })
      test(`shoud continu with tx: "${data.tx} & ty ${data.ty}`, () => {
        expect(manager.continue(data.translateToPoint)).toEqual({ tx: data.tx, ty: data.ty })

        // A full `matrix(...)` rather than `translate(tx,ty)`: it has to compose with the matrix a
        // symbol already carries, and a bare `translate` would replace it. `strokeOrigin`'s own
        // matrix is the identity here, so both writes come out the same — the composition itself is
        // pinned by the "keeps the matrix a symbol already carries" test below.
        const live = `matrix(1, 0, 0, 1, ${data.tx}, ${data.ty})`
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", live)
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(2, strokeOrigin.id, "transform", live)
      })
      test(`shoud end with tx: "${data.tx} & ty ${data.ty}`, async () => {
        const endPromise = manager.end(data.translateToPoint)
        // Must be ended synchronously, before the backend round-trip below even resolves -
        // IISynchronizerManager's write-idle gate polls this same flag.
        expect(canvas.endOperation).toHaveBeenCalledWith("Translating")
        await endPromise

        const newStroke = canvas.model.getSymbol(strokeOrigin.id) as TStroke
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        // Committing a transform rewrites the element's `transform` attribute instead of rebuilding
        // it through `drawSymbol` (task 12) - the final geometry reaches the renderer as an
        // untouched `setSymbolTransform` call, not a `drawSymbol` one.
        expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledWith(newStroke)
        expect(canvas.client.transformTranslate).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformTranslate).toHaveBeenCalledWith([newStroke.id], data.tx, data.ty)
        expect(strokeOrigin).not.toEqual(newStroke)
      })
    })
  })

  /**
   * IIC-1999, the bug this whole epic started from. The drag preview used to write the gesture's
   * transform alone, which replaced whatever the element already carried — so a symbol moved before
   * snapped back to its raw coordinates for the length of the drag and jumped into place on release.
   * Before the epic only a rotated typeset carried a baked transform; now every moved symbol does,
   * so the same overwrite would affect all of them.
   */
  describe("the preview keeps the matrix a symbol already carries", () => {
    test("composes the gesture onto the stored matrix rather than replacing it", () => {
      const canvas = createCanvasMock()
      const stroke = buildIIStroke()
      // Already turned a quarter turn about the origin, as a previous committed rotate would have
      // left it. A rotation rather than a translate on purpose: composing two translates commutes,
      // so it could not tell composition apart from addition.
      stroke.transform = MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "already-moved-group")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(target)

      const manager = new IITranslateManager(asCanvas(canvas))
      manager.start(target, { x: 0, y: 0 })
      manager.continue({ x: 10, y: 20 })

      const written = (canvas.renderer.setAttribute as jest.Mock).mock.calls.find(
        ([id, name]) => id === stroke.id && name === "transform"
      )
      // Hand-computed, not read back from the code under test. The stored quarter turn is
      // {xx:0, yx:1, xy:-1, yy:0, tx:0, ty:0}; the live translate is {1,0,0,1,10,20}. Their product
      // live*stored keeps the rotation's four leading terms and carries the live offset through
      // unchanged: tx = 1*0 + 0*0 + 10 = 10, ty = 0*0 + 1*0 + 20 = 20. Replacing instead of
      // composing would write "matrix(1, 0, 0, 1, 10, 20)" — the rotation gone, which is exactly
      // the symptom: the symbol un-rotates for the duration of the drag.
      expect(written?.[2]).toBe("matrix(0, 1, -1, 0, 10, 20)")
    })
  })

  describe("ghost strokes follow a selected math block during translate", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget() {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(target)
      return target
    }

    test("continue() live-translates the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      manager.start(setupTarget(), { x: 0, y: 0 })
      manager.continue({ x: 10, y: 20 })

      // The ghost must follow with the *same* transform the selection got: it previews the block the
      // selection belongs to, so any divergence shows on screen as the ghost drifting away from the
      // strokes it shadows.
      const calls = (canvas.renderer.setAttribute as jest.Mock).mock.calls
      const selectionWrite = calls.find(([id, name]) => id === stroke.id && name === "transform")
      const ghostWrite = calls.find(([id, name]) => id === "ghost-1" && name === "transform")
      expect(selectionWrite?.[2]).toBe("matrix(1, 0, 0, 1, 10, 20)")
      expect(ghostWrite?.[2]).toBe(selectionWrite?.[2])
    })

    test("translate() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IITranslateManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)

      await manager.translate([stroke], 10, 20, false)

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("raw single-anchor edge stroke follows a translated block through the full commit path", () => {
    /**
     * Wires a real IIConnectorManager (the stub would no-op) plus a shape and a raw Edge stroke
     * anchored to it, so the follow-on-transform commit path runs for real.
     */
    function setupShapeWithConnectedEdgeStroke(canvas: ReturnType<typeof createCanvasMock>) {
      // `connector` is readonly on TInteractiveInkCanvas; swap the stub for a real instance
      // wired to this same canvas mock, mirroring the cast pattern createCanvasMock.ts itself
      // uses to configure otherwise-readonly/auto-stubbed manager properties for tests.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      // The gradient-follow direction resolves the connected block's center via
      // jiix.getStrokesForElement + model.getSymbol — here the "block" is just the shape itself.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeUtil.createEmpty()
      edgeStroke.pointers = [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 0, dt: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStroke)

      return { shape, edgeStroke }
    }

    test("translate() applies the matrix ONCE when the edge stroke is selected together with its shape", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)

      // Both symbols dragged together: the direct-transform path owns the edge stroke, so the
      // rigid-follow pass must not apply the same matrix a second time.
      await manager.translate([shape, edgeStroke], 5, 5, false)

      // Read the model, not the object passed in: the transform commits a draft rather than
      // mutating the committed record, so the local reference is a pre-transform snapshot.
      const movedEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      // Composed once, not twice: {x:5,y:5} would be a double-apply's translation on top of the
      // direct-transform path's own — the pointers themselves never move at all any more.
      expect(movedEdgeStroke.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 5 })
      expect(movedEdgeStroke.pointers).toEqual(edgeStroke.pointers)
    })

    test("translate() records the followed edge stroke's pre-transform snapshot in history so undo restores its points", async () => {
      const canvas = createCanvasMock()
      const history = new IIHistoryManager(DefaultHistoryConfiguration, canvas.event)
      ;(canvas as unknown as { history: IIHistoryManager }).history = history
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)
      history.init(canvas.model)
      canvas.model.selectSymbol(shape.id)
      const pointersBefore = edgeStroke.pointers.map((p) => ({ ...p }))

      await manager.translate([shape], 5, 5)

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      // This connection is gradient-followed (single anchor, shape moving): point[1] (10,0) is
      // nearest the shape's center (50,50) → full weight; point[0] is farthest → unchanged.
      expect(newEdgeStroke.pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(newEdgeStroke.pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))

      // Gradient moves aren't uniform, so undo can't just re-apply an inverse matrix — it must
      // restore the pre-transform snapshot recorded in `changes.updated` instead. Replay the way
      // InteractiveInkCanvas.#applyHistoryChanges does: `updated`, which is now the whole of it.
      const undoChanges = history.undo()
      undoChanges.updated?.forEach(({ after }) => canvas.model.updateSymbol(after))

      const restoredEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as typeof edgeStroke
      expect(restoredEdgeStroke.pointers[0]).toEqual(
        expect.objectContaining({ x: pointersBefore[0].x, y: pointersBefore[0].y })
      )
      expect(restoredEdgeStroke.pointers[1]).toEqual(
        expect.objectContaining({ x: pointersBefore[1].x, y: pointersBefore[1].y })
      )
    })

    test("drag preview of an edge anchored at both ends matches the commit after repeated moves, even when the edge carries its own matrix", async () => {
      // Regression: the preview wrote document-space anchor points into the edge's raw coordinates,
      // and the renderer then applied the edge's own matrix on top — an edge moved before being
      // anchored lagged its shapes by that matrix while dragging, then jumped on pointer-up.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const history = new IIHistoryManager(DefaultHistoryConfiguration, canvas.event)
      ;(canvas as unknown as { history: IIHistoryManager }).history = history
      const manager = new IITranslateManager(asCanvas(canvas))

      const shapeA = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      const shapeB = ShapeUtil.createCircle({ x: 300, y: 50 }, 20)
      const edge = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
      canvas.model.addSymbol(shapeA)
      canvas.model.addSymbol(shapeB)
      canvas.model.addSymbol(edge)
      history.init(canvas.model)
      await manager.translate([canvas.model.getSymbol(edge.id)!], 37, 11)
      const draft = canvas.model.draftSymbol(edge.id) as TDraft<TEdgeLine>
      canvas.connector.applyEndpointAnchor(draft, 0, { x: 50, y: 50 })
      canvas.connector.applyEndpointAnchor(draft, 1, { x: 300, y: 50 })
      canvas.model.commitSymbol(draft)

      const drawn: TEdgeLine[] = []
      canvas.renderer.drawSymbol = jest.fn((s: TSymbol) => {
        if (s.id === edge.id) drawn.push(s as TEdgeLine)
      })
      const toDocument = (e: TEdgeLine) => ({
        start: applyMatrixToPoint(e.start, e.transform),
        end: applyMatrixToPoint(e.end, e.transform),
        entry: e.startAnchor?.entryPoint,
      })
      const moves: [string, number, number][] = [
        [shapeA.id, 30, 40],
        [shapeB.id, 25, -60],
        [shapeA.id, -15, 15],
      ]
      for (const [id, tx, ty] of moves) {
        drawn.length = 0
        canvas.connector.drawAnchoredEdgesForMatrix([id], MatrixTransform.identity().translate(tx, ty))
        const preview = toDocument(drawn[0])
        await manager.translate([canvas.model.getSymbol(id)!], tx, ty)
        const committed = canvas.model.getSymbol(edge.id) as TEdgeLine
        expect(preview).toEqual(toDocument(committed))
        expect(preview.start).toEqual(SymbolGeometry.boundsOf(canvas.model.getSymbol(shapeA.id)!).center)
        expect(preview.end).toEqual(SymbolGeometry.boundsOf(canvas.model.getSymbol(shapeB.id)!).center)
      }
    })

    test("translate() moving a shape with a converted, anchored edge is undo-safe (the originally reported bug)", async () => {
      // Reproduces the exact scenario reported: move a shape connected to an already-converted
      // (anchored) edge, then undo — the shape must go back AND the edge must go back with it.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const history = new IIHistoryManager(DefaultHistoryConfiguration, canvas.event)
      ;(canvas as unknown as { history: IIHistoryManager }).history = history
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)

      const edge = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
      edge.endAnchor = { symbolId: shape.id, normalizedX: 0.5, normalizedY: 0.5 }
      canvas.model.addSymbol(edge)

      history.init(canvas.model)
      canvas.model.selectSymbol(shape.id)
      const endBefore = { ...edge.end }

      await manager.translate([shape], 20, 20)

      const newEdge = canvas.model.getSymbol(edge.id) as TEdgeLine
      // Anchor recomputed from the shape's new bounds center (70,70), not translated by (20,20).
      expect(newEdge.end).toEqual({ x: 70, y: 70 })
      expect(newEdge.end).not.toEqual(endBefore)

      // Replay the undo diff the way InteractiveInkCanvas.#applyHistoryChanges does: `updated`
      // — one pass over `updated`, which carries the shape and the edge alike.
      const undoChanges = history.undo()
      undoChanges.updated?.forEach(({ after }) => canvas.model.updateSymbol(after))

      const restoredShape = canvas.model.getSymbol(shape.id) as typeof shape
      const restoredEdge = canvas.model.getSymbol(edge.id) as typeof edge
      expect(restoredShape.center).toEqual({ x: 50, y: 50 })
      expect(restoredEdge.end).toEqual(endBefore)
    })

    test("translate() sends the followed edge stroke's new content via replaceStrokes, not the backend transform", async () => {
      const canvas = createCanvasMock()
      canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
      canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
      const manager = new IITranslateManager(asCanvas(canvas))
      const { shape, edgeStroke } = setupShapeWithConnectedEdgeStroke(canvas)

      await manager.translate([shape], 5, 5, false)

      // Gradient-followed (single anchor): reshaped non-uniformly, so its full new content must
      // be replaced on the backend, not folded into a uniform transformTranslate call.
      const sentIds = (canvas.client.transformTranslate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(edgeStroke.id)

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(canvas.client.replaceStrokes).toHaveBeenCalledWith([edgeStroke.id], [newEdgeStroke])
    })

    test("translate() commits the exact same gradient shape the drag preview showed (no pointerup snap)", async () => {
      // Regression: the preview pass (drawAnchoredEdgesForMatrix, called from continue() before
      // the shape has moved) and the commit pass (updateAnchoredEdges, called from translate()
      // after applyAndDraw already moved the shape) must resolve the gradient's target center
      // from the SAME pre-transform position, or the committed stroke jumps to a different
      // shape than what was just shown while dragging. Needs a 3rd, non-extreme point: with
      // only 2 points both always land exactly on the group's min/max (weight 0 or 1 no matter
      // which center is used), so the drift this test guards against wouldn't show up.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeUtil.createEmpty()
      edgeStroke.pointers = [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 5, y: 0, dt: 1, p: 1 },
        { x: 10, y: 0, dt: 2, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStroke)

      const matrix = MatrixTransform.identity().translate(30, 40)
      canvas.connector.drawAnchoredEdgesForMatrix([shape.id], matrix)
      const previewClone = (canvas.renderer.drawSymbol as jest.Mock).mock.calls.at(-1)![0] as typeof edgeStroke
      const previewPointers = previewClone.pointers.map((p) => ({ ...p }))

      await manager.translate([shape], 30, 40, false)

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers).toEqual(previewPointers)
    })

    test("translate() moving a shape with a converted, anchored edge never sends the edge's id to the backend", async () => {
      // The backend only tracks raw ink strokes — a converted Line/PolyEdge/Arc symbol must
      // never appear in a client.transform* call, even though its anchor gets recomputed.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      canvas.client.transformTranslate = jest.fn(() => Promise.resolve())
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      const edge = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 100, y: 100 })
      edge.endAnchor = { symbolId: shape.id, normalizedX: 0.5, normalizedY: 0.5 }
      canvas.model.addSymbol(edge)

      await manager.translate([shape], 20, 20, false)

      // The anchor was in fact recomputed (proves the connector ran, not a no-op).
      const newEdge = canvas.model.getSymbol(edge.id) as TEdgeLine
      expect(newEdge.end).toEqual({ x: 70, y: 70 })

      // Neither the shape nor the edge is raw ink once converted — nothing for the backend here.
      const sentIds = (canvas.client.transformTranslate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(edge.id)
      expect(sentIds).toEqual([])
    })

    test("translate() permanently mutates the connected edge stroke's points (not just a preview clone)", async () => {
      const canvas = createCanvasMock()
      // Use the real IIConnectorManager so this exercises updateAnchoredEdges' commit path for
      // real, not the connector stub — this is what the drag-preview-only test would have missed.
      // `connector` is readonly on TInteractiveInkCanvas; swap the stub for a real instance
      // wired to this same canvas mock, mirroring the cast pattern createCanvasMock.ts itself
      // uses to configure otherwise-readonly/auto-stubbed manager properties for tests.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      const manager = new IITranslateManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      // The gradient-follow direction resolves the connected block's center via
      // jiix.getStrokesForElement + model.getSymbol — here the "block" is just the shape itself.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStroke = StrokeUtil.createEmpty()
      edgeStroke.pointers = [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 0, dt: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStroke)

      await manager.translate([shape], 5, 5, false)

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers[0]).toEqual(expect.objectContaining({ x: 0, y: 0 }))
      expect(newEdgeStroke.pointers[1]).toEqual(expect.objectContaining({ x: 15, y: 5 }))
    })
  })

  /**
   * IIC-2011 moved translate onto each symbol's util. Two things about that move needed holding
   * that nothing held before: text and math reach a service rather than doing geometry, and a
   * symbol type the library does not know can now translate at all.
   */
  describe("translate through the util", () => {
    test.each([
      ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
      ["math", () => buildIIMath()],
    ])("%s composes the matrix without touching the typeset service", (_name, build) => {
      // Translate is `SymbolUtil.applyTransform` now, for every type: nothing left in `TextUtil`/
      // `MathUtil` re-measures on a move, because a translate no longer touches a stored
      // coordinate at all — only the matrix changes.
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))
      const symbol = build()
      manager.applyToSymbol(symbol, MatrixTransform.identity().translate(10, 15))
      expect(canvas.typeset.setBounds).not.toHaveBeenCalled()
      expect(symbol.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
    })

    test.each([
      ["text", () => buildIIText({ point: { x: 1, y: 2 } })],
      ["math", () => buildIIMath("y=3x+2", { point: { x: 1, y: 2 } })],
    ])("%s composes the matrix rather than move its anchor point", (_name, build) => {
      const symbol = build()
      const canvas = createCanvasMock()
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(symbol, MatrixTransform.identity().translate(10, 15))
      expect(symbol.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
      expect(symbol.point).toEqual({ x: 1, y: 2 })
    })

    test("math composes the matrix rather than move its stored bounds centre or its elements", () => {
      // Math carries more position than text: its own bounds centre, and one box per element. None
      // of it moves any more — the matrix is the whole of what a translate changes.
      const math = buildIIMath("y=3x+2", { point: { x: 1, y: 2 } })
      const centreBefore = { ...math.bounds.center }
      const elementBefore = { ...math.elements[0].bounds }
      const canvas = createCanvasMock()
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(math, MatrixTransform.identity().translate(10, 15))
      expect(math.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
      expect(math.bounds.center).toEqual(centreBefore)
      expect(math.elements[0].bounds).toEqual(elementBefore)
    })

    test("a symbol type the library does not know should translate", () => {
      // The point of the epic. It is reachable through the util now; `applyToSymbol` still throws
      // for an unregistered type, because the base's switch on `symbol.type` survives until
      // IIC-2014.
      type TStickyNote = TBaseSymbol & { type: "sticky-note"; point: TPoint }
      class StickyNoteUtil extends SymbolUtil<TStickyNote> {
        readonly type = "sticky-note"
        create(partial: TPartialDeep<TStickyNote>): TStickyNote {
          return partial as TStickyNote
        }
        getGeometry(symbol: TStickyNote): Geometry2d {
          return new Polygon2d(BoxOps.getCorners({ x: symbol.point.x, y: symbol.point.y, width: 10, height: 10 }))
        }
        overlaps(): boolean {
          return false
        }
        translate(symbol: TStickyNote, { matrix }: TTransformContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        rotate(symbol: TStickyNote, { matrix }: TTransformContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        resize(symbol: TStickyNote, { matrix }: TTransformContext): void {
          symbol.point = applyMatrixToPoint(symbol.point, matrix)
        }
        getSVGElement(): SVGGraphicsElement {
          return document.createElementNS("http://www.w3.org/2000/svg", "g")
        }
      }
      symbolRegistry.register(new StickyNoteUtil())

      const canvas = createCanvasMock()
      const sticky = { id: "n1", type: "sticky-note", point: { x: 1, y: 2 } } as unknown as TSymbol
      symbolRegistry
        .getUtilFor(sticky)
        .translate(sticky, { matrix: MatrixTransform.identity().translate(10, 15) })

      expect((sticky as unknown as TStickyNote).point).toEqual({ x: 11, y: 17 })

      // Written in IIC-2011 asserting that `applyToSymbol` still refused this symbol, because the
      // base's `switch (symbol.type)` fell to a throwing default. IIC-2014 deleted that switch, so
      // the manager route works too — which is the whole point of the epic.
      new IITranslateManager(asCanvas(canvas)).applyToSymbol(sticky, MatrixTransform.identity().translate(1, 2))
      expect((sticky as unknown as TStickyNote).point).toEqual({ x: 12, y: 19 })
    })
  })
})

/**
 * IIC-1999. Translating a selection of typeset symbols moved only the first one in the model: the
 * rest kept their old coordinates while the drag preview showed them moved, so selection and
 * hit-testing afterwards pointed at where they used to be.
 *
 * The mechanism is a double write. `IITypesetManager.updateBounds` measures **and** commits, and
 * `SymbolStore.update` deep-freezes what it stores — so the draft came back frozen, and
 * `applyAndDraw`'s own `commitSymbol` then threw on `updatedSymbol.modificationDate = Date.now()`.
 * That `TypeError` escaped the `forEach`, and every symbol after the first was never drafted at all.
 *
 * No unit test could see it: the canvas mock's `typeset` is an auto-stub, so the model write that
 * causes the freeze never happened. These tests supply a port that behaves like the real service.
 */
describe("IIC-1999, a selection of typeset symbols", () => {
  const realisticTypeset = (canvas: ReturnType<typeof createCanvasMock>) => {
    // Both methods, as IITypesetManager has them: `setBounds` measures, `updateBounds` also commits.
    canvas.typeset.setBounds = () => {}
    canvas.typeset.updateBounds = <S extends TText | TMath>(symbol: S): S => {
      canvas.model.updateSymbol(symbol)
      return symbol
    }
  }

  const selection = (canvas: ReturnType<typeof createCanvasMock>, symbols: TSymbol[]) =>
    symbols.forEach((symbol) => {
      canvas.model.addSymbol(symbol)
      canvas.model.selectSymbol(symbol.id)
    })

  test.each([
    ["texts", () => [buildIIText({ point: { x: 0, y: 0 } }), buildIIText({ point: { x: 100, y: 0 } })]],
    ["maths", () => [buildIIMath("a=1", { point: { x: 0, y: 0 } }), buildIIMath("b=2", { point: { x: 100, y: 0 } })]],
    ["a text then a math", () => [buildIIText({ point: { x: 0, y: 0 } }), buildIIMath("b=2", { point: { x: 100, y: 0 } })]],
  ])("should move every one of two %s, not just the first", async (_name, build) => {
    const canvas = createCanvasMock()
    realisticTypeset(canvas)
    const manager = new IITranslateManager(asCanvas(canvas))
    await canvas.init()
    const symbols = build()
    selection(canvas, symbols)

    await manager.translate(symbols, 10, 15)

    expect(canvas.model.symbols.map((s) => (s as TText).transform)).toEqual([
      { xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 },
      { xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 },
    ])
  })

  test("should still move a lone typeset symbol", async () => {
    // Guards the guard: the bug spared the first symbol, so a single-symbol test passes either way
    // and proves nothing on its own.
    const canvas = createCanvasMock()
    realisticTypeset(canvas)
    const manager = new IITranslateManager(asCanvas(canvas))
    await canvas.init()
    const text = buildIIText({ point: { x: 0, y: 0 } })
    selection(canvas, [text])

    await manager.translate([text], 10, 15)

    expect((canvas.model.symbols[0] as TText).transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 15 })
  })
  /**
   * `DecoratorUtil.applyTransform` is a no-op, so `updateDecoratorsForTargets` is the only thing
   * that keeps a standalone decorator in step with the symbols it sits over: it composes their
   * matrix onto the decorator when they all moved, and refits its box when only some did.
   */
  describe("standalone decorators follow translated targets", () => {
    test("translate() moves the decorator by the same matrix as its target", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorUtil.createDecorator(
        DecoratorKind.Highlight,
        {},
        [stroke.id],
        OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      )
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.targetBounds!.center }

      await manager.translate([stroke], 10, 20, false)

      const newDeco = canvas.model.getSymbol(decorator.id) as TDecorator
      expect(newDeco.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 20 })
      expect(newDeco.targetBounds!.center).toEqual(centerBefore)
      expect(SymbolGeometry.boundsOf(newDeco).center).toEqual(
        expect.objectContaining({ x: centerBefore.x + 10, y: centerBefore.y + 20 })
      )
    })

    test("translate() records the decorator it moved in the history entry, so undo brings it back", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorUtil.createDecorator(
        DecoratorKind.Underline,
        {},
        [stroke.id],
        OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      )
      canvas.model.addSymbol(decorator)

      await manager.translate([stroke], 10, 20)

      const changes = (canvas.history.push as jest.Mock).mock.calls[0][0]
      const pair = changes.updated.find((p: { before: TSymbol }) => p.before.id === decorator.id)
      expect(pair.before.transform).toEqual(MatrixTransform.identity())
      expect(pair.after.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 10, ty: 20 })
    })

    test("translate() refits the box of a decorator whose targets only partly moved", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const moved = buildIIStroke({ box: { x: 0, y: 0, width: 10, height: 10 } })
      const still = buildIIStroke({ box: { x: 20, y: 0, width: 10, height: 10 } })
      canvas.model.addSymbol(moved)
      canvas.model.addSymbol(still)
      const decorator = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {}, [moved.id, still.id], {
        x: 0,
        y: 0,
        width: 30,
        height: 10,
      })
      canvas.model.addSymbol(decorator)

      await manager.translate([moved], 0, 40, false)

      const newDeco = canvas.model.getSymbol(decorator.id) as TDecorator
      const expected = OBBOps.createFromOBBs([moved, still].map((s) => SymbolGeometry.boundsOf(canvas.model.getSymbol(s.id)!)))
      expect(newDeco.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 0, ty: 0 })
      expect(newDeco.targetBounds).toEqual(expected)
    })

    test("translate() leaves other decorators (not targeting a moved symbol) untouched", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const movedStroke = buildIIStroke()
      const otherStroke = buildIIStroke()
      canvas.model.addSymbol(movedStroke)
      canvas.model.addSymbol(otherStroke)
      const decorator = DecoratorUtil.createDecorator(
        DecoratorKind.Highlight,
        {},
        [otherStroke.id],
        OBBOps.toBox(SymbolGeometry.boundsOf(otherStroke))
      )
      canvas.model.addSymbol(decorator)
      const centerBefore = { ...decorator.targetBounds!.center }

      await manager.translate([movedStroke], 10, 20, false)

      expect(decorator.targetBounds!.center).toEqual(centerBefore)
    })

    test("translate() keeps the decorator's baseline in its local frame, carried by its matrix", async () => {
      const canvas = createCanvasMock()
      const manager = new IITranslateManager(asCanvas(canvas))

      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorUtil.createDecorator(
        DecoratorKind.Underline,
        {},
        [stroke.id],
        OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      )
      decorator.baseline = 100
      decorator.xHeight = 8
      canvas.model.addSymbol(decorator)

      await manager.translate([stroke], 0, 50, false)

      const newDeco = canvas.model.getSymbol(decorator.id) as TDecorator
      expect(newDeco.baseline).toBe(100)
      expect(newDeco.transform.ty).toBe(50)
    })
  })
})
