import
{
  Editor,
  TLDrawShape,
  TLShape,
  TLShapeId
} from "tldraw"
import
{
  DeferredPromise,
  OIStroke,
  TStyle,
  TGesture
} from "iink-ts"
import
{
  Recognizer
} from "./Recognizer"
import { Gesture } from "./Gesture"

export class Synchronizer
{
  static instance: Synchronizer
  editor: Editor
  recognizer: Recognizer
  gesture: Gesture
  updateDebounce?: ReturnType<typeof setTimeout>

  protected drawShapeToAdd: TLDrawShape[] = []
  protected drawShapeToUpdate: TLDrawShape[] = []
  protected drawShapeToRemove: TLDrawShape[] = []

  constructor(editor: Editor, recognizer: Recognizer)
  {
    this.editor = editor
    this.recognizer = recognizer
    this.gesture = new Gesture(editor)
  }

  protected formatDrawShapeToSend(shape: TLDrawShape): OIStroke
  {

    const style: TStyle = {
      color: shape.props.color,
      fill: shape.props.fill,
      width: 1
    }
    const stroke = new OIStroke(style, shape.props.isPen ? "pen" : "mouse")
    stroke.id = shape.id

    shape.props.segments.forEach(seg =>
    {
      seg.points.forEach((p, i) =>
      {
        stroke.pointers.push({
          p: 1,
          t: Date.now() + i * 20,
          x: p.x + shape.x,
          y: p.y + shape.y
        })
      })
    })

    return stroke
  }

  protected async determinesContextlessGesture(drawShapes: TLDrawShape[]): Promise<TGesture | undefined>
  {
    const gestureShape = drawShapes[0]
    const othersPageShape = this.editor.getCurrentPageShapes().filter(s => s.id !== gestureShape.id)
    if (!gestureShape || !othersPageShape.length) return

    const gestureBounds = this.editor.getShapePageBounds(gestureShape)!

    if (!othersPageShape.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))) {
      return
    }

    const gestureResult = await this.recognizer.recognizeGesture(drawShapes.map(this.formatDrawShapeToSend))
    if (gestureResult) {
      if (
        gestureResult.gestures[0].type.toLocaleLowerCase() == "surround" &&
        othersPageShape.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))
      ) {
        return {
          gestureStrokeId: gestureShape.id,
          gestureType: "SURROUND",
          strokeIds: [],
          strokeBeforeIds: [],
          strokeAfterIds: []
        }
      }
      else if (
        gestureResult.gestures[0].type.toLocaleLowerCase() == "scratch" &&
        othersPageShape.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))
      ) {
        return {
          gestureStrokeId: gestureShape.id,
          gestureType: "SCRATCH",
          strokeIds: [],
          strokeBeforeIds: [],
          strokeAfterIds: []
        }
      }
    }
    return
  }

  //@ts-ignore
  async sync(changes: RecordsDiff<TLShape>): Promise<TExport>
  {
    for (const record of Object.values((changes.added as Record<TLShapeId, TLShape>))) {
      if (record.typeName === 'shape') {
        if (record.type === 'draw') {
          this.drawShapeToAdd.push(record as TLDrawShape)
        }
      }
    }
    for (const [_, to] of Object.values(changes.updated as [TLDrawShape, TLDrawShape][])) {
      if (to.typeName === 'shape') {
        if (to.type === 'draw') {
          const shape = to as TLDrawShape
          const newShape = this.drawShapeToAdd.find(s => s.id === shape.id)
          if (newShape) {
            const index = this.drawShapeToAdd.findIndex(s => s.id === shape.id)
            this.drawShapeToAdd.splice(index, 1, shape)
          }
          else {
            const index = this.drawShapeToUpdate.findIndex(s => s.id === shape.id)
            if (index > -1) {
              this.drawShapeToUpdate[index] = shape
            } else {
              this.drawShapeToUpdate.push(shape)
            }
          }
        }
      }
    }
    for (const record of Object.values(changes.removed as Record<TLShapeId, TLShape>)) {
      if (record.typeName === 'shape') {
        if (record.type === 'draw') {
          this.drawShapeToRemove.push(record as TLDrawShape)
        }
      }
    }

    if (!this.drawShapeToAdd.filter(s => s.props.isComplete).length && !this.drawShapeToUpdate.length && !this.drawShapeToRemove.length) {
      return false
    }

    if (this.drawShapeToAdd.length) {
      const newDrawShapeCompleted = this.drawShapeToAdd.filter(s => s.props.isComplete)
      this.drawShapeToAdd = this.drawShapeToAdd.filter(s => !s.props.isComplete)
      if (newDrawShapeCompleted.length) {
        let gesture = await this.determinesContextlessGesture(newDrawShapeCompleted)
        const addStrokeResult = await this.recognizer.addStrokes(newDrawShapeCompleted.map(this.formatDrawShapeToSend), !gesture)
        if (!gesture) {
          gesture = addStrokeResult
        }
        if (gesture) {
          await this.gesture.apply(gesture)
        }
      }
    }

    if (this.drawShapeToUpdate.length) {
      clearTimeout(this.updateDebounce)
      const updatePromise = new DeferredPromise<void>()
      this.updateDebounce = setTimeout(async () =>
      {
        const newStrokes = this.drawShapeToUpdate.map(shape =>
        {
          const stroke = this.formatDrawShapeToSend(shape)
          let points = shape.props.segments.flatMap(seg => seg.points)

          const matrix = this.editor.getShapePageTransform(shape.id)
          if (matrix) {
            points = matrix.applyToPoints(points)
          }
          stroke.pointers = points.map((p, i) =>
          {
            return {
              p: 1,
              t: Date.now() + i,
              x: p.x,
              y: p.y
            }
          })
          return stroke
        })
        await this.recognizer.replaceStrokes(newStrokes.map(s => s.id), newStrokes)
        updatePromise.resolve()
        this.drawShapeToUpdate = []
      }, 500)
      await updatePromise
    }

    if (this.drawShapeToRemove.length) {
      const promise = this.recognizer?.eraseStrokes(this.drawShapeToRemove.map(s => s.id))
      this.drawShapeToRemove = []
      await promise
    }

    return Recognizer.instance.export(['application/vnd.myscript.jiix', 'text/html'])
  }
}

export const useSynchronizer = (editor: Editor, recognizer: Recognizer): Synchronizer =>
{
  if (!Synchronizer.instance) {
    Synchronizer.instance = new Synchronizer(editor, recognizer)
  }
  return Synchronizer.instance
}
