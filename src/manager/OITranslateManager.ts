import { SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  EdgeKind,
  OIStroke,
  OIText,
  OISymbolGroup,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TPoint
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer/svg/OISVGRenderer"
import { OIHistoryManager } from "../history"
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

  get history(): OIHistoryManager
  {
    return this.behaviors.history
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
        shape.center.x += tx
        shape.center.y += ty
        return shape
      }
      case ShapeKind.Polygon:{
        shape.points.forEach(p =>
        {
          p.x += tx
          p.y += ty
        })
        return shape
      }
      default:
        throw new Error(`Can't apply translate on shape, kind unknow: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TOIEdge, tx: number, ty: number): TOIEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.center.x += tx
        edge.center.y += ty
        return edge
      }
      case EdgeKind.Line: {
        edge.start.x += tx
        edge.start.y += ty
        edge.end.x += tx
        edge.end.y += ty
        return edge
      }
      case EdgeKind.PolyEdge: {
        edge.points.forEach(p =>
        {
          p.x += tx
          p.y += ty
        })
        return edge
      }
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

  protected applyOnGroup(group: OISymbolGroup, tx: number, ty: number): OISymbolGroup
  {
    group.children.forEach(s => this.applyToSymbol(s, tx, ty))
    return group
  }

  applyToSymbol(symbol: TOISymbol, tx: number, ty: number): TOISymbol
  {
    this.#logger.info("applyToSymbol", { symbol, tx, ty })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, tx, ty)
      case SymbolType.Shape:
        return this.applyToShape(symbol, tx, ty)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, tx, ty)
      case SymbolType.Text:
        return this.applyOnText(symbol, tx, ty)
      case SymbolType.Group:
        return this.applyOnGroup(symbol, tx, ty)
      default:
        throw new Error(`Can't apply translate on symbol, type unknow: ${ JSON.stringify(symbol) }`)
    }
  }

  translate(symbols: TOISymbol[], tx: number, ty: number, addToHistory = true): Promise<void>
  {
    this.#logger.info("translate", { symbols, tx, ty })
    symbols.forEach(s => {
      this.applyToSymbol(s, tx, ty)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })
    if (addToHistory) {
      this.history.push(this.model, { translate: [{ symbols: this.model.symbolsSelected, tx, ty }] })
    }
    const strokes = this.behaviors.extractStrokesFromSymbols(symbols)
    return this.recognizer.transformTranslate(strokes.map(s => s.id), tx, ty)
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
    this.model.symbolsSelected.forEach(s =>
    {
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
    this.translate(this.model.symbolsSelected, tx, ty, false)

    this.selector.resetSelectedGroup(this.model.symbolsSelected)
    this.interactElementsGroup = undefined
    this.selector.showInteractElements()
    this.svgDebugger.apply()
  }

}
