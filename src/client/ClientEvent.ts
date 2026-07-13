import type { THistoryContext } from "@/history"
import type { TExport } from "@/model"

import type { TWebSocketClientMessageGesture } from "./WebSocketClientMessage"
import type { TWebSocketSSRClientMessageSVGPatch } from "./WebSocketSSRClientMessage"

/**
 * @group Client
 * @summary
 * Lists all events that can be listened to on the canvas or DOM element
 * @example
 * You can run code on "ClientEventName" raised by using
 * ```ts
 * client.events.addEventListener(ClientEventName.CONTENT_CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum ClientEventName {
  /**
   * @summary event emitted at the start of connection initialization
   */
  START_INITIALIZATION = "start-initialization",
  /**
   * @summary event emitted after full client initialization
   */
  END_INITIALIZATION = "end-initialization",
  /**
   * @summary event emitted after receiving an "contentChanged" message
   */
  CONTENT_CHANGED = "content-changed",
  /**
   * @summary event emitted after receiving an "idle" message
   */
  IDLE = "idle",
  /**
   * @summary event emitted after receiving an "exported" message
   */
  EXPORTED = "exported",
  /**
   * @summary event emitted when the client encounters an error
   */
  ERROR = "error",
  /**
   * @remarks event emitted after connection closed
   */
  CONNECTION_CLOSE = "connection-close",
  /**
   * @summary
   * event emitted after receiving an "svgPatch" message
   * @remarks
   * only usable in the case of websocket
   */
  SVG_PATCH = "svg-patch",
  /**
   * @summary event emitted session opened
   */
  SESSION_OPENED = "session-opened",
  /**
   * @summary event emitted when the connection status changes (e.g. going offline while queueing strokes, or reconnecting)
   */
  CONNECTION_STATUS_CHANGED = "connection-status-changed",
  /**
   * @summary event emitted after receiving a "gestureDetected" message
   */
  GESTURE_DETECTED = "gesture-detected",
}

/**
 * @group Client
 * @remarks "offline" covers both a bare disconnect and actively reconnecting/queueing.
 * "error" means reconnection attempts were exhausted and the offline queue was rejected.
 */
export type TConnectionStatus = "connected" | "offline" | "error"

/**
 * @group Client
 */
export class ClientEvent extends EventTarget {
  protected abortController: AbortController

  constructor() {
    super()
    this.abortController = new AbortController()
  }

  removeAllListeners(): void {
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  protected emit(type: string, data?: unknown): void {
    const evt = new CustomEvent(
      type,
      Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)
    )
    this.dispatchEvent(evt)
  }

  emitStartInitialization(): void {
    this.emit(ClientEventName.START_INITIALIZATION)
  }
  addStartInitialization(callback: () => void): void {
    this.addEventListener(ClientEventName.START_INITIALIZATION, () => callback(), {
      signal: this.abortController.signal,
    })
  }

  emitEndInitialization(): void {
    this.emit(ClientEventName.END_INITIALIZATION)
  }
  addEndInitialization(callback: () => void): void {
    this.addEventListener(ClientEventName.END_INITIALIZATION, () => callback(), {
      signal: this.abortController.signal,
    })
  }

  emitSessionOpened(sessionId: string): void {
    this.emit(ClientEventName.SESSION_OPENED, sessionId)
  }
  addSessionOpenedListener(callback: (sessionId: string) => void): void {
    this.addEventListener(
      ClientEventName.SESSION_OPENED,
      (evt: unknown) => callback((evt as CustomEvent).detail as string),
      { signal: this.abortController.signal }
    )
  }

  emitContentChanged(undoRedoContext: THistoryContext): void {
    this.emit(ClientEventName.CONTENT_CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty,
    })
  }
  addContentChangedListener(callback: (context: THistoryContext) => void): void {
    this.addEventListener(
      ClientEventName.CONTENT_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as THistoryContext),
      { signal: this.abortController.signal }
    )
  }

  emitIdle(idle: boolean): void {
    this.emit(ClientEventName.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void {
    this.addEventListener(ClientEventName.IDLE, (evt: unknown) => callback((evt as CustomEvent).detail as boolean), {
      signal: this.abortController.signal,
    })
  }

  emitExported(exports: TExport): void {
    this.emit(ClientEventName.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport) => void): void {
    this.addEventListener(
      ClientEventName.EXPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitError(err: Error): void {
    this.emit(ClientEventName.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void {
    this.addEventListener(ClientEventName.ERROR, (evt: unknown) => callback((evt as CustomEvent).detail as Error), {
      signal: this.abortController.signal,
    })
  }

  emitConnectionClose({ code, message }: { code: number; message?: string }): void {
    this.emit(ClientEventName.CONNECTION_CLOSE, { code, message })
  }
  addConnectionCloseListener(callback: ({ code, message }: { code: number; message?: string }) => void): void {
    this.addEventListener(
      ClientEventName.CONNECTION_CLOSE,
      (evt: unknown) =>
        callback(
          (evt as CustomEvent).detail as {
            code: number
            message?: string
          }
        ),
      { signal: this.abortController.signal }
    )
  }

  emitConnectionStatusChanged(status: TConnectionStatus): void {
    this.emit(ClientEventName.CONNECTION_STATUS_CHANGED, status)
  }
  addConnectionStatusChangedListener(callback: (status: TConnectionStatus) => void): void {
    this.addEventListener(
      ClientEventName.CONNECTION_STATUS_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TConnectionStatus),
      { signal: this.abortController.signal }
    )
  }

  emitGestureDetected(gesture: TWebSocketClientMessageGesture): void {
    this.emit(ClientEventName.GESTURE_DETECTED, gesture)
  }
  addGestureDetectedListener(callback: (gesture: TWebSocketClientMessageGesture) => void): void {
    this.addEventListener(
      ClientEventName.GESTURE_DETECTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TWebSocketClientMessageGesture),
      { signal: this.abortController.signal }
    )
  }

  /**
   * @remarks only use in the case of websocket
   */
  emitSVGPatch(svgPatch: TWebSocketSSRClientMessageSVGPatch): void {
    this.emit(ClientEventName.SVG_PATCH, svgPatch)
  }
  /**
   * @remarks only usable in the case of websocket
   */
  addSVGPatchListener(callback: (svgPatch: TWebSocketSSRClientMessageSVGPatch) => void): void {
    this.addEventListener(
      ClientEventName.SVG_PATCH,
      (evt: unknown) => callback((evt as CustomEvent).detail as TWebSocketSSRClientMessageSVGPatch),
      { signal: this.abortController.signal }
    )
  }
}
