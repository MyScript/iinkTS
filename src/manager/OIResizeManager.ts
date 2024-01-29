import { LoggerClass, ResizeDirection, SvgElementRole } from "../Constants"
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
import { OISVGRenderer } from "../renderer"
import { UndoRedoManager } from "../undo-redo"
import { OISelectionManager } from "./OISelectionManager"
import { OITextManager } from "./OITextManager"

/**
 * @group Manager
 */
export class OIResizeManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors

  wrapper?: SVGElement
  direction!: ResizeDirection
  boundingBox!: Box
  transformOrigin!: TPoint
  keepRatio = false

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

  get textManager(): OITextManager
  {
    return this.behaviors.textManager
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  protected applyToStroke(stroke: OIStroke, origin: TPoint, scaleX: number, scaleY: number): OIStroke
  {
    this.#logger.debug("applyToStroke", { stroke, origin, scaleX, scaleY })
    stroke.pointers.forEach(p =>
    {
      p.x = origin.x + scaleX * (p.x - origin.x)
      p.y = origin.y + scaleY * (p.y - origin.y)
    })
    return stroke
  }

  protected applyToShape(shape: TOIShape, origin: TPoint, scaleX: number, scaleY: number): TOIShape
  {
    this.#logger.debug("applyToShape", { shape, origin, scaleX, scaleY })
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        const c = shape as OIShapeEllipse
        c.radiusX *= scaleX
        c.radiusY *= scaleY
        c.center.x = origin.x + scaleX * (c.center.x - origin.x)
        c.center.y = origin.y + scaleY * (c.center.y - origin.y)
        return c
      }
      case ShapeKind.Circle: {
        const c = shape as OIShapeCircle
        c.radius *= (scaleX + scaleY) / 2
        c.center.x = origin.x + scaleX * (c.center.x - origin.x)
        c.center.y = origin.y + scaleY * (c.center.y - origin.y)
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
          p.x = origin.x + scaleX * (p.x - origin.x)
          p.y = origin.y + scaleY * (p.y - origin.y)
        })
        return p
      }
      default:
        throw new Error(`Can't apply resize on shape, kind unknow: ${ shape.kind }`)
    }
  }

  protected applyToEdge(edge: TOIEdge, origin: TPoint, scaleX: number, scaleY: number): TOIEdge
  {
    this.#logger.debug("applyToEdge", { edge, origin, scaleX, scaleY })
    edge.start.x = origin.x + scaleX * (edge.start.x - origin.x)
    edge.start.y = origin.y + scaleY * (edge.start.y - origin.y)
    edge.end.x = origin.x + scaleX * (edge.end.x - origin.x)
    edge.end.y = origin.y + scaleY * (edge.end.y - origin.y)
    if (edge.kind === EdgeKind.Arc) {
      const arc = edge as OIEdgeArc
      arc.middle.x = origin.x + scaleX * (arc.middle.x - origin.x)
      arc.middle.y = origin.y + scaleY * (arc.middle.y - origin.y)
      return arc
    }
    return edge
  }

  protected applyOnText(text: OIText, origin: TPoint, scaleX: number, scaleY: number): OIText
  {
    text.point.x = origin.x + scaleX * (text.point.x - origin.x)
    text.point.y = origin.y + scaleY * (text.point.y - origin.y)

    text.chars.forEach(c =>
    {
      c.fontSize *= (scaleX + scaleY) / 2
    })
    return this.textManager.updateTextBoundingBox(text)
  }

  applyToSymbol(symbol: TOISymbol, origin: TPoint, scaleX: number, scaleY: number): TOISymbol
  {
    this.#logger.info("applyToSymbol", { symbol, scaleX, scaleY })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol as OIStroke, origin, scaleX, scaleY)
      case SymbolType.Shape:
        return this.applyToShape(symbol as TOIShape, origin, scaleX, scaleY)
      case SymbolType.Edge:
        return this.applyToEdge(symbol as TOIEdge, origin, scaleX, scaleY)
      case SymbolType.Decorator:
        // Decorator is computed from its parent (eg. OIStroke)
        return symbol
      case SymbolType.Text:
        return this.applyOnText(symbol as OIText, origin, scaleX, scaleY)
      default:
        throw new Error(`Can't apply resize on symbol, type unknow: ${ symbol.type }`)
    }
  }

  setTransformOrigin(id: string, originX: number, originY: number): void
  {
    this.renderer.setAttribute(id, "transform-origin", `${ originX }px ${ originY }px`)
  }

  scaleElement(id: string, sx: number, sy: number): void
  {
    this.#logger.info("scaleElement", { id, sx, sy })
    this.renderer.setAttribute(id, "transform", `scale(${ sx },${ sy })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { target })
    this.wrapper = (target.closest(`[role=${ SvgElementRole.Selected }]`) as unknown) as SVGGElement
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    this.keepRatio = this.model.symbolsSelected.some(s => s.type === SymbolType.Text || (s.type === SymbolType.Shape && (s as TOIShape).kind === ShapeKind.Circle))

    this.transformOrigin = origin
    this.boundingBox = Box.createFromPoints(this.model.symbolsSelected.flatMap(s => s.vertices))

    this.setTransformOrigin(this.wrapper!.id, this.transformOrigin.x, this.transformOrigin.y)
  }

  continue(point: TPoint): { scaleX: number, scaleY: number }
  {
    this.#logger.info("continue", { point })
    if (!this.wrapper) {
      throw new Error("Can't resize, you must call start before")
    }

    let deltaX = 0, deltaY = 0
    if ([ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast].includes(this.direction)) {
      deltaX = point.x - this.boundingBox.xMax
    }
    else if ([ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest].includes(this.direction)) {
      deltaX = this.boundingBox.xMin - point.x
    }

    if ([ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest].includes(this.direction)) {
      deltaY = this.boundingBox.yMin - point.y
    }
    else if ([ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest].includes(this.direction)) {
      deltaY = point.y - this.boundingBox.yMax
    }

    let scaleX = 1 + (deltaX / this.boundingBox.width)
    let scaleY = 1 + (deltaY / this.boundingBox.height)

    if (this.keepRatio) {
      if ([ResizeDirection.North, ResizeDirection.South].includes(this.direction)) {
        scaleX = scaleY
      }
      else if ([ResizeDirection.East, ResizeDirection.West].includes(this.direction)) {
        scaleY = scaleX
      }
      else {
        scaleX = Math.max(scaleX, scaleY)
        scaleY = scaleX
      }
    }
    this.scaleElement(this.wrapper.id, scaleX, scaleY)
    return {
      scaleX,
      scaleY
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const { scaleX, scaleY } = this.continue(point)
    const strokesResized: OIStroke[] = []
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, this.transformOrigin, scaleX, scaleY)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
      if (s.type === SymbolType.Stroke) {
        strokesResized.push(s as OIStroke)
      }
    })
    const promise = this.recognizer.replaceStrokes(strokesResized.map(s => s.id), strokesResized)
    this.selector.resetSelectedGroup(this.model.symbolsSelected)
    this.undoRedoManager.addModelToStack(this.model)
    this.wrapper = undefined
    await promise
  }
}
