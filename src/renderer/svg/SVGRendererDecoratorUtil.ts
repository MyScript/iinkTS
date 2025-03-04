import { DecoratorKind, IIDecorator, RecognizedKind, SymbolType, TBox, TIISymbol } from "../../symbol"
import { DefaultStyle } from "../../style"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererDecoratorUtil
{
  static getSVGElement(decorator: IIDecorator, symbol: TIISymbol): SVGGeometryElement | undefined
  {
    const attrs: { [key: string]: string } = {
      "id": decorator.id,
      "type": "decorator",
      "kind": decorator.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (decorator.style.opacity) {
      attrs["opacity"] = decorator.style.opacity.toString()
    }
    if (symbol.deleting) {
      attrs["opacity"] = ((decorator.style.opacity || 1) * 0.5).toString()
    }

    let element: SVGGeometryElement | undefined

    switch (decorator.kind) {
      case DecoratorKind.Highlight: {
        attrs["opacity"] = symbol.deleting ? "0.25" : "0.5"
        attrs["stroke"] = "transparent"
        attrs["fill"] = decorator.style.color || DefaultStyle.color!
        const boundingBox: TBox = {
          x: symbol.bounds.x - +(symbol.style.width || DefaultStyle.width),
          y: symbol.bounds.y - +(symbol.style.width || DefaultStyle.width),
          height: symbol.bounds.height + +(symbol.style.width || DefaultStyle.width) * 2,
          width: symbol.bounds.width + +(symbol.style.width || DefaultStyle.width) * 2,
        }
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
      }
      case DecoratorKind.Surround: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const boundingBox: TBox = {
          x: symbol.bounds.x - +(symbol.style.width || DefaultStyle.width),
          y: symbol.bounds.y - +(symbol.style.width || DefaultStyle.width),
          height: symbol.bounds.height + +(symbol.style.width || DefaultStyle.width) * 2,
          width: symbol.bounds.width + +(symbol.style.width || DefaultStyle.width) * 2,
        }
        element = SVGBuilder.createRect(boundingBox, attrs)
        break
      }
      case DecoratorKind.Strikethrough: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = {
          x: symbol.bounds.xMin,
          y: symbol.bounds.yMid
        }
        const p2 = {
          x: symbol.bounds.xMax,
          y: symbol.bounds.yMid
        }
        if (symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Text) {
          p1.y = symbol.baseline - symbol.xHeight / 2
          p2.y = symbol.baseline - symbol.xHeight / 2
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
      case DecoratorKind.Underline: {
        attrs["fill"] = "transparent"
        attrs["stroke"] = decorator.style.color || DefaultStyle.color!
        attrs["stroke-width"] = (decorator.style.width || DefaultStyle.width).toString()
        const p1 = {
          x: symbol.bounds.xMin,
          y: symbol.bounds.yMax + +(symbol.style.width || DefaultStyle.width)
        }
        const p2 = {
          x: symbol.bounds.xMax,
          y: symbol.bounds.yMax + +(symbol.style.width || DefaultStyle.width)
        }
        if (symbol.type === SymbolType.Recognized && symbol.kind === RecognizedKind.Text) {
          p1.y = symbol.baseline + symbol.xHeight / 2
          p2.y = symbol.baseline + symbol.xHeight / 2
        }
        element = SVGBuilder.createLine(p1, p2, attrs)
        break
      }
    }

    return element
  }
}