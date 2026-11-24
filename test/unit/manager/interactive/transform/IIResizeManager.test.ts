import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"
import { BoxOps, EdgeUtil, IIConnectorManager, IIResizeManager, MatrixTransform, OBBOps, ResizeDirection, ShapeUtil, StrokeUtil, SvgElementRole, SymbolGeometry, TBaseSymbol, TPoint, TStroke, TSymbol, TSymbolChar, TextUtil } from "@/iink"

describe("IIResizeManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIResizeManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("applyToSymbol", () => {
    const canvas = createCanvasMock()
    const manager = new IIResizeManager(asCanvas(canvas))
    test("should not resize a symbol whose type no util owns", () => {
      const stroke = buildIIStroke()
      //@ts-ignore
      stroke.type = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      // IIC-2014 deleted the manager's `switch (symbol.type)` and its throwing default. The refusal
      // did not disappear — it comes from the registry now, and says what *is* registered, which
      // distinguishes a typo from a missing `registerBuiltinSymbolUtils()`.
      expect(() => manager.applyToSymbol(stroke, matrix)).toThrow('No util is registered for type "pouet"')
      expect(() => manager.applyToSymbol(stroke, matrix)).toThrow(/Registered types: .*stroke/)
    })
    test("should resize stroke by composing the matrix rather than moving its pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      const origin: TPoint = { x: 1, y: 2 }
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 2 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 10, x: 21, y: 42 })
      const pointersBefore = stroke.pointers.map((p) => ({ ...p }))
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(stroke, matrix)
      // Starting from identity, composing the matrix onto it is the matrix itself.
      expect(stroke.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: -1, ty: -4 })
      expect(stroke.pointers).toEqual(pointersBefore)
    })
    test("should resize a math solver-output (draw) stroke the same way", () => {
      const stroke = StrokeUtil.createEmpty()
      stroke.isSolverOutput = true
      const origin: TPoint = { x: 1, y: 2 }
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 2 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 10, x: 21, y: 42 })
      const pointersBefore = stroke.pointers.map((p) => ({ ...p }))
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: -1, ty: -4 })
      expect(stroke.pointers).toEqual(pointersBefore)
    })
    test("resize shape with kind unknown no longer throws, since resize no longer resolves a kind", () => {
      // IIC-2013 moved the refusal to the shape util's kind table; Task 11 then made
      // translate/rotate/resize matrix-only, so that table is no longer on this path at all — a
      // symbol whose geometry cannot be computed can still have its matrix composed.
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 0, y: 5 },
        { x: 5, y: 5 },
        { x: 5, y: 0 },
      ]
      const poly = ShapeUtil.createPolygon(points)
      //@ts-ignore
      poly.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).not.toThrow()
      expect(poly.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: 0, ty: 0 })
    })
    test("should resize shape Circle by composing the matrix rather than scaling its radius", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const shape = ShapeUtil.createCircle(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().scale(2, 4, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 4, tx: -1, ty: -6 })
      expect(shape.radius).toEqual(radius)
      expect(shape.center).toEqual(center)
    })
    test("should resize shape Ellipse by composing the matrix rather than scaling its radii", () => {
      const center: TPoint = { x: 0, y: 0 }
      const radiusX = 50
      const radiusY = 10
      const orientation = 0
      const shape = ShapeUtil.createEllipse(center, radiusX, radiusY, orientation)
      const scaleX = 2
      const scaleY = 4
      const shapeBoundsBox = OBBOps.toBox(SymbolGeometry.boundsOf(shape))
      const origin: TPoint = { x: shapeBoundsBox.x, y: shapeBoundsBox.y }
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      // `matrix` is built independently of the code under test (`applyTransform`), so comparing
      // against it is not circular: starting from identity, composing it is the matrix itself.
      expect(shape.transform).toEqual(matrix)
      expect(shape.radiusX).toEqual(radiusX)
      expect(shape.radiusY).toEqual(radiusY)
      expect(shape.center).toEqual(center)
      expect(shape.orientation).toEqual(orientation)
    })
    test("should resize shape Polygon by composing the matrix rather than moving its points", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const shape = ShapeUtil.createPolygon(points)
      const scaleX = 2
      const scaleY = 4
      const polyBoundsBox = OBBOps.toBox(SymbolGeometry.boundsOf(shape))
      const origin: TPoint = { x: polyBoundsBox.x, y: polyBoundsBox.y }
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(shape, matrix)
      expect(shape.transform).toEqual(matrix)
      expect(shape.points).toEqual(points)
    })
    test("resize edge with kind unknown no longer throws, for the same reason", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeUtil.createLine(start, end)
      //@ts-ignore
      edge.kind = "pouet"
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      expect(() => manager.applyToSymbol(edge, matrix)).not.toThrow()
      expect(edge.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: 0, ty: 0 })
    })
    test("should resize edge Arc by composing the matrix rather than scaling its radii", () => {
      const center: TPoint = { x: 0, y: 0 }
      const startAngle = -Math.PI
      const sweepAngle = Math.PI
      const radiusX = 50
      const radiusY = 10
      const phi = 0
      const edge = EdgeUtil.createArc(center, startAngle, sweepAngle, radiusX, radiusY, phi)
      const edgeBoundsBox = OBBOps.toBox(SymbolGeometry.boundsOf(edge))
      const origin: TPoint = { x: edgeBoundsBox.x, y: edgeBoundsBox.y }
      const scaleX = 2
      const scaleY = 3
      manager.transformOrigin = origin
      const matrix = MatrixTransform.identity().scale(scaleX, scaleY, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.transform).toEqual(matrix)
      expect(edge.center).toEqual(center)
      expect(edge.radiusX).toEqual(radiusX)
      expect(edge.radiusY).toEqual(radiusY)
      expect(edge.startAngle).toEqual(startAngle)
      expect(edge.sweepAngle).toEqual(sweepAngle)
    })
    test("resize edge Line composes the matrix rather than moving its endpoints", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const edge = EdgeUtil.createLine(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: 0, ty: 0 })
      expect(edge.start).toEqual(start)
      expect(edge.end).toEqual(end)
    })
    test("resize edge PolyEdge composes the matrix rather than moving its points", () => {
      const points: TPoint[] = [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 10 },
        { x: 0, y: 10 },
      ]
      const edge = EdgeUtil.createPolyLine(points)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(edge, matrix)
      expect(edge.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: 0, ty: 0 })
      expect(edge.points).toEqual(points)
    })
    test("resize edge Text composes the matrix rather than rebuilding bounds or scaling glyphs", () => {
      const point: TPoint = { x: 0, y: 0 }
      const chars: TSymbolChar[] = [
        {
          bounds: { height: 10, width: 5, x: 0, y: 0 },
          color: "black",
          fontSize: 12,
          fontWeight: "normal",
          id: "char-1",
          label: "A",
        },
      ]
      const text = TextUtil.createText(chars, point, { height: 10, width: 5, x: 0, y: 0 })
      const boundsBefore = structuredClone(text.bounds)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().scale(2, 3, origin)
      manager.applyToSymbol(text, matrix)
      expect(text.transform).toEqual({ xx: 2, yx: 0, xy: 0, yy: 3, tx: 0, ty: 0 })
      expect(text.point).toEqual(point)
      expect(chars[0].fontSize).toEqual(12)
      expect(text.bounds).toEqual(boundsBefore)
    })
  })

  describe("resize process on stroke without snap", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformScale = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()
    canvas.renderer.setSymbolTransform = jest.fn()
    canvas.snaps.snapConfiguration.guide = false
    canvas.snaps.snapConfiguration.symbol = false

    const manager = new IIResizeManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const strokeOrigin = StrokeUtil.createEmpty({})
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 0, y: 0 })
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 10, y: 50 })
    canvas.model.addSymbol(strokeOrigin)
    canvas.model.selectSymbol(strokeOrigin.id)

    const sb = OBBOps.toBox(SymbolGeometry.boundsOf(strokeOrigin))
    const resizeToPoint: TPoint = {
      x: (sb.x + sb.width + sb.x) / 4,
      y: (sb.y + sb.height + sb.y) / 4,
    }

    const testDatas = [
      {
        direction: ResizeDirection.North,
        transformOrigin: {
          x: sb.x + sb.width / 2,
          y: sb.y + sb.height,
        },
        scale: {
          x: 1,
          y: 1 + (sb.y - resizeToPoint.y) / sb.height,
        },
      },
      {
        direction: ResizeDirection.East,
        transformOrigin: {
          x: sb.x,
          y: sb.y + sb.height / 2,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + sb.width)) / sb.width,
          y: 1,
        },
      },
      {
        direction: ResizeDirection.South,
        transformOrigin: {
          x: sb.x + sb.width / 2,
          y: sb.y,
        },
        scale: {
          x: 1,
          y: 1 + (resizeToPoint.y - (sb.y + sb.height)) / sb.height,
        },
      },
      {
        direction: ResizeDirection.West,
        transformOrigin: {
          x: sb.x + sb.width,
          y: sb.y + sb.height / 2,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / sb.width,
          y: 1,
        },
      },
      {
        direction: ResizeDirection.NorthEast,
        transformOrigin: {
          x: sb.x,
          y: sb.y + sb.height,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + sb.width)) / sb.width,
          y: 1 + (sb.y - resizeToPoint.y) / sb.height,
        },
      },
      {
        direction: ResizeDirection.NorthWest,
        transformOrigin: {
          x: sb.x + sb.width,
          y: sb.y + sb.height,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / sb.width,
          y: 1 + (sb.y - resizeToPoint.y) / sb.height,
        },
      },
      {
        direction: ResizeDirection.SouthEast,
        transformOrigin: {
          x: sb.x,
          y: sb.y,
        },
        scale: {
          x: 1 + (resizeToPoint.x - (sb.x + sb.width)) / sb.width,
          y: 1 + (resizeToPoint.y - (sb.y + sb.height)) / sb.height,
        },
      },
      {
        direction: ResizeDirection.SouthWest,
        transformOrigin: {
          x: sb.x + sb.width,
          y: sb.y,
        },
        scale: {
          x: 1 + (sb.x - resizeToPoint.x) / sb.width,
          y: 1 + (resizeToPoint.y - (sb.y + sb.height)) / sb.height,
        },
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", data.direction)
      group.appendChild(resizeElement)

      test(`should start with direction: "${data.direction}" `, () => {
        manager.start(resizeElement, data.transformOrigin)
        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.boundingBox).toEqual(OBBOps.toBox(SymbolGeometry.boundsOf(strokeOrigin)))
        expect(manager.direction).toEqual(data.direction)
        expect(manager.transformOrigin).toEqual(data.transformOrigin)
        // `start` no longer writes anything to the DOM. It used to set `transform-origin` on the
        // group and on every selected symbol, which cannot survive alongside a stored matrix: that
        // attribute applies to the whole transform list, so it would displace the symbol's own
        // matrix as well as the gesture's. The live matrix carries `transformOrigin` itself instead.
        expect(canvas.renderer.setAttribute).not.toHaveBeenCalled()
        expect(canvas.startOperation).toHaveBeenCalledWith("Resizing")
      })
      test(`shoud continu with direction: "${data.direction}"`, () => {
        expect(manager.continue(resizeToPoint)).toEqual({ scaleX: data.scale.x, scaleY: data.scale.y })
        // A full `matrix(...)` rather than `scale(sx,sy)`: it has to compose with the matrix a symbol
        // already carries, and a bare `scale` would replace it. `strokeOrigin`'s own matrix is the
        // identity here, so both writes come out the same — the composition itself is pinned by the
        // "keeps the matrix a symbol already carries" test below.
        const live = MatrixTransform.identity()
          .scale(data.scale.x, data.scale.y, data.transformOrigin)
          .toCssString()
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", live)
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(2, strokeOrigin.id, "transform", live)
      })
      test(`shoud end with direction: "${data.direction}"`, async () => {
        const endPromise = manager.end(resizeToPoint)
        expect(canvas.endOperation).toHaveBeenCalledWith("Resizing")
        await endPromise
        const newStroke = canvas.model.getSymbol(strokeOrigin.id) as TStroke
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        // Committing a transform rewrites the element's `transform` attribute instead of rebuilding
        // it through `drawSymbol` (task 12) - the final geometry reaches the renderer as an
        // untouched `setSymbolTransform` call, not a `drawSymbol` one.
        expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledWith(newStroke)
        expect(canvas.client.transformScale).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformScale).toHaveBeenCalledWith(
          [strokeOrigin.id],
          data.scale.x,
          data.scale.y,
          data.transformOrigin.x,
          data.transformOrigin.y
        )
        expect(strokeOrigin).not.toEqual(newStroke)
      })
    })
  })

  /**
   * IIC-1999. The drag preview used to write the gesture's transform alone, which replaced whatever
   * the element already carried — so a symbol moved before snapped back to its raw coordinates for
   * the length of the drag and jumped into place on release. Before this epic only a rotated typeset
   * carried a baked transform; now every moved symbol does.
   */
  describe("the preview keeps the matrix a symbol already carries", () => {
    test("composes the gesture onto the stored matrix rather than replacing it", () => {
      const canvas = createCanvasMock()
      const stroke = buildIIStroke()
      // Already moved 100 to the right, as a previous committed translate would have left it.
      stroke.transform = MatrixTransform.identity().translate(100, 0)
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "already-moved-group")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      target.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(target)

      const manager = new IIResizeManager(asCanvas(canvas))
      manager.start(target, { x: 0, y: 0 })
      // Driven straight in rather than derived from a pointer position: this test is about the
      // composition, and `continue`'s scale arithmetic is covered above.
      manager.boundingBox = { x: 0, y: 0, width: 10, height: 10 }
      manager.transformOrigin = { x: 0, y: 0 }
      manager.keepRatio = false
      manager.continue({ x: 20, y: 10 })

      const written = (canvas.renderer.setAttribute as jest.Mock).mock.calls.find(
        ([id, name]) => id === stroke.id && name === "transform"
      )
      // Hand-computed, not read back from the code under test. Dragging the east handle from x=10 to
      // x=20 over a 10-wide box gives scaleX = 1 + 10/10 = 2 and scaleY = 1, so the live matrix about
      // the origin is {xx:2, yx:0, xy:0, yy:1, tx:0, ty:0}; the stored translate is {1,0,0,1,100,0}.
      // Their product live*stored has tx = 2*100 = 200 — the symbol's own offset scaled by the
      // gesture. Replacing instead of composing would write "matrix(2, 0, 0, 1, 0, 0)" and lose it.
      expect(written?.[2]).toBe("matrix(2, 0, 0, 1, 200, 0)")
    })
  })

  describe("ghost strokes follow a selected math block during resize", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget() {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "line")
      target.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(target)
      return target
    }

    test("continue() live-scales the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IIResizeManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      manager.start(setupTarget(), { x: sb.x, y: sb.y + sb.height / 2 })
      manager.continue({ x: sb.x + sb.width * 2, y: sb.y + sb.height / 2 })

      // The ghost must follow with the *same* transform the selection got, not merely with some
      // scale: it previews the block the selection belongs to, so any divergence shows on screen as
      // the ghost drifting away from the strokes it shadows. Compared against the write the selected
      // stroke received rather than a hard-coded string — the property that actually matters.
      const calls = (canvas.renderer.setAttribute as jest.Mock).mock.calls
      const selectionWrite = calls.find(([id, name]) => id === stroke.id && name === "transform")
      const ghostWrite = calls.find(([id, name]) => id === "ghost-1" && name === "transform")
      expect(selectionWrite?.[2]).toEqual(expect.stringContaining("matrix("))
      expect(ghostWrite?.[2]).toBe(selectionWrite?.[2])
    })

    test("end() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.client.transformScale = jest.fn(() => Promise.resolve())
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IIResizeManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      manager.start(setupTarget(), { x: sb.x, y: sb.y + sb.height / 2 })
      await manager.end({ x: sb.x + sb.width * 2, y: sb.y + sb.height / 2 })

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("raw single-anchor edge stroke follows a resized block through the full commit path", () => {
    test("end() permanently mutates the connected edge stroke's points (not just a preview clone)", async () => {
      const canvas = createCanvasMock()
      // Use the real IIConnectorManager so this exercises updateAnchoredEdges' commit path for
      // real, not the connector stub — mirrors the analogous IITranslateManager test.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      canvas.client.transformScale = jest.fn(() => Promise.resolve())
      const manager = new IIResizeManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      canvas.model.selectSymbol(shape.id)
      // The gradient-follow direction resolves the connected block's center via
      // jiix.getStrokesForElement + model.getSymbol — here the "block" is just the shape itself.
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockImplementation((id) => (id === shape.id ? [shape.id] : []))

      const edgeStrokeOrigin = StrokeUtil.createEmpty()
      edgeStrokeOrigin.pointers = [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 0, dt: 1, p: 1 },
      ]
      edgeStrokeOrigin.jiixBlockType = "Edge"
      edgeStrokeOrigin.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStrokeOrigin)
      const originalPointers = edgeStrokeOrigin.pointers.map((p) => ({ ...p }))

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(shape))
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(resizeElement)

      const transformOrigin: TPoint = { x: sb.x, y: sb.y + sb.height / 2 }
      const resizeToPoint: TPoint = { x: sb.x + sb.width * 2, y: sb.y + sb.height / 2 }

      manager.start(resizeElement, transformOrigin)
      const { scaleX, scaleY } = manager.continue(resizeToPoint)
      await manager.end(resizeToPoint)

      // Reconstruct the exact matrix end() applied (same scaleX/scaleY, same origin) and assert
      // the edge stroke's points were transformed by it on a gradient — not left at their
      // pre-resize values, and not just used to draw a transient preview clone. point[1] (10,0)
      // is nearest the shape's center (50,50) → full weight; point[0] is farthest → unchanged.
      const expectedMatrix = MatrixTransform.identity().scale(scaleX, scaleY, transformOrigin)
      const transformedLast = expectedMatrix.applyToPoint(originalPointers[1])
      const expectedPointers = [
        originalPointers[0],
        { ...originalPointers[1], x: +transformedLast.x.toFixed(3), y: +transformedLast.y.toFixed(3) },
      ]
      const newEdgeStroke = canvas.model.getSymbol(edgeStrokeOrigin.id) as TStroke
      expect(newEdgeStroke.pointers).toEqual(expectedPointers)
      expect(newEdgeStroke.pointers).not.toEqual(originalPointers)
    })

    test("end() commits the exact same gradient shape the drag preview showed (no pointerup snap)", async () => {
      // Regression: the preview pass (drawAnchoredEdgesForMatrix, called from continue() before
      // the shape has moved) and the commit pass (updateAnchoredEdges, called after applyAndDraw
      // already resized the shape) must resolve the gradient's target center from the SAME
      // pre-transform position. Needs a 3rd, non-extreme point: with only 2 points both always
      // land exactly on the group's min/max (weight 0 or 1 regardless of which center is used),
      // so the drift this test guards against wouldn't show up.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      canvas.client.transformScale = jest.fn(() => Promise.resolve())
      const manager = new IIResizeManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      canvas.model.selectSymbol(shape.id)
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

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(shape))
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(resizeElement)

      const transformOrigin: TPoint = { x: sb.x, y: sb.y + sb.height / 2 }
      const resizeToPoint: TPoint = { x: sb.x + sb.width * 2, y: sb.y + sb.height / 2 }

      manager.start(resizeElement, transformOrigin)
      await manager.end(resizeToPoint)

      // First drawSymbol call for this id is the preview clone (from continue(), before the
      // shape moved) — must match the final, committed points exactly.
      const previewClone = (canvas.renderer.drawSymbol as jest.Mock).mock.calls.find(
        (c) => (c[0] as { id: string }).id === edgeStroke.id
      )![0] as typeof edgeStroke
      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers).toEqual(previewClone.pointers)
    })

    test("end() sends the followed edge stroke's new content via replaceStrokes and snapshots it in history's updated entry", async () => {
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([])
      canvas.client.transformScale = jest.fn(() => Promise.resolve())
      canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
      const manager = new IIResizeManager(asCanvas(canvas))

      const shape = ShapeUtil.createCircle({ x: 50, y: 50 }, 20)
      canvas.model.addSymbol(shape)
      canvas.model.selectSymbol(shape.id)

      const edgeStroke = StrokeUtil.createEmpty()
      edgeStroke.pointers = [
        { x: 0, y: 0, dt: 0, p: 1 },
        { x: 10, y: 0, dt: 1, p: 1 },
      ]
      edgeStroke.jiixBlockType = "Edge"
      edgeStroke.endAnchor = { symbolId: shape.id, normalizedX: 1, normalizedY: 0.5 }
      canvas.model.addSymbol(edgeStroke)
      const originalPointers = edgeStroke.pointers.map((p) => ({ ...p }))

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(shape))
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const resizeElement = document.createElementNS("http://www.w3.org/2000/svg", "line")
      resizeElement.setAttribute("resize-direction", ResizeDirection.East)
      group.appendChild(resizeElement)

      const transformOrigin: TPoint = { x: sb.x, y: sb.y + sb.height / 2 }
      const resizeToPoint: TPoint = { x: sb.x + sb.width * 2, y: sb.y + sb.height / 2 }

      manager.start(resizeElement, transformOrigin)
      await manager.end(resizeToPoint)

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      // Gradient-followed (single anchor): reshaped non-uniformly, so it must never be folded
      // into the uniform transformScale call — its full new content goes via replaceStrokes.
      const sentIds = (canvas.client.transformScale as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(newEdgeStroke.id)
      expect(canvas.client.replaceStrokes).toHaveBeenCalledWith([newEdgeStroke.id], [newEdgeStroke])

      // History needs a PRE-transform snapshot of the followed stroke, else undo cannot restore it.
      // Every change is a before/after pair now, so the gradient-shifted stroke and the resized
      // selection sit in the same list.
      const changes = (canvas.history.push as jest.Mock).mock.calls[0][0] as {
        updated?: { before: TStroke; after: TStroke }[]
      }
      const pair = changes.updated?.find((entry) => entry.before.id === newEdgeStroke.id)
      expect(pair).toBeDefined()
      expect(pair!.before.pointers).toEqual(originalPointers)
      expect(pair!.after).toStrictEqual(newEdgeStroke)
      // And the resized symbol's own pair is still there beside it. Two sources feed one entry — the
      // selection and the followed stroke — and they must be appended, not assigned: assigning
      // `updated` twice keeps only the last writer, which would leave the symbols the user actually
      // dragged with nothing to undo.
      expect(changes.updated?.find((entry) => entry.before.id === shape.id)).toBeDefined()
    })
  })
  })

