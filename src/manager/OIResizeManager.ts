import { ResizeDirection, SvgElementRole } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  Box,
  EdgeKind,
  OIStroke,
  OISymbolGroup,
  OIText,
  OIStrokeText,
  ShapeKind,
  SymbolType,
  TOIEdge,
  TOIShape,
  TOISymbol,
  TPoint
} from "../primitive"

/**
 * @group Manager
 */
export class OIResizeManager
{
  #logger = LoggerManager.getLogger(LoggerClass.TRANSFORMER)
  behaviors: OIBehaviors

  interactElementsGroup?: SVGElement
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

  protected applyToStroke(stroke: OIStroke, origin: TPoint, scaleX: number, scaleY: number): OIStroke
  {
    this.#logger.debug("applyToStroke", { stroke, origin, scaleX, scaleY })
    stroke.pointers.forEach(p =>
    {
      p.x = +(origin.x + scaleX * (p.x - origin.x)).toFixed(3)
      p.y = +(origin.y + scaleY * (p.y - origin.y)).toFixed(3)
    })
    return stroke
  }

  protected applyToShape(shape: TOIShape, origin: TPoint, scaleX: number, scaleY: number): TOIShape
  {
    this.#logger.debug("applyToShape", { shape, origin, scaleX, scaleY })
    switch (shape.kind) {
      case ShapeKind.Ellipse: {
        const cosPhi = Math.cos(shape.orientation)
        const sinPhi = Math.sin(shape.orientation)
        shape.center.x = +(shape.center.x + ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (shape.center.x - origin.x)).toFixed(3)
        shape.center.y = +(shape.center.y + ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (shape.center.y - origin.y)).toFixed(3)
        shape.radiusX = +(Math.abs(shape.radiusX * (scaleX * cosPhi - scaleY * sinPhi))).toFixed(3)
        shape.radiusY = +(Math.abs(shape.radiusY * (scaleX * sinPhi + scaleY * cosPhi))).toFixed(3)
        return shape
      }
      case ShapeKind.Circle: {
        shape.radius = +(shape.radius * (scaleX + scaleY) / 2).toFixed(3)
        shape.center.x = +(origin.x + scaleX * (shape.center.x - origin.x)).toFixed(3)
        shape.center.y = +(origin.y + scaleY * (shape.center.y - origin.y)).toFixed(3)
        return shape
      }
      case ShapeKind.Polygon: {
        shape.points.forEach(p =>
        {
          p.x = +(origin.x + scaleX * (p.x - origin.x)).toFixed(3)
          p.y = +(origin.y + scaleY * (p.y - origin.y)).toFixed(3)
        })
        return shape
      }
      default:
        throw new Error(`Can't apply resize on shape, kind unknow: ${ JSON.stringify(shape) }`)
    }
  }

  protected applyToEdge(edge: TOIEdge, origin: TPoint, scaleX: number, scaleY: number): TOIEdge
  {
    this.#logger.debug("applyToEdge", { edge, origin, scaleX, scaleY })
    switch (edge.kind) {
      case EdgeKind.Arc: {
        const cosPhi = Math.cos(edge.phi)
        const sinPhi = Math.sin(edge.phi)
        edge.center.x = +(edge.center.x + ((scaleX - 1) * cosPhi + (scaleY - 1) * sinPhi) * (edge.center.x - origin.x)).toFixed(3)
        edge.center.y = +(edge.center.y + ((scaleX - 1) * -sinPhi + (scaleY - 1) * cosPhi) * (edge.center.y - origin.y)).toFixed(3)
        edge.radiusX = +(edge.radiusX * Math.abs(scaleX * cosPhi + scaleY * sinPhi)).toFixed(3)
        edge.radiusY = +(edge.radiusY * Math.abs(scaleX * sinPhi + scaleY * cosPhi)).toFixed(3)

        if (scaleX < 0) {
          edge.startAngle = +(Math.PI - edge.startAngle).toFixed(3)
          edge.sweepAngle *= -1
        }
        else if (scaleY < 0) {
          edge.sweepAngle *= -1
        }
        return edge
      }
      case EdgeKind.Line: {
        edge.start.x = +(origin.x + scaleX * (edge.start.x - origin.x)).toFixed(3)
        edge.start.y = +(origin.y + scaleY * (edge.start.y - origin.y)).toFixed(3)
        edge.end.x = +(origin.x + scaleX * (edge.end.x - origin.x)).toFixed(3)
        edge.end.y = +(origin.y + scaleY * (edge.end.y - origin.y)).toFixed(3)
        return edge
      }
      case EdgeKind.PolyEdge: {
        edge.points.forEach(p =>
        {
          p.x = +(origin.x + scaleX * (p.x - origin.x)).toFixed(3)
          p.y = +(origin.y + scaleY * (p.y - origin.y)).toFixed(3)
          return p
        })
        return edge
      }
      default:
        throw new Error(`Can't apply resize on edge, kind unknow: ${ JSON.stringify(edge) }`)
    }
  }

