import { DecoratorKind, TOIDecorator } from "../../primitive"
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

  getSVGElement(decorator: TOIDecorator): SVGGeometryElement | undefined
  {
    const attrs: { [key: string]: string } = {
      "id": decorator.id,
      "type": decorator.type,
      "kind": decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (decorator.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }
    attrs["opacity"] = (decorator.style.opacity || DefaultStyle.opacity!).toString()
    if (decorator.toDelete) {
      attrs["opacity"] = ((decorator.style.opacity || DefaultStyle.opacity!) * 0.5).toString()
    }

    let element: SVGGeometryElement | undefined

    switch (decorator.kind) {
      case DecoratorKind.Highlight:
        attrs["opacity"] = decorator.toDelete ? "0.25" : "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        element = SVGBuilder.createRect(decorator.boundingBox, attrs)
        break
      case DecoratorKind.Surround:
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = SVGBuilder.createRect(decorator.boundingBox, attrs)
        break
      case DecoratorKind.Strikethrough:
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = SVGBuilder.createLine(decorator.vertices[0], decorator.vertices[1], attrs)
        break
      case DecoratorKind.Underline:
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = SVGBuilder.createLine(decorator.vertices[0], decorator.vertices[1], attrs)
        break
    }

    return element
  }

}