/**
 * Two resize cells that nothing covered: gutting either left this whole file green. IIC-2013 moved
 * them onto the utils, so they are pinned here.
 */
/**
 * These three cells — an arc's mirrored start angle/sweep, math's font scaling — were the last
 * per-type resize logic left, and Task 11 deleted all of it: resize composes the matrix now, for
 * every type, and leaves the raw fields it used to rewrite by hand untouched.
 */
describe("IIResizeManager, resize composes the matrix instead of touching these fields", () => {
  const resize = (symbol: TSymbol, matrix: MatrixTransform, origin: TPoint) => {
    const canvas = createCanvasMock()
    const manager = new IIResizeManager(asCanvas(canvas))
    manager.transformOrigin = origin
    manager.applyToSymbol(symbol, matrix)
  }

  test("mirroring an arc no longer re-bases its start angle or reverses its sweep", () => {
    const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0.5, 1.5, 30, 20, 0)
    const origin: TPoint = { x: 0, y: 0 }
    const matrix = MatrixTransform.identity().scale(-1, 1, origin)
    resize(arc, matrix, origin)
    expect(arc.transform).toEqual(matrix)
    expect(arc.startAngle).toBe(0.5)
    expect(arc.sweepAngle).toBe(1.5)
  })

  test("mirroring an arc vertically leaves it just as untouched", () => {
    const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0.5, 1.5, 30, 20, 0)
    const origin: TPoint = { x: 0, y: 0 }
    const matrix = MatrixTransform.identity().scale(1, -1, origin)
    resize(arc, matrix, origin)
    expect(arc.transform).toEqual(matrix)
    expect(arc.startAngle).toBe(0.5)
    expect(arc.sweepAngle).toBe(1.5)
  })

  test("resizing math no longer scales its element font sizes by hand", () => {
    // The matrix scales the glyphs at render time instead, which is also what makes the operation
    // exactly reversible — hand-scaling a font size and rounding it to three decimals could not be.
    const math = buildIIMath()
    const before = math.elements.map((element) => element.fontSize)
    expect(before.length).toBeGreaterThan(0)
    const origin: TPoint = { x: 0, y: 0 }
    const matrix = MatrixTransform.identity().scale(2, 4, origin)
    resize(math, matrix, origin)
    expect(math.transform).toEqual(matrix)
    expect(math.elements.map((element) => element.fontSize)).toEqual(before)
  })
})

