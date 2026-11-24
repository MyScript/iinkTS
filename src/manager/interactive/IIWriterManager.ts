import type { TInteractiveInkCanvas } from "@/canvas"
import type { WebSocketClient } from "@/client"
import { SELECTION_PADDING } from "@/constants"
import type { TPoint, TPointer } from "@/core"
import { OBBOps } from "@/core"
import { RafCoalescer } from "@/dom"
import type { TPointerInfo } from "@/grabber"
import type { IIHistoryManager } from "@/history"
import type { IIModel } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TEdge, TShapeCircle, TShapeEllipse, TShapePolygon, TStroke, TSymbol } from "@/symbol"
import { cloneSymbol, EdgeDecoration, EdgeKind, isStroke, SymbolType } from "@/symbol"
import { EdgeUtil, ShapeUtil, StrokeUtil, SymbolGeometry, symbolRegistry } from "@/symbol-utils"

import { AbstractWriterManager } from "../base/AbstractWriterManager"
import { CanvasWriteTool } from "./CanvasWriteTool"
import type { TGesture } from "./gestures"
import type { IIGestureManager } from "./IIGestureManager"
import type { IISnapManager } from "./IISnapManager"

/**
 * @group Manager
 */
export class IIWriterManager extends AbstractWriterManager {
  #tool: CanvasWriteTool = CanvasWriteTool.Pencil
  #renderCoalescer = new RafCoalescer()
  detectGesture: boolean = true
  canvas: TInteractiveInkCanvas
  currentSymbolOrigin?: TPoint

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas)
    this.canvas = canvas
  }

  get tool(): CanvasWriteTool {
    return this.#tool
  }
  set tool(wt: CanvasWriteTool) {
    this.#tool = wt
    this.canvas.menu.update()
    if (wt !== CanvasWriteTool.Pencil) {
      this.canvas.layers.root.classList.add("shape")
    } else {
      this.canvas.layers.root.classList.remove("shape")
    }
    this.canvas.unselectAll()
  }

  get model(): IIModel {
    return this.canvas.model
  }

  get renderer(): SVGRenderer {
    return this.canvas.renderer
  }

  get history(): IIHistoryManager {
    return this.canvas.history
  }

  get gestureManager(): IIGestureManager {
    return this.canvas.gesture
  }

  get snaps(): IISnapManager {
    return this.canvas.snaps
  }

  get client(): WebSocketClient {
    return this.canvas.client
  }

  attach(layer: HTMLElement): void {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  /**
   * name: alice-strokes-write-latency
   */

  detach(): void {
    this.cancelScheduledRender()
    this.renderer.clearCurrentSymbolLayer()
    this.grabber.detach()
  }

  /**
   * Coalesces the DOM write for the current symbol to at most once per animation
   * frame: a fast pen/mouse can fire many `continue()` calls per frame (further
   * amplified by coalesced pointer samples), each of which would otherwise force
   * a real DOM replace + repaint on a canvas that may already hold many symbols.
   */
  protected scheduleRender(): void {
    this.#renderCoalescer.schedule(() => {
      if (this.currentSymbol) {
        this.renderer.drawCurrentSymbol(this.currentSymbol)
      }
    })
  }

  protected cancelScheduledRender(): void {
    this.#renderCoalescer.cancel()
  }

  protected needContextLessGesture(stroke: TStroke): boolean {
    const strokeBoundsWithMargin = this.canvas.getSymbolsBounds([stroke], 2 * SELECTION_PADDING)
    return (
      this.detectGesture &&
      // Whole-document scan on every stroke-end — one unregistered symbol type must not abort
      // gesture detection for the rest of the document.
      this.model.symbols.some(
        (s) =>
          !isStroke(s) &&
          symbolRegistry.has(s.type) &&
          OBBOps.overlapsBox(SymbolGeometry.boundsOf(s), strokeBoundsWithMargin)
      )
    )
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string, creationTime: number): TSymbol {
    switch (this.tool) {
      case CanvasWriteTool.Pencil:
        this.currentSymbol = StrokeUtil.createEmpty(style, pointerType, creationTime)
        break
      case CanvasWriteTool.Rectangle:
        this.currentSymbol = ShapeUtil.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Triangle:
        this.currentSymbol = ShapeUtil.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Parallelogram:
        this.currentSymbol = ShapeUtil.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Rhombus:
        this.currentSymbol = ShapeUtil.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Circle:
        this.currentSymbol = ShapeUtil.createCircleBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Ellipse:
        this.currentSymbol = ShapeUtil.createEllipseBetweenPoints(pointer, pointer, style)
        break
      case CanvasWriteTool.Line:
      case CanvasWriteTool.Arrow:
      case CanvasWriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (this.tool === CanvasWriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        } else if (this.tool === CanvasWriteTool.DoubleArrow) {
          startDecoration = EdgeDecoration.Arrow
          endDecoration = EdgeDecoration.Arrow
        }
        this.currentSymbol = EdgeUtil.createLine(pointer, pointer, startDecoration, endDecoration, style)
        break
      }
      default:
        throw new Error(`Can't create symbol, tool is unknown: "${this.tool}"`)
    }
    return this.updateCurrentSymbol(pointer)
  }

  protected updateCurrentSymbolShape(pointer: TPointer): void {
    switch (this.tool) {
      case CanvasWriteTool.Rectangle:
        ShapeUtil.updateRectangleBetweenPoints(this.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case CanvasWriteTool.Triangle:
        ShapeUtil.updateTriangleBetweenPoints(this.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case CanvasWriteTool.Parallelogram:
        ShapeUtil.updateParallelogramBetweenPoints(
          this.currentSymbol as TShapePolygon,
          this.currentSymbolOrigin!,
          pointer
        )
        break
      case CanvasWriteTool.Rhombus:
        ShapeUtil.updateRhombusBetweenPoints(this.currentSymbol as TShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case CanvasWriteTool.Circle:
        ShapeUtil.updateCircleBetweenPoints(this.currentSymbol as TShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case CanvasWriteTool.Ellipse:
        ShapeUtil.updateEllipseBetweenPoints(this.currentSymbol as TShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
    }
  }

  protected updateCurrentSymbolEdge(pointer: TPointer): void {
    const edge = this.currentSymbol as TEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        edge.end = pointer
        break
    }
  }

  protected updateCurrentSymbol(pointer: TPointer): TSymbol {
    if (!this.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }

    switch (this.currentSymbol.type) {
      case SymbolType.Stroke:
        StrokeUtil.addPointer(this.currentSymbol as TStroke, pointer)
        break
      case SymbolType.Shape:
        this.updateCurrentSymbolShape(pointer)
        break
      case SymbolType.Edge:
        this.updateCurrentSymbolEdge(pointer)
        break
    }
    return this.currentSymbol
  }

  start(info: TPointerInfo): void {
    // Reflects "working" on the state badge as soon as the user starts drawing, without waiting
    // for a server round-trip. Also the signal IISynchronizerManager's write-idle gate polls to
    // avoid contending with an in-progress gesture. Ended synchronously in `end()`.
    this.canvas.startOperation("Writing")
    const localPointer = info.pointer
    if (this.tool !== CanvasWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.currentSymbolOrigin = localPointer
    this.createCurrentSymbol(localPointer, this.canvas.penStyle, info.pointerType, info.gestureStartTime)
    this.renderer.drawCurrentSymbol(this.currentSymbol!)
  }

  continue(info: TPointerInfo): void {
    const localPointer = info.pointer
    if (this.tool !== CanvasWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }

    this.updateCurrentSymbol(localPointer)
    this.scheduleRender()
  }

  protected async interactWithBackend(stroke: TStroke): Promise<void> {
    const localStroke = cloneSymbol(stroke) as TStroke
    let gestureFromContextLess: TGesture | undefined
    if (this.needContextLessGesture(stroke)) {
      gestureFromContextLess = await this.gestureManager.getGestureFromContextLess(localStroke)
    }
    if (gestureFromContextLess) {
      this.client.addStrokes([localStroke], this.detectGesture)
      await this.gestureManager.apply(gestureFromContextLess)
    } else {
      // Any server-detected gesture arrives asynchronously via client.event.addGestureDetectedListener,
      // handled by IIGestureManager itself — not tied to this call's return value.
      await this.client.addStrokes([localStroke], this.detectGesture)
    }
  }

  async end(info: TPointerInfo): Promise<void> {
    this.cancelScheduledRender()
    const localPointer = info.pointer
    if (this.tool !== CanvasWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.currentSymbol = undefined
    this.currentSymbolOrigin = undefined
    this.snaps.clearSnapToElementLines()
    // Gesture is over as soon as the pointer lifts - end it now, synchronously, rather than
    // waiting for the backend round-trip below. IISynchronizerManager's write-idle gate waits
    // on this same flag, so leaving it set until the round-trip resolves would deadlock the
    // debounced synchronize() that triggers said round-trip in the first place.
    this.canvas.endOperation("Writing")

    this.renderer.drawSymbol(localSymbol!)
    this.renderer.clearCurrentSymbolLayer()
    this.model.addSymbol(localSymbol)
    this.history.push({
      added: [localSymbol],
    })

    // this.renderer.redrawGuides()

    if (isStroke(localSymbol)) {
      await this.interactWithBackend(localSymbol)
    }
  }
}
