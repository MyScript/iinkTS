import { Intention } from "../Constants"
import { LoggerManager, LoggerClass } from "../logger"
import { IModel, TExport } from "../model"
import { TSymbol } from "../primitive"
import { TUndoRedoContext } from "../history"

/**
 * @group Event
 * @description Lists all events that can be listened to on the editor or DOM element
 * @example
 * You can run code on "EventType" raised by using
 * ```ts
 * editor.events.addEventListener(EventType.CHANGED, (evt) => console.log(evt.detail))
 * ```
 */
export enum EventType {
  /**
   * @description event emitted when history has changed i.e. the context of undo-redo
   */
  CHANGED = "changed",
  /**
   * @description event emitted when clearing is complete
   */
  CLEARED = "cleared",
  /**
   * @description event emitted after the conversion is complete
   */
  CONVERTED = "converted",
  /**
   * @description event emitted when the editor encounters an error
   */
  ERROR = "error",
  /**
   * @description event emitted on click on pointer events
   */
  POINTEREVENTS = "pointer_events",
  /**
   * @description event emitted after the end of the export
   */
  EXPORTED = "exported",
  /**
   * @description event emitted after the end of the import
   */
  IMPORTED = "imported",
  /**
   * @description event emitted when the server is idle after a job
   */
  IDLE = "idle",
  /**
   * @description event emitted after full editor initialization
   */
  LOADED = "loaded",
  /**
  * @description event emitted after
  */
  SELECTED = "selected",
  /**
  * @description event emitted after
  */
  INTENTION = "intention",
}

/**
 * @group Event
 */
export class PublicEvent extends EventTarget
{
  static #instance: PublicEvent
  #element?: HTMLElement
  #logger = LoggerManager.getLogger(LoggerClass.PUBLIC_EVENT)

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
    this.#logger.info("emitLoaded")
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

  emitSelected(symbols: TSymbol[]): void
  {
    this.#emit(EventType.SELECTED, symbols)
  }

  emitIntention(intention: Intention): void
  {
    this.#emit(EventType.INTENTION, intention)
  }
}
