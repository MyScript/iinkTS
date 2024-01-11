import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { Box } from "./Box"
import { DecoratorKind, OIDecorator } from "./OIDecorator"
import { TPoint } from "./Point"
import { TOISymbol, TOISymbolDecorable } from "./OISymbol"

/**
 * @group Primitive
 */
export class OIDecoratorStrikethrough extends OIDecorator implements TOISymbol
{
  constructor(style: TStyle, symbols: TOISymbolDecorable[])
  {
    super(DecoratorKind.Strikethrough, style, symbols)
  }

  get boundingBox(): Box
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    const x = symBox.xMin + (symBox.width - SELECTION_MARGIN) / 2
    const y = symBox.yMin + (symBox.height + SELECTION_MARGIN) / 2
    const width = symBox.width + SELECTION_MARGIN
    const height = (this.style.width || 1) + SELECTION_MARGIN
    return new Box({ x, y, width, height })
  }

  get vertices(): TPoint[]
  {
    const symBox = Box.createFromBoxes(this.parents.map(sym => sym.boundingBox))
    return [
      {
        x: symBox.xMin,
        y: symBox.yMiddle
      },
      {
        x: symBox.xMax,
        y: symBox.yMiddle
      }
    ]
  }

  clone(): OIDecoratorStrikethrough
  {
    const clone = new OIDecoratorStrikethrough(structuredClone(this.style), structuredClone(this.parents))
    clone.id = this.id
    clone.selected = this.selected
    clone.toDelete = this.toDelete
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}
