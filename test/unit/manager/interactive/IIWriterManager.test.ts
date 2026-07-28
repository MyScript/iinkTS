import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import {
  IIWriterManager,
  DefaultStyle,
  SymbolType,
  TPointer,
  CanvasWriteTool,
  ShapeKind,
  TShape,
  TEdge,
  EdgeDecoration,
  EdgeKind,
  TStroke,
  TPointerInfo,
} from "@/iink"

describe("IIWriterManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IIWriterManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  describe("writing process", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve(undefined))

    const manager = new IIWriterManager(asCanvas(canvas))
    manager.renderer.drawSymbol = jest.fn()

    canvas.init()

    test("should init model.currentSymbol with pencil", async () => {
      expect(manager.currentSymbol).toBeUndefined()

      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(canvas.startOperation).toHaveBeenCalledWith("Writing")
      expect(manager.model.creationTime).toStrictEqual(manager.model.modificationDate)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toEqual(SymbolType.Stroke)
      expect(manager.currentSymbol?.style.color).toBe(DefaultStyle.color)
      expect(manager.currentSymbol?.style.width).toBe(DefaultStyle.width)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with pencil & custom style", () => {
      canvas.penStyle = { color: "red", width: 42 }
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.style.color).toBe(canvas.penStyle.color)
      expect(manager.currentSymbol?.style.width).toBe(canvas.penStyle.width)
    })
    test("should init model.currentSymbol with Rectangle", () => {
      canvas.penStyle = DefaultStyle
      expect(canvas.layers.root.classList.contains("shape")).toBe(false)
      manager.tool = CanvasWriteTool.Rectangle
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.currentSymbol as TShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Circle", () => {
      manager.tool = CanvasWriteTool.Circle
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.currentSymbol as TShape
      expect(shape.kind).toBe(ShapeKind.Circle)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Ellipse", () => {
      manager.tool = CanvasWriteTool.Ellipse
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.currentSymbol as TShape
      expect(shape.kind).toBe(ShapeKind.Ellipse)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Triangle", () => {
      manager.tool = CanvasWriteTool.Triangle
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.currentSymbol as TShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Parallelogram", () => {
      manager.tool = CanvasWriteTool.Parallelogram
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Shape)
      const shape = manager.currentSymbol as TShape
      expect(shape.kind).toBe(ShapeKind.Polygon)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Line", () => {
      manager.tool = CanvasWriteTool.Line
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.currentSymbol as TEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toBeUndefined()
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with Arrow", () => {
      manager.tool = CanvasWriteTool.Arrow
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.currentSymbol as TEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toBeUndefined()
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should init model.currentSymbol with DoubleArrow", () => {
      manager.tool = CanvasWriteTool.DoubleArrow
      expect(canvas.layers.root.classList.contains("shape")).toBe(true)
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentSymbol).toBeDefined()
      expect(manager.currentSymbol?.type).toBe(SymbolType.Edge)
      const shape = manager.currentSymbol as TEdge
      expect(shape.kind).toBe(EdgeKind.Line)
      expect(shape.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(shape.endDecoration).toEqual(EdgeDecoration.Arrow)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })
    test("should throw error if symbol type unknown when start", () => {
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      //@ts-ignore
      manager.tool = "unknown"
      expect(() => manager.start(info)).toThrow('Can\'t create symbol, tool is unknown: "unknown"')
    })
    test("should update currentSymbol", () => {
      manager.tool = CanvasWriteTool.Pencil
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      const point2: TPointer = { t: 15, p: 15, x: 15, y: 15 }
      manager.continue({ pointer: point2 } as TPointerInfo)
      const stroke = manager.currentSymbol as TStroke
      expect(stroke.pointers).toHaveLength(2)
      expect(stroke.pointers[1].x).toBe(point2.x)
      expect(stroke.pointers[1].y).toBe(point2.y)
      expect(stroke.pointers[1].t).toBe(point2.t)
      expect(stroke.pointers[1].p).toBe(point2.p)
    })
    test("should throw error when continu if currentSymbol is undefined", () => {
      manager.currentSymbol = undefined
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      expect(() => manager.continue(info)).toThrow("Can't update current symbol because currentSymbol is undefined")
    })
    test("should clear currentSymbol and add into model.symbols", async () => {
      manager.model.clear()
      manager.currentSymbol = undefined
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      manager.continue({ pointer: point } as TPointerInfo)
      await manager.end({ pointer: point } as TPointerInfo)
      expect(manager.currentSymbol).toBeUndefined()
      expect(manager.model.symbols).toHaveLength(1)
      expect(canvas.client.addStrokes).toHaveBeenCalledTimes(1)
      expect(canvas.client.addStrokes).toHaveBeenCalledWith([manager.model.symbols[0]], true)
    })

    test("should end the 'Writing' operation synchronously on end(), even for a stroke whose backend round-trip is still pending", () => {
      manager.model.clear()
      manager.currentSymbol = undefined
      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      manager.continue({ pointer: point } as TPointerInfo)
      // Not awaited on purpose: endOperation("Writing") must happen before the backend
      // round-trip (interactWithBackend) resolves, not after.
      void manager.end({ pointer: point } as TPointerInfo)
      expect(canvas.endOperation).toHaveBeenCalledWith("Writing")
    })

    test("should end the 'Writing' operation immediately for a non-stroke symbol (e.g. a shape)", async () => {
      const shapeCanvas = createCanvasMock()
      shapeCanvas.client.init = jest.fn(() => Promise.resolve())
      const shapeManager = new IIWriterManager(asCanvas(shapeCanvas))
      shapeManager.renderer.drawSymbol = jest.fn()
      shapeManager.tool = CanvasWriteTool.Rectangle

      const point: TPointer = { t: 25, p: 25, x: 25, y: 25 }
      shapeManager.start({ pointer: { t: 1, p: 0.5, x: 1, y: 1 } } as TPointerInfo)
      await shapeManager.end({ pointer: point } as TPointerInfo)

      expect(shapeCanvas.startOperation).toHaveBeenCalledWith("Writing")
      expect(shapeCanvas.endOperation).toHaveBeenCalledWith("Writing")
    })
  })

  describe("continue() rendering throttle", () => {
    const canvas = createCanvasMock()
    canvas.client.init = jest.fn(() => Promise.resolve())
    canvas.client.addStrokes = jest.fn(() => Promise.resolve(undefined))

    const manager = new IIWriterManager(asCanvas(canvas))
    manager.renderer.drawSymbol = jest.fn()

    canvas.init()

    test("should coalesce several continue() calls into a single drawCurrentSymbol per animation frame", async () => {
      manager.tool = CanvasWriteTool.Pencil
      manager.start({ pointer: { t: 0, p: 0.5, x: 0, y: 0 } } as TPointerInfo)
      ;(manager.renderer.drawCurrentSymbol as jest.Mock).mockClear()

      manager.continue({ pointer: { t: 1, p: 0.5, x: 10, y: 10 } } as TPointerInfo)
      manager.continue({ pointer: { t: 2, p: 0.5, x: 20, y: 20 } } as TPointerInfo)
      manager.continue({ pointer: { t: 3, p: 0.5, x: 30, y: 30 } } as TPointerInfo)

      // Data is updated synchronously for every point - only the DOM write is throttled.
      expect((manager.currentSymbol as TStroke).pointers).toHaveLength(4)
      expect(manager.renderer.drawCurrentSymbol).not.toHaveBeenCalled()

      await new Promise((resolve) => requestAnimationFrame(resolve))

      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawCurrentSymbol).toHaveBeenCalledWith(manager.currentSymbol)
    })

    test("should still draw the final state immediately on end(), without a pending stale frame", async () => {
      manager.continue({ pointer: { t: 4, p: 0.5, x: 4, y: 4 } } as TPointerInfo)
      ;(manager.renderer.drawSymbol as jest.Mock).mockClear()
      ;(manager.renderer.drawCurrentSymbol as jest.Mock).mockClear()

      await manager.end({ pointer: { t: 5, p: 0.5, x: 5, y: 5 } } as TPointerInfo)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.clearCurrentSymbolLayer).toHaveBeenCalledTimes(1)

      // If the pending frame from the continue() above wasn't cancelled, it would fire here
      // and call drawCurrentSymbol again with a stale (now undefined) currentSymbol.
      await new Promise((resolve) => requestAnimationFrame(resolve))
      expect(manager.renderer.drawCurrentSymbol).not.toHaveBeenCalled()
    })
  })
})
