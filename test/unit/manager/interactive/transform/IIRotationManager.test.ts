import { createCanvasMock, asCanvas } from "../../../__mocks__/createCanvasMock"
import { buildIIMath, buildIIStroke, buildIIText } from "../../../helpers"
import { BoxOps, DecoratorKind, DecoratorUtil, EdgeUtil, IIConnectorManager, IIRotationManager, MathUtil, MatrixTransform, OBBOps, ShapeUtil, StrokeUtil, SvgElementRole, SymbolGeometry, TBaseSymbol, TDecorator, TPoint, TStroke, TSymbol, TextUtil, computeRotatedPoint, convertDegreeToRadian } from "@/iink"

describe("IIRotationManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIRotationManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("should applyToSymbol", () => {
    const canvas = createCanvasMock()
    canvas.typeset.setBounds = jest.fn()
    canvas.renderer.setAttribute = jest.fn()
    const manager = new IIRotationManager(asCanvas(canvas))

    test("rotate edge with kind unknown no longer throws, since rotate no longer resolves a kind", () => {
      // IIC-2012 moved the refusal to the edge util's kind table; Task 11 then made
      // translate/rotate/resize matrix-only, so that table (and the `resolveKind` call that used
      // to throw) is no longer on this path — a symbol whose geometry cannot be computed can still
      // have its matrix composed.
      const edge = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 0, y: 5 })
      //@ts-ignore
      edge.kind = "pouet"
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })
      expect(() => manager.applyToSymbol(edge, matrix)).not.toThrow()
      expect(edge.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
    })

    test("rotate shape with kind unknown no longer throws, for the same reason", () => {
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
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      expect(() => manager.applyToSymbol(poly, matrix)).not.toThrow()
      expect(poly.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
    })
    test("rotate stroke composes the matrix rather than moving its pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      const origin: TPoint = { x: 0, y: 0 }
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 10, x: 10, y: 0 })
      const pointersBefore = stroke.pointers.map((p) => ({ ...p }))
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
      expect(stroke.pointers).toEqual(pointersBefore)
    })
    test("rotate a math solver-output (draw) stroke composes the matrix like a normal stroke", () => {
      const stroke = StrokeUtil.createEmpty()
      stroke.isSolverOutput = true
      const origin: TPoint = { x: 0, y: 0 }
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 10, x: 10, y: 0 })
      const pointersBefore = stroke.pointers.map((p) => ({ ...p }))
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(stroke, matrix)
      expect(stroke.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
      expect(stroke.pointers).toEqual(pointersBefore)
    })
    test("rotate shape Circle composes the matrix rather than moving its centre", () => {
      const center: TPoint = { x: 5, y: 5 }
      const radius = 4
      const circle = ShapeUtil.createCircle(center, radius)
      const origin: TPoint = { x: 1, y: 2 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(circle, matrix)
      expect(circle.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 3, ty: 1 })
      expect(circle.radius).toEqual(radius)
      expect(circle.center).toEqual(center)
    })
    test("rotate edge Line composes the matrix rather than moving its endpoints", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 0, y: 5 }
      const line = EdgeUtil.createLine(start, end)
      const origin: TPoint = { x: 0, y: 0 }
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2, origin)
      manager.applyToSymbol(line, matrix)
      expect(line.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
    })
  })

  describe("rotate process on stroke", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.transformRotate = jest.fn(() => Promise.resolve())
    canvas.renderer.setAttribute = jest.fn()
    canvas.renderer.drawSymbol = jest.fn()
    canvas.renderer.setSymbolTransform = jest.fn()

    const manager = new IIRotationManager(asCanvas(canvas))
    manager.applyToSymbol = jest.fn()

    const strokeOrigin = StrokeUtil.createEmpty({})
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 0, y: 0 })
    StrokeUtil.addPointer(strokeOrigin, { p: 1, dt: 1, x: 10, y: 50 })
    canvas.model.addSymbol(strokeOrigin)
    canvas.model.selectSymbol(strokeOrigin.id)

    const originBox = OBBOps.toBox(SymbolGeometry.boundsOf(strokeOrigin))
    const rotateCenter: TPoint = {
      x: originBox.x + originBox.width / 2,
      y: originBox.y + originBox.height / 2,
    }
    const rotateOrigin: TPoint = {
      x: originBox.x + originBox.width / 2,
      y: originBox.y + originBox.height,
    }

    const testDatas = [
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 5),
        angle: 324,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, Math.PI / 2),
        angle: 270,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 5),
        angle: 36,
      },
      {
        rotateToPoint: computeRotatedPoint(rotateOrigin, rotateCenter, -Math.PI / 2),
        angle: 90,
      },
    ]

    beforeAll(async () => {
      await canvas.init()
    })

    testDatas.forEach((data) => {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "group-id")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      rotateElement.setAttribute("cx", rotateOrigin.x.toString())
      rotateElement.setAttribute("cy", rotateOrigin.y.toString())
      group.appendChild(rotateElement)

      test(`should start with angle: "${data.angle}° `, () => {
        manager.start(rotateElement, rotateOrigin)

        expect(manager.interactElementsGroup).toEqual(group)
        expect(manager.center).toEqual(rotateCenter)
        expect(manager.origin).toEqual(rotateOrigin)
        // `start` no longer writes anything to the DOM. It used to set `transform-origin` on the
        // group and on every selected symbol, which cannot survive alongside a stored matrix: that
        // attribute applies to the whole transform list, so it would displace the symbol's own
        // matrix as well as the gesture's. The live matrix carries `center` itself instead.
        expect(canvas.renderer.setAttribute).not.toHaveBeenCalled()
        expect(canvas.startOperation).toHaveBeenCalledWith("Rotating")
      })
      test(`shoud continu with angle: "${data.angle}°`, () => {
        expect(manager.continue(data.rotateToPoint)).toEqual(data.angle)

        // The preview is a full `matrix(...)` rather than `rotate(deg)`: it has to compose with the
        // matrix a symbol already carries, and a bare `rotate` would replace it. `strokeOrigin`'s own
        // matrix is the identity here, so both writes come out the same — the composition itself is
        // pinned by the "keeps the matrix a symbol already carries" test below.
        const live = MatrixTransform.identity()
          .rotate(convertDegreeToRadian(data.angle), rotateCenter)
          .toCssString()
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(1, group.id, "transform", live)
        expect(canvas.renderer.setAttribute).toHaveBeenNthCalledWith(2, strokeOrigin.id, "transform", live)
      })
      test(`shoud end with angle: "${data.angle}°`, async () => {
        const endPromise = manager.end(data.rotateToPoint)
        expect(canvas.endOperation).toHaveBeenCalledWith("Rotating")
        await endPromise

        const newStroke = canvas.model.getSymbol(strokeOrigin.id) as TStroke
        expect(manager.applyToSymbol).toHaveBeenCalledTimes(1)
        // Committing a transform rewrites the element's `transform` attribute instead of rebuilding
        // it through `drawSymbol` (task 12) - the final geometry reaches the renderer as an
        // untouched `setSymbolTransform` call, not a `drawSymbol` one.
        expect(canvas.renderer.drawSymbol).not.toHaveBeenCalled()
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledTimes(1)
        expect(canvas.renderer.setSymbolTransform).toHaveBeenCalledWith(newStroke)
        expect(canvas.client.transformRotate).toHaveBeenCalledTimes(1)
        expect(canvas.client.transformRotate).toHaveBeenCalledWith(
          [newStroke.id],
          convertDegreeToRadian(data.angle),
          rotateCenter.x,
          rotateCenter.y
        )
        expect(strokeOrigin).not.toEqual(newStroke)
      })
    })
  })

  /**
   * IIC-1999. The drag preview used to write the gesture's transform alone, which replaced whatever
   * the element already carried — so a symbol that had been moved before snapped back to its raw
   * coordinates for the length of the drag and jumped into place on release. Before this epic only a
   * rotated typeset carried a baked transform; now every moved symbol does.
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
      group.appendChild(target)

      const manager = new IIRotationManager(asCanvas(canvas))
      manager.start(target, { x: 0, y: 0 })
      // Drive the angle straight in rather than deriving it from a pointer position: this test is
      // about the composition, and `continue`'s angle arithmetic is covered above.
      manager.center = { x: 0, y: 0 }
      manager.origin = { x: 1, y: 0 }
      manager.continue({ x: 0, y: 1 })

      const written = (canvas.renderer.setAttribute as jest.Mock).mock.calls.find(
        ([id, name]) => id === stroke.id && name === "transform"
      )
      // Hand-computed, not read back from the code under test. A 90 degree rotation about the origin
      // is {xx:0, yx:1, xy:-1, yy:0, tx:0, ty:0}; the stored translate is {1,0,0,1,100,0}. Their
      // product live*stored has tx = 0*100 + (-1)*0 + 0 = 0 and ty = 1*100 + 0*0 + 0 = 100 — the
      // symbol's own offset turned by the gesture. Replacing instead of composing would write
      // "matrix(0, 1, -1, 0, 0, 0)" and lose the 100 entirely.
      expect(written?.[2]).toBe("matrix(0, 1, -1, 0, 0, 100)")
    })
  })

  describe("ghost strokes follow a selected math block during rotation", () => {
    function buildMathStroke(jiixBlockId: string) {
      const stroke = buildIIStroke()
      stroke.jiixBlockType = "Math"
      stroke.jiixBlockId = jiixBlockId
      return stroke
    }

    function setupTarget(origin: TPoint) {
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      target.setAttribute("cx", origin.x.toString())
      target.setAttribute("cy", origin.y.toString())
      group.appendChild(target)
      return target
    }

    test("continue() live-rotates the block's ghost stroke element", () => {
      const canvas = createCanvasMock()
      canvas.math.getGhostStrokeIds = jest.fn().mockReturnValue(["ghost-1"])
      canvas.renderer.setAttribute = jest.fn()
      const manager = new IIRotationManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      const origin: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height }
      const center: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }

      manager.start(setupTarget(origin), origin)
      manager.continue(computeRotatedPoint(origin, center, Math.PI / 2))

      // The ghost must follow with the *same* transform the selection got, not merely with some
      // rotation: it is a preview of the block the selection belongs to, so any divergence shows on
      // screen as the ghost drifting away from the strokes it shadows. Compared against the write
      // the selected stroke received rather than a hard-coded string, which is the property that
      // actually matters and survives a change of angle.
      const calls = (canvas.renderer.setAttribute as jest.Mock).mock.calls
      const selectionWrite = calls.find(([id, name]) => id === stroke.id && name === "transform")
      const ghostWrite = calls.find(([id, name]) => id === "ghost-1" && name === "transform")
      expect(selectionWrite?.[2]).toEqual(expect.stringContaining("matrix("))
      expect(ghostWrite?.[2]).toBe(selectionWrite?.[2])
    })

    test("end() permanently applies the matrix to the block's ghost strokes", async () => {
      const canvas = createCanvasMock()
      canvas.client.transformRotate = jest.fn(() => Promise.resolve())
      canvas.math.applyTransformToGhostStrokes = jest.fn()
      const manager = new IIRotationManager(asCanvas(canvas))
      const stroke = buildMathStroke("block-1")
      canvas.model.addSymbol(stroke)
      canvas.model.selectSymbol(stroke.id)

      const sb = OBBOps.toBox(SymbolGeometry.boundsOf(stroke))
      const origin: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height }
      const center: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }

      manager.start(setupTarget(origin), origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      expect(canvas.math.applyTransformToGhostStrokes).toHaveBeenCalledWith("block-1", expect.anything())
    })
  })

  describe("raw single-anchor edge stroke follows a rotated block through the full commit path", () => {
    test("end() sends the followed edge stroke's new content via replaceStrokes and snapshots it in history's updated entry", async () => {
      const canvas = createCanvasMock()
      // Real connector: the stub would no-op the rigid-follow commit path entirely.
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      jest.spyOn(canvas.jiix, "getStrokesForElement").mockReturnValue([])
      canvas.client.transformRotate = jest.fn(() => Promise.resolve())
      canvas.client.replaceStrokes = jest.fn(() => Promise.resolve())
      const manager = new IIRotationManager(asCanvas(canvas))

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
      const origin: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height }
      const center: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(rotateElement)

      manager.start(rotateElement, origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      // The edge stroke really moved with the shape...
      expect(newEdgeStroke.pointers).not.toEqual(originalPointers)
      // ...but it was reshaped non-uniformly (gradient-followed, single anchor), so it must never
      // be folded into the uniform transformRotate call — its full new content goes via replaceStrokes...
      const sentIds = (canvas.client.transformRotate as jest.Mock).mock.calls[0][0] as string[]
      expect(sentIds).not.toContain(newEdgeStroke.id)
      expect(canvas.client.replaceStrokes).toHaveBeenCalledWith([newEdgeStroke.id], [newEdgeStroke])
      // ...and history must hold its PRE-rotation snapshot for undo. Every change is a before/after
      // pair now, so the gradient-shifted stroke and the rotated selection sit in the same list.
      const changes = (canvas.history.push as jest.Mock).mock.calls[0][0] as {
        updated?: { before: TStroke; after: TStroke }[]
      }
      const pair = changes.updated?.find((entry) => entry.before.id === edgeStroke.id)
      expect(pair).toBeDefined()
      expect(pair!.before.pointers).toEqual(originalPointers)
      expect(pair!.after).toStrictEqual(newEdgeStroke)
      // And the rotated symbol's own pair is still there beside it. Two sources feed one entry — the
      // selection and the followed stroke — and they must be appended, not assigned: assigning
      // `updated` twice keeps only the last writer, which would leave the symbols the user actually
      // dragged with nothing to undo.
      expect(changes.updated?.find((entry) => entry.before.id === shape.id)).toBeDefined()
    })

    test("end() commits the exact same gradient shape the drag preview showed (no pointerup snap)", async () => {
      // Regression: the preview pass (drawAnchoredEdgesForMatrix, called from continue() before
      // the shape has moved) and the commit pass (updateAnchoredEdges, called after applyAndDraw
      // already rotated the shape) must resolve the gradient's target center from the SAME
      // pre-transform position. Needs a 3rd, non-extreme point: with only 2 points both always
      // land exactly on the group's min/max (weight 0 or 1 regardless of which center is used),
      // so the drift this test guards against wouldn't show up.
      const canvas = createCanvasMock()
      ;(canvas as unknown as { connector: IIConnectorManager }).connector = new IIConnectorManager(asCanvas(canvas))
      canvas.client.transformRotate = jest.fn(() => Promise.resolve())
      const manager = new IIRotationManager(asCanvas(canvas))

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
      const origin: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height }
      const center: TPoint = { x: sb.x + sb.width / 2, y: sb.y + sb.height / 2 }
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const rotateElement = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(rotateElement)

      manager.start(rotateElement, origin)
      await manager.end(computeRotatedPoint(origin, center, Math.PI / 2))

      // First drawSymbol call for this id is the preview clone (from continue(), before the
      // shape moved) — must match the final, committed points exactly.
      const previewClone = (canvas.renderer.drawSymbol as jest.Mock).mock.calls.find(
        (c) => (c[0] as { id: string }).id === edgeStroke.id
      )![0] as typeof edgeStroke
      const newEdgeStroke = canvas.model.getSymbol(edgeStroke.id) as TStroke
      expect(newEdgeStroke.pointers).toEqual(previewClone.pointers)
    })
  })
})

/**
 * The four cells of the transform matrix that genuinely differed by operation all used to belong to
 * a per-type rotate: an ellipse and an arc carried an angle of their own, and text and math were
 * turned by recording an angle rather than by moving anything. Task 11 deleted all four — rotate is
 * `SymbolUtil.applyTransform` now, for every type, and composes the matrix onto `.transform` alone.
 *
 * These hold the replacement invariant: none of the four still-special fields moves, and the matrix
 * is what carries the turn instead.
 */