/**
 * `keepRatio` decides whether dragging one edge of a selection scales both axes together. It was
 * asserted nowhere at all — `grep keepRatio test/` returned nothing before IIC-2015 — even though
 * it changes the outcome of every resize gesture on a circle, a text or a math block.
 *
 * IIC-2015 moved the decision from three type tests in the manager onto the symbol's util, so these
 * cover both halves: which symbols ask for it, and what asking for it does.
 */
describe("IIResizeManager aspect ratio locking", () => {
  const startResize = async (symbols: TSymbol[], direction: ResizeDirection) => {
    const canvas = createCanvasMock()
    const manager = new IIResizeManager(asCanvas(canvas))
    await canvas.init()
    symbols.forEach((symbol) => {
      canvas.model.addSymbol(symbol)
      canvas.model.selectSymbol(symbol.id)
    })
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.setAttribute("id", "group-id")
    group.setAttribute("role", SvgElementRole.InteractElementsGroup)
    const handle = document.createElementNS("http://www.w3.org/2000/svg", "line")
    handle.setAttribute("resize-direction", direction)
    group.appendChild(handle)
    const box = BoxOps.createFromPoints(symbols.flatMap((s) => SymbolGeometry.verticesOf(s)))
    manager.start(handle, { x: box.x, y: box.y })
    return { manager, box }
  }

  const buildStroke = () => {
    const stroke = StrokeUtil.createEmpty({})
    StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
    StrokeUtil.addPointer(stroke, { p: 1, dt: 2, x: 40, y: 20 })
    return stroke
  }

  test("a circle in the selection should lock it", async () => {
    const { manager } = await startResize([ShapeUtil.createCircle({ x: 20, y: 20 }, 10)], ResizeDirection.East)
    expect(manager.keepRatio).toBe(true)
  })

  test.each([
    ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
    ["math", () => buildIIMath()],
  ])("a %s in the selection should lock it", async (_name, build) => {
    const { manager } = await startResize([build()], ResizeDirection.East)
    expect(manager.keepRatio).toBe(true)
  })

  test.each([
    ["a stroke", () => buildStroke()],
    ["an ellipse", () => ShapeUtil.createEllipse({ x: 20, y: 20 }, 30, 10, 0)],
    ["a polygon", () => ShapeUtil.createPolygon([{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }])],
    ["a line", () => EdgeUtil.createLine({ x: 0, y: 0 }, { x: 20, y: 20 })],
  ])("%s alone should not lock it", async (_name, build) => {
    const { manager } = await startResize([build()], ResizeDirection.East)
    expect(manager.keepRatio).toBe(false)
  })

  test("one locking symbol should lock the whole selection", async () => {
    // `some`, not `every` — which is what the three type tests said, and easy to invert by accident.
    const { manager } = await startResize(
      [buildStroke(), ShapeUtil.createCircle({ x: 60, y: 20 }, 10)],
      ResizeDirection.East
    )
    expect(manager.keepRatio).toBe(true)
  })

  test("a locked drag should equalise the two scale factors", async () => {
    // The payoff. Dragging an east handle normally scales x alone; with the ratio locked, y follows.
    const { manager, box } = await startResize([ShapeUtil.createCircle({ x: 20, y: 20 }, 10)], ResizeDirection.East)
    const scales = manager.continue({ x: box.x + box.width * 2, y: box.y })
    expect(scales.scaleY).toBe(scales.scaleX)
    expect(scales.scaleX).not.toBe(1)
  })

  test("an unlocked drag of the same shape should not", async () => {
    // Guards the guard: without this, the assertion above could pass on a gesture that happened to
    // produce equal factors anyway.
    const { manager, box } = await startResize(
      [ShapeUtil.createEllipse({ x: 20, y: 20 }, 30, 10, 0)],
      ResizeDirection.East
    )
    const scales = manager.continue({ x: box.x + box.width * 2, y: box.y })
    expect(scales.scaleY).toBe(1)
    expect(scales.scaleX).not.toBe(1)
  })
})

