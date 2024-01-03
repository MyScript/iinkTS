import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { Box } from "./Box"
import { DecoratorKind, OIDecorator } from "./OIDecorator"
import { TPoint } from "./Point"
import { TOISymbol } from "./Symbol"

/**
 * @group Primitive
 */
export class OIDecoratorStrikethrough extends OIDecorator implements TOISymbol
{
  constructor(style: TStyle, symbols: TOISymbol[])
  {
    super(DecoratorKind.Strikethrough, style, symbols)
  }

  get boundingBox(): Box
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    const x = symBox.xMin + (symBox.width - SELECTION_MARGIN) / 2
    const y = symBox.yMin + (symBox.height + SELECTION_MARGIN) / 2
    const width =  symBox.width + SELECTION_MARGIN
    const height = (this.style.width || 1 ) + SELECTION_MARGIN
    return new Box(x, y, width, height)
  }

  get vertices(): TPoint[]
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    return [
      {
        x: symBox.xMin,
        y: symBox.yMin + symBox.height / 2
      },
      {
        x: symBox.xMax,
        y: symBox.yMin + symBox.height / 2
      }
    ]
  }

  getClone(): OIDecoratorStrikethrough
  {
    const clone = new OIDecoratorStrikethrough(structuredClone(this.style), structuredClone(this.parents))
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.transform = this.transform.getClone()
    return clone
  }
}
