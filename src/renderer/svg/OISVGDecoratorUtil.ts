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

  getSVGElement(decorator: OIDecorator, { deleting, style, boundingBox }: { deleting: boolean, style: TStyle, boundingBox: Box }): SVGGeometryElement | undefined
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
        const bounds: TBoundingBox = {
          x: boundingBox.x - (style.width || 1),
          y: boundingBox.y - (style.width || 1),
          height: boundingBox.height + (style.width || 1) * 2,
          width: boundingBox.width + (style.width || 1) * 2,
        }
        element = SVGBuilder.createRect(bounds, attrs)
        break
      }
      case DecoratorKind.Surround: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const bounds: TBoundingBox = {
          x: boundingBox.x - (style.width || 1),
          y: boundingBox.y - (style.width || 1),
          height: boundingBox.height + (style.width || 1) * 2,
          width: boundingBox.width + (style.width || 1) * 2,
        }
        element = SVGBuilder.createRect(bounds, attrs)
        break
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: boundingBox.xMin,
          y: boundingBox.yMid
        }
        const p2 = {
          x: boundingBox.xMax,
          y: boundingBox.yMid
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: boundingBox.xMin,
          y: boundingBox.yMax + (style.width || 1)
        }
        const p2 = {
          x: boundingBox.xMax,
          y: boundingBox.yMax + (style.width || 1)
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
    }

    return element
  }

}
