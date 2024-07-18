import { Intention } from "../Constants"
import { TConverstionState } from "../configuration"
import { LoggerManager, LoggerClass } from "../logger"
import { TExport, TJIIXExport } from "../model"
import { TOISymbol } from "../primitive"
import { TWSMessageEventSVGPatch } from "../recognizer"
import { TUndoRedoContext } from "../history"


/**
 * @group Event
 * @description Lists all internal library events
 * @example
 * You can run code on "EventType" raised by using
 * ```ts
 * editor.internalEvents.addEventListener(InternalEventType.SVG_PATCH, (evt) => console.log(evt.detail))
 * ```
 */
export enum InternalEventType {
  SVG_PATCH = "internal_svg_patch",
  EXPORTED = "internal_exported",
  CLEAR_MESSAGE = "internal_clear_message",
  ERROR = "internal_error",
  NOTIF = "internal_notif",
  IMPORT_JIIX = "internal_import_jiix",
  CONVERT = "internal_convert",
  CLEAR = "internal_clear",
  CONTEXT_CHANGE = "internal_context_change",
  IDLE = "internal_idle",
  SELECTED = "internal_selected",
  INTENTION = "internal_intention",
}

/**
 * @group Event
 */
export class InternalEvent extends EventTarget
{
  static #instance: InternalEvent
  #abortController: AbortController
  #logger = LoggerManager.getLogger(LoggerClass.INTERNAL_EVENT)

  private constructor()
  {
    super()
    this.#logger.info("constructor")
    this.#abortController = new AbortController()
  }

  public static getInstance(): InternalEvent
  {
    if (!InternalEvent.#instance) {
      InternalEvent.#instance = new InternalEvent()
    }

    return InternalEvent.#instance
  }

  removeAllListeners(): void
  {
    this.#logger.info("removeAllListeners")
    this.#abortController.abort()
    this.#abortController = new AbortController()
  }

