import { DecoratorKind, OIStroke, OIDecorator, TPointer } from "../../primitive"
import { DefaultStyle } from "../../style"
import { computeAngleAxeRadian, computeLinksPointers, computeMiddlePointer } from "../../utils"
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

  protected getArcPath(center: TPointer, radius: number): string
  {
    const svgPath = [
      `M ${ center.x } ${ center.y }`,
      `m ${ -radius } 0`,
      `a ${ radius } ${ radius } 0 1 0 ${ radius * 2 } 0`,
      `a ${ radius } ${ radius } 0 1 0 ${ -(radius * 2) } 0`
    ].join(" ")
    return svgPath
  }

  protected getLinePath(begin: TPointer, end: TPointer, width: number): string
  {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, end), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(begin, end), width)
    const svgPath = [
      `M ${ linkPoints1[0].x } ${ linkPoints1[0].y }`,
      `L ${ linkPoints2[0].x } ${ linkPoints2[0].y }`,
      `L ${ linkPoints2[1].x } ${ linkPoints2[1].y }`,
      `L ${ linkPoints1[1].x } ${ linkPoints1[1].y }`
    ].join(" ")
    return svgPath
  }

  protected getFinalPath(begin: TPointer, end: TPointer, width: number): string
  {
    const ARCSPLIT = 6
    const angle = computeAngleAxeRadian(begin, end)
    const linkPoints = computeLinksPointers(end, angle, width)
    const parts = [`M ${ linkPoints[0].x } ${ linkPoints[0].y }`]
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - (i * (Math.PI / ARCSPLIT))
      const x = +(end.x - (end.p * width * Math.sin(newAngle))).toFixed(3)
      const y = +(end.y + (end.p * width * Math.cos(newAngle))).toFixed(3)
      parts.push(`L ${ x } ${ y }`)
    }
    const svgPath = parts.join(" ")
    return svgPath
  }

  protected getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string
  {
    const linkPoints1 = computeLinksPointers(begin, computeAngleAxeRadian(begin, central), width)
    const linkPoints2 = computeLinksPointers(end, computeAngleAxeRadian(central, end), width)
    const linkPoints3 = computeLinksPointers(central, computeAngleAxeRadian(begin, end), width)
    const svgPath = [
      `M ${ linkPoints1[0].x } ${ linkPoints1[0].y }`,
      `Q ${ linkPoints3[0].x } ${ linkPoints3[0].y } ${ linkPoints2[0].x } ${ linkPoints2[0].y }`,
      `L ${ linkPoints2[1].x } ${ linkPoints2[1].y }`,
      `Q ${ linkPoints3[1].x } ${ linkPoints3[1].y } ${ linkPoints1[1].x } ${ linkPoints1[1].y }`
    ].join(" ")
    return svgPath
  }

  getSVGPath(stroke: OIStroke): string
  {
    const STROKE_LENGTH = stroke.pointers.length
    if (!STROKE_LENGTH) return ""
    const STROKE_WIDTH = (stroke.style.width as number)
    const NB_QUADRATICS = STROKE_LENGTH - 2
    const firstPoint = stroke.pointers[0]

    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(this.getLinePath(firstPoint, computeMiddlePointer(firstPoint, stroke.pointers[1]), STROKE_WIDTH))

      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePointer(stroke.pointers[i], stroke.pointers[i + 1])
        const end = computeMiddlePointer(stroke.pointers[i + 1], stroke.pointers[i + 2])
        const central = stroke.pointers[i + 1]
        parts.push(this.getQuadraticPath(begin, end, central, STROKE_WIDTH)
        )
      }
      const beforeLastPoint = stroke.pointers[STROKE_LENGTH - 2]
      const lastPoint = stroke.pointers[STROKE_LENGTH - 1]
      parts.push(this.getLinePath(computeMiddlePointer(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(this.getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  }

  getSVGElement(stroke: OIStroke): SVGGraphicsElement
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

    const strokeAttrs: { [key: string]: string } = { "d": this.getSVGPath(stroke) }
    if (stroke.selected) {
      strokeAttrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    strokeGroup.append(SVGBuilder.createPath(strokeAttrs))

    stroke.decorators.forEach(d => {
      const deco = this.decoratorUtil.getSVGElement(d as OIDecorator)
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

}
