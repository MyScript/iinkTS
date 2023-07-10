import { IModel, TExport, TJIIXExport } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { EventType } from "../Constants"

export class GlobalEvent extends EventTarget
{
  static #instance: GlobalEvent
  #element?: HTMLElement

  private constructor()
  {
    super()
  }

  public static getInstance(): GlobalEvent
  {
    if (!GlobalEvent.#instance) {
      GlobalEvent.#instance = new GlobalEvent()
    }

    return GlobalEvent.#instance
  }

  setElement(el: HTMLElement) {
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

  emitChange(undoRedoContext: TUndoRedoContext): void
  {
    this.#emit(EventType.CHANGED, {
      canUndo: undoRedoContext.canUndo,
      canRedo: undoRedoContext.canRedo,
      canClear: undoRedoContext.stack[undoRedoContext.stackIndex].strokeGroups.length > 0,
      stackIndex: undoRedoContext.stackIndex,
      stackLength: undoRedoContext.stack.length,
      isEmpty: undoRedoContext.stack[undoRedoContext.stackIndex].strokeGroups.length === 0,
    })
  }

  emitIdle(model: IModel): void
  {
    this.#emit(EventType.IDLE, model)
  }

  emitError(err: Error): void
  {
    this.#emit(EventType.ERROR, err)
  }
  emitNotif(message: string, timeout?: number): void
  {
    this.#emit(EventType.NOTIF, { message, timeout })
  }

  emitClearMessage(): void
  {
    this.#emit(EventType.CLEAR_MESSAGE)
  }

  emitClear(): void
  {
    this.#emit(EventType.CLEAR)
  }
  emitCleared(model?: IModel): void
  {
    this.#emit(EventType.CLEARED, model)
  }

  emitConvert(): void
  {
    this.#emit(EventType.CONVERT, exports)
  }
  emitConverted(exports: TExport): void
  {
    this.#emit(EventType.CONVERTED, exports)
  }

  emitImport(jiix: string | TJIIXExport, mimeType: string): void
  {
    this.#emit(EventType.IMPORT, { jiix, mimeType })
  }
  emitImported(jiix: TJIIXExport): void
  {
    this.#emit(EventType.IMPORTED, jiix)
  }
}
