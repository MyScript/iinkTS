import { SELECTION_MARGIN } from "../../Constants"
import { DecoratorKind, OIDecorator, OIStroke, OIText, SymbolType, TBoundingBox } from "../../primitive"
import { DefaultStyle } from "../../style"
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

  getSVGElement(decorator: OIDecorator, parent: OIStroke | OIText): SVGGeometryElement | undefined
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
    if (parent.deleting) {
      attrs["opacity"] = ((decorator.style.opacity || DefaultStyle.opacity!) * 0.5).toString()
    }

    let element: SVGGeometryElement | undefined

    switch (decorator.kind) {
      case DecoratorKind.Highlight: {
        attrs["opacity"] = parent.deleting ? "0.25" : "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        const bounds: TBoundingBox = {
          x: parent.boundingBox.x - (parent.style.width || 1),
          y: parent.boundingBox.y - (parent.style.width || 1),
          height: parent.boundingBox.height + (parent.style.width || 1) * 2,
          width: parent.boundingBox.width + (parent.style.width || 1) * 2,
        }
        element = SVGBuilder.createRect(bounds, attrs)
        break
      }
      case DecoratorKind.Surround: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const bounds: TBoundingBox = {
          x: parent.boundingBox.x - (parent.style.width || 1),
          y: parent.boundingBox.y - (parent.style.width || 1),
          height: parent.boundingBox.height + (parent.style.width || 1) * 2,
          width: parent.boundingBox.width + (parent.style.width || 1) * 2,
        }
        element = SVGBuilder.createRect(bounds, attrs)
        break
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: parent.boundingBox.xMin,
          y: parent.boundingBox.yMid
        }
        const p2 = {
          x: parent.boundingBox.xMax,
          y: parent.boundingBox.yMid
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        const p1 = {
          x: parent.boundingBox.xMin,
          y: parent.boundingBox.yMax + (parent.type === SymbolType.Stroke ? SELECTION_MARGIN / 2 : 0)
        }
        const p2 = {
          x: parent.boundingBox.xMax,
          y: parent.boundingBox.yMax + (parent.type === SymbolType.Stroke ? SELECTION_MARGIN / 2 : 0)
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
    }

    return element
  }

}
