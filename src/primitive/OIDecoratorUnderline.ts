import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { Box } from "./Box"
import { DecoratorKind, OIDecorator } from "./OIDecorator"
import { TPoint } from "./Point"
import { TOISymbol, TOISymbolDecorable } from "./OISymbol"

/**
 * @group Primitive
 */
export class OIDecoratorUnderline extends OIDecorator implements TOISymbol
{
  constructor(style: TStyle, symbols: TOISymbolDecorable[])
  {
    super(DecoratorKind.Underline, style, symbols)
  }

  get vertices(): TPoint[]
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    return [
      {
        x: symBox.xMin,
        y: symBox.yMax + SELECTION_MARGIN / 2
      },
      {
        x: symBox.xMax,
        y: symBox.yMax + SELECTION_MARGIN / 2
      }
    ]
  }

  get boundingBox(): Box
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    const x = symBox.xMin - SELECTION_MARGIN / 2
    const y = symBox.yMax
    const width = symBox.width + SELECTION_MARGIN
    const height = 2 * SELECTION_MARGIN
    return new Box({ x, y, width, height })
  }

  clone(): OIDecoratorUnderline
  {
    const clone = new OIDecoratorUnderline(structuredClone(this.style), structuredClone(this.parents))
    clone.id = this.id
    clone.selected = this.selected
    clone.toDelete = this.toDelete
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}
