import type { TConnectionStatus } from "@/client"
import type { CanvasTool } from "@/Constants"
import type { THistoryContext } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TGestureType } from "@/manager"
import type { TExport, TExportV2 } from "@/model"
import type { TBaseSymbol, TStroke, TSymbol } from "@/symbol"

/**
 * @group Canvas
 * @remarks Lists all events that can be listened to on the canvas or DOM element
 * @example
 * You can run code on "CanvasEventName" raised by using
 * ```ts
 * canvas.event.addEventListener(CanvasEventName.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum CanvasEventName {
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
   * @remarks event emitted when the canvas encounters an error
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
   * @remarks event emitted after full canvas initialization
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
   * @remarks event emitted when the derived UI connection state changes (see {@link TCanvasConnectionState})
   */
  CONNECTION_STATE_CHANGED = "connection-state-changed",
}

/**
 * @group Canvas
 * @remarks Derived, UI-oriented connection state combining initialization, connection, offline
 * queue, and busy/idle status. See `canvas.connectionState` and `addConnectionStateChangedListener`.
 * - `initializing` — canvas not yet connected to the server for the first time
 * - `online-idle` — connected, client idle
 * - `online-working` — connected, client processing a request
 * - `syncing` — disconnected, actively reconnecting, with strokes queued to replay
 * - `offline` — disconnected, actively reconnecting, nothing queued yet
 * - `error` — reconnection attempts exhausted, queued strokes were rejected
 */
export type TCanvasConnectionState = "initializing" | "online-idle" | "online-working" | "syncing" | "offline" | "error"

/**
 * @group Canvas
 */
