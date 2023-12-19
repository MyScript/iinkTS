import { OIStroke, TPointer } from "../../primitive"
import { DefaultStyle } from "../../style"
import { createPath } from "./SVGElementBuilder"

export class OISVGRendererStroke
{
  selectionFilterId: string

  constructor(selectionFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
  }

  getSVGPath(stroke: OIStroke): string
  {
    if (stroke.pointers.length < 2) return ""

    const firstPoint = stroke.pointers.at(0) as TPointer
    const middlePoints = stroke.pointers.slice(1)

    const startPathMoveTo = `M ${ firstPoint.x } ${ firstPoint.y }`

    const middlePathQuadratic = middlePoints.reduce((acc, point) => {
      return `${ acc } ${ point.x } ${ point.y }`
    }, "Q")

    return `${ startPathMoveTo } ${ middlePathQuadratic }`
  }

  getSVGElement(stroke: OIStroke): SVGPathElement
  {

    const attrs: { [key: string]: string } = {
      "id": stroke.id,
      "type": "stroke",
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": "transparent",
      "d": this.getSVGPath(stroke),
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
    }

    if (stroke.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }

    return createPath(attrs)
  }

}
