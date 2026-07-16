import { EditorWriteTool, SELECTION_MARGIN } from "@/Constants"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TPointerInfo } from "@/grabber"
import type { IIHistoryManager } from "@/history"
import { AbstractWriterManager } from "@/manager/base/AbstractWriterManager"
import type { IIModel } from "@/model"
import type { RecognizerWebSocket } from "@/recognizer"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type {
  TEdge,
  TEdgeLine,
  TPoint,
  TPointer,
  TShapeCircle,
  TShapeEllipse,
  TShapePolygon,
  TStroke,
  TSymbol,
} from "@/symbol"
import { cloneSymbol, EdgeDecoration, EdgeKind, isStroke, SymbolType } from "@/symbol"
import { EdgeOps } from "@/symbol/edge/Edge"
import { EdgeLineOps } from "@/symbol/edge/Line"
import { OBBOps } from "@/symbol/primitives/OBB"
import { ShapeCircleOps } from "@/symbol/shape/Circle"
import { ShapeEllipseOps } from "@/symbol/shape/Ellipse"
import { ShapePolygonOps } from "@/symbol/shape/Polygon"
import { StrokeOps } from "@/symbol/stroke/Stroke"

import type { TGesture } from "./gestures"
import type { IIGestureManager } from "./IIGestureManager"
import type { IISnapManager } from "./IISnapManager"

/**
 * @group Manager
 */
export class IIWriterManager extends AbstractWriterManager {
  #tool: EditorWriteTool = EditorWriteTool.Pencil
  detectGesture: boolean = true
  editor: TInteractiveInkEditor
  currentSymbolOrigin?: TPoint

  constructor(editor: TInteractiveInkEditor) {
    super(editor)
    this.editor = editor
  }

  get tool(): EditorWriteTool {
    return this.#tool
  }
  set tool(wt: EditorWriteTool) {
    this.#tool = wt
    if (wt !== EditorWriteTool.Pencil) {
      this.editor.layers.root.classList.add("shape")
    } else {
      this.editor.layers.root.classList.remove("shape")
    }
    this.editor.unselectAll()
  }

  get model(): IIModel {
    return this.editor.model
  }

  get renderer(): SVGRenderer {
    return this.editor.renderer
  }

  get history(): IIHistoryManager {
    return this.editor.history
  }

  get gestureManager(): IIGestureManager {
    return this.editor.gesture
  }

  get snaps(): IISnapManager {
    return this.editor.snaps
  }

  get recognizer(): RecognizerWebSocket {
    return this.editor.recognizer
  }

