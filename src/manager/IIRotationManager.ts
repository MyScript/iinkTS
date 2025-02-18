import { SvgElementRole } from "../Constants"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import
{
  Box,
  EdgeKind,
  IIStroke,
  IISymbolGroup,
  IIText,
  TIIRecognized,
  ShapeKind,
  SymbolType,
  TIIEdge,
  TIIShape,
  TIISymbol,
  TPoint
} from "../symbol"
import { computeAngleRadian, convertDegreeToRadian, convertRadianToDegree, computeRotatedPoint } from "../utils"

/**
 * @group Manager
 */
export class IIRotationManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.TRANSFORMER)
  editor: InteractiveInkEditor
  interactElementsGroup?: SVGElement
  center!: TPoint
  origin!: TPoint

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  protected applyToStroke(stroke: IIStroke, center: TPoint, angleRad: number): IIStroke
  {
    stroke.pointers.forEach(p =>
    {
      const { x, y } = computeRotatedPoint(p, center, angleRad)
      p.x = x
      p.y = y
    })
    return stroke
  }

  protected applyToShape(shape: TIIShape, center: TPoint, angleRad: number): TIIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        shape.center = computeRotatedPoint(shape.center, center, angleRad)
        shape.orientation = (shape.orientation + angleRad) % (2 * Math.PI)
        return shape
      }
      case ShapeKind.Circle: {
        shape.center = computeRotatedPoint(shape.center, center, angleRad)
        return shape
      }
      case ShapeKind.Polygon: {
        shape.points.forEach(p =>
        {
          const { x, y } = computeRotatedPoint(p, center, angleRad)
          p.x = x
          p.y = y
        })
        return shape
      }
      default:
        throw new Error(`Can't apply rotate on shape, kind unknow: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TIIEdge, center: TPoint, angleRad: number): TIIEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        edge.phi = (edge.phi - angleRad) % (2 * Math.PI)
        edge.center = computeRotatedPoint(edge.center, center, angleRad)
        return edge
      }
      case EdgeKind.Line: {
        edge.start = computeRotatedPoint(edge.start, center, angleRad)
        edge.end = computeRotatedPoint(edge.end, center, angleRad)
        return edge
      }
      case EdgeKind.PolyEdge: {
        edge.points = edge.points.map(p => computeRotatedPoint(p, center, angleRad))
        return edge
      }
      default:
        throw new Error(`Can't apply rotate on edge, kind unknow: ${ JSON.stringify(edge) }`)
    }
    return edge
  }

  protected applyOnText(text: IIText, center: TPoint, angleRad: number): IIText
  {
    text.rotation = {
      degree: convertRadianToDegree(angleRad) + (text.rotation?.degree || 0),
      center: center
    }
    return this.editor.texter.updateBounds(text)
  }

  protected applyOnGroup(group: IISymbolGroup, center: TPoint, angleRad: number): IISymbolGroup
  {
    group.children.forEach(s => this.applyToSymbol(s, center, angleRad))
    return group
  }

  protected applyOnRecognizedSymbol(strokeText: TIIRecognized, center: TPoint, angleRad: number): TIIRecognized
  {
    strokeText.strokes.forEach(s => this.applyToStroke(s, center, angleRad))
    return strokeText
  }

  applyToSymbol(symbol: TIISymbol, center: TPoint, angleRad: number): TIISymbol
  {
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, center, angleRad)
      case SymbolType.Shape:
        return this.applyToShape(symbol, center, angleRad)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, center, angleRad)
      case SymbolType.Text:
        return this.applyOnText(symbol, center, angleRad)
      case SymbolType.Group:
        return this.applyOnGroup(symbol, center, angleRad)
      case SymbolType.Recognized:
        return this.applyOnRecognizedSymbol(symbol, center, angleRad)
      default:
        throw new Error(`Can't apply rotate on symbol, type unknow: ${ JSON.stringify(symbol) }`)
    }
  }

  setTransformOrigin(id: string, originX: number, originY: number): void
  {
    this.editor.renderer.setAttribute(id, "transform-origin", `${ originX }px ${ originY }px`)
  }

  rotateElement(id: string, degree: number): void
  {
    this.#logger.info("rotateElement", { id, degree })
    this.editor.renderer.setAttribute(id, "transform", `rotate(${ degree })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { target })
    this.interactElementsGroup = (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
    const boundingBox = Box.createFromPoints(this.model.symbolsSelected.flatMap(s => s.vertices))

    this.center = {
      x: boundingBox.xMin + boundingBox.width / 2,
      y: boundingBox.yMid
    }
    this.origin = origin
    this.setTransformOrigin(this.interactElementsGroup.id, this.center.x, this.center.y)
    this.model.symbolsSelected.forEach(s =>
    {
      this.setTransformOrigin(s.id, this.center.x, this.center.y)
    })
  }

  continue(point: TPoint): number
  {
    this.#logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = Math.round(convertRadianToDegree(computeAngleRadian(this.origin, this.center, point)))

    angleDegree = this.editor.snaps.snapRotation(angleDegree)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }

    this.rotateElement(this.interactElementsGroup.id, angleDegree)
    this.model.symbolsSelected.forEach(s =>
    {
      this.rotateElement(s.id, angleDegree)
    })
    return angleDegree
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const angleDegree = this.continue(point)
    const angleRad = convertDegreeToRadian(angleDegree) % (2 * Math.PI)
    const oldSymbols = this.model.symbolsSelected.map(s => s.clone())
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, this.center, angleRad)
      this.editor.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })
    const strokesFromSymbols = this.editor.extractStrokesFromSymbols(this.model.symbolsSelected)
    this.editor.recognizer.transformRotate(strokesFromSymbols.map(s => s.id), angleRad, this.center.x, this.center.y)
    this.editor.history.push(this.model, { rotate: [{ symbols: oldSymbols, angle: angleRad, center: {...this.center}, }] })

    this.interactElementsGroup = undefined
    this.editor.svgDebugger.apply()
  }
}
