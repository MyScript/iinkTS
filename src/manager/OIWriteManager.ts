import { WriteTool } from "../Constants"
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
  OISymbolGroup,
  SymbolType,
  TOIEdge,
  TOISymbol,
  TPoint,
  TPointer
} from "../primitive"
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

  #tool: WriteTool = WriteTool.Pencil
  detectGesture: boolean = true

  currentSymbolOrigin?: TPoint

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get tool(): WriteTool
  {
    return this.#tool
  }
  set tool(wt: WriteTool)
  {
    this.#tool = wt
    if (wt !== WriteTool.Pencil) {
      this.renderer.parent.classList.add("shape")
    }
    else {
      this.renderer.parent.classList.remove("shape")
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

  get needContextLessGesture(): boolean
  {
    return this.detectGesture && this.model.symbols.some(s =>
    {
      if (s.type === SymbolType.Stroke) return false
      if (s.type === SymbolType.Group && (s as OISymbolGroup).containsOnlyStroke()) return false
      return true
    })
  }

  protected createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TOISymbol
  {
    this.#logger.debug("createCurrentSymbol", { pointer, style, pointerType })

    switch (this.tool) {
      case WriteTool.Pencil:
        this.model.currentSymbol = new OIStroke(style, pointerType)
        break
      case WriteTool.Rectangle:
        this.model.currentSymbol = OIShapePolygon.createRectangleBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Triangle:
        this.model.currentSymbol = OIShapePolygon.createTriangleBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Parallelogram:
        this.model.currentSymbol = OIShapePolygon.createParallelogramBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Rhombus:
        this.model.currentSymbol = OIShapePolygon.createRhombusBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Circle:
        this.model.currentSymbol = OIShapeCircle.createBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Ellipse:
        this.model.currentSymbol = OIShapeEllipse.createBetweenPoints(pointer, pointer, style)
        break
      case WriteTool.Line:
      case WriteTool.Arrow:
      case WriteTool.DoubleArrow: {
        let startDecoration, endDecoration
        if (this.tool === WriteTool.Arrow) {
          endDecoration = EdgeDecoration.Arrow
        }
        else if (this.tool === WriteTool.DoubleArrow) {
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
      case WriteTool.Rectangle:
        OIShapePolygon.updateRectangleBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case WriteTool.Triangle:
        OIShapePolygon.updateTriangleBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case WriteTool.Parallelogram:
        OIShapePolygon.updateParallelogramBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case WriteTool.Rhombus:
        OIShapePolygon.updateRhombusBetweenPoints(this.model.currentSymbol as OIShapePolygon, this.currentSymbolOrigin!, pointer)
        break
      case WriteTool.Circle:
        OIShapeCircle.updateBetweenPoints(this.model.currentSymbol as OIShapeCircle, this.currentSymbolOrigin!, pointer)
        break
      case WriteTool.Ellipse:
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
    if (this.tool !== WriteTool.Pencil) {
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
    if (this.tool !== WriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(pointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  async end(pointer: TPointer): Promise<void>
  {
    this.#logger.info("finishWriting", { pointer })
    const localPointer = pointer
    if (this.tool !== WriteTool.Pencil) {
      const { x, y } = this.snaps.snapResize(pointer)
      localPointer.x = x
      localPointer.y = y
    }
    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
    this.snaps.clearSnapToElementLines()
    const symbol = this.model.currentSymbol as TOISymbol
    this.model.currentSymbol = undefined
    this.currentSymbolOrigin = undefined

    this.model.addSymbol(symbol)
    this.history.push(this.model, { added: [symbol] })

    if (symbol.type === SymbolType.Stroke) {
      let gestureFromContextLess: TGesture | undefined
      const currentStroke = symbol
      if (this.needContextLessGesture) {
        gestureFromContextLess = await this.gestureManager.getGestureFromContextLess(currentStroke)
      }
      if (gestureFromContextLess) {
        this.history.pop()
        this.gestureManager.apply(currentStroke, gestureFromContextLess)
      }
      else {
        const gesture = await this.recognizer.addStrokes([currentStroke], this.detectGesture)
        if (gesture) {
          this.history.pop()
          this.gestureManager.apply(this.model.getRootSymbol(gesture.gestureStrokeId) as OIStroke, gesture)
        }
      }
    }
  }
}