  protected applyOnText(text: OIText, origin: TPoint, scaleX: number, scaleY: number): OIText
  {
    text.point.x = +(origin.x + scaleX * (text.point.x - origin.x)).toFixed(3)
    text.point.y = +(origin.y + scaleY * (text.point.y - origin.y)).toFixed(3)

    text.chars.forEach(c =>
    {
      c.fontSize = +(c.fontSize * (scaleX + scaleY) / 2).toFixed(3)
    })
    return this.behaviors.texter.updateBounds(text)
  }

  protected applyOnGroup(group: OISymbolGroup, origin: TPoint, scaleX: number, scaleY: number): OISymbolGroup
  {
    group.children.forEach(s => this.applyToSymbol(s, origin, scaleX, scaleY))
    return group
  }

  protected applyOnStrokeText(strokeText: OIStrokeText, origin: TPoint, scaleX: number, scaleY: number): OIStrokeText
  {
    strokeText.strokes.forEach(s => this.applyToStroke(s, origin, scaleX, scaleY))
    strokeText.xHeight *= scaleY
    return strokeText
  }

  applyToSymbol(symbol: TOISymbol, origin: TPoint, scaleX: number, scaleY: number): TOISymbol
  {
    this.#logger.info("applyToSymbol", { symbol, scaleX, scaleY })
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.applyToStroke(symbol, origin, scaleX, scaleY)
      case SymbolType.Shape:
        return this.applyToShape(symbol, origin, scaleX, scaleY)
      case SymbolType.Edge:
        return this.applyToEdge(symbol, origin, scaleX, scaleY)
      case SymbolType.Text:
        return this.applyOnText(symbol, origin, scaleX, scaleY)
      case SymbolType.Group:
        return this.applyOnGroup(symbol, origin, scaleX, scaleY)
      case SymbolType.StrokeText:
        return this.applyOnStrokeText(symbol, origin, scaleX, scaleY)
      default:
        throw new Error(`Can't apply resize on symbol, type unknow: ${ JSON.stringify(symbol) }`)
    }
  }

  setTransformOrigin(id: string, originX: number, originY: number): void
  {
    this.behaviors.renderer.setAttribute(id, "transform-origin", `${ originX }px ${ originY }px`)
  }

  scaleElement(id: string, sx: number, sy: number): void
  {
    this.#logger.info("scaleElement", { id, sx, sy })
    this.behaviors.renderer.setAttribute(id, "transform", `scale(${ sx },${ sy })`)
  }

  start(target: Element, origin: TPoint): void
  {
    this.#logger.info("start", { target })
    this.interactElementsGroup = (target.closest(`[role=${ SvgElementRole.InteractElementsGroup }]`) as unknown) as SVGGElement
    this.direction = target.getAttribute("resize-direction") as ResizeDirection

    this.keepRatio = this.model.symbolsSelected.some(s => s.type === SymbolType.Text || (s.type === SymbolType.Shape && (s as TOIShape).kind === ShapeKind.Circle))

    this.transformOrigin = origin
    this.boundingBox = Box.createFromPoints(this.model.symbolsSelected.flatMap(s => s.vertices))
    this.setTransformOrigin(this.interactElementsGroup!.id, this.transformOrigin.x, this.transformOrigin.y)
    this.model.symbolsSelected.forEach(s =>
    {
      this.setTransformOrigin(s.id, this.transformOrigin.x, this.transformOrigin.y)
    })
  }

  continue(point: TPoint): { scaleX: number, scaleY: number }
  {
    this.#logger.info("continue", { point })
    if (!this.interactElementsGroup) {
      throw new Error("Can't resize, you must call start before")
    }
    const localPoint = point
    const horizontalResize = [
      ResizeDirection.East,
      ResizeDirection.NorthEast,
      ResizeDirection.SouthEast,
      ResizeDirection.West,
      ResizeDirection.NorthWest,
      ResizeDirection.SouthWest
    ].includes(this.direction)
    const verticalResize = [
      ResizeDirection.North,
      ResizeDirection.NorthEast,
      ResizeDirection.NorthWest,
      ResizeDirection.South,
      ResizeDirection.SouthEast,
      ResizeDirection.SouthWest
    ].includes(this.direction)
    const { x, y } = this.behaviors.snaps.snapResize(point, horizontalResize, verticalResize)
    localPoint.x = x
    localPoint.y = y

    let deltaX = 0, deltaY = 0
    if ([ResizeDirection.East, ResizeDirection.NorthEast, ResizeDirection.SouthEast].includes(this.direction)) {
      deltaX = localPoint.x - this.boundingBox.xMax
    }
    else if ([ResizeDirection.West, ResizeDirection.NorthWest, ResizeDirection.SouthWest].includes(this.direction)) {
      deltaX = this.boundingBox.xMin - localPoint.x
    }

    if ([ResizeDirection.North, ResizeDirection.NorthEast, ResizeDirection.NorthWest].includes(this.direction)) {
      deltaY = this.boundingBox.yMin - localPoint.y
    }
    else if ([ResizeDirection.South, ResizeDirection.SouthEast, ResizeDirection.SouthWest].includes(this.direction)) {
      deltaY = localPoint.y - this.boundingBox.yMax
    }

    let scaleX = this.boundingBox.width ? 1 + (deltaX / this.boundingBox.width) : 1
    let scaleY = this.boundingBox.height ? 1 + (deltaY / this.boundingBox.height) : 1

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
    this.scaleElement(this.interactElementsGroup.id, scaleX, scaleY)
    this.model.symbolsSelected.forEach(s =>
    {
      this.scaleElement(s.id, scaleX, scaleY)
    })
    return {
      scaleX,
      scaleY
    }
  }

  async end(point: TPoint): Promise<void>
  {
    this.#logger.info("end", { point })
    const { scaleX, scaleY } = this.continue(point)
    this.behaviors.snaps.clearSnapToElementLines()
    const oldSymbols = this.model.symbolsSelected.map(s => s.clone())
    this.model.symbolsSelected.forEach(s =>
    {
      this.applyToSymbol(s, this.transformOrigin, scaleX, scaleY)
      this.behaviors.renderer.drawSymbol(s)
      this.model.updateSymbol(s)
    })

    const strokesFromSymbols = this.behaviors.extractStrokesFromSymbols(this.model.symbolsSelected)
    this.behaviors.recognizer.transformScale(strokesFromSymbols.map(s => s.id), scaleX, scaleY, this.transformOrigin.x, this.transformOrigin.y)
    this.behaviors.history.push(this.model, { scale: [{ symbols: oldSymbols, origin: {...this.transformOrigin}, scaleX, scaleY }] })

    this.interactElementsGroup = undefined
    this.behaviors.svgDebugger.apply()
  }
}
