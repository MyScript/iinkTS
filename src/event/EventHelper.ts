import { IModel, TExport } from "../@types/model/Model"
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

  emitLoaded() {
    this.emit(Constants.EventType.LOADED)
  }

  emitExported(exports: TExport) {
    this.emit(Constants.EventType.EXPORTED, exports)
  }
  emitExportedMimeType(mimeType: string, exports: TExport) {
    this.emit(Constants.EventType.EXPORTED + '_' + mimeType, exports[mimeType])
  }
  addExportedListener(callback: EventListenerOrEventListenerObject): void
  {
    this.addEventListener(Constants.EventType.EXPORTED, callback)
  }
  // removeExportedListener(callback: EventListenerOrEventListenerObject): void
  // {
  //   this.removeEventListener(Constants.EventType.EXPORTED, callback)
  // }

  emitIdle(model: IModel) {
    this.emit(Constants.EventType.IDLE, model)
  }
  emitError(err: Error) {
    this.emit(Constants.EventType.ERROR, err)
  }
  emitClear(model?: IModel) {
    this.emit(Constants.EventType.CLEAR, model)
  }
  emitCleared(model?: IModel) {
    this.emit(Constants.EventType.CLEARED, model)
  }
  emitConvert() {
    this.emit(Constants.EventType.CONVERT)
  }
  emitImport(jiix: string, mimeType: string) {
    this.emit(Constants.EventType.IMPORT, { jiix, mimeType } )
  }
}