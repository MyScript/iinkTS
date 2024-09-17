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
import { GestureManager } from "./GestureManager"

export class Synchronizer
{
  static instance: Synchronizer
  editor: Editor
  gestureManager: GestureManager
  processGestures: boolean = true
  updateDebounce?: ReturnType<typeof setTimeout>

  protected drawShapeToAdd: TLDrawShape[] = []
  protected drawShapeToUpdate: TLDrawShape[] = []
  protected drawShapeToRemove: TLDrawShape[] = []

  constructor(editor: Editor)
  {
    this.editor = editor
    this.gestureManager = new GestureManager(editor)
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
        stroke.addPointer({
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
    if (!gestureShape) return
    const othersPageShape = this.editor.getCurrentPageShapes().filter(s => s.id !== gestureShape.id && s.typeName === "shape" && s.type !== "draw")
    if(!othersPageShape.length) return

    const gestureBounds = this.editor.getShapePageBounds(gestureShape)!

    if (!othersPageShape.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))) {
      return
    }

    const gestureResult = await Recognizer.instance.recognizeGesture(this.formatDrawShapeToSend(gestureShape))
    if (gestureResult) {
      if (
        gestureResult.gestureType == "surround" &&
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
        gestureResult.gestureType == "scratch" &&
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
  async sync(changes: RecordsDiff<TLShape>): Promise<void>
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
      return
    }
    const recognizer = await useRecognizer()
    if (this.drawShapeToAdd.length) {
      const newDrawShapeCompleted = this.drawShapeToAdd.filter(s => s.props.isComplete)
      this.drawShapeToAdd = this.drawShapeToAdd.filter(s => !s.props.isComplete)
      if (newDrawShapeCompleted.length) {
        const gesture = this.processGestures && newDrawShapeCompleted.length === 1 ? await this.determinesContextlessGesture(newDrawShapeCompleted) : undefined
        recognizer.addStrokes(newDrawShapeCompleted.map(this.formatDrawShapeToSend), this.processGestures && !gesture && newDrawShapeCompleted.length === 1)
          .then(addStrokeResponse => {
            if (addStrokeResponse) {
              this.gestureManager.apply(addStrokeResponse)
            }
          })
        if (gesture) {
          await this.gestureManager.apply(gesture)
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
        await recognizer.replaceStrokes(newStrokes.map(s => s.id), newStrokes)
        updatePromise.resolve()
        this.drawShapeToUpdate = []
      }, 500)
      await updatePromise
    }

    if (this.drawShapeToRemove.length) {
      const promise = recognizer?.eraseStrokes(this.drawShapeToRemove.map(s => s.id))
      this.drawShapeToRemove = []
      await promise
    }
  }
}

export const useSynchronizer = (editor: Editor): Synchronizer =>
{
  if (!Synchronizer.instance) {
    Synchronizer.instance = new Synchronizer(editor)
  }
  return Synchronizer.instance
}
