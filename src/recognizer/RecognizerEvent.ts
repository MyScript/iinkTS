import { TUndoRedoContext } from "../history"
import { TExport } from "../model"
import { TWSMessageEventSVGPatch } from "./WSRecognizerMessage"

/**
 * @group Event
 * @description Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "RecognizerEventName" raised by using
 * ```ts
 * recognizer.events.addEventListener(RecognizerEventName.CONTENT_CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum RecognizerEventName
{
  /**
   * @description event emitted at the start of connection initialization
   */
  START_INITIALIZATION = "start-initialization",
  /**
   * @description event emitted after full recognizer initialization
   */
  END_INITIALIZATION = "end-initialization",
  /**
   * @description event emitted after receiving an "contentChanged" message
   */
  CONTENT_CHANGED = "content-changed",
  /**
   * @description event emitted after receiving an "idle" message
   */
  IDLE = "idle",
  /**
   * @description event emitted after receiving an "exported" message
   */
  EXPORTED = "exported",
  /**
   * @description event emitted when the recognizer encounters an error
   */
  ERROR = "error",
  /**
   * @description event emitted after connection closed
   */
  CONNECTION_CLOSE = "connection-close",
  /**
   * @description event emitted after receiving an "svgPatch" message
   * @remarks only usable in the case of websocket
   */
  SVG_PATCH = "svg-patch",
  /**
   * @description event emitted session opened
   */
  SESSION_OPENED = "session-opened",

}

/**
 * @group Event
 */
export class RecognizerEvent extends EventTarget
{
  protected abortController: AbortController

  constructor()
  {
    super()
    this.abortController = new AbortController()
  }

  removeAllListeners(): void
  {
    this.abortController.abort()
    this.abortController = new AbortController()
  }

  protected emit(type: string, data?: unknown): void
  {
    const evt = new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined))
    this.dispatchEvent(evt)
  }

  emitStartInitialization(): void
  {
    this.emit(RecognizerEventName.START_INITIALIZATION)
  }
  addStartInitialization(callback: () => void): void
  {
    this.addEventListener(
      RecognizerEventName.START_INITIALIZATION,
      () => callback(),
      { signal: this.abortController.signal }
    )
  }

  emitEndtInitialization(): void
  {
    this.emit(RecognizerEventName.END_INITIALIZATION)
  }
  addEndInitialization(callback: () => void): void
  {
    this.addEventListener(
      RecognizerEventName.END_INITIALIZATION,
      () => callback(),
      { signal: this.abortController.signal }
    )
  }

  emitSessionOpened(sessionId: string): void
  {
    this.emit(RecognizerEventName.SESSION_OPENED, sessionId)
  }
  addSessionOpenedListener(callback: (sessionId: string) => void): void
  {
    this.addEventListener(
      RecognizerEventName.SESSION_OPENED,
      (evt: unknown) => callback((evt as CustomEvent).detail as string),
      { signal: this.abortController.signal }
    )
  }

  emitContentChanged(undoRedoContext: TUndoRedoContext): void
  {
    this.emit(RecognizerEventName.CONTENT_CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty
    })
  }
  addContentChangedListener(callback: (context: TUndoRedoContext) => void): void
  {
    this.addEventListener(
      RecognizerEventName.CONTENT_CHANGED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TUndoRedoContext),
      { signal: this.abortController.signal }
    )
  }

  emitIdle(idle: boolean): void
  {
    this.emit(RecognizerEventName.IDLE, idle)
  }
  addIdleListener(callback: (idle: boolean) => void): void
  {
    this.addEventListener(
      RecognizerEventName.IDLE,
      (evt: unknown) => callback((evt as CustomEvent).detail as boolean),
      { signal: this.abortController.signal }
    )
  }

  emitExported(exports: TExport): void
  {
    this.emit(RecognizerEventName.EXPORTED, exports)
  }
  addExportedListener(callback: (exports: TExport) => void): void
  {
    this.addEventListener(
      RecognizerEventName.EXPORTED,
      (evt: unknown) => callback((evt as CustomEvent).detail as TExport),
      { signal: this.abortController.signal }
    )
  }

  emitError(err: Error): void
  {
    this.emit(RecognizerEventName.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void
  {
    this.addEventListener(
      RecognizerEventName.ERROR,
      (evt: unknown) => callback((evt as CustomEvent).detail as Error),
      { signal: this.abortController.signal }
    )
  }

  emitConnectionClose({ code, message }: { code: number, message?: string }): void
  {
    this.emit(RecognizerEventName.CONNECTION_CLOSE, { code, message })
  }
  addConnectionCloseListener(callback: ({ code, message }: { code: number, message?: string }) => void): void
  {
    this.addEventListener(
      RecognizerEventName.CONNECTION_CLOSE,
      (evt: unknown) => callback((evt as CustomEvent).detail as { code: number, message?: string }),
      { signal: this.abortController.signal }
    )
  }

  /**
   * @remarks only use in the case of websocket
   */
  emitSVGPatch(svgPatch: TWSMessageEventSVGPatch): void
  {
    this.emit(RecognizerEventName.SVG_PATCH, svgPatch)
  }
  /**
   * @remarks only usable in the case of websocket
   */
  addSVGPatchListener(callback:  (svgPatch: TWSMessageEventSVGPatch) => void): void
  {
    this.addEventListener(
      RecognizerEventName.SVG_PATCH,
      (evt: unknown) => callback((evt as CustomEvent).detail as TWSMessageEventSVGPatch),
      { signal: this.abortController.signal }
    )
  }
}
