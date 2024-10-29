import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { OIDecorator } from "../OIDecorator"
import { OIRecognizedBase, RecognizedKind } from "./OIRecognizedBase"
import { OIStroke } from "../OIStroke"

/**
 * @group Symbol
 */
export class OIRecognizedText extends OIRecognizedBase<RecognizedKind.Text>
{
  readonly isClosed = false

  decorators: OIDecorator[]

  baseline: number
  xHeight: number
  label?: string

  constructor(
    strokes: OIStroke[],
    lines: { baseline: number, xHeight: number },
    style?: PartialDeep<TStyle>
  )
  {
    super(RecognizedKind.Text, strokes, style)
    this.baseline = lines.baseline
    this.xHeight = lines.xHeight
    this.decorators = []
  }

  clone(): OIRecognizedText
  {
    const clone = new OIRecognizedText(this.strokes.map(s => s.clone()), { baseline: this.baseline, xHeight: this.xHeight }, structuredClone({ ...this.style }))
    clone.id = this.id
    clone.label = this.label
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    return clone
  }

  toJSON(): PartialDeep<OIRecognizedText>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      label: this.label,
      baseline: this.baseline,
      xHeight: this.xHeight,
      strokes: JSON.parse(JSON.stringify(this.strokes)),
      decorators: this.decorators.length ? JSON.parse(JSON.stringify(this.decorators)) : undefined
    }
  }

  static create(partial: PartialDeep<OIRecognizedText>): OIRecognizedText
  {
    if (!partial.strokes?.length) {
      throw new Error(`no strokes`)
    }
    const strokes = partial.strokes.map(s => OIStroke.create(s!))
    const line = {
      baseline: partial.baseline || 0,
      xHeight: partial.xHeight || 0
    }
    const ws = new OIRecognizedText(strokes, line, partial.style)

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