describe("IIRotationManager, the cells that used to be rotation-specific", () => {
  const quarterTurn = () => MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })

  const rotate = (symbol: TSymbol, times = 1) => {
    const canvas = createCanvasMock()
    const manager = new IIRotationManager(asCanvas(canvas))
    manager.center = { x: 0, y: 0 }
    for (let i = 0; i < times; i++) {
      manager.applyToSymbol(symbol, quarterTurn())
    }
    return canvas
  }

  test("an ellipse's own orientation no longer moves — the matrix carries the turn", () => {
    const ellipse = ShapeUtil.createEllipse({ x: 10, y: 10 }, 30, 20, 0)
    rotate(ellipse)
    expect(ellipse.orientation).toBe(0)
    expect(ellipse.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
  })

  test("an arc's phi no longer moves either", () => {
    const arc = EdgeUtil.createArc({ x: 50, y: 50 }, 0, Math.PI, 30, 20, 0)
    rotate(arc)
    expect(arc.phi).toBe(0)
    expect(arc.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
  })

  test.each([
    ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
    ["math", () => buildIIMath()],
  ])("%s composes the matrix rather than recording an angle", (_name, build) => {
    const symbol = build()
    rotate(symbol)
    expect(symbol.transform).toEqual({ xx: 0, yx: 1, xy: -1, yy: 0, tx: 0, ty: 0 })
  })

  test.each([
    ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
    ["math", () => buildIIMath()],
  ])("%s accumulates the matrix across two turns", (_name, build) => {
    const symbol = build()
    rotate(symbol, 2)
    // Two quarter turns compose to a half turn: cos(180°) rounds to -1, sin(180°) to 0 — `xy` lands
    // on negative zero, which `toEqual` distinguishes from positive zero (see TypesetUtil.test.ts).
    expect(symbol.transform).toEqual({ xx: -1, yx: 0, xy: -0, yy: -1, tx: 0, ty: 0 })
  })

  test.each([
    ["text", () => buildIIText({ point: { x: 0, y: 0 } })],
    ["math", () => buildIIMath()],
  ])("%s is neither re-measured nor re-derived by a rotate", (_name, build) => {
    // Nothing left in TypesetUtil re-measures or recomputes derived fields on a move: the raw
    // (pre-matrix) bounds/vertices a typeset symbol was measured at do not change just because it
    // turned, and only `SymbolGeometry` (which applies the matrix) reports the rotated extent.
    const symbol = build()
    // `rawOf`, not `verticesOf`: the latter applies the matrix, so it *must* differ after a turn —
    // that is the epic working. What this test pins is that the pre-matrix geometry is untouched.
    const before = {
      bounds: structuredClone(symbol.bounds),
      vertices: structuredClone(SymbolGeometry.rawOf(symbol).vertices),
    }
    const canvas = rotate(symbol)

    expect(canvas.typeset.setBounds).not.toHaveBeenCalled()
    expect(symbol.bounds).toEqual(before.bounds)
    expect(SymbolGeometry.rawOf(symbol).vertices).toEqual(before.vertices)
  })
})

