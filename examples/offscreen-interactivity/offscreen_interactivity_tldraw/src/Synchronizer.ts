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
  Recognizer,
  useRecognizer
} from "./Recognizer"
import { Gesture } from "./Gesture"

export class Synchronizer
{
  static instance: Synchronizer
  editor: Editor
  recognizer!: Recognizer
  gesture: Gesture
  updateDebounce?: ReturnType<typeof setTimeout>

  protected drawShapeToAdd: TLDrawShape[] = []
  protected drawShapeToUpdate: TLDrawShape[] = []
  protected drawShapeToRemove: TLDrawShape[] = []

  constructor(editor: Editor)
  {
    this.editor = editor
    this.gesture = new Gesture(editor)
  }

  protected formatDrawShapeToSend(shape: TLDrawShape): OIStroke
  {

    const style: TStyle = {
      color: shape.props.color,
      fill: shape.props.fill,
      width: 1
    }
    const stroke = new OIStroke(style, 1, shape.props.isPen ? "pen" : "mouse")
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

  //@ts-ignore
  async sync(changes: RecordsDiff<TLShape>): Promise<boolean>
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

    if (!this.recognizer) {
      this.recognizer = await useRecognizer()
    }

    if (this.drawShapeToAdd.length) {
      const newDrawShapeCompleted = this.drawShapeToAdd.filter(s => s.props.isComplete)
      this.drawShapeToAdd = this.drawShapeToAdd.filter(s => !s.props.isComplete)
      if (newDrawShapeCompleted.length) {
        let gesture: TGesture | undefined

        const gestureResult = await this.recognizer.recognizeGesture(newDrawShapeCompleted.map(this.formatDrawShapeToSend))
        if (gestureResult) {
          const gestureBounds = this.editor.getShapePageBounds(newDrawShapeCompleted[0])!
          if (
            gestureResult.gestures[0].type.toLocaleLowerCase() == "surround" &&
            this.editor.getCurrentPageShapes().some(s => s.id !== newDrawShapeCompleted[0].id && gestureBounds.collides(this.editor.getShapePageBounds(s)!))
          ) {
            gesture = {
              gestureStrokeId: newDrawShapeCompleted[0].id,
              gestureType: "SURROUND",
              strokeIds: [],
              strokeBeforeIds: [],
              strokeAfterIds: []
            }
          }
          else if (
            gestureResult.gestures[0].type.toLocaleLowerCase() == "scratch" &&
            this.editor.getCurrentPageShapes().some(s => s.id !== newDrawShapeCompleted[0].id && gestureBounds.collides(this.editor.getShapePageBounds(s)!))
          ) {
            gesture = {
              gestureStrokeId: newDrawShapeCompleted[0].id,
              gestureType: "SCRATCH",
              strokeIds: [],
              strokeBeforeIds: [],
              strokeAfterIds: []
            }
          }
        }

        const addStrokeResult = await this.recognizer.addStrokes(newDrawShapeCompleted.map(this.formatDrawShapeToSend), newDrawShapeCompleted.length < 2)
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
    await this.recognizer.waitForIdle()
    return true
  }
}

export const useSynchronizer = (editor: Editor): Synchronizer =>
{
  if (!Synchronizer.instance) {
    Synchronizer.instance = new Synchronizer(editor)
  }
  return Synchronizer.instance
}
