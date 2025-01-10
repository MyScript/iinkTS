import { EditorOffscreen } from "../editor/EditorOffscreen"
import { OISVGRenderer } from "../renderer"

/**
 * @group Manager
 */
export class OIMoveManager
{
  editor: EditorOffscreen
  origin?: {
    left: number,
    top: number,
    x: number,
    y: number
  }

  constructor(editor: EditorOffscreen)
  {
    this.editor = editor
  }

  get renderer(): OISVGRenderer
  {
    return this.editor.renderer
  }

  start(evt: PointerEvent): void
  {
    this.origin = {
      left: this.renderer.parent.scrollLeft,
      top: this.renderer.parent.scrollTop,
      x: evt.clientX,
      y: evt.clientY,
    }
  }

  continue(evt: PointerEvent): void
  {
    if (!this.origin) {
      throw new Error("Can't move cause origin is undefined")
    }
    const dx = evt.clientX - this.origin.x
    const dy = evt.clientY - this.origin.y

    this.renderer.parent.scrollTop = this.origin.top - dy
    this.renderer.parent.scrollLeft = this.origin.left - dx
  }

  async end(evt: PointerEvent): Promise<void>
  {
    this.continue(evt)
    this.origin = undefined
  }
}
