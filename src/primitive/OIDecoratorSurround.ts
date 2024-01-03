import { TStyle } from "../style"
import { Box } from "./Box"
import { DecoratorKind, OIDecorator } from "./OIDecorator"
import { TPoint } from "./Point"
import { TOISymbol } from "./Symbol"

/**
 * @group Primitive
 */
export class OIDecoratorSurround extends OIDecorator implements TOISymbol
{
  constructor(style: TStyle, symbols: TOISymbol[])
  {
    super(DecoratorKind.Surround, style, symbols)
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

  getClone(): OIDecoratorSurround
  {
    const clone = new OIDecoratorSurround(structuredClone(this.style), structuredClone(this.parents))
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.transform = this.transform.getClone()
    return clone
  }
}
