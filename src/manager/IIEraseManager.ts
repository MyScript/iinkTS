import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { IIEraser, TSegment } from "../symbol"
import { IISVGRenderer } from "../renderer"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../grabber"

/**
 * @group Manager
 */
export class IIEraseManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor

  currentEraser?: IIEraser

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get renderer(): IISVGRenderer
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
    this.model.symbols.forEach(s => {
      if (s.isIntersected(lastSeg))
      {
        s.deleting = true
      }
    })
    this.model.symbolsToDelete.map(s => this.renderer.drawSymbol(s))
  }

  async end(info: PointerInfo): Promise<void>
  {
    this.#logger.info("finishErasing", { info })
    this.continue(info)

    this.renderer.removeSymbol(this.currentEraser!.id)
    this.editor.removeSymbols(this.model.symbolsToDelete.map(s => s.id))
    this.currentEraser = undefined
  }
}
