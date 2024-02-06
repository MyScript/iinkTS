import
{
  Editor,
  TLDrawShape,
  TLShape,
  TLShapeId
} from "tldraw"
import { TGesture } from "iink-ts"

export class Gesture
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
    const surroundBounds = this.editor.getShapePageBounds(this.drawShapes.find(s => s.id === gesture.gestureStrokeId as TLShapeId) as TLShape)
    if (!surroundBounds) return

    const selectedShapes = this.editor.getCurrentPageShapes()
      .filter(s => s.id !== gesture.gestureStrokeId && surroundBounds.contains(this.editor.getShapePageBounds(s)!))

    this.editor.deleteShapes([gesture.gestureStrokeId as TLShapeId])
    if (selectedShapes.length) {
      this.editor.setSelectedShapes(selectedShapes)
      this.editor.setCurrentTool("select")
    }
  }

  protected async applyScratch(gesture: TGesture): Promise<void>
  {
    const surroundBounds = this.editor.getShapePageBounds(this.drawShapes.find(s => s.id === gesture.gestureStrokeId as TLShapeId) as TLShape)
    if (!surroundBounds) return

    const scratchedShapes = this.editor.getCurrentPageShapes()
      .filter(s => s.id !== gesture.gestureStrokeId && surroundBounds.contains(this.editor.getShapePageBounds(s)!))

    this.editor.deleteShapes([gesture.gestureStrokeId as TLShapeId])
    this.editor.deleteShapes(scratchedShapes.map(s => s.id) as TLShapeId[])
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
