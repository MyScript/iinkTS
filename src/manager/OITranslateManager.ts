import { LoggerClass, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  EdgeKind,
  OIEdgeArc,
  OIShapeCircle,
  OIShapePolygon,
  OIStroke,
  OIText,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TPoint
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer/svg/OISVGRenderer"
import { UndoRedoManager } from "../undo-redo"
import { OIDebugSVGManager } from "./OIDebugSVGManager"
import { OISelectionManager } from "./OISelectionManager"
import { OISnapManager } from "./OISnapManager"
import { OITextManager } from "./OITextManager"

/**
 * @group Manager
 */
export class OITranslateManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors
  interactElementsGroup?: SVGElement
  transformOrigin!: TPoint

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

  get selector(): OISelectionManager
  {
    return this.behaviors.selector
  }

  get texter(): OITextManager
  {
    return this.behaviors.texter
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  get snaps(): OISnapManager
  {
    return this.behaviors.snaps
  }

  get svgDebugger(): OIDebugSVGManager
  {
    return this.behaviors.svgDebugger
  }

  protected applyToStroke(stroke: OIStroke, tx: number, ty: number): OIStroke
  {
    stroke.pointers.forEach(p =>
    {
      p.x += tx
      p.y += ty
    })
    return stroke
  }

  protected applyToShape(shape: TOIShape, tx: number, ty: number): TOIShape
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
        p.points.forEach(p =>
        {
          p.x += tx
          p.y += ty
        })
        return p
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknow: ${ shape.kind }`)
    }
  }

  protected applyToEdge(edge: TOIEdge, tx: number, ty: number): TOIEdge
  {
    edge.start.x += tx
    edge.start.y += ty
    edge.end.x += tx
    edge.end.y += ty
    if (edge.kind === EdgeKind.Arc) {
      const arc = edge as OIEdgeArc
      arc.middle.x += tx
      arc.middle.y += ty
      return arc
    }
    return edge
  }

  protected applyOnText(text: OIText, tx: number, ty: number): OIText
  {
    if (text.rotation) {
      text.rotation.center = { x: text.rotation.center.x + tx, y: text.rotation.center.y + ty }
    }
    text.point.x += tx
    text.point.y += ty
    return this.texter.updateTextBoundingBox(text)
  }

  applyToSymbol(symbol: TOISymbol, tx: number, ty: number): TOISymbol
  {
    this.#logger.info("applyToSymbol", { symbol, tx, ty })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol as OIStroke, tx, ty)
      case SymbolType.Shape:
        return this.applyToShape(symbol as TOIShape, tx, ty)
      case SymbolType.Edge:
        return this.applyToEdge(symbol as TOIEdge, tx, ty)
      case SymbolType.Text:
        return this.applyOnText(symbol as OIText, tx, ty)
      default:
        throw new Error(`Can't apply translate on symbol, type unknow: ${ symbol.type }`)
    }
  }

  translate(symbols: TOISymbol[], tx: number, ty: number): Promise<void>
  {
    this.#logger.info("translate", { symbols, tx, ty })
    symbols.forEach(s =>
    {
      this.applyToSymbol(s, tx, ty)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })
    return this.recognizer.translateStrokes(symbols.filter(s => s.type === SymbolType.Stroke).map(s => s.id), tx, ty)
  }

  translateElement(id: string, tx: number, ty: number): void
  {
    this.#logger.info("translateElement", { id, tx, ty })
    this.renderer.setAttribute(id, "transform", `translate(${ tx },${ ty })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { origin })
    this.interactElementsGroup = (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
    this.transformOrigin = origin
    this.selector.hideInteractElements()
  }

  continue(point: TPoint): { tx: number, ty: number }
  {
    this.#logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.snaps.snapTranslate(tx, ty)
    tx = nudge.x
    ty = nudge.y

    this.translateElement(this.interactElementsGroup.id as string, tx, ty)
    this.model.symbolsSelected.forEach(s => {
      this.translateElement(s.id as string, tx, ty)
    })
    return {
      tx,
      ty
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const { tx, ty } = this.continue(point)
    this.snaps.clearSnapToElementLines()
    const strokesTranslated: OIStroke[] = []
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, tx, ty)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
      if (s.type === SymbolType.Stroke) {
        strokesTranslated.push(s as OIStroke)
      }
    })
    const promise = this.recognizer.translateStrokes(strokesTranslated.map(s => s.id), tx, ty)
    this.selector.resetSelectedGroup(this.model.symbolsSelected)
    this.undoRedoManager.addModelToStack(this.model)
    this.interactElementsGroup = undefined
    this.selector.showInteractElements()
    await promise
    await this.svgDebugger.apply()
  }

}
