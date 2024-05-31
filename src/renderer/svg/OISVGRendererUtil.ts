import { LoggerClass } from "../../Constants"
import { LoggerManager } from "../../logger"
import { DecoratorKind, EdgeDecoration, OIDecorator, OIEraser, OIStroke, OISymbolGroup, OIText, SymbolType, TOIEdge, TOIShape, TOISymbol } from "../../primitive"
import { DefaultStyle } from "../../style"
import { OISVGDecoratorUtil } from "./OISVGDecoratorUtil"
import { OISVGRendererEdgeUtil } from "./OISVGRendererEdgeUtil"
import { OISVGRendererEraserUtil } from "./OISVGRendererEraserUtil"
import { OISVGRendererShapeUtil } from "./OISVGRendererShapeUtil"
import { OISVGRendererStrokeUtil } from "./OISVGRendererStrokeUtil"
import { SVGBuilder } from "./SVGBuilder"


/**
 * @group Renderer
 */
export class OISVGRendererUtil
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)

  selectionFilterId: string
  removalFilterId: string
  arrowStartDecoration: string
  arrowEndDecoration: string

  decoratorUtil: OISVGDecoratorUtil

  constructor(selectionFilterId: string, removalFilterId: string, arrowStartDecoration: string, arrowEndDecoration: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
    this.arrowStartDecoration = arrowStartDecoration
    this.arrowEndDecoration = arrowEndDecoration
    this.decoratorUtil = new OISVGDecoratorUtil(this.selectionFilterId, this.removalFilterId)
  }

  getTextElement(text: OIText): SVGGraphicsElement
  {
    const groupAttrs: { [key: string]: string } = {
      "id": text.id,
      "type": text.type,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "style": "-webkit-user-select: none; -ms-user-select: none; user-select: none;",
      "opacity": (text.style.opacity || DefaultStyle.opacity!).toString(),
    }
    if (text.rotation) {
      groupAttrs.transform = `rotate(${ text.rotation.degree }, ${ text.rotation.center.x }, ${ text.rotation.center.y })`
    }
    if (text.deleting) {
      groupAttrs["filter"] = `url(#${ this.removalFilterId })`
    }

    const textGroup = SVGBuilder.createGroup(groupAttrs)

    const textAttrs: { [key: string]: string } = { }
    if (text.selected) {
      textAttrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    const textElement = SVGBuilder.createText(text.point, "", textAttrs)

    text.chars.forEach(c =>
    {
      const attrs: { [key: string]: string } = {
        id: c.id,
        fill: c.color,
        "font-size": `${ c.fontSize }px`,
        "font-weight": c.fontWeight.toString(),
      }
      const span = SVGBuilder.createTSpan(c.label, attrs)

      textElement.appendChild(span)
    })
    textGroup.append(textElement)

    text.decorators.forEach(d =>
    {
      const deco = this.decoratorUtil.getSVGElement(d, text)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          textGroup.prepend(deco)
        }
        else {
          textGroup.append(deco)
        }
      }
    })

    return textGroup
  }

  getStrokeElement(stroke: OIStroke): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": stroke.id,
      "type": "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": stroke.style.color || DefaultStyle.color!,
      "stroke-width": (stroke.style.width || DefaultStyle.width!).toString(),
      "opacity": (stroke.style.opacity || DefaultStyle.opacity!).toString(),
    }

    if (stroke.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }

    const strokeGroup = SVGBuilder.createGroup(attrs)

    const strokeAttrs: { [key: string]: string } = { "d": OISVGRendererStrokeUtil.getSVGPath(stroke) }
    if (stroke.selected) {
      strokeAttrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    stroke.decorators.forEach(d => {
      const deco = this.decoratorUtil.getSVGElement(d as OIDecorator, stroke)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          strokeGroup.prepend(deco)
        }
        else {
          strokeGroup.append(deco)
        }
      }
    })

    return strokeGroup
  }

  getEdgeElement(edge: TOIEdge): SVGPathElement
  {
    const attrs: { [key: string]: string } = {
      "id": edge.id,
      "type": edge.type,
      "kind": edge.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": "transparent",
      "stroke": edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width!).toString(),
      "opacity": (edge.style.opacity || DefaultStyle.opacity!).toString(),
      "d": OISVGRendererEdgeUtil.getSVGPath(edge),
    }

    if (edge.startDecoration === EdgeDecoration.Arrow) {
      attrs["marker-start"] = `url(#${ this.arrowStartDecoration })`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      attrs["marker-end"] = `url(#${ this.arrowEndDecoration })`
    }
    if (edge.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    if (edge.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }

    return SVGBuilder.createPath(attrs)
  }

  getShapeElement(shape: TOIShape): SVGPathElement
  {

    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width!).toString(),
      "opacity": (shape.style.opacity || DefaultStyle.opacity!).toString(),
      "d": OISVGRendererShapeUtil.getSVGPath(shape),
    }

    if (shape.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    if (shape.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }

    return SVGBuilder.createPath(attrs)
  }

  getEraserElement(eraser: OIEraser): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": eraser.id,
      "type": "eraser",
      "stroke-width":  "12",
      "stroke": "grey",
      "opacity": "0.2",
      "shadowBlur": "5",
      "stroke-linecap": "round",
      "fill": "transparent",
      "d": OISVGRendererEraserUtil.getSVGPath(eraser)
    }
    return SVGBuilder.createPath(attrs)
  }

  getGroupElement(groupSym: OISymbolGroup): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": groupSym.id,
      "type": "group",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": groupSym.style.color || DefaultStyle.color!,
      "stroke-width": (groupSym.style.width || DefaultStyle.width!).toString(),
      "opacity": (groupSym.style.opacity || DefaultStyle.opacity!).toString(),
    }

    if (groupSym.deleting) {
      attrs["filter"] = `url(#${ this.removalFilterId })`
    }
    if (groupSym.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    const groupEl = SVGBuilder.createGroup(attrs)

    groupSym.symbols.forEach(sym => {
      groupEl.append(this.getSymbolElement(sym)!)
    })

    groupSym.decorators.forEach(d => {
      const deco = this.decoratorUtil.getSVGElement(d as OIDecorator, groupSym)
      if (deco) {
        if (d.kind === DecoratorKind.Highlight) {
          groupEl.prepend(deco)
        }
        else {
          groupEl.append(deco)
        }
      }
    })

    return groupEl
  }

  getSymbolElement(symbol: TOISymbol): SVGGraphicsElement | undefined
  {
    switch (symbol.type) {
      case SymbolType.Stroke:
        return this.getStrokeElement(symbol as OIStroke)
      case SymbolType.Eraser:
        return this.getEraserElement(symbol as OIEraser)
      case SymbolType.Shape:
        return this.getShapeElement(symbol as TOIShape)
      case SymbolType.Edge:
        return this.getEdgeElement(symbol as TOIEdge)
      case SymbolType.Text:
        return this.getTextElement(symbol as OIText)
      case SymbolType.Group:
        return this.getGroupElement(symbol as OISymbolGroup)
      default:
        this.#logger.error("getSymbolElement", `symbol type is unknow: "${ symbol.type }"`)
        return
    }
  }

}
