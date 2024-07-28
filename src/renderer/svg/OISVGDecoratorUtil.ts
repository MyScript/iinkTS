import { Box, DecoratorKind, OIDecorator, TBoundingBox } from "../../primitive"
import { DefaultStyle, TStyle } from "../../style"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGDecoratorUtil
{
  selectionFilterId: string
  removalFilterId: string

  constructor(selectionFilterId: string, removalFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
    this.removalFilterId = removalFilterId
  }

  getSVGElement(decorator: OIDecorator, { deleting, style, bounds }: { deleting: boolean, style: TStyle, bounds: Box }): SVGGeometryElement | undefined
  {
    const attrs: { [key: string]: string } = {
      "id": decorator.id,
      "type": "decorator",
      "kind": decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    attrs["opacity"] = (decorator.style.opacity || DefaultStyle.opacity!).toString()
    if (deleting) {
      attrs["opacity"] = ((decorator.style.opacity || DefaultStyle.opacity!) * 0.5).toString()
    }

    let element: SVGGeometryElement | undefined

    switch (decorator.kind) {
      case DecoratorKind.Highlight: {
        attrs["opacity"] = deleting ? "0.25" : "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        const boundingBox: TBoundingBox = {
          x: bounds.x - +(style.width || DefaultStyle.width!),
          y: bounds.y - +(style.width || DefaultStyle.width!),
          height: bounds.height + +(style.width || DefaultStyle.width!) * 2,
          width: bounds.width + +(style.width || DefaultStyle.width!) * 2,
        }
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
      }
      case DecoratorKind.Surround: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const boundingBox: TBoundingBox = {
          x: bounds.x - +(style.width || DefaultStyle.width!),
          y: bounds.y - +(style.width || DefaultStyle.width!),
          height: bounds.height + +(style.width || DefaultStyle.width!) * 2,
          width: bounds.width + +(style.width || DefaultStyle.width!) * 2,
        }
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: bounds.xMin,
          y: bounds.yMid
        }
        const p2 = {
          x: bounds.xMax,
          y: bounds.yMid
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: bounds.xMin,
          y: bounds.yMax + +(style.width || DefaultStyle.width!)
        }
        const p2 = {
          x: bounds.xMax,
          y: bounds.yMax + +(style.width || DefaultStyle.width!)
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
    }

    return element
  }

}
