import { createUUID } from "../utils"
import { TStyle } from "../style"
import { OIStroke } from "./OIStroke"
import { OIText } from "./OIText"

/**
 * @group Primitive
 */
export enum DecoratorKind
{
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * @group Primitive
 */
export class OIDecorator
{
  id: string
  kind: DecoratorKind
  style: TStyle
  parent: OIStroke | OIText

  constructor(kind: DecoratorKind, style: TStyle, symbol: OIStroke | OIText)
  {
    this.id = `${ kind }-${ createUUID() }`
    this.style = structuredClone(style)
    this.kind = kind
    this.parent = symbol
  }

  clone(parent: OIStroke | OIText): OIDecorator
  {
    const clone = new OIDecorator(this.kind, structuredClone(this.style), parent)
    clone.id = this.id
    return clone
  }

}
