import { SvgElementRole } from "../Constants"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import
{
  EdgeKind,
  IIStroke,
  IIText,
  IISymbolGroup,
  ShapeKind,
  SymbolType,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TPoint,
  TIIRecognized,
  RecognizedKind
} from "../symbol"

/**
 * @group Manager
 */
export class IITranslateManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.TRANSFORMER)
  editor: InteractiveInkEditor
  interactElementsGroup?: SVGElement
  transformOrigin!: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  protected applyToStroke(stroke: IIStroke, tx: number, ty: number): IIStroke
  {
    stroke.pointers.forEach(p =>
    {
      p.x += tx
      p.y += ty
    })
    return stroke
  }

  protected applyToShape(shape: TIIShape, tx: number, ty: number): TIIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse:
      case ShapeKind.Circle: {
        shape.center.x += tx
        shape.center.y += ty
        return shape
      }
      case ShapeKind.Polygon: {
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

  protected applyToEdge(edge: TIIEdge, tx: number, ty: number): TIIEdge
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

  protected applyOnText(text: IIText, tx: number, ty: number): IIText
  {
    if (text.rotation) {
      text.rotation.center = { x: text.rotation.center.x + tx, y: text.rotation.center.y + ty }
    }
    text.point.x += tx
    text.point.y += ty
    return this.editor.texter.updateBounds(text)
  }

  protected applyOnGroup(group: IISymbolGroup, tx: number, ty: number): IISymbolGroup
  {
    group.children.forEach(s => this.applyToSymbol(s, tx, ty))
    return group
  }

  protected applyOnRecognizedSymbol(recognizedSymbol: TIIRecognized, tx: number, ty: number): TIIRecognized
  {
    recognizedSymbol.strokes.forEach(s => this.applyToStroke(s, tx, ty))
    if (recognizedSymbol.kind === RecognizedKind.Text) {
      recognizedSymbol.baseline += ty
    }
    return recognizedSymbol
  }

  applyToSymbol(symbol: TIISymbol, tx: number, ty: number): TIISymbol
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
      case SymbolType.Recognized:
        return this.applyOnRecognizedSymbol(symbol, tx, ty)
      default:
        throw new Error(`Can't apply translate on symbol, type unknow: ${ JSON.stringify(symbol) }`)
    }
  }

  translate(symbols: TIISymbol[], tx: number, ty: number, addToHistory = true): Promise<void>
  {
    this.#logger.info("translate", { symbols, tx, ty })
    symbols.forEach(s =>
    {
      this.applyToSymbol(s, tx, ty)
      this.model.updateSymbol(s)
      this.editor.renderer.drawSymbol(s)
    })
    if (addToHistory) {
      this.editor.history.push(this.model, { translate: [{ symbols: this.model.symbolsSelected, tx, ty }] })
    }
    const strokes = this.editor.extractStrokesFromSymbols(symbols)
    return this.editor.recognizer.transformTranslate(strokes.map(s => s.id), tx, ty)
  }

  translateElement(id: string, tx: number, ty: number): void
  {
    this.#logger.info("translateElement", { id, tx, ty })
    this.editor.renderer.setAttribute(id, "transform", `translate(${ tx },${ ty })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { origin })
    this.interactElementsGroup = (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
    this.transformOrigin = origin
  }

  continue(point: TPoint): { tx: number, ty: number }
  {
    this.#logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't translate, you must call start before")
    }

    let tx = point.x - this.transformOrigin.x
    let ty = point.y - this.transformOrigin.y

    const nudge = this.editor.snaps.snapTranslate(tx, ty)
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
    this.editor.snaps.clearSnapToElementLines()
    this.translate(this.model.symbolsSelected, tx, ty)

    this.interactElementsGroup = undefined
    this.editor.svgDebugger.apply()
  }

}
