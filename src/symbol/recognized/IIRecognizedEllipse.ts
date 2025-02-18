import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { IIRecognizedBase, RecognizedKind } from "./IIRecognizedBase"
import { IIStroke } from "../IIStroke"

/**
 * @group Symbol
 */
export class IIRecognizedEllipse extends IIRecognizedBase<RecognizedKind.Ellipse>
{
  readonly isClosed = true

  constructor(
    strokes: IIStroke[],
    style?: PartialDeep<TStyle>
  )
  {
    super(RecognizedKind.Ellipse, strokes, style)
  }

  clone(): IIRecognizedEllipse
  {
    const clone = new IIRecognizedEllipse(this.strokes.map(s => s.clone()), structuredClone({ ...this.style }))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIRecognizedEllipse>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      strokes: JSON.parse(JSON.stringify(this.strokes)),
    }
  }

  static create(partial: PartialDeep<IIRecognizedEllipse>): IIRecognizedEllipse
  {
    if (!partial.strokes?.length) {
      throw new Error(`no strokes`)
    }
    const strokes = partial.strokes.map(s => IIStroke.create(s!))

    const ws = new IIRecognizedEllipse(strokes, partial.style)

    if (partial.id) {
      ws.id = partial.id
    }
    return ws
  }
}
