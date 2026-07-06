import type { EditorTool } from "@/Constants"
import type { THistoryContext } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TGestureType } from "@/manager"
import type { TExport, TExportV2 } from "@/model"
import type { TConnectionStatus } from "@/recognizer"
import type { TBaseSymbol, TStroke, TSymbol } from "@/symbol"

/**
 * @group Editor
 * @remarks Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "EditorEventName" raised by using
 * ```ts
 * editor.event.addEventListener(EditorEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum EditorEventName {
  /**
   * @remarks event emitted when history has changed i.e. the context of undo-redo
   */
  CHANGED = "changed",
  /**
   * @remarks event emitted when clearing is complete
   */
  CLEARED = "cleared",
  /**
   * @remarks event emitted after the conversion is complete
   */
  CONVERTED = "converted",
  /**
   * @remarks event emitted when the editor encounters an error
   */
  ERROR = "error",
  /**
   * @remarks event emitted on click on pointer events
   */
  POINTEREVENTS = "pointer_events",
  /**
   * @remarks event emitted after
   */
  NOTIF = "notif",
  /**
   * @remarks event emitted after the end of the export
   */
  EXPORTED = "exported",
  /**
   * @remarks event emitted after the end of the import
   */
  IMPORTED = "imported",
  /**
   * @remarks event emitted when the server is idle after a job
   */
  IDLE = "idle",
  /**
   * @remarks event emitted after full editor initialization
   */
  LOADED = "loaded",
  /**
   * @remarks event emitted session opened
   */
  SESSION_OPENED = "session-opened",
  /**
   * @remarks event emitted after selection change
   */
  SELECTED = "selected",
  /**
   * @remarks event emitted after tool change
   */
  TOOL_CHANGED = "tool-changed",
  /**
   * @remarks event emitted after mode change
   */
  UI_UPDATED = "ui-updated",
  /**
   * @remarks event emitted after stroke synchronized with jiix
   */
  SYNCHRONIZED = "synchronized",
  /**
   * @remarks event emitted after applying a gesture
   */
  GESTURED = "gestured",
  /**
   * @remarks event emitted when the connection status changes (e.g. going offline while queueing strokes, or reconnecting)
   */
  CONNECTION_STATUS_CHANGED = "connection-status-changed",
  /**
   * @remarks event emitted when the derived UI connection state changes (see {@link TEditorConnectionState})
   */
  CONNECTION_STATE_CHANGED = "connection-state-changed",
}

/**
 * @group Editor
 * @remarks Derived, UI-oriented connection state combining initialization, connection, offline
 * queue, and busy/idle status. See `editor.connectionState` and `addConnectionStateChangedListener`.
 * - `initializing` — editor not yet connected to the server for the first time
 * - `online-idle` — connected, recognizer idle
 * - `online-working` — connected, recognizer processing a request
 * - `syncing` — disconnected, actively reconnecting, with strokes queued to replay
 * - `offline` — disconnected, actively reconnecting, nothing queued yet
 * - `error` — reconnection attempts exhausted, queued strokes were rejected
 */
export type TEditorConnectionState = "initializing" | "online-idle" | "online-working" | "syncing" | "offline" | "error"

/**
 * @group Editor
 */
export class EditorEvent extends EventTarget {
  #logger = LoggerManager.getLogger(LoggerCategory.EDITOR_EVENT)
  protected abortController: AbortController
  element: Element

  constructor(element: Element) {
    super()
    this.#logger.info("constructor", { element })
    this.abortController = new AbortController()
    this.element = element
  }

  removeAllListeners(): void {
    this.#logger.info("removeAllListeners")
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  protected emit(type: string, data?: unknown): void {
    const evt = new CustomEvent(
      type,
      Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)
    )
    this.dispatchEvent(evt)
    this.element?.dispatchEvent(evt)
  }

