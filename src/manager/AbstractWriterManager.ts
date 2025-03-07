import { LoggerCategory, LoggerManager } from "../logger"
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
export abstract class AbstractWriterManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.WRITE)
  grabber: PointerEventGrabber
  editor: InteractiveInkEditor | InkEditor
  currentSymbol?: TIISymbol

  detectGesture: boolean = true

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

  protected abstract createCurrentSymbol(pointer: TPointer, style: TStyle, pointerType: string): TIISymbol
  protected abstract updateCurrentSymbol(pointer: TPointer): TIISymbol

  start(info: PointerInfo): void
  {
    this.#logger.info("startWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.createCurrentSymbol(localPointer, this.editor.penStyle, info.pointerType)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  continue(info: PointerInfo): void
  {
    this.#logger.info("continueWriting", { info })
    const localPointer = info.pointer
    this.currentSymbol = this.updateCurrentSymbol(localPointer)
    this.renderer.drawSymbol(this.currentSymbol!)
  }

  abstract end(info: PointerInfo): Promise<void>
}