export class CanvasEvent extends EventTarget {
  #logger = LoggerManager.getLogger(LoggerCategory.CANVAS_EVENT)
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
    this.emit(CanvasEventName.CONNECTION_STATUS_CHANGED, status)
  }
  addConnectionStatusChangedListener(callback: (status: TConnectionStatus) => void): void {
    this.#logger.info("addConnectionStatusChangedListener", { callback })
    this.addEventListener(
      CanvasEventName.CONNECTION_STATUS_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TConnectionStatus),
      { signal: this.abortController.signal }
    )
  }

  emitConnectionStateChanged(state: TCanvasConnectionState): void {
    this.#logger.info("emitConnectionStateChanged", { state })
    this.emit(CanvasEventName.CONNECTION_STATE_CHANGED, state)
  }
  addConnectionStateChangedListener(callback: (state: TCanvasConnectionState) => void): void {
    this.#logger.info("addConnectionStateChangedListener", { callback })
    this.addEventListener(
      CanvasEventName.CONNECTION_STATE_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TCanvasConnectionState),
      { signal: this.abortController.signal }
    )
  }

  emitSessionOpened(sessionId: string): void {
    this.#logger.info("emitSessionOpened")
    this.emit(CanvasEventName.SESSION_OPENED, sessionId)
  }
  addSessionOpenedListener(callback: (sessionId: string) => void): void {
    this.#logger.info("addSessionOpenedListener", { callback })
    this.addEventListener(
      CanvasEventName.SESSION_OPENED,
      (evt: unknown) => callback((evt as CustomEvent).detail as string),
      { signal: this.abortController.signal }
    )
  }

  emitLoaded(): void {
    this.#logger.info("emitLoaded")
    this.emit(CanvasEventName.LOADED)
  }
  addLoadedListener(callback: () => void): void {
    this.#logger.info("addLoadedListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.LOADED, () => callback(), { signal: this.abortController.signal })
  }

  emitNotif(notif: { message: string; timeout?: number }): void {
    this.#logger.info("emitNotif", { notif })
    this.emit(CanvasEventName.NOTIF, notif)
  }
  addNotifListener(callback: (notif: { message: string; timeout?: number }) => void): void {
    this.#logger.info("addNotifListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.NOTIF,
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
    this.emit(CanvasEventName.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void {
    this.#logger.info("addErrorListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.ERROR, (evt: unknown) => callback((evt as CustomEvent).detail as Error), {
      signal: this.abortController.signal,
    })
  }

  emitExported(exports: TExport | TExportV2): void {
    this.#logger.info("emitExported", { exports })
    this.emit(CanvasEventName.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport | TExportV2) => void): void {
    this.#logger.info("addExportedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.EXPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport | TExportV2),
      { signal: this.abortController.signal }
    )
  }

  emitChanged(undoRedoContext: THistoryContext): void {
    this.#logger.info("emitChanged", {
      undoRedoContext,
    })
    this.emit(CanvasEventName.CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty,
    })
  }
  addChangedListener(callback: (context: THistoryContext) => void): void {
    this.#logger.info("addChangedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as THistoryContext),
      { signal: this.abortController.signal }
    )
  }

  emitIdle(idle: boolean): void {
    this.#logger.info("emitIdle", { idle })
    this.emit(CanvasEventName.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void {
    this.#logger.info("addIdleListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.IDLE, (evt: unknown) => callback((evt as CustomEvent).detail as boolean), {
      signal: this.abortController.signal,
    })
  }

  emitCleared(): void {
    this.#logger.info("emitCleared")
    this.emit(CanvasEventName.CLEARED)
  }
  addClearedListener(callback: () => void): void {
    this.#logger.info("addClearedListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.CLEARED, () => callback(), { signal: this.abortController.signal })
  }

  emitConverted(exports?: TExport): void {
    this.#logger.info("emitConverted", {
      exports,
    })
    this.emit(CanvasEventName.CONVERTED, exports)
  }
  addConvertedListener(callback: (exports: TExport) => void): void {
    this.#logger.info("addConvertedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.CONVERTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitImported(exports: TExport): void {
    this.#logger.info("emitImported", { exports })
    this.emit(CanvasEventName.IMPORTED, exports)
  }
  addImportedListener(callback: (exports: TExport) => void): void {
    this.#logger.info("addImportedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.IMPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitSelected(symbols: TBaseSymbol[]): void {
    this.#logger.info("emitSelected")
    this.emit(CanvasEventName.SELECTED, symbols)
  }
  addSelectedListener(callback: (symbols: TSymbol[]) => void): void {
    this.#logger.info("addSelectedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.SELECTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TSymbol[]),
      { signal: this.abortController.signal }
    )
  }

  emitToolChanged(mode: CanvasTool): void {
    this.#logger.info("emitToolChanged")
    this.emit(CanvasEventName.TOOL_CHANGED, mode)
  }
  addToolChangedListener(callback: (mode: CanvasTool) => void): void {
    this.#logger.info("addToolChangedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.TOOL_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as CanvasTool),
      { signal: this.abortController.signal }
    )
  }

  emitUIpdated(): void {
    this.#logger.info("emitUIpdated")
    this.emit(CanvasEventName.UI_UPDATED)
  }
  addUIpdatedListener(callback: () => void): void {
    this.#logger.info("addUIpdatedListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.UI_UPDATED, () => callback(), { signal: this.abortController.signal })
  }

  emitSynchronized(): void {
    this.#logger.info("emitSynchronized")
    this.emit(CanvasEventName.SYNCHRONIZED)
  }
  addSynchronizedListener(callback: () => void): void {
    this.#logger.info("addSynchronizedListener", {
      callback,
    })
    this.addEventListener(CanvasEventName.SYNCHRONIZED, () => callback(), { signal: this.abortController.signal })
  }

  emitGestured(gesture: { gestureType: TGestureType; stroke: TStroke }): void {
    this.#logger.info("emitGestured")
    this.emit(CanvasEventName.GESTURED, gesture)
  }
  addGesturedListener(callback: (gesture: { gestureType: TGestureType; stroke: TStroke }) => void): void {
    this.#logger.info("addGesturedListener", {
      callback,
    })
    this.addEventListener(
      CanvasEventName.GESTURED,
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
