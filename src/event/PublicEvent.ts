import { IModel, TExport } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { EventType } from "../Constants"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class PublicEvent extends EventTarget
{
  static #instance: PublicEvent
  #element?: HTMLElement
  #logger: Logger

  private constructor()
  {
    super()
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.PUBLIC_EVENT)
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
    this.#logger.info("setElement", { el })
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
    this.#logger.info("emitExported", { exports })
    this.#emit(EventType.EXPORTED, exports)
  }

  emitChanged(undoRedoContext: TUndoRedoContext): void
  {
    this.#logger.info("emitChanged", { undoRedoContext })
    this.#emit(EventType.CHANGED, {
      ...undoRedoContext,
      canClear: !undoRedoContext.empty
    })
  }

  emitIdle(idle: boolean): void
  {
    this.#logger.info("emitIdle", { idle })
    this.#emit(EventType.IDLE, idle)
  }

  emitCleared(model?: IModel): void
  {
    this.#logger.info("emitCleared", { model })
    this.#emit(EventType.CLEARED, model)
  }

  emitConverted(exports: TExport): void
  {
    this.#logger.info("emitConverted", { exports })
    this.#emit(EventType.CONVERTED, exports)
  }

  emitImported(exports: TExport): void
  {
    this.#logger.info("emitImported", { exports })
    this.#emit(EventType.IMPORTED, exports)
  }
}
