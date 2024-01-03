import { LoggerClass, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIShapeCircle, OIShapePolygon, OIStroke, ShapeKind, SymbolType, TOIEdge, TOIShape, TOISymbol, TPoint } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer/svg/OISVGRenderer"
import { UndoRedoManager } from "../undo-redo"
import { computeAngleRadian, converDegreeToRadian, convertRadianToDegree, rotatePoint } from "../utils"

/**
 * @group Renderer
 */
export class OIRotateManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors
  wrapper?: SVGElement
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

  protected applyOnStroke(stroke: OIStroke, center: TPoint, angleRad: number): OIStroke
  {
    stroke.pointers.forEach(p =>
    {
      const { x, y } = rotatePoint(center, p, angleRad)
      p.x = x
      p.y = y
    })
    return stroke
  }

  protected applyOnShape(shape: TOIShape, center: TPoint, angleRad: number): TOIShape
  {
    switch (shape.kind) {
      case ShapeKind.Circle: {
        const circle = shape as OIShapeCircle
        circle.center = rotatePoint(center, circle.center, angleRad)
        return circle
      }
      case ShapeKind.Rectangle:
      case ShapeKind.Triangle:
      case ShapeKind.Parallelogram:
      case ShapeKind.Polygon:
      case ShapeKind.Rhombus: {
        const p = shape as OIShapePolygon
        p.points.forEach(p =>
        {
          const { x, y } = rotatePoint(center, p, angleRad)
          p.x = x
          p.y = y
        })
        return p
      }
      default:
        throw new Error(`Can't apply rotate on shape, kind unknow: ${ shape.kind }`)
    }
  }

  protected applyOnEdge(edge: TOIEdge, center: TPoint, angleRad: number): TOIEdge
  {
    edge.start = rotatePoint(center, edge.start, angleRad)
    edge.end = rotatePoint(center, edge.end, angleRad)
    return edge
  }

  applyOnSymbol(symbol: TOISymbol, center: TPoint, angleRad: number): TOISymbol
  {
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyOnStroke(symbol as OIStroke, center, angleRad)
      case SymbolType.Shape:
        return this.applyOnShape(symbol as TOIShape, center, angleRad)
      case SymbolType.Edge:
        return this.applyOnEdge(symbol as TOIEdge, center, angleRad)
      case SymbolType.Decorator:
        // Decorator is computed from its parent (eg. OIStroke)
        return symbol
      default:
        throw new Error(`Can't apply rotate on symbol, type unknow: ${ symbol.type }`)
    }
  }

  start(target: Element): void
  {
    this.#logger.info("start", { target })
    this.wrapper = (target.closest(`[role=${ SvgElementRole.Selected }]`) as unknown) as SVGGElement
    const boundingBox = Box.createFromBoxes(this.model.selection.map(s => s.boundingBox))

    this.center = {
      x: boundingBox.xMin + boundingBox.width / 2,
      y: boundingBox.yMin + boundingBox.height / 2
    }
    this.origin = {
      x: Number(target.getAttribute("cx")),
      y: Number(target.getAttribute("cy"))
    }
    this.renderer.setTransformOrigin(this.wrapper.id, this.center.x, this.center.y)
  }

  continue(point: TPoint): number
  {
    this.#logger.info("continue", { point })
    if (!this.wrapper) {
      throw new Error("Can't rotate, you must call start before")
    }
    let angleDegree = +convertRadianToDegree(computeAngleRadian(this.origin, point, this.center)).toFixed(0)

    if (point.x - this.center.x < 0) {
      angleDegree = 360 - angleDegree
    }
    this.renderer.rotateElement(this.wrapper.id, angleDegree)
    return angleDegree
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const angleDegree = this.continue(point)
    const strokesRotated: OIStroke[] = []
    const angleRad = 2 * Math.PI - converDegreeToRadian(angleDegree)
    this.model.selection.forEach(s =>
    {
      this.applyOnSymbol(s, this.center, angleRad)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
      if (s.type === SymbolType.Stroke) {
        strokesRotated.push(s as OIStroke)
      }
    })
    this.renderer.resetSelectedGroup(this.model.selection)
    this.undoRedoManager.updateModelInStack(this.model)
    const promise = this.recognizer.replaceStrokes(strokesRotated.map(s => s.id), strokesRotated)
    await promise
  }
}
