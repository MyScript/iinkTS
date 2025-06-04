import { LoggerCategory, LoggerManager } from "../logger"
import { IIEraser, TSegment } from "../symbol"
import { SVGRenderer } from "../renderer"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { InkEditor } from "../editor"

/**
 * @group Manager
 */
export class EraseManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor | InkEditor

  currentEraser?: IIEraser

  constructor(editor: InteractiveInkEditor | InkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  attach(layer: HTMLElement): void
  {
    this.grabber.attach(layer)
    this.grabber.onPointerDown = this.start.bind(this)
    this.grabber.onPointerMove = this.continue.bind(this)
    this.grabber.onPointerUp = this.end.bind(this)
  }

  detach(): void
  {
    this.grabber.detach()
  }

  start(info: PointerInfo): void
  {
    this.#logger.info("startErase", { info })
    this.currentEraser = new IIEraser()
    this.currentEraser.pointers.push(info.pointer)
    this.renderer.drawSymbol(this.currentEraser!)
  }

  continue(info: PointerInfo): void
  {
    this.#logger.info("continueErase", { info })
    if (!this.currentEraser) {
      throw new Error("Can't update current eraser because currentEraser is undefined")
    }
    this.currentEraser.pointers.push(info.pointer)
    this.renderer.drawSymbol(this.currentEraser)
    const lastSeg: TSegment = {
      p1: this.currentEraser.pointers.at(-1)!,
      p2: this.currentEraser.pointers.at(-2)!
    }
    if (this.editor instanceof InteractiveInkEditor) {
      this.editor.model.symbols.forEach(s =>
      {
        if (s.isIntersected(lastSeg)) {
          s.deleting = true
          this.renderer.drawSymbol(s)
        }
      })
    }
    else {
      this.editor.model.strokes.forEach(s =>
      {
        if (s.isIntersected(lastSeg)) {
          s.deleting = true
          this.renderer.drawSymbol(s)
        }
      })
    }
  }

  async end(info: PointerInfo): Promise<void>
  {
    this.#logger.info("finishErasing", { info })
    this.continue(info)

    this.renderer.removeSymbol(this.currentEraser!.id)
    if (this.editor instanceof InteractiveInkEditor) {
      this.editor.removeSymbols(this.editor.model.symbolsToDelete.map(s => s.id))
    }
    else {
      this.editor.removeStrokes(this.editor.model.strokesToDelete.map(s => s.id))
    }
    this.currentEraser = undefined
  }
}