  emitConnectionStatusChanged(status: TConnectionStatus): void {
    this.#logger.info("emitConnectionStatusChanged", { status })
    this.emit(EditorEventName.CONNECTION_STATUS_CHANGED, status)
  }
  addConnectionStatusChangedListener(callback: (status: TConnectionStatus) => void): void {
    this.#logger.info("addConnectionStatusChangedListener", { callback })
    this.addEventListener(
      EditorEventName.CONNECTION_STATUS_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TConnectionStatus),
      { signal: this.abortController.signal }
    )
  }

  emitConnectionStateChanged(state: TEditorConnectionState): void {
    this.#logger.info("emitConnectionStateChanged", { state })
    this.emit(EditorEventName.CONNECTION_STATE_CHANGED, state)
  }
  addConnectionStateChangedListener(callback: (state: TEditorConnectionState) => void): void {
    this.#logger.info("addConnectionStateChangedListener", { callback })
    this.addEventListener(
      EditorEventName.CONNECTION_STATE_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TEditorConnectionState),
      { signal: this.abortController.signal }
    )
  }

  emitSessionOpened(sessionId: string): void {
    this.#logger.info("emitSessionOpened")
    this.emit(EditorEventName.SESSION_OPENED, sessionId)
  }
  addSessionOpenedListener(callback: (sessionId: string) => void): void {
    this.#logger.info("addSessionOpenedListener", { callback })
    this.addEventListener(
      EditorEventName.SESSION_OPENED,
      (evt: unknown) => callback((evt as CustomEvent).detail as string),
      { signal: this.abortController.signal }
    )
  }

  emitLoaded(): void {
    this.#logger.info("emitLoaded")
    this.emit(EditorEventName.LOADED)
  }
  addLoadedListener(callback: () => void): void {
    this.#logger.info("addLoadedListener", {
      callback,
    })
    this.addEventListener(EditorEventName.LOADED, () => callback(), { signal: this.abortController.signal })
  }

  emitNotif(notif: { message: string; timeout?: number }): void {
    this.#logger.info("emitNotif", { notif })
    this.emit(EditorEventName.NOTIF, notif)
  }
  addNotifListener(callback: (notif: { message: string; timeout?: number }) => void): void {
    this.#logger.info("addNotifListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.NOTIF,
      (evt: unknown) =>
        callback(
          (evt as CustomEvent).detail as {
            message: string
            timeout?: number
          }
        ),
      { signal: this.abortController.signal }
    )
  }

  emitError(err: Error): void {
    this.#logger.info("emitError", { err })
    this.emit(EditorEventName.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void {
    this.#logger.info("addErrorListener", {
      callback,
    })
    this.addEventListener(EditorEventName.ERROR, (evt: unknown) => callback((evt as CustomEvent).detail as Error), {
      signal: this.abortController.signal,
    })
  }

  emitExported(exports: TExport | TExportV2): void {
    this.#logger.info("emitExported", { exports })
    this.emit(EditorEventName.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport | TExportV2) => void): void {
    this.#logger.info("addExportedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.EXPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport | TExportV2),
      { signal: this.abortController.signal }
    )
  }

  emitChanged(undoRedoContext: THistoryContext): void {
    this.#logger.info("emitChanged", {
      undoRedoContext,
    })
    this.emit(EditorEventName.CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty,
    })
  }
  addChangedListener(callback: (context: THistoryContext) => void): void {
    this.#logger.info("addChangedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as THistoryContext),
      { signal: this.abortController.signal }
    )
  }

  emitIdle(idle: boolean): void {
    this.#logger.info("emitIdle", { idle })
    this.emit(EditorEventName.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void {
    this.#logger.info("addIdleListener", {
      callback,
    })
    this.addEventListener(EditorEventName.IDLE, (evt: unknown) => callback((evt as CustomEvent).detail as boolean), {
      signal: this.abortController.signal,
    })
  }

  emitCleared(): void {
    this.#logger.info("emitCleared")
    this.emit(EditorEventName.CLEARED)
  }
  addClearedListener(callback: () => void): void {
    this.#logger.info("addClearedListener", {
      callback,
    })
    this.addEventListener(EditorEventName.CLEARED, () => callback(), { signal: this.abortController.signal })
  }

  emitConverted(exports?: TExport): void {
    this.#logger.info("emitConverted", {
      exports,
    })
    this.emit(EditorEventName.CONVERTED, exports)
  }
  addConvertedListener(callback: (exports: TExport) => void): void {
    this.#logger.info("addConvertedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.CONVERTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitImported(exports: TExport): void {
    this.#logger.info("emitImported", { exports })
    this.emit(EditorEventName.IMPORTED, exports)
  }
  addImportedListener(callback: (exports: TExport) => void): void {
    this.#logger.info("addImportedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.IMPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitSelected(symbols: TBaseSymbol[]): void {
    this.#logger.info("emitSelected")
    this.emit(EditorEventName.SELECTED, symbols)
  }
  addSelectedListener(callback: (symbols: TSymbol[]) => void): void {
    this.#logger.info("addSelectedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.SELECTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TSymbol[]),
      { signal: this.abortController.signal }
    )
  }

  emitToolChanged(mode: EditorTool): void {
    this.#logger.info("emitToolChanged")
    this.emit(EditorEventName.TOOL_CHANGED, mode)
  }
  addToolChangedListener(callback: (mode: EditorTool) => void): void {
    this.#logger.info("addToolChangedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.TOOL_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as EditorTool),
      { signal: this.abortController.signal }
    )
  }

  emitUIpdated(): void {
    this.#logger.info("emitUIpdated")
    this.emit(EditorEventName.UI_UPDATED)
  }
  addUIpdatedListener(callback: () => void): void {
    this.#logger.info("addUIpdatedListener", {
      callback,
    })
    this.addEventListener(EditorEventName.UI_UPDATED, () => callback(), { signal: this.abortController.signal })
  }

  emitSynchronized(): void {
    this.#logger.info("emitSynchronized")
    this.emit(EditorEventName.SYNCHRONIZED)
  }
  addSynchronizedListener(callback: () => void): void {
    this.#logger.info("addSynchronizedListener", {
      callback,
    })
    this.addEventListener(EditorEventName.SYNCHRONIZED, () => callback(), { signal: this.abortController.signal })
  }

  emitGestured(gesture: { gestureType: TGestureType; stroke: TStroke }): void {
    this.#logger.info("emitGestured")
    this.emit(EditorEventName.GESTURED, gesture)
  }
  addGesturedListener(callback: (gesture: { gestureType: TGestureType; stroke: TStroke }) => void): void {
    this.#logger.info("addGesturedListener", {
      callback,
    })
    this.addEventListener(
      EditorEventName.GESTURED,
      (evt) =>
        callback(
          (evt as CustomEvent).detail as {
            gestureType: TGestureType
            stroke: TStroke
          }
        ),
      { signal: this.abortController.signal }
    )
  }
}
