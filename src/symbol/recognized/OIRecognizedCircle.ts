import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { OIRecognizedBase, RecognizedKind } from "./OIRecognizedBase"
import { OIStroke } from "../OIStroke"

/**
 * @group Symbol
 */
export class OIRecognizedCircle extends OIRecognizedBase<RecognizedKind.Circle>
{
  readonly isClosed = true

  constructor(
    strokes: OIStroke[],
    style?: PartialDeep<TStyle>
  )
  {
    super(RecognizedKind.Circle, strokes, style)
  }

  clone(): OIRecognizedCircle
  {
    const clone = new OIRecognizedCircle(this.strokes.map(s => s.clone()), structuredClone({ ...this.style }))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIRecognizedCircle>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      strokes: JSON.parse(JSON.stringify(this.strokes)),
    }
  }

  static create(partial: PartialDeep<OIRecognizedCircle>): OIRecognizedCircle
  {
    if (!partial.strokes?.length) {
      throw new Error(`no strokes`)
    }
    const strokes = partial.strokes.map(s => OIStroke.create(s!))

    const ws = new OIRecognizedCircle(strokes, partial.style)

    if (partial.id) {
      ws.id = partial.id
    }
    return ws
  }
}
