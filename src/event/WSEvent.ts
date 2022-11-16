import { TWebSocketContentChangeEvent, TWebSocketExportEvent, TWebSocketPartChangeEvent, TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { WSEventType } from "../Constants"

export class WSEvent extends EventTarget
{
  #abortController: AbortController

  constructor()
  {
    super()
    this.#abortController = new AbortController()
  }

  private emit(type: string, data?: unknown): void
  {
    this.dispatchEvent(new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)))
  }

  emitInitialized(): void
  {
    this.emit(WSEventType.INITIALIZED)
  }
  emitConnected(): void
  {
    this.emit(WSEventType.CONNECTED)
  }

  emitConnectionActive(): void
  {
    this.emit(WSEventType.CONNECTION_ACTIVE)
  }
  addConnectionActiveListener(callback: () => void): void
  {
    this.addEventListener(WSEventType.CONNECTION_ACTIVE, () => callback(), { signal: this.#abortController.signal })
  }

  emitDisconnected(event: CloseEvent): void
  {
    this.emit(WSEventType.DISCONNECTED, event)
  }
  addDisconnectedListener(callback: (event: CloseEvent) => void): void
  {
    this.addEventListener(WSEventType.DISCONNECTED, (evt: unknown) => callback(((evt as CustomEvent).detail as CloseEvent)), { signal: this.#abortController.signal })
  }

  emitPartChange(partChange: TWebSocketPartChangeEvent): void
  {
    this.emit(WSEventType.PART_CHANGE, partChange)
  }
  addPartChangeListener(callback: (partChange: TWebSocketPartChangeEvent) => void): void
  {
    this.addEventListener(WSEventType.PART_CHANGE, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketPartChangeEvent)), { signal: this.#abortController.signal })
  }

  emitContentChange(contentChange: TWebSocketContentChangeEvent): void
  {
    this.emit(WSEventType.CONTENT_CHANGE, contentChange)
  }
  addContentChangeListener(callback: (contentChange: TWebSocketContentChangeEvent) => void): void
  {
    this.addEventListener(WSEventType.CONTENT_CHANGE, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketContentChangeEvent)), { signal: this.#abortController.signal })
  }

  emitSVGPatch(patchChange: TWebSocketSVGPatchEvent): void
  {
    this.emit(WSEventType.SVG_PATCH, patchChange)
  }
  addSVGPatchListener(callback: (contentChange: TWebSocketSVGPatchEvent) => void): void
  {
    this.addEventListener(WSEventType.SVG_PATCH, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketSVGPatchEvent)), { signal: this.#abortController.signal })
  }

  emitExported(exports: TWebSocketExportEvent): void
  {
    this.emit(WSEventType.EXPORTED, exports)
  }
  addExportListener(callback: (exports: TWebSocketExportEvent) => void): void
  {
    this.addEventListener(WSEventType.EXPORTED, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketExportEvent)), { signal: this.#abortController.signal })
  }

  emitError(err: Error): void
  {
    this.emit(WSEventType.ERROR, err)
  }
  addErrorListener(callback: (err: Error) => void): void
  {
    this.addEventListener(WSEventType.ERROR, (evt: unknown) => callback(((evt as CustomEvent).detail as Error)), { signal: this.#abortController.signal })
  }

  clearListeners()
  {
    this.#abortController.abort()
  }
}