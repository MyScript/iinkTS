import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import
{
  TIISymbol,
  TPointer,
} from "../symbol"
import { SVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { InkEditor } from "../editor"


/**
 * @group Manager
 */
export abstract class AbstractWriteManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor | InkEditor

  detectGesture: boolean = true

  constructor(editor: InteractiveInkEditor | InkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
    this.grabber = new PointerEventGrabber(editor.configuration.grabber)
  }

  get model(): IIModel
  {
    return this.editor.model
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

  protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol
  protected abstract updateCurrentSymbol(pointer: TPointer): TIISymbol

  start(info: PointerInfo): void
  {
    this.#logger.info("startWriting", { info })
    const localPointer = info.pointer
    this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  continue(info: PointerInfo): void
  {
    this.#logger.info("continueWriting", { info })
    const localPointer = info.pointer
    this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.model.currentSymbol!)
  }

  abstract end(info: PointerInfo): Promise<void>
}
