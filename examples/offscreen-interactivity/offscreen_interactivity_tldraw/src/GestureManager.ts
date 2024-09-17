import
{
  Editor,
  TLDrawShape,
  TLShapeId
} from "tldraw"
import { TGesture } from "iink-ts"

export class GestureManager
{
  editor: Editor

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
      this.editor.setSelectedShapes(selectedShapes)
      this.editor.setCurrentTool("select")
    }
    this.editor.deleteShape(gestureShape)
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

  async apply(gesture: TGesture): Promise<void>
  {
    switch (gesture.gestureType) {
      case "SCRATCH":
        return this.applyScratch(gesture)
      case "SURROUND":
        return this.applySurround(gesture)
      case "INSERT":
      case "JOIN":
      case "STRIKETHROUGH":
      case "UNDERLINE":
      default:
        break
    }
  }
}
