import { SELECTION_MARGIN, EditorWriteTool } from "../Constants"
import { TGesture } from "../gesture"
import { IIModel } from "../model"
import
{
  EdgeDecoration,
  EdgeKind,
  IIEdgeLine,
  IIShapePolygon,
  IIShapeCircle,
  IIShapeEllipse,
  IIStroke,
  SymbolType,
  TIIEdge,
  TIISymbol,
  TPoint,
  TPointer
} from "../symbol"
import { RecognizerWebSocket } from "../recognizer"
import { SVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { IIHistoryManager } from "../history"
import { IIGestureManager } from "../gesture/IIGestureManager"
import { IISnapManager } from "../snap/IISnapManager"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerInfo } from "../grabber"
import { AbstractWriteManager } from "./AbstractWriteManager"


/**
 * @group Manager
 */
export class IIWriteManager extends AbstractWriteManager
{
  #tool: EditorWriteTool = EditorWriteTool.Pencil
  detectGesture: boolean = true
  editor: InteractiveInkEditor
  currentSymbolOrigin?: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    super(editor)
    this.editor = editor
  }

  get tool(): EditorWriteTool
  {
    return this.#tool
  }
  set tool(wt: EditorWriteTool)
  {
    this.#tool = wt
    if (wt !== EditorWriteTool.Pencil) {
      this.editor.layers.root.classList.add("shape")
    }
    else {
      this.editor.layers.root.classList.remove("shape")
    }
    this.editor.unselectAll()
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get history(): IIHistoryManager
  {
    return this.editor.history
  }

  get gestureManager(): IIGestureManager
  {
    return this.editor.gesture
  }

  get snaps(): IISnapManager
  {
    return this.editor.snaps
  }

  get recognizer(): RecognizerWebSocket
  {
    return this.editor.recognizer
  }

  attach(layer: HTMLElement): void
  {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void
  {
    this.grabber.detach()
  }

  protected needContextLessGesture(stroke: IIStroke): boolean
  {
    const strokeBoundsWithMargin = this.editor.getSymbolsBounds([stroke], 2 * SELECTION_MARGIN)
    return this.detectGesture && this.model.symbols.some(s =>
    {
      switch (s.type) {
        case SymbolType.Recognized:
        case SymbolType.Stroke:
          return false
        case SymbolType.Group:
          if (s.containsOnlyStroke()) {
            return false
          }
          else {
            return s.bounds.overlaps(strokeBoundsWithMargin)
          }
        default:
          return s.bounds.overlaps(strokeBoundsWithMargin)
      }
    })
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol
  {
    switch (this.tool) {
      case EditorWriteTool.Pencil:
        this.model.currentSymbol = new IIStroke(style, pointerType)
        break
      case EditorWriteTool.Rectangle:
        this.model.currentSymbol = IIShapePolygon.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Triangle:
        this.model.currentSymbol = IIShapePolygon.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Parallelogram:
        this.model.currentSymbol = IIShapePolygon.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Rhombus:
        this.model.currentSymbol = IIShapePolygon.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Circle:
        this.model.currentSymbol = IIShapeCircle.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Ellipse:
        this.model.currentSymbol = IIShapeEllipse.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Line:
      case EditorWriteTool.Arrow:
      case EditorWriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (this.tool === EditorWriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        }
        else if (this.tool === EditorWriteTool.DoubleArrow) {
          startDecoration = EdgeDecoration.Arrow
          endDecoration = EdgeDecoration.Arrow
        }
        this.model.currentSymbol = new IIEdgeLine(pointer, pointer, startDecoration, endDecoration, style)
        break
      }
      default:
        throw new Error(`Can't create symbol, tool is unknow: "${ this.tool }"`)
    }
    return this.updateCurrentSymbol(pointer)
  }

  protected updateCurrentSymbolShape(pointer: TPointer): void
  {
    switch (this.tool) {
      case EditorWriteTool.Rectangle:
        IIShapePolygon.updateRectangleBetweenPoints(this.model.currentSymbol as IIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Triangle:
        IIShapePolygon.updateTriangleBetweenPoints(this.model.currentSymbol as IIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Parallelogram:
        IIShapePolygon.updateParallelogramBetweenPoints(this.model.currentSymbol as IIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Rhombus:
        IIShapePolygon.updateRhombusBetweenPoints(this.model.currentSymbol as IIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Circle:
        IIShapeCircle.updateBetweenPoints(this.model.currentSymbol as IIShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Ellipse:
        IIShapeEllipse.updateBetweenPoints(this.model.currentSymbol as IIShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
    }
  }

  protected updateCurrentSymbolEdge(pointer: TPointer): void
  {
    const edge = this.model.currentSymbol as TIIEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        edge.end = pointer
        break
    }
  }

  protected updateCurrentSymbol(pointer: TPointer): TIISymbol
  {
    if (!this.model.currentSymbol) {
      throw new Error("Can't update current symbol because currentSymbol is undefined")
    }

    switch (this.model.currentSymbol.type) {
      case SymbolType.Stroke:
        this.model.currentSymbol!.addPointer(pointer)
        break
      case SymbolType.Shape:
        this.updateCurrentSymbolShape(pointer)
        break
      case SymbolType.Edge:
        this.updateCurrentSymbolEdge(pointer)
        break
    }
    return this.model.currentSymbol
  }

  start(info: PointerInfo): void
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.currentSymbolOrigin = localPointer
    this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  continue(info: PointerInfo): void
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  protected async interactWithBackend(stroke: IIStroke): Promise<void>
  {
    const localStroke = stroke.clone()
    let gestureFromContextLess: TGesture | undefined
    if (this.needContextLessGesture(stroke)) {
      gestureFromContextLess = await this.gestureManager.getGestureFromContextLess(localStroke)
    }
    if (gestureFromContextLess) {
      this.history.pop()
      this.recognizer.addStrokes([localStroke], this.detectGesture)
      await this.gestureManager.apply(localStroke, gestureFromContextLess)
    }
    else {
      const gesture = await this.recognizer.addStrokes([localStroke], this.detectGesture)
      if (gesture) {
        this.history.pop()
        await this.gestureManager.apply(localStroke, gesture)
      }
    }
  }

  async end(info: PointerInfo): Promise<void>
  {
    const localPointer = info.pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(localPointer)
      localPointer.x = x
      localPointer.y = y
    }
    const localSymbol = this.updateCurrentSymbol(localPointer)
    this.model.currentSymbol = undefined
    this.currentSymbolOrigin = undefined
    this.snaps.clearSnapToElementLines()

    this.renderer.drawSymbol(localSymbol!)
    this.model.addSymbol(localSymbol)
    this.history.push(this.model, { added: [localSymbol] })

    if (localSymbol.type === SymbolType.Stroke) {
      await this.interactWithBackend(localSymbol)
    }
  }
}