  #emit(type: string, data?: unknown): void
  {
    this.dispatchEvent(new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)))
  }

  emitSVGPatch(patchChange: TWSMessageEventSVGPatch): void
  {
    this.#logger.info("emitSVGPatch", { patchChange })
    this.#emit(InternalEventType.SVG_PATCH, patchChange)
  }
  addSVGPatchListener(callback: (contentChange: TWSMessageEventSVGPatch) => void): void
  {
    this.#logger.info("addSVGPatchListener", { callback })
    this.addEventListener(InternalEventType.SVG_PATCH, (evt: unknown) => callback(((evt as CustomEvent).detail as TWSMessageEventSVGPatch)), { signal: this.#abortController.signal })
  }

  emitExported(exports: TExport): void
  {
    this.#logger.info("emitExported", { exports })
    this.#emit(InternalEventType.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport) => void): void
  {
    this.#logger.info("addExportedListener", { callback })
    this.addEventListener(InternalEventType.EXPORTED, (evt: unknown) => callback(((evt as CustomEvent).detail as TExport)), { signal: this.#abortController.signal })
  }

  emitClearMessage(): void
  {
    this.#logger.info("emitClearMessage")
    this.#emit(InternalEventType.CLEAR_MESSAGE)
  }
  addClearMessageListener(callback: () => void): void
  {
    this.#logger.info("addClearMessageListener", { callback })
    this.addEventListener(InternalEventType.CLEAR_MESSAGE, () => callback(), { signal: this.#abortController.signal })
  }

  emitError(err: Error): void
  {
    this.#logger.info("emitError", { err })
    this.#emit(InternalEventType.ERROR, err)
  }

  addErrorListener(callback: (err: Error) => void): void
  {
    this.#logger.info("addErrorListener", { callback })
    this.addEventListener(InternalEventType.ERROR, (evt: unknown) => callback(((evt as CustomEvent).detail as Error)), { signal: this.#abortController.signal })
  }

  emitNotif(notif: { message: string, timeout?: number }): void
  {
    this.#logger.info("emitWNotif", { notif })
    this.#emit(InternalEventType.NOTIF, notif)
  }
  addNotifListener(callback: (notif: { message: string, timeout?: number }) => void): void
  {
    this.#logger.info("addNotifListener", { callback })
    this.addEventListener(InternalEventType.NOTIF, (evt: unknown) => callback(((evt as CustomEvent).detail as { message: string, timeout?: number })), { signal: this.#abortController.signal })
  }

  emitImportJIIX(jiix: TJIIXExport): void
  {
    this.#logger.info("emitImportJIIX", { jiix })
    this.#emit(InternalEventType.IMPORT_JIIX, jiix)
  }
  addImportJIIXListener(callback: (jiix: TJIIXExport) => void): void
  {
    this.#logger.info("addImportJIIXListener", { callback })
    this.addEventListener(InternalEventType.IMPORT_JIIX, (evt: unknown) => callback(((evt as CustomEvent).detail as TJIIXExport)), { signal: this.#abortController.signal })
  }

  emitConvert(conversionState: TConverstionState = "DIGITAL_EDIT"): void
  {
    this.#logger.info("emitConvert", { conversionState })
    this.#emit(InternalEventType.CONVERT, conversionState)
  }
  addConvertListener(callback: (params?: { conversionState?: TConverstionState, mimeTypes?: string[] }) => void): void
  {
    this.#logger.info("addConvertListener", { callback })
    this.addEventListener(InternalEventType.CONVERT, (evt: unknown) => callback(((evt as CustomEvent).detail as { conversionState?: TConverstionState, mimeTypes?: string[] })), { signal: this.#abortController.signal })
  }

  emitClear(): void
  {
    this.#logger.info("emitClear")
    this.#emit(InternalEventType.CLEAR)
  }
  addClearListener(callback: () => void): void
  {
    this.#logger.info("addClearListener", { callback })
    this.addEventListener(InternalEventType.CLEAR, () => callback(), { signal: this.#abortController.signal })
  }

  emitContextChange(context: TUndoRedoContext): void
  {
    this.#logger.info("emitContextChange", { context })
    this.#emit(InternalEventType.CONTEXT_CHANGE, context)
  }
  addContextChangeListener(callback: (context: TUndoRedoContext) => void): void
  {
    this.#logger.info("addContextChangeListener", { callback })
    this.addEventListener(InternalEventType.CONTEXT_CHANGE, (evt: unknown) => callback(((evt as CustomEvent).detail as TUndoRedoContext)), { signal: this.#abortController.signal })
  }

  emitIdle(idle: boolean): void
  {
    this.#logger.info("emitIdle", { idle })
    this.#emit(InternalEventType.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void
  {
    this.#logger.info("addIdleListener", { callback })
    this.addEventListener(InternalEventType.IDLE, (evt: unknown) => callback(((evt as CustomEvent).detail as boolean)), { signal: this.#abortController.signal })
  }

  emitSelected(symbols: TOISymbol[]): void
  {
    this.#emit(InternalEventType.SELECTED, symbols)
  }
  addSelectedListener(callback: (symbols: TOISymbol[]) => void): void
  {
    this.#logger.info("addSelectedListener", { callback })
    this.addEventListener(InternalEventType.SELECTED, (evt: unknown) => callback(((evt as CustomEvent).detail as TOISymbol[])), { signal: this.#abortController.signal })
  }

  emitIntention(intention: Intention): void
  {
    this.#emit(InternalEventType.INTENTION, intention)
  }
  addIntentionListener(callback: (intention: Intention) => void): void
  {
    this.#logger.info("addSelectedListener", { callback })
    this.addEventListener(InternalEventType.INTENTION, (evt: unknown) => callback(((evt as CustomEvent).detail as Intention)), { signal: this.#abortController.signal })
  }
}
