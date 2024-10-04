import { TStyle } from "../style"
import { PartialDeep } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { OIDecorator } from "./OIDecorator"
import { OIStroke } from "./OIStroke"
import { OISymbolBase } from "./OISymbolBase"
import { TPoint } from "./Point"
import { SymbolType } from "./Symbol"

/**
 * @group Primitive
 */
export class OIStrokeText extends OISymbolBase<SymbolType.StrokeText>
{
  readonly isClosed = false

  strokes: OIStroke[]
  decorators: OIDecorator[]

  baseline: number
  xHeight: number

  constructor(
    strokes: OIStroke[],
    lines: { baseline: number, xHeight: number },
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.StrokeText, style)
    this.strokes = strokes
    this.baseline = lines.baseline
    this.xHeight = lines.xHeight
    this.decorators = []
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

  overlaps(box: TBoundingBox): boolean
  {
    return this.strokes.some(s => s.overlaps(box))
  }

  containsStroke(strokeId: string): boolean
  {
    return this.strokes.some(s => s.id === strokeId)
  }

  removeStrokes(strokeIds: string[]): void
  {
    this.strokes = this.strokes.filter(s => !strokeIds.includes(s.id))
  }

  clone(): OIStrokeText
  {
    const clone = new OIStrokeText(this.strokes.map(s => s.clone()), { baseline: this.baseline, xHeight: this.xHeight }, structuredClone({ ...this.style }))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    return clone
  }

  toJSON(): PartialDeep<OIStrokeText>
  {
    return {
      id: this.id,
      type: this.type,
      baseline: this.baseline,
      xHeight: this.xHeight,
      strokes: JSON.parse(JSON.stringify(this.strokes)),
      decorators: this.decorators.length ? JSON.parse(JSON.stringify(this.decorators)) : undefined
    }
  }


  static create(partial: PartialDeep<OIStrokeText>): OIStrokeText
  {
    if (!partial.strokes?.length) {
      throw new Error(`no strokes`)
    }
    const strokes = partial.strokes.map(s => OIStroke.create(s!))
    const line = {
      baseline: partial.baseline || 0,
      xHeight: partial.xHeight || 0
    }
    const ws = new OIStrokeText(strokes, line, partial.style)

    if (partial.decorators?.length) {
      partial.decorators.forEach(d =>
      {
        if (d?.kind) {
          ws.decorators.push(new OIDecorator(d.kind, Object.assign({}, ws.style, d.style)))
        }
      })
    }
    if (partial.id) {
      ws.id = partial.id
    }
    return ws
  }
}
