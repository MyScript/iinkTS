import { LoggerClass, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  Box,
  EdgeKind,
  OIEdgeArc,
  OIShapeCircle,
  OIShapeEllipse,
  OIShapePolygon,
  OIStroke, OIText,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TPoint
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { UndoRedoManager } from "../undo-redo"
import { computeAngleRadian, converDegreeToRadian, convertRadianToDegree, rotatePoint } from "../utils"
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

  get undoRedoManager(): UndoRedoManager
  {
    return this.behaviors.undoRedoManager
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
      const { x, y } = rotatePoint(p, center, angleRad)
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
        ellipse.center = rotatePoint(ellipse.center, center, angleRad)
        return ellipse
      }
      case ShapeKind.Circle: {
        const circle = shape as OIShapeCircle
        circle.center = rotatePoint(circle.center, center, angleRad)
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
          const { x, y } = rotatePoint(p, center, angleRad)
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
    edge.start = rotatePoint(edge.start, center, angleRad)
    edge.end = rotatePoint(edge.end, center, angleRad)
    if (edge.kind === EdgeKind.Arc) {
      const arc = edge as OIEdgeArc
      arc.middle = rotatePoint(arc.middle, center, angleRad)
      return arc
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
    this.model.symbolsSelected.forEach(s => {
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
    this.model.symbolsSelected.forEach(s => {
      this.rotateElement(s.id, angleDegree)
    })
    return angleDegree
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const angleDegree = this.continue(point)
    const strokesRotated: OIStroke[] = []
    const angleRad = 2 * Math.PI - converDegreeToRadian(angleDegree)
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, this.center, angleRad)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
      if (s.type === SymbolType.Stroke) {
        strokesRotated.push(s as OIStroke)
      }
    })
    this.selector.resetSelectedGroup(this.model.symbolsSelected)
    this.undoRedoManager.addModelToStack(this.model)
    const promise = this.recognizer.replaceStrokes(strokesRotated.map(s => s.id), strokesRotated)
    this.interactElementsGroup = undefined
    this.selector.showInteractElements()
    await promise
    await this.svgDebugger.apply()
  }
}
