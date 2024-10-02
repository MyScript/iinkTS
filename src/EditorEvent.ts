import { EditorTool } from "./Constants"
import { LoggerManager, LoggerClass } from "./logger"
import { TExport } from "./model"
import { TOISymbol, TSymbol } from "./primitive"
import { TUndoRedoContext } from "./history"

/**
 * @group Event
 * @description Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "EditorEventName" raised by using
 * ```ts
 * editor.event.addEventListener(EditorEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum EditorEventName
{
  /**
   * @description event emitted when history has changed i.e. the context of undo-redo
   */
  CHANGED = "changed",
  /**
   * @description event emitted when clearing is complete
   */
  CLEARED = "cleared",
  /**
   * @description event emitted after the conversion is complete
   */
  CONVERTED = "converted",
  /**
   * @description event emitted when the editor encounters an error
   */
  ERROR = "error",
  /**
   * @description event emitted on click on pointer events
   */
  POINTEREVENTS = "pointer_events",
  /**
   * @description event emitted after
   */
  NOTIF = "notif",
  /**
   * @description event emitted after the end of the export
   */
  EXPORTED = "exported",
  /**
   * @description event emitted after the end of the import
   */
  IMPORTED = "imported",
  /**
   * @description event emitted when the server is idle after a job
   */
  IDLE = "idle",
  /**
   * @description event emitted after full editor initialization
   */
  LOADED = "loaded",
  /**
   * @description event emitted after selection change
   */
  SELECTED = "selected",
  /**
   * @description event emitted after mode change
   */
  MODE = "mode"
}

/**
 * @group Event
 */
export class EditorEvent extends EventTarget
{
  #logger = LoggerManager.getLogger(LoggerClass.EDITOR_EVENT);
  protected abortController: AbortController
  protected element: Element

  constructor(element: Element)
  {
    super()
    this.#logger.info("constructor", { element })
    this.abortController = new AbortController()
    this.element = element
  }

  removeAllListeners(): void
  {
    this.#logger.info("removeAllListeners")
    this.abortController.abort()
    this.abortController = new AbortController()
  }


  protected emit(type: string, data?: unknown): void
  {
    const evt = new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined))
    this.dispatchEvent(evt)
    this.element?.dispatchEvent(evt)
  }

  emitLoaded(): void
  {
    this.#logger.info("emitLoaded")
    this.emit(EditorEventName.LOADED)
  }
  addLoadedListener(callback: () => void): void
  {
    this.#logger.info("addConvertListener", { callback })
    this.addEventListener(
      EditorEventName.LOADED,
      () => callback(),
      { signal: this.abortController.signal }
    )
  }

  emitNotif(notif: { message: string; timeout?: number }): void
  {
    this.#logger.info("emitWNotif", { notif })
    this.emit(EditorEventName.NOTIF, notif)
  }
  addNotifListener(callback: (notif: { message: string; timeout?: number }) => void): void
  {
    this.#logger.info("addNotifListener", { callback })
    this.addEventListener(
      EditorEventName.NOTIF,
      (evt: unknown) => callback((evt as CustomEvent).detail as { message: string; timeout?: number }),
      { signal: this.abortController.signal }
    )
  }

  emitError(err: Error): void
  {
    this.#logger.info("emitError", { err })
    this.emit(EditorEventName.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void
  {
    this.#logger.info("addErrorListener", { callback })
    this.addEventListener(
      EditorEventName.ERROR,
      (evt: unknown) => callback((evt as CustomEvent).detail as Error),
      { signal: this.abortController.signal }
    )
  }

  emitExported(exports: TExport): void
  {
    this.#logger.info("emitExported", { exports })
    this.emit(EditorEventName.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport) => void): void
  {
    this.#logger.info("addConvertListener", { callback })
    this.addEventListener(
      EditorEventName.EXPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitChanged(undoRedoContext: TUndoRedoContext): void
  {
    this.#logger.info("emitChanged", { undoRedoContext })
    this.emit(EditorEventName.CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty
    })
  }
  addChangedListener(callback: (context: TUndoRedoContext) => void): void
  {
    this.#logger.info("emitChanged", { callback })
    this.addEventListener(
      EditorEventName.CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TUndoRedoContext),
      { signal: this.abortController.signal }
    )
  }

  emitIdle(idle: boolean): void
  {
    this.#logger.info("emitIdle", { idle })
    this.emit(EditorEventName.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void
  {
    this.#logger.info("addIdleListener", { callback })
    this.addEventListener(
      EditorEventName.IDLE,
      (evt: unknown) => callback((evt as CustomEvent).detail as boolean),
      { signal: this.abortController.signal }
    )
  }

  emitCleared(): void
  {
    this.#logger.info("emitCleared")
    this.emit(EditorEventName.CLEARED)
  }
  addClearedListener(callback: () => void): void
  {
    this.#logger.info("addClearListener", { callback })
    this.addEventListener(
      EditorEventName.CLEARED,
      () => callback(),
      { signal: this.abortController.signal }
    )
  }

  emitConverted(exports: TExport): void
  {
    this.#logger.info("emitConverted", { exports })
    this.emit(EditorEventName.CONVERTED, exports)
  }
  addConvertedListener(callback: (exports: TExport) => void): void
  {
    this.#logger.info("addConvertListener", { callback })
    this.addEventListener(
      EditorEventName.CONVERTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitImported(exports: TExport): void
  {
    this.#logger.info("emitImported", { exports })
    this.emit(EditorEventName.IMPORTED, exports)
  }
  addImportedListener(callback: (exports: TExport) => void): void
  {
    this.#logger.info("addIdleListener", { callback })
    this.addEventListener(
      EditorEventName.IMPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitSelected(symbols: TSymbol[]): void
  {
    this.emit(EditorEventName.SELECTED, symbols)
  }
  addSelectedListener(callback: (symbols: TOISymbol[]) => void): void
  {
    this.#logger.info("addSelectedListener", { callback })
    this.addEventListener(
      EditorEventName.SELECTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TOISymbol[]),
      { signal: this.abortController.signal }
    )
  }

  emitTool(mode: EditorTool): void
  {
    this.emit(EditorEventName.MODE, mode)
  }
  addToolListener(callback: (mode: EditorTool) => void): void
  {
    this.#logger.info("addSelectedListener", { callback })
    this.addEventListener(
      EditorEventName.MODE,
      (evt: unknown) => callback((evt as CustomEvent).detail as EditorTool),
      { signal: this.abortController.signal }
    )
  }
}