/**
 * The symptom this ticket was reported for: after rotating a typeset symbol, surrounding it no
 * longer selected it, because `overlaps` reads `vertices` and those described the renderer's quad
 * mirrored about the rotation centre.
 *
 * This closes the loop the coordinate tests leave open — from the gesture to the predicate the
 * selection actually asks.
 */
/**
 * Task 11 changed what "where it is drawn" means for a rotated typeset symbol. Rotate no longer
 * bakes the turn into raw `vertices` — it composes the matrix and stops, like every other type — so
 * `TextUtil.overlaps`/`MathUtil.overlaps` (raw-geometry, unchanged by this task) can no longer see a
 * rotation at all. `SymbolGeometry.verticesOf`, which applies the matrix, is what now carries the
 * invariant this describe block used to hold at the raw-util level.
 *
 * This is a known gap, not a silent one: `IISelectionManager`'s surround-reselect (`continue()`,
 * `shouldBeSelected = symbolRegistry.getUtil(s.type)?.overlaps(...)`) still calls the raw, no-longer
 * matrix-aware method — so surround-selecting any symbol that has been translated/rotated/resized is
 * broken in the running app today, for every type, not just text and math. Fixing that is a manager
 * change outside this task's six utils, flagged in the task report rather than made here.
 */
describe("surrounding a rotated typeset symbol", () => {
  const rotateQuarterTurn = (symbol: TSymbol) => {
    const canvas = createCanvasMock()
    const manager = new IIRotationManager(asCanvas(canvas))
    manager.center = { x: 0, y: 0 }
    manager.applyToSymbol(symbol, MatrixTransform.identity().rotate(Math.PI / 2, manager.center))
  }

  test.each([
    ["text", () => buildIIText({ point: { x: 10, y: 20 } })],
    ["math", () => buildIIMath("y=3x+2", { point: { x: 10, y: 20 } })],
  ])("a rotated %s's matrix-aware vertices land where the renderer draws it", (_name, build) => {
    const symbol = build()
    const rawCorners = BoxOps.getCorners(OBBOps.toUnrotatedBox(symbol.bounds))
    rotateQuarterTurn(symbol)

    // Where the renderer puts it: rotate(90, 0, 0) sends (x, y) to (−y, x). `SymbolGeometry`
    // applies the composed matrix on top of the raw (unrotated) box, which is what a caller that
    // wants the on-screen quad has to read now.
    const expected = rawCorners.map((corner) => ({ x: -corner.y, y: corner.x }))
    SymbolGeometry.verticesOf(symbol).forEach((vertex, i) => {
      expect(vertex.x).toBeCloseTo(expected[i].x, 2)
      expect(vertex.y).toBeCloseTo(expected[i].y, 2)
    })
  })

  test.each([
    ["text", () => buildIIText({ point: { x: 10, y: 20 } }), () => new TextUtil()],
    ["math", () => buildIIMath("y=3x+2", { point: { x: 10, y: 20 } }), () => new MathUtil()],
  ])("a rotated %s's raw vertices, read straight from the util, do NOT move — documenting the gap", (_name, build, buildUtil) => {
    const symbol = build()
    const rawVerticesBefore = structuredClone(buildUtil().getGeometry(symbol as never).vertices)
    rotateQuarterTurn(symbol)

    expect(buildUtil().getGeometry(symbol as never).vertices).toEqual(rawVerticesBefore)
  })
})

