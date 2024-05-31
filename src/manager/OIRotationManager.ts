import { LoggerClass, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  Box,
  EdgeKind,
  OIEdgeArc,
  OIEdgeLine,
  OIEdgePolyLine,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon,
  OIStroke, OISymbolGroup, OIText,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TPoint
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { OIHistoryManager } from "../history"
import { computeAngleRadian, converDegreeToRadian, convertRadianToDegree, computeRotatedPoint } from "../utils"
import { OIDebugSVGManager } from "./OIDebugSVGManager"
import { OISelectionManager } from "./OISelectionManager"
import { OISnapManager } from "./OISnapManager"
import { OITextManager } from "./OITextManager"

/**
 * @group Manager
 */
export class OIRotationManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors
  interactElementsGroup?: SVGElement
  center!: TPoint
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

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get history(): OIHistoryManager
  {
    return this.behaviors.history
  }

  get texter(): OITextManager
  {
    return this.behaviors.texter
  }

  get selector(): OISelectionManager
  {
    return this.behaviors.selector
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

  protected applyToStroke(stroke: OIStroke, center: TPoint, angleRad: number): OIStroke
  {
    stroke.pointers.forEach(p =>
    {
      const { x, y } = computeRotatedPoint(p, center, angleRad)
      p.x = x
      p.y = y
    })
    return stroke
  }

  protected applyToShape(shape: TOIShape, center: TPoint, angleRad: number): TOIShape
  {
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        const ellipse = shape as OIShapeEllipse
        ellipse.center = computeRotatedPoint(ellipse.center, center, angleRad)
        return ellipse
      }
      case ShapeKind.Circle: {
        const circle = shape as OIShapeCircle
        circle.center = computeRotatedPoint(circle.center, center, angleRad)
        return circle
      }
      case ShapeKind.Rectangle:
      case ShapeKind.Triangle:
      case ShapeKind.Parallelogram:
      case ShapeKind.Polygon:
      case ShapeKind.Rhombus: {
        const polygon = shape as OIShapePolygon
        polygon.points.forEach(p =>
        {
          const { x, y } = computeRotatedPoint(p, center, angleRad)
          p.x = x
          p.y = y
        })
        return polygon
      }
      default:
        throw new Error(`Can't apply rotate on shape, kind unknow: ${ shape.kind }`)
    }
  }

  protected applyToEdge(edge: TOIEdge, center: TPoint, angleRad: number): TOIEdge
  {
    switch (edge.kind) {
      case EdgeKind.Arc: {
        const arc = edge as OIEdgeArc
        arc.startAngle -= angleRad
        arc.center = computeRotatedPoint(arc.center, center, angleRad)
        return arc
      }
      case EdgeKind.Line: {
        const line = edge as OIEdgeLine
        line.start = computeRotatedPoint(line.start, center, angleRad)
        line.end = computeRotatedPoint(line.end, center, angleRad)
        return line
      }
      case EdgeKind.PolyEdge: {
        const polyline = edge as OIEdgePolyLine
        polyline.points = polyline.points.map(p => computeRotatedPoint(p, center, angleRad))
        return polyline
      }
    }
    return edge
  }

  protected applyOnText(text: OIText, center: TPoint, angleRad: number): OIText
  {
    text.rotation = {
      degree: convertRadianToDegree(-angleRad) + (text.rotation?.degree || 0),
      center: center
    }
    return this.texter.updateTextBoundingBox(text)
  }

  protected applyOnGroup(group: OISymbolGroup, center: TPoint, angleRad: number): OISymbolGroup
  {
    group.symbols.forEach(s => this.applyToSymbol(s, center, angleRad))
    return group
  }

  applyToSymbol(symbol: TOISymbol, center: TPoint, angleRad: number): TOISymbol
  {
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol as OIStroke, center, angleRad)
      case SymbolType.Shape:
        return this.applyToShape(symbol as TOIShape, center, angleRad)
      case SymbolType.Edge:
        return this.applyToEdge(symbol as TOIEdge, center, angleRad)
      case SymbolType.Text:
        return this.applyOnText(symbol as OIText, center, angleRad)
      case SymbolType.Group:
        return this.applyOnGroup(symbol as OISymbolGroup, center, angleRad)
      default:
        throw new Error(`Can't apply rotate on symbol, type unknow: ${ symbol.type }`)
    }
  }

  setTransformOrigin(id: string, originX: number, originY: number): void
  {
    this.renderer.setAttribute(id, "transform-origin", `${ originX }px ${ originY }px`)
  }

  rotateElement(id: string, degree: number): void
  {
    this.#logger.info("rotateElement", { id, degree })
    this.renderer.setAttribute(id, "transform", `rotate(${ degree })`)
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
    this.selector.hideInteractElements()
  }

  continue(point: TPoint): number
  {
    this.#logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = +convertRadianToDegree(computeAngleRadian(this.origin, this.center, point))

    angleDegree = this.snaps.snapRotation(angleDegree)

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
    const angleRad = 2 * Math.PI - converDegreeToRadian(angleDegree)
    const oldSymbols = this.model.symbolsSelected.map(s => s.clone())
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, this.center, angleRad)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })
    const strokesFromSymbols = this.behaviors.extractStrokesFromSymbols(this.model.symbolsSelected)
    this.recognizer.replaceStrokes(strokesFromSymbols.map(s => s.id), strokesFromSymbols)
    this.history.push(this.model, { replaced: { oldSymbols, newSymbols: this.model.symbolsSelected } })

    this.selector.resetSelectedGroup(this.model.symbolsSelected)
    this.interactElementsGroup = undefined
    this.selector.showInteractElements()
    this.svgDebugger.apply()
  }
}
