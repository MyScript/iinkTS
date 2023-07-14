import { IModel, TExport, TJIIXExport } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { EventType } from "../Constants"

export class PublicEvent extends EventTarget
{
  static #instance: PublicEvent
  #element?: HTMLElement

  private constructor()
  {
    super()
  }

  public static getInstance(): PublicEvent
  {
    if (!PublicEvent.#instance) {
      PublicEvent.#instance = new PublicEvent()
    }

    return PublicEvent.#instance
  }

  setElement(el: HTMLElement)
  {
    this.#element = el
  }

  #emit(type: string, data?: unknown): void
  {
    const evt = new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined))
    this.dispatchEvent(evt)
    this.#element?.dispatchEvent(evt)
  }

  emitLoaded(): void
  {
    this.#emit(EventType.LOADED)
  }

  emitExported(exports: TExport): void
  {
    this.#emit(EventType.EXPORTED, exports)
  }

  emitChanged(undoRedoContext: TUndoRedoContext): void
  {
    this.#emit(EventType.CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty
    })
  }

  emitIdle(model: IModel): void
  {
    this.#emit(EventType.IDLE, model)
  }

  emitCleared(model?: IModel): void
  {
    this.#emit(EventType.CLEARED, model)
  }

  emitConverted(exports: TExport): void
  {
    this.#emit(EventType.CONVERTED, exports)
  }

  emitImported(jiix: TJIIXExport): void
  {
    this.#emit(EventType.IMPORTED, jiix)
  }
}
