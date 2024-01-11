import { OIStroke, TOIDecorator, TPointer } from "../../primitive"
import { DefaultStyle } from "../../style"
import { OISVGDecoratorUtil } from "./OISVGDecoratorUtil"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGStrokeUtil
{
  removalFilterId: string
  selectionFilterId: string
  decoratorUtil: OISVGDecoratorUtil

  constructor(selectionFilterId: string, removalFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
    this.decoratorUtil = new OISVGDecoratorUtil(this.selectionFilterId, this.removalFilterId)
  }

  getSVGPath(stroke: OIStroke): string
  {
    if (stroke.pointers.length < 1) return ""

    const firstPoint = stroke.pointers.at(0) as TPointer

    if (stroke.pointers.length === 1) {
      const strokeWith = stroke.style.width || 4
      return `C ${ firstPoint.x - strokeWith / 2 } ${ firstPoint.y } Q ${ firstPoint.x  + strokeWith / 2 } ${ firstPoint.y }`
    }

    const middlePoints = stroke.pointers.slice(1)

    const startPathMoveTo = `M ${ firstPoint.x } ${ firstPoint.y }`


    const middlePathQuadratic = middlePoints.reduce((acc, point) => {
      return `${ acc } ${ point.x } ${ point.y }`
    }, "Q")

    return `${ startPathMoveTo } ${ middlePathQuadratic }`
  }

  getSVGElement(stroke: OIStroke): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": stroke.id,
      "type": "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": "transparent",
    }

    if (stroke.pointerType === "eraser") {
      attrs["stroke-width"] =  "20"
      attrs["stroke"] = "grey"
      attrs["opacity"] = "0.2"
      attrs["shadowBlur"] = "5"
    }
    else {
      attrs["stroke"] = stroke.style.color || DefaultStyle.color!
      attrs["stroke-width"] = (stroke.style.width || DefaultStyle.width!).toString()
      attrs["opacity"] = (stroke.style.opacity || DefaultStyle.opacity!).toString()
      if (stroke.selected) {
        attrs["filter"] = `url(#${ this.selectionFilterId })`
      }
      if (stroke.toDelete) {
        attrs["filter"] = `url(#${ this.removalFilterId })`
      }
    }

    const strokeGroup = SVGBuilder.createGroup(attrs)

    const strokeAttrs: { [key: string]: string } = { "d": this.getSVGPath(stroke) }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    stroke.decorators.forEach(d => {
      const deco = this.decoratorUtil.getSVGElement(d as TOIDecorator)
      if (deco) {
        strokeGroup.prepend(deco)
      }
    })

    return strokeGroup
  }

}
