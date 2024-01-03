import { DecoratorKind, TOIDecorator } from "../../primitive"
import { DefaultStyle } from "../../style"
import { createLine, createRect } from "./SVGElementBuilder"

/**
 * @group Renderer
 */
export class OISVGDecoratorUtil
{
  selectionFilterId: string

  constructor(selectionFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
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

    let element: SVGGeometryElement | undefined

    switch (decorator.kind) {
      case DecoratorKind.Highlight:
        attrs["opacity"] = "0.4"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        element = createRect(decorator.boundingBox, attrs)
        break
      case DecoratorKind.Surround:
        attrs["opacity"] = (decorator.style.opacity || DefaultStyle.opacity!).toString()
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = createRect(decorator.boundingBox, attrs)
        break
      case DecoratorKind.Strikethrough:
        attrs["opacity"] = (decorator.style.opacity || DefaultStyle.opacity!).toString()
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = createLine(decorator.vertices[0], decorator.vertices[1], attrs)
        break
      case DecoratorKind.Underline:
        attrs["opacity"] = (decorator.style.opacity || DefaultStyle.opacity!).toString()
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width!).toString()
        element = createLine(decorator.vertices[0], decorator.vertices[1], attrs)
        break
    }

    return element
  }

}
