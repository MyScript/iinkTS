import
{
  Editor,
  TLDrawShape,
  TLShapeId
} from "tldraw"
import { TGesture } from "iink-ts"

export class GestureManager
{
  static instance: GestureManager

  editor: Editor
  onUnderline: "draw" | "size" = "size"
  onStrikethrough: "draw" | "erase" = "erase"

  constructor(editor: Editor)
  {
    this.editor = editor
  }

  get drawShapes(): TLDrawShape[]
  {
    return this.editor.getCurrentPageShapes().filter(s => s.type === "draw") as TLDrawShape[]
  }

  protected async applySurround(gesture: TGesture): Promise<void>
  {
    const gestureShape = this.editor.getCurrentPageShapes().find(s => s.id === gesture.gestureStrokeId)
    const othersPageShape = this.editor.getCurrentPageShapes().filter(s => s.id !== gesture.gestureStrokeId)
    if (!gestureShape || !othersPageShape.length) return

    const surroundBounds = this.editor.getShapePageBounds(gestureShape)
    if (!surroundBounds) return

    const selectedShapes = othersPageShape.filter(s => surroundBounds.contains(this.editor.getShapePageBounds(s)!))

    if (selectedShapes.length) {
      this.editor.setCurrentTool('select')
      this.editor.setSelectedShapes(selectedShapes)
      this.editor.deleteShape(gestureShape)
    }
  }

  protected async applyScratch(gesture: TGesture): Promise<void>
  {
    const gestureShape = this.editor.getCurrentPageShapes().find(s => s.id === gesture.gestureStrokeId)
    const othersPageShape = this.editor.getCurrentPageShapes().filter(s => s.id !== gesture.gestureStrokeId)
    if (!gestureShape || !othersPageShape.length) return

    const surroundBounds = this.editor.getShapePageBounds(gestureShape)
    if (!surroundBounds) return

    const scratchedShapes = othersPageShape.filter(s => surroundBounds.contains(this.editor.getShapePageBounds(s)!))

    if (scratchedShapes.length) {
      this.editor.deleteShapes([gesture.gestureStrokeId, ...scratchedShapes.map(s => s.id)] as TLShapeId[])
    }
  }

  protected async applyUnderline(gesture: TGesture): Promise<void>
  {
    const gestureShape = this.editor.getCurrentPageShapes().find(s => s.id === gesture.gestureStrokeId)
    const shapeToApplyGesture = this.editor.getCurrentPageShapes().filter(s => gesture.strokeIds.includes(s.id)) as TLDrawShape[]
    if (!gestureShape || !shapeToApplyGesture.length) return

    if (this.onUnderline === "size") {
      const size = ["s", "m", "l", "xl"]
      const mapToUpdate: TLDrawShape[] = []
      shapeToApplyGesture.forEach(s =>
      {
        const currentSizeIndex = size.indexOf(s.props.size)
        mapToUpdate.push({
          ...s,
          props: {
            ...s.props,
            size: size[Math.min(currentSizeIndex + 1, size.length - 1)] as "s" | "m" | "l" | "xl"
          }
        })
      })

      if (mapToUpdate.length) {
        this.editor.run(() =>
        {
          this.editor.deleteShape(gestureShape)
          this.editor.updateShapes(mapToUpdate)
        })
      }
    }
  }

  protected async applyStrikeThrough(gesture: TGesture): Promise<void>
  {
    if (this.onStrikethrough === "erase") {
      const gestureShape = this.editor.getCurrentPageShapes().find(s => s.id === gesture.gestureStrokeId)
      const drawShapeToApplyGesture = this.editor.getCurrentPageShapes().filter(s => gesture.strokeIds.includes(s.id)) as TLDrawShape[]
      if (!gestureShape || !drawShapeToApplyGesture.length) return

      this.editor.deleteShapes([gestureShape, ...drawShapeToApplyGesture])
    }
  }

  async apply(gesture: TGesture): Promise<void>
  {
    switch (gesture.gestureType) {
      case "SCRATCH":
        return this.applyScratch(gesture)
      case "SURROUND":
        return this.applySurround(gesture)
      case "STRIKETHROUGH":
        this.applyStrikeThrough(gesture)
        break
      case "UNDERLINE":
        this.applyUnderline(gesture)
        break
      case "INSERT":
      case "JOIN":
          break
      default:
        break
    }
  }
}

export const useGestureManager = (editor: Editor): GestureManager =>
{
  if (!GestureManager.instance) {
    GestureManager.instance = new GestureManager(editor)
  }
  return GestureManager.instance
}
