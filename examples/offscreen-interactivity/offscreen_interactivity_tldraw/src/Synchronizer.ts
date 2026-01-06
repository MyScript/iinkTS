import
{
  Editor,
  RecordsDiff,
  TLDrawShape,
  TLRecord,
} from "tldraw"
import
{
  IIStroke,
  TStyle,
  TGesture
} from "iink-ts"
import
{
  Recognizer,
  useRecognizer
} from "./Recognizer"
import { GestureManager, useGestureManager } from "./GestureManager"

export class Synchronizer
{
  static instance: Synchronizer
  editor: Editor
  gestureManager: GestureManager
  processGestures: boolean = true
  updateDebounce?: ReturnType<typeof setTimeout>

  protected shapeSendedToRecognizer: Set<string> = new Set<string>()

  constructor(editor: Editor)
  {
    this.editor = editor
    this.gestureManager = useGestureManager(editor)
  }

  protected formatDrawShapeToSend(shape: TLDrawShape): IIStroke
  {

    const style: TStyle = {
      color: shape.props.color,
      fill: shape.props.fill,
      width: 1
    }
    const stroke = new IIStroke(style, shape.props.isPen ? "pen" : "mouse")
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
    const shapesTypeset = this.editor.getCurrentPageShapes().filter(s => s.id !== gestureShape.id && s.typeName === "shape" && s.type !== "draw")
    if(!shapesTypeset.length) return

    const gestureBounds = this.editor.getShapePageBounds(gestureShape)!

    if (!shapesTypeset.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))) {
      return
    }

    const gestureResult = await Recognizer.instance.recognizeGesture(this.formatDrawShapeToSend(gestureShape))
    if (gestureResult) {
      if (
        gestureResult.gestureType == "surround" &&
        shapesTypeset.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))
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
        shapesTypeset.some(s => gestureBounds.contains(this.editor.getShapePageBounds(s)!))
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
  async sync(changes: RecordsDiff<TLRecord>): Promise<void>
  {
    const drawShapesChanged = Object.values(changes.added).filter(r => r.typeName === "shape" && r.type === "draw").concat(Object.values(changes.updated).map(([_, to]) => to).filter(r => r.typeName === "shape" && r.type === "draw")) as TLDrawShape[]
    const drawShapesToRemove = Object.values(changes.removed).filter(r => r.typeName === "shape" && r.type === "draw") as TLDrawShape[]

    if (!drawShapesChanged.filter(s => s.props.isComplete).length && !drawShapesToRemove.length) {
      return
    }

    const serverConfiguration = JSON.parse(window.localStorage.getItem("server") || "{}") as Partial<import("iink-ts").TServerWebsocketConfiguration>
    const recognizer = Recognizer.instance || await useRecognizer(serverConfiguration)

    if (drawShapesChanged.length) {
      const drawShapeCompleted = drawShapesChanged.filter(s => s.props.isComplete)
      const toCreate = drawShapeCompleted.filter(s => !this.shapeSendedToRecognizer.has(s.id))
      const toUpdate = drawShapeCompleted.filter(s => this.shapeSendedToRecognizer.has(s.id))
 
      if (toCreate.length) {
        toCreate.map(s => this.shapeSendedToRecognizer.add(s.id))
        const gesture = this.processGestures && drawShapeCompleted.length === 1 ? await this.determinesContextlessGesture(toCreate) : undefined
        recognizer.addStrokes(toCreate.map(this.formatDrawShapeToSend), this.processGestures && !gesture && toCreate.length === 1)
          .then(addStrokeResponse => {
            if (addStrokeResponse) {
              this.gestureManager.apply(addStrokeResponse)
            }
          })
        if (gesture) {
          await this.gestureManager.apply(gesture)
        }
      }

      if (toUpdate.length) {
        clearTimeout(this.updateDebounce)
        this.updateDebounce = setTimeout(async () => {
          const newStrokes = toUpdate.map(shape =>
          {
            const matrix = this.editor.getShapePageTransform(shape.id)
            const points = matrix.applyToPoints(shape.props.segments.flatMap(seg => seg.points))

            const stroke = this.formatDrawShapeToSend(shape)
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
        })
      }
    }

    if (drawShapesToRemove.length) {
      await recognizer.eraseStrokes(drawShapesToRemove.map(s => s.id))
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
