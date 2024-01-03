import { LoggerClass, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIShapeCircle, OIShapePolygon, OIStroke, ShapeKind, SymbolType, TOIEdge, TOIShape, TOISymbol, TPoint } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer/svg/OISVGRenderer"
import { UndoRedoManager } from "../undo-redo"

/**
 * @group Manager
 */
export class OITranslateManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors
  wrapper?: SVGElement
  origin!: TPoint

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get undoRedoManager(): UndoRedoManager
  {
    return this.behaviors.undoRedoManager
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  protected applyOnStroke(stroke: OIStroke, tx: number, ty: number): OIStroke
  {
    stroke.pointers.forEach(p =>
    {
      p.x += tx
      p.y += ty
    })
    return stroke
  }

  protected applyOnShape(shape: TOIShape, tx: number, ty: number): TOIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse:
      case ShapeKind.Circle: {
        const c = shape as OIShapeCircle
        c.center.x += tx
        c.center.y += ty
        return c
      }
      case ShapeKind.Rectangle:
      case ShapeKind.Triangle:
      case ShapeKind.Parallelogram:
      case ShapeKind.Polygon:
      case ShapeKind.Rhombus: {
        const p = shape as OIShapePolygon
        p.points.forEach(p => {
          p.x += tx
          p.y += ty
        })
        return p
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknow: ${shape.kind}`)
    }
  }

  protected applyOnEdge(edge: TOIEdge, tx: number, ty: number): TOIEdge
  {
    edge.start.x += tx
    edge.start.y += ty
    edge.end.x += tx
    edge.end.y += ty
    return edge
  }

  applyOnSymbol(symbol: TOISymbol, tx: number, ty: number): TOISymbol
  {
    this.#logger.info("applyOnSymbol", { symbol, tx, ty })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyOnStroke(symbol as OIStroke, tx, ty)
      case SymbolType.Shape:
        return this.applyOnShape(symbol as TOIShape, tx, ty)
      case SymbolType.Edge:
        return this.applyOnEdge(symbol as TOIEdge, tx, ty)
        case SymbolType.Decorator:
          // Decorator is computed from its parent (eg. OIStroke)
          return symbol
      default:
        throw new Error(`Can't apply translate on symbol, type unknow: ${symbol.type}`)
    }
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { origin })
    this.wrapper = (target.closest(`[role=${ SvgElementRole.Selected }]`) as unknown) as SVGGElement
    this.origin = origin
  }

  continue(point: TPoint): { tx: number, ty: number }
  {
    this.#logger.info("continue", { point })
    if (!this.wrapper) {
      throw new Error("Can't translate, you must call start before")
    }
    const tx = point.x - this.origin.x
    const ty = point.y - this.origin.y
    this.renderer.translateElement(this.wrapper.id as string, tx, ty)
    return {
      tx,
      ty
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const { tx, ty } = this.continue(point)
    const promise = this.recognizer.translateStrokes(this.model.selection.filter(s => s.type === SymbolType.Stroke).map(s => s.id), tx, ty)
    this.model.selection.forEach(s =>
    {
      this.applyOnSymbol(s, tx, ty)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })
    this.renderer.resetSelectedGroup(this.model.selection)
    this.undoRedoManager.addModelToStack(this.model)
    await promise
  }

}
