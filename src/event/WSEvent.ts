import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
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

  emitSVGPatch(patchChange: TWebSocketSVGPatchEvent): void
  {
    this.emit(WSEventType.SVG_PATCH, patchChange)
  }

  addSVGPatchListener(callback: (contentChange: TWebSocketSVGPatchEvent) => void): void
  {
    this.addEventListener(WSEventType.SVG_PATCH, (evt: unknown) => callback(((evt as CustomEvent).detail as TWebSocketSVGPatchEvent)), { signal: this.#abortController.signal })
  }
}
