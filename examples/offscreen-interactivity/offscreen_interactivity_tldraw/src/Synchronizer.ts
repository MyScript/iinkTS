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
  private pageShapesCache?: ReturnType<Editor["getCurrentPageShapes"]>
  private cacheTimestamp: number = 0
  private static readonly CACHE_DURATION = 500

  private pendingStrokes: TLDrawShape[] = []
  private batchDebounce?: ReturnType<typeof setTimeout>
  private static readonly BATCH_DELAY = 10

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

    const baseTime = Date.now()
    let pointIndex = 0

    shape.props.segments.forEach(seg =>
    {
      seg.points.forEach((p) =>
      {
        stroke.addPointer({
          p: 1,
          t: baseTime + pointIndex * 20,
          x: p.x + shape.x,
          y: p.y + shape.y
        })
        pointIndex++
      })
    })

    return stroke
  }

  private getPageShapesOptimized() {
    const now = Date.now()
    if (!this.pageShapesCache || now - this.cacheTimestamp > Synchronizer.CACHE_DURATION) {
      this.pageShapesCache = this.editor.getCurrentPageShapes()
      this.cacheTimestamp = now
    }
    return this.pageShapesCache
  }

  protected async determinesContextlessGesture(drawShapes: TLDrawShape[]): Promise<TGesture | undefined>
  {
    const gestureShape = drawShapes[0]
    if (!gestureShape) return
    const shapesTypeset = this.getPageShapesOptimized().filter(s => s.id !== gestureShape.id && s.typeName === "shape" && s.type !== "draw")
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

  private async sendBatchedStrokes(): Promise<void>
  {
    if (this.pendingStrokes.length === 0) return

    const strokesToSend = [...this.pendingStrokes]
    this.pendingStrokes = []

    const serverConfiguration = JSON.parse(window.localStorage.getItem("server") || "{}") as Partial<import("iink-ts").TServerWebsocketConfiguration>
    const recognizer = Recognizer.instance || await useRecognizer(serverConfiguration)

    const shouldDetectGesture = this.processGestures && strokesToSend.length === 1

    if (shouldDetectGesture) {
      this.determinesContextlessGesture(strokesToSend).then(gesture => {
        if (gesture) {
          this.gestureManager.apply(gesture)
        }
      })
    }

    recognizer.addStrokes(
      strokesToSend.map(this.formatDrawShapeToSend.bind(this)),
      shouldDetectGesture
    ).then(addStrokeResponse => {
      if (addStrokeResponse) {
        this.gestureManager.apply(addStrokeResponse)
      }
    })
  }

  async sync(changes: RecordsDiff<TLRecord>): Promise<void>
  {
    const allChangedRecords = Object.values(changes.added).concat(
      Object.values(changes.updated).map(([, to]) => to)
    )
    const drawShapesChanged = allChangedRecords.filter(
      r => r.typeName === "shape" && r.type === "draw"
    ) as TLDrawShape[]

    const drawShapesToRemove = Object.values(changes.removed).filter(
      r => r.typeName === "shape" && r.type === "draw"
    ) as TLDrawShape[]

    const completedShapes = drawShapesChanged.filter(s => s.props.isComplete)
    if (completedShapes.length === 0 && drawShapesToRemove.length === 0) {
      return
    }

    const serverConfiguration = JSON.parse(window.localStorage.getItem("server") || "{}") as Partial<import("iink-ts").TServerWebsocketConfiguration>
    const recognizer = Recognizer.instance || await useRecognizer(serverConfiguration)

    if (completedShapes.length > 0) {
      const toCreate = completedShapes.filter(s => !this.shapeSendedToRecognizer.has(s.id))
      const toUpdate = completedShapes.filter(s => this.shapeSendedToRecognizer.has(s.id))
 
      if (toCreate.length) {
        toCreate.forEach(s => this.shapeSendedToRecognizer.add(s.id))
        this.pendingStrokes.push(...toCreate)
        clearTimeout(this.batchDebounce)
        this.batchDebounce = setTimeout(() => {
          this.sendBatchedStrokes()
        }, Synchronizer.BATCH_DELAY)
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
          recognizer.replaceStrokes(newStrokes.map(s => s.id), newStrokes)
        }, 100)
      }
    }

    if (drawShapesToRemove.length) {
      drawShapesToRemove.forEach(s => this.shapeSendedToRecognizer.delete(s.id))
      recognizer.eraseStrokes(drawShapesToRemove.map(s => s.id))
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
