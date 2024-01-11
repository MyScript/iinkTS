import { TStyle } from "../style"
import { Box } from "./Box"
import { DecoratorKind, OIDecorator } from "./OIDecorator"
import { TOISymbol, TOISymbolDecorable } from "./OISymbol"
import { TPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIDecoratorHighlight extends OIDecorator implements TOISymbol
{
  constructor(style: TStyle, symbols: TOISymbolDecorable[])
  {
    super(DecoratorKind.Highlight, style, symbols)
  }

  get boundingBox(): Box
  {
    return Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
  }

  get vertices(): TPoint[]
  {
    return [
      { x: this.boundingBox.x, y: this.boundingBox.y },
      { x: this.boundingBox.x + this.boundingBox.width, y: this.boundingBox.y },
      { x: this.boundingBox.x + this.boundingBox.width, y: this.boundingBox.y + this.boundingBox.height },
      { x: this.boundingBox.x, y: this.boundingBox.y + this.boundingBox.height },
    ]
  }

  clone(): OIDecoratorHighlight
  {
    const clone = new OIDecoratorHighlight(structuredClone(this.style), structuredClone(this.parents))
    clone.id = this.id
    clone.selected = this.selected
    clone.toDelete = this.toDelete
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}
