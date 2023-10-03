import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TExport, TJIIXExport } from "../@types/model/Model"
import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { InternalEventType } from "../Constants"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class InternalEvent extends EventTarget
{
  static #instance: InternalEvent
  #abortController: AbortController
  #logger: Logger

  private constructor()
  {
    super()
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.INTERNALEVENT)
    this.#logger.info("constructor", { })
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
    this.#logger.info("removeAllListeners", { })
    this.#abortController.abort()
  }

  #emit(type: string, data?: unknown): void
  {
    this.dispatchEvent(new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)))
  }

  emitSVGPatch(patchChange: TWebSocketSVGPatchEvent): void
  {
    this.#logger.info("emitSVGPatch", { patchChange })
    this.#emit(InternalEventType.SVG_PATCH, patchChange)
  }
  addSVGPatchListener(callback: (contentChange: TWebSocketSVGPatchEvent) => void): void
  {
    this.#logger.info("addSVGPatchListener", { callback })
    this.addEventListener(InternalEventType.SVG_PATCH, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketSVGPatchEvent)), { signal: this.#abortController.signal })
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
    this.#logger.info("emitClearMessage", { })
    this.#emit(InternalEventType.CLEAR_MESSAGE)
  }
  addClearMessageListener(callback: () => void): void
  {
    this.#logger.info("addClearMessageListener", { callback })
    this.addEventListener(InternalEventType.CLEAR_MESSAGE, () => callback(), { signal: this.#abortController.signal })
  }

  emitError(err: Error): void
  {
    this.#logger.error("emitError", { err })
    this.#emit(InternalEventType.ERROR, err)
  }

  addErrorListener(callback: (err: Error) => void): void
  {
    this.addEventListener(InternalEventType.ERROR, (evt: unknown) => callback(((evt as CustomEvent).detail as Error)), { signal: this.#abortController.signal })
  }

  emitWSClosed(): void
  {
    this.#logger.info("emitWSClosed", { })
    this.#emit(InternalEventType.WS_CLOSED)
  }
  addWSClosedListener(callback: () => void): void
  {
    this.addEventListener(InternalEventType.WS_CLOSED, () => callback(), { signal: this.#abortController.signal })
  }

  emitNotif(notif: { message: string, timeout?: number }): void
  {
    this.#logger.info("emitWNotif", { notif })
    this.#emit(InternalEventType.NOTIF, notif)
  }
  addNotifListener(callback: (notif: { message: string, timeout?: number }) => void): void
  {
    this.addEventListener(InternalEventType.NOTIF, (evt: unknown) => callback(((evt as CustomEvent).detail as { message: string, timeout?: number })), { signal: this.#abortController.signal })
  }

  emitImportJIIX(jiix: TJIIXExport): void
  {
    this.#logger.info("emitImportJIIX", { jiix })
    this.#emit(InternalEventType.IMPORT_JIIX, jiix)
  }
  addImportJIIXListener(callback: (jiix: TJIIXExport) => void): void
  {
    this.addEventListener(InternalEventType.IMPORT_JIIX, (evt: unknown) => callback(((evt as CustomEvent).detail as TJIIXExport)), { signal: this.#abortController.signal })
  }

  emitConvert(conversionState: TConverstionState = "DIGITAL_EDIT"): void
  {
    this.#logger.info("emitConvert", { conversionState })
    this.#emit(InternalEventType.CONVERT, conversionState)
  }
  addConvertListener(callback: (params?: { conversionState?: TConverstionState, mimeTypes?: string[] }) => void): void
  {
    this.addEventListener(InternalEventType.CONVERT, (evt: unknown) => callback(((evt as CustomEvent).detail as { conversionState?: TConverstionState, mimeTypes?: string[] })), { signal: this.#abortController.signal })
  }

  emitClear(): void
  {
    this.#logger.info("emitClear", { })
    this.#emit(InternalEventType.CLEAR)
  }
  addClearListener(callback: () => void): void
  {
    this.addEventListener(InternalEventType.CLEAR, () => callback(), { signal: this.#abortController.signal })
  }

  emitContextChange(context: TUndoRedoContext): void
  {
    this.#logger.info("emitContextChange", { context })
    this.#emit(InternalEventType.CONTEXT_CHANGE, context)
  }
  addContextChangeListener(callback: (context: TUndoRedoContext) => void): void
  {
    this.addEventListener(InternalEventType.CONTEXT_CHANGE, (evt: unknown) => callback(((evt as CustomEvent).detail as TUndoRedoContext)), { signal: this.#abortController.signal })
  }

  emitIdle(idle: boolean): void
  {
    this.#logger.info("emitIdle", { idle })
    this.#emit(InternalEventType.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void
  {
    this.addEventListener(InternalEventType.IDLE, (evt: unknown) => callback(((evt as CustomEvent).detail as boolean)), { signal: this.#abortController.signal })
  }
}