  #pendingFrame?: number

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
    if (this.#pendingFrame !== undefined) {
      return
    }
    this.#pendingFrame = requestAnimationFrame(() => {
      this.#pendingFrame = undefined
      if (this.currentSymbol) {
        this.renderer.drawCurrentSymbol(this.currentSymbol)
      }
    })
  }

  protected cancelScheduledRender(): void {
    if (this.#pendingFrame !== undefined) {
      cancelAnimationFrame(this.#pendingFrame)
      this.#pendingFrame = undefined
    }
  }

  protected needContextLessGesture(stroke: TStroke): boolean {
    const strokeBoundsWithMargin = this.editor.getSymbolsBounds([stroke], 2 * SELECTION_MARGIN)
    return (
      this.detectGesture &&
      this.model.symbols.some((s) => !isStroke(s) && OBBOps.overlapsBox(s.bounds, strokeBoundsWithMargin))
    )
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TSymbol {
    switch (this.tool) {
      case EditorWriteTool.Pencil:
        this.currentSymbol = StrokeOps.create(style, pointerType)
        break
      case EditorWriteTool.Rectangle:
        this.currentSymbol = ShapePolygonOps.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Triangle:
        this.currentSymbol = ShapePolygonOps.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Parallelogram:
        this.currentSymbol = ShapePolygonOps.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Rhombus:
        this.currentSymbol = ShapePolygonOps.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Circle:
        this.currentSymbol = ShapeCircleOps.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Ellipse:
        this.currentSymbol = ShapeEllipseOps.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Line:
      case EditorWriteTool.Arrow:
      case EditorWriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (this.tool === EditorWriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        } else if (this.tool === EditorWriteTool.DoubleArrow) {
          startDecoration = EdgeDecoration.Arrow
          endDecoration = EdgeDecoration.Arrow
        }
        this.currentSymbol = EdgeLineOps.create(pointer, pointer, startDecoration, endDecoration, style)
        break
      }
      default:
        throw new Error(`Can't create symbol, tool is unknown: "${this.tool}"`)
    }
    return this.updateCurrentSymbol(pointer)
  }

  protected updateCurrentSymbolShape(pointer: TPointer): void {
    switch (this.tool) {
      case EditorWriteTool.Rectangle:
        ShapePolygonOps.updateRectangleBetweenPoints(
          this.currentSymbol as TShapePolygon,
          this.currentSymbolOrigin!,
          pointer
        )
        break
      case EditorWriteTool.Triangle:
        ShapePolygonOps.updateTriangleBetweenPoints(
          this.currentSymbol as TShapePolygon,
          this.currentSymbolOrigin!,
          pointer
        )
        break
      case EditorWriteTool.Parallelogram:
        ShapePolygonOps.updateParallelogramBetweenPoints(
          this.currentSymbol as TShapePolygon,
          this.currentSymbolOrigin!,
          pointer
        )
        break
      case EditorWriteTool.Rhombus:
        ShapePolygonOps.updateRhombusBetweenPoints(
          this.currentSymbol as TShapePolygon,
          this.currentSymbolOrigin!,
          pointer
        )
        break
      case EditorWriteTool.Circle:
        ShapeCircleOps.updateBetweenPoints(this.currentSymbol as TShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Ellipse:
        ShapeEllipseOps.updateBetweenPoints(this.currentSymbol as TShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
    }
  }

  protected updateCurrentSymbolEdge(pointer: TPointer): void {
    const edge = this.currentSymbol as TEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        ;(edge as TEdgeLine).end = pointer
        EdgeOps.updateEdgeDerivedFields(edge)
        break
    }
  }

  protected updateCurrentSymbol(pointer: TPointer): TSymbol {
    if (!this.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }

    switch (this.currentSymbol.type) {
      case SymbolType.Stroke:
        StrokeOps.addPointer(this.currentSymbol as TStroke, pointer)
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
    // Optimistic: reflects "working" on the state badge as soon as the user starts drawing,
    // without waiting for a server round-trip. Cleared either right away in `end()` (nothing sent
    // to the recognizer, e.g. a shape) or by the debounced synchronize() triggered by onContentChanged.
    this.editor.startOperation("Recognizing")
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.currentSymbolOrigin = localPointer
    this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawCurrentSymbol(this.currentSymbol!)
  }

  continue(info: TPointerInfo): void {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }

    this.renderer.ensurePointVisible(localPointer, 20)

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
      this.recognizer.addStrokes([localStroke], this.detectGesture)
      await this.gestureManager.apply(gestureFromContextLess)
    } else {
      // Any server-detected gesture arrives asynchronously via recognizer.event.addGestureDetectedListener,
      // handled by IIGestureManager itself — not tied to this call's return value.
      await this.recognizer.addStrokes([localStroke], this.detectGesture)
    }
  }

  async end(info: TPointerInfo): Promise<void> {
    this.cancelScheduledRender()
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.currentSymbol = undefined
    this.currentSymbolOrigin = undefined
    this.snaps.clearSnapToElementLines()

    this.renderer.drawSymbol(localSymbol!)
    this.renderer.clearCurrentSymbolLayer()
    this.model.addSymbol(localSymbol)
    this.history.push(this.model, {
      added: [localSymbol],
    })

    // this.renderer.redrawGuides()

    if (isStroke(localSymbol)) {
      await this.interactWithBackend(localSymbol)
    } else {
      // Nothing sent to the recognizer (e.g. a shape) — nothing will ever trigger the
      // debounced synchronize() that clears the optimistic "Recognizing" started in start().
      this.editor.endOperation("Recognizing")
    }
  }
}
