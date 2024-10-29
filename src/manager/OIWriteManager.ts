import { SELECTION_MARGIN, EditorWriteTool } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { TGesture } from "../gesture"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  EdgeDecoration,
  EdgeKind,
  OIEdgeLine,
  OIShapePolygon,
  OIShapeCircle,
  OIShapeEllipse,
  OIStroke,
  SymbolType,
  TOIEdge,
  TOISymbol,
  TPoint,
  TPointer
} from "../symbol"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { OIHistoryManager } from "../history"
import { OIGestureManager } from "./OIGestureManager"
import { OISnapManager } from "./OISnapManager"


/**
 * @group Manager
 */
export class OIWriteManager
{
  #logger = LoggerManager.getLogger(LoggerClass.WRITE)
  behaviors: OIBehaviors

  #tool: EditorWriteTool = EditorWriteTool.Pencil
  detectGesture: boolean = true

  currentSymbolOrigin?: TPoint

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get tool(): EditorWriteTool
  {
    return this.#tool
  }
  set tool(wt: EditorWriteTool)
  {
    this.#tool = wt
    if (wt !== EditorWriteTool.Pencil) {
      this.behaviors.layers.root.classList.add("shape")
    }
    else {
      this.behaviors.layers.root.classList.remove("shape")
    }
    this.behaviors.unselectAll()
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get history(): OIHistoryManager
  {
    return this.behaviors.history
  }

  get gestureManager(): OIGestureManager
  {
    return this.behaviors.gesture
  }

  get snaps(): OISnapManager
  {
    return this.behaviors.snaps
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  protected needContextLessGesture(stroke: OIStroke): boolean
  {
    const strokeBoundsWithMargin = this.behaviors.getSymbolsBounds([stroke], 2 * SELECTION_MARGIN)
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

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TOISymbol
  {
    this.#logger.debug("createCurrentSymbol", { pointer, style, pointerType })

    switch (this.tool) {
      case EditorWriteTool.Pencil:
        this.model.currentSymbol = new OIStroke(style, pointerType)
        break
      case EditorWriteTool.Rectangle:
        this.model.currentSymbol = OIShapePolygon.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Triangle:
        this.model.currentSymbol = OIShapePolygon.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Parallelogram:
        this.model.currentSymbol = OIShapePolygon.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Rhombus:
        this.model.currentSymbol = OIShapePolygon.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Circle:
        this.model.currentSymbol = OIShapeCircle.createBetweenPoints(pointer, pointer, style)
        break
      case EditorWriteTool.Ellipse:
        this.model.currentSymbol = OIShapeEllipse.createBetweenPoints(pointer, pointer, style)
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
        this.model.currentSymbol = new OIEdgeLine(pointer, pointer, startDecoration, endDecoration, style)
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
        OIShapePolygon.updateRectangleBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Triangle:
        OIShapePolygon.updateTriangleBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Parallelogram:
        OIShapePolygon.updateParallelogramBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Rhombus:
        OIShapePolygon.updateRhombusBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Circle:
        OIShapeCircle.updateBetweenPoints(this.model.currentSymbol as OIShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case EditorWriteTool.Ellipse:
        OIShapeEllipse.updateBetweenPoints(this.model.currentSymbol as OIShapeEllipse, this.currentSymbolOrigin!, pointer)
        break
    }
  }

  protected updateCurrentSymbolEdge(pointer: TPointer): void
  {
    const edge = this.model.currentSymbol as TOIEdge
    switch (edge.kind) {
      case EdgeKind.Line:
        edge.end = pointer
        break
    }
  }

  protected updateCurrentSymbol(pointer: TPointer): TOISymbol
  {
    this.#logger.debug("updateCurrentSymbol", { pointer })
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

  start(style: TStyle, pointer: TPointer, pointerType: string): void
  {
    this.#logger.info("startWriting", { style, pointer, pointerType })
    const localPointer = pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(pointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.currentSymbolOrigin = localPointer
    this.createCurrentSymbol(localPointer, style, pointerType)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  continue(pointer: TPointer): void
  {
    this.#logger.info("continueWriting", { pointer })
    const localPointer = pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(pointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  protected async interactWithBackend(stroke: OIStroke): Promise<void>
  {
    const localStroke = stroke.clone()
    let gestureFromContextLess: TGesture | undefined
    if (this.needContextLessGesture(stroke)) {
      gestureFromContextLess = await this.gestureManager.getGestureFromContextLess(localStroke)
    }
    if (gestureFromContextLess) {
      this.history.pop()
      this.recognizer.addStrokes([localStroke], this.detectGesture)
      this.gestureManager.apply(localStroke, gestureFromContextLess)
    }
    else {
      const gesture = await this.recognizer.addStrokes([localStroke], this.detectGesture)
      if (gesture) {
        this.history.pop()
        this.gestureManager.apply(localStroke, gesture)
      }
    }
  }

  async end(pointer: TPointer): Promise<void>
  {
    this.#logger.info("finishWriting", { pointer })
    const localPointer = pointer
    if (this.tool !== EditorWriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(pointer)
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
