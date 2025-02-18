import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { Box, TBox } from "../Box"
import { IIStroke } from "../IIStroke"
import { IISymbolBase } from "../IISymbolBase"
import { TPoint } from "../Point"
import { SymbolType } from "../Symbol"

/**
 * @group Symbol
 */
export enum RecognizedKind
{
  Text = "text",
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
  Circle = "circle",
  Ellipse = "ellipse",
  Polygone = "polygone",
}

/**
 * @group Symbol
 */
export abstract class IIRecognizedBase<K = RecognizedKind> extends IISymbolBase<SymbolType.Recognized>
{
  readonly kind: K

  strokes: IIStroke[]

  constructor(
    kind: K,
    strokes: IIStroke[],
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Recognized, style)
    this.kind = kind
    this.strokes = strokes
  }

  get vertices(): TPoint[]
  {
    return this.strokes.flatMap(s => s.vertices)
  }

  get bounds(): Box
  {
    return Box.createFromBoxes(this.strokes.map(c => c.bounds))
  }

  get snapPoints(): TPoint[]
  {
    return this.bounds.snapPoints
  }

  updateChildrenStyle(): void
  {
    this.strokes.forEach(child => child.style = Object.assign({}, child.style, this.style))
  }

  overlaps(box: TBox): boolean
  {
    return this.strokes.some(s => s.overlaps(box))
  }

  containsStroke(strokeId: string): boolean
  {
    return this.strokes.some(s => s.id === strokeId)
  }

  removeStrokes(strokeIds: string[]): IIStroke[]
  {
    const strokeRemoved = this.strokes.filter(s => strokeIds.includes(s.id))
    this.strokes = this.strokes.filter(s => !strokeIds.includes(s.id))
    return strokeRemoved
  }
}
