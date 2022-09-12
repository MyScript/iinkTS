import { IModel, TExport } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import Constants from "../Constants"


export class EventHelper extends EventTarget
{
  private static instance: EventHelper

  private constructor()
  {
    super()
  }

  public static getInstance(): EventHelper
  {
    if (!EventHelper.instance) {
      EventHelper.instance = new EventHelper()
    }

    return EventHelper.instance
  }

  private emit(type: string, data?: unknown): void
  {
    this.dispatchEvent(new CustomEvent(type, Object.assign({ bubbles: true, composed: true }, data ? { detail: data } : undefined)))
  }

  emitLoaded(): void {
    this.emit(Constants.EventType.LOADED)
  }

  emitExported(exports: TExport): void {
    this.emit(Constants.EventType.EXPORTED, exports)
  }
  // addExportedListener(callback: EventListenerOrEventListenerObject): void
  // {
  //   this.addEventListener(Constants.EventType.EXPORTED, callback)
  // }
  // removeExportedListener(callback: EventListenerOrEventListenerObject): void
  // {
  //   this.removeEventListener(Constants.EventType.EXPORTED, callback)
  // }

  emitChange(undoRedoContext: TUndoRedoContext): void {
    this.emit(Constants.EventType.CHANGED, {
      canUndo: undoRedoContext.canUndo,
      canRedo: undoRedoContext.canRedo,
      canClear: !undoRedoContext.stack[undoRedoContext.stackIndex].isEmpty,
      stackIndex: undoRedoContext.stackIndex,
      stackLength: undoRedoContext.stack.length,
      isEmpty: undoRedoContext.stack[undoRedoContext.stackIndex].isEmpty,
    })
  }
  emitIdle(model: IModel): void {
    this.emit(Constants.EventType.IDLE, model)
  }
  emitError(err: Error): void {
    this.emit(Constants.EventType.ERROR, err)
  }
  emitClear(model?: IModel): void {
    this.emit(Constants.EventType.CLEAR, model)
  }
  emitCleared(model?: IModel): void {
    this.emit(Constants.EventType.CLEARED, model)
  }
  emitConvert(): void {
    this.emit(Constants.EventType.CONVERT)
  }
  emitImport(jiix: string, mimeType: string): void {
    this.emit(Constants.EventType.IMPORT, { jiix, mimeType } )
  }
}