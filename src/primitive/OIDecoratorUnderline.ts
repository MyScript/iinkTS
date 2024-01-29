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

  get boundingBox(): Box
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    const x = symBox.xMin - SELECTION_MARGIN / 2
    const y = symBox.yMax
    const width = symBox.width + SELECTION_MARGIN
    const height = SELECTION_MARGIN
    return new Box({ x, y, width, height })
  }

  get vertices(): TPoint[]
  {
    const symBox = this.boundingBox
    return [
      {
        x: symBox.xMin + SELECTION_MARGIN / 2,
        y: symBox.yMin + SELECTION_MARGIN / 2
      },
      {
        x: symBox.xMax - SELECTION_MARGIN / 2,
        y: symBox.yMin + SELECTION_MARGIN / 2
      }
    ]
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
