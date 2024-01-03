import { LoggerClass, ResizeDirection, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIShapeCircle, OIShapePolygon, OIStroke, ShapeKind, SymbolType, TOIEdge, TOIShape, TOISymbol, TPoint } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { UndoRedoManager } from "../undo-redo"

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

  protected setResizeOrigin(): void
  {
    this.#logger.info("setResizeOrigin", { direction: this.direction })
    switch (this.direction) {
      case ResizeDirection.North: {
        this.origin = {
          x: 0,
          y: this.boundingBox.yMax
        }
        break
      }
      case ResizeDirection.East: {
        this.origin = {
          x: this.boundingBox.xMin,
          y: 0
        }
        break
      }
      case ResizeDirection.South: {
        this.origin = {
          x: 0,
          y: this.boundingBox.yMin
        }
        break
      }
      case ResizeDirection.West: {
        this.origin = {
          x: this.boundingBox.xMax,
          y: 0
        }
        break
      }
      case ResizeDirection.NorthEast: {
        this.origin = {
          x: this.boundingBox.xMin,
          y: this.boundingBox.yMax
        }
        break
      }
      case ResizeDirection.NorthWest: {
        this.origin = {
          x: this.boundingBox.xMax,
          y: this.boundingBox.yMax
        }
        break
      }
      case ResizeDirection.SouthEast: {
        this.origin = {
          x: this.boundingBox.xMin,
          y: this.boundingBox.yMin
        }
        break
      }
      case ResizeDirection.SouthWest: {
        this.origin = {
          x: this.boundingBox.xMax,
          y: this.boundingBox.yMin
        }
        break
      }
      default:
        this.#logger.error("setResizeOrigin", `Resize direction unknow: "${ this.direction }".`)
        break
    }
    this.renderer.setTransformOrigin(this.wrapper!.id, this.origin.x, this.origin.y)
  }

  protected applyOnStroke(stroke: OIStroke, origin: TPoint, scaleX: number, scaleY: number): OIStroke
  {
    this.#logger.debug("applyOnStroke", { stroke, origin, scaleX, scaleY })
    stroke.pointers.forEach(p =>
    {
      p.x = origin.x + scaleX * (p.x - origin.x)
      p.y = origin.y + scaleY * (p.y - origin.y)
    })
    return stroke
  }

  protected applyOnShape(shape: TOIShape, origin: TPoint, scaleX: number, scaleY: number): TOIShape
  {
    this.#logger.debug("applyOnShape", { shape, origin, scaleX, scaleY })
    switch (shape.kind) {
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

  protected applyOnEdge(edge: TOIEdge, origin: TPoint, scaleX: number, scaleY: number): TOIEdge
  {
    this.#logger.debug("applyOnEdge", { edge, origin, scaleX, scaleY })
    edge.start.x = origin.x + scaleX * (edge.start.x - origin.x)
    edge.start.y = origin.y + scaleY * (edge.start.y - origin.y)
    edge.end.x = origin.x + scaleX * (edge.end.x - origin.x)
    edge.end.y = origin.y + scaleY * (edge.end.y - origin.y)
    return edge
  }

  applyOnSymbol(symbol: TOISymbol, origin: TPoint, scaleX: number, scaleY: number): TOISymbol
  {
    this.#logger.info("applyOnSymbol", { symbol, scaleX, scaleY })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyOnStroke(symbol as OIStroke, origin, scaleX, scaleY)
      case SymbolType.Shape:
        return this.applyOnShape(symbol as TOIShape, origin, scaleX, scaleY)
      case SymbolType.Edge:
        return this.applyOnEdge(symbol as TOIEdge, origin, scaleX, scaleY)
      case SymbolType.Decorator:
        // Decorator is computed from its parent (eg. OIStroke)
        return symbol
      default:
        throw new Error(`Can't apply resize on symbol, type unknow: ${ symbol.type }`)
    }
  }

  start(target: Element): void
  {
    this.#logger.info("start", { target })
    this.wrapper = (target.closest(`[role=${ SvgElementRole.Selected }]`) as unknown) as SVGGElement
    this.direction = target.getAttribute("resize-direction") as ResizeDirection
    this.boundingBox = Box.createFromBoxes(this.model.selection.map(s => s.boundingBox))
    this.setResizeOrigin()
  }

  continue(point: TPoint): { scaleX: number, scaleY: number }
  {
    this.#logger.info("continue", { point })
    if (!this.wrapper) {
      throw new Error("Can't resize, you must call start before")
    }
    let scaleX = 1
    let scaleY = 1
    switch (this.direction) {
      case ResizeDirection.North: {
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = this.boundingBox.yMin - point.y
        scaleY = 1 + (ty / height)
        break
      }
      case ResizeDirection.East: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = point.x - this.boundingBox.xMax
        scaleX = 1 + (tx / width)
        break
      }
      case ResizeDirection.South: {
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = point.y - this.boundingBox.yMax
        scaleY = 1 + (ty / height)
        break
      }
      case ResizeDirection.West: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = this.boundingBox.xMin - point.x
        scaleX = 1 + (tx / width)
        break
      }
      case ResizeDirection.NorthEast: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = point.x - this.boundingBox.xMax
        scaleX = 1 + (tx / width)
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = this.boundingBox.yMin - point.y
        scaleY = 1 + (ty / height)
        break
      }
      case ResizeDirection.NorthWest: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = this.boundingBox.xMin - point.x
        scaleX = 1 + (tx / width)
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = this.boundingBox.yMin - point.y
        scaleY = 1 + (ty / height)
        break
      }
      case ResizeDirection.SouthEast: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = point.x - this.boundingBox.xMax
        scaleX = 1 + (tx / width)
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = point.y - this.boundingBox.yMax
        scaleY = 1 + (ty / height)
        break
      }
      case ResizeDirection.SouthWest: {
        const width = this.boundingBox.xMax - this.boundingBox.xMin
        const tx = this.boundingBox.xMin - point.x
        scaleX = 1 + (tx / width)
        const height = this.boundingBox.yMax - this.boundingBox.yMin
        const ty = point.y - this.boundingBox.yMax
        scaleY = 1 + (ty / height)
        break
      }
    }
    this.renderer.scaleElement(this.wrapper.id, scaleX, scaleY)
    return {
      scaleX,
      scaleY
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    this.undoRedoManager.addModelToStack(this.model)
    const { scaleX, scaleY } = this.continue(point)
    const strokesResized: OIStroke[] = []
    this.model.selection.forEach(s =>
    {
      this.applyOnSymbol(s, this.origin, scaleX, scaleY)
      this.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
      if (s.type === SymbolType.Stroke) {
        strokesResized.push(s as OIStroke)
      }
    })
    this.renderer.resetSelectedGroup(this.model.selection)
    this.undoRedoManager.updateModelInStack(this.model)
    const promise = this.recognizer.replaceStrokes(strokesResized.map(s => s.id), strokesResized)
    await promise
    this.wrapper = undefined
  }
}