describe("start() — selection containing an unregistered symbol type", () => {
  /**
   * selectAll() (and any other bulk-select path) populates symbolsSelected with no registry
   * check ahead of it — start()'s bounding-box scan must not throw over one bad symbol, or the
   * gesture never reaches end(), leaving startOperation("Rotating") stuck open for the rest of
   * the session (endOperation only runs from end()/continue(), never from a throw in start()).
   */
  test("does not throw, and computes center from the registered symbols only", () => {
    const canvas = createCanvasMock()
    const manager = new IIRotationManager(asCanvas(canvas))

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
    const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
    group.appendChild(target)

    expect(() => manager.start(target, { x: 0, y: 0 })).not.toThrow()

    // Center comes only from the registered stroke's bounds (5,5) — the orphan at (1000,1000)
    // must not have pulled it off toward the far corner.
    expect(manager.center).toEqual({ x: 5, y: 5 })
  })
  describe("standalone decorators turn with their targets", () => {
    const buildDecoratedStroke = (canvas: ReturnType<typeof createCanvasMock>) => {
      const stroke = buildIIStroke({ box: { x: 0, y: 0, width: 40, height: 10 } })
      canvas.model.addSymbol(stroke)
      const decorator = DecoratorUtil.createDecorator(DecoratorKind.Underline, {}, [stroke.id], {
        x: 0,
        y: 0,
        width: 40,
        height: 10,
      })
      canvas.model.addSymbol(decorator)
      return { stroke, decorator }
    }

    test("a committed rotation gives the decorator the same matrix as its target", () => {
      const canvas = createCanvasMock()
      const manager = new IIRotationManager(asCanvas(canvas))
      const { stroke, decorator } = buildDecoratedStroke(canvas)
      const matrix = MatrixTransform.identity().rotate(convertDegreeToRadian(30), { x: 20, y: 5 })

      manager.applyMatrix([stroke], matrix)

      const newStroke = canvas.model.getSymbol(stroke.id)!
      const newDeco = canvas.model.getSymbol(decorator.id) as TDecorator
      expect(newDeco.transform).toEqual(newStroke.transform)
      expect(newDeco.targetBounds).toEqual(decorator.targetBounds)
      expect(DecoratorUtil.renderForSymbol(newDeco, newDeco)?.getAttribute("transform")).toBe(
        MatrixTransform.toCssString(newStroke.transform)
      )
    })

    test("the rotation preview turns the decorator element with its target", () => {
      const canvas = createCanvasMock()
      const { stroke, decorator } = buildDecoratedStroke(canvas)
      canvas.model.selectSymbol(stroke.id)

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
      group.setAttribute("id", "decorated-group")
      group.setAttribute("role", SvgElementRole.InteractElementsGroup)
      const target = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      group.appendChild(target)

      const manager = new IIRotationManager(asCanvas(canvas))
      manager.start(target, { x: 0, y: 0 })
      manager.center = { x: 0, y: 0 }
      manager.origin = { x: 1, y: 0 }
      manager.continue({ x: 0, y: 1 })

      const calls = (canvas.renderer.setAttribute as jest.Mock).mock.calls
      const written = (id: string) => calls.find(([callId, name]) => callId === id && name === "transform")?.[2]
      expect(written(decorator.id)).toBe("matrix(0, 1, -1, 0, 0, 0)")
      expect(written(decorator.id)).toBe(written(stroke.id))
    })
  })
})