describe("start() — selection containing an unregistered symbol type", () => {
  /**
   * selectAll() (and any other bulk-select path) populates symbolsSelected with no registry
   * check ahead of it — start()'s bounding-box scan AND its keepRatio check must both skip an
   * unregistered symbol rather than throw, or the gesture never reaches end(), leaving
   * startOperation("Resizing") stuck open for the rest of the session (endOperation only runs
   * from end(), never from a throw in start()). Both guards share one filtered list, so this
   * fails if either is removed.
   */
  test("does not throw, computing both the bounding box and keepRatio from the registered symbols only", () => {
    const canvas = createCanvasMock()
    const manager = new IIResizeManager(asCanvas(canvas))

    const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 10, height: 10 } })
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)

    const orphan = {
      ...(buildIIStroke({ box: { x: 1000, y: 1000, width: 10, height: 10 } }) as unknown as TBaseSymbol),
      type: "no-such-type",
      id: "orphan-1",
    } as unknown as TSymbol
    canvas.model.addSymbol(orphan)
    canvas.model.selectSymbol(orphan.id)

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
    group.setAttribute("role", SvgElementRole.InteractElementsGroup)
    const handle = document.createElementNS("http://www.w3.org/2000/svg", "line")
    handle.setAttribute("resize-direction", ResizeDirection.East)
    group.appendChild(handle)

    expect(() => manager.start(handle, { x: 0, y: 0 })).not.toThrow()

    // Bounding box comes only from the registered stroke (0,0,10,10) — the orphan at
    // (1000,1000,10,10) must not have pulled it out toward that far corner.
    expect(manager.boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 })
    // A plain stroke never requires a locked ratio — this is really just checking that
    // keepRatio was computed at all (over the filtered list) rather than throwing before
    // assigning it.
    expect(manager.keepRatio).toBe(false)
  })
})
