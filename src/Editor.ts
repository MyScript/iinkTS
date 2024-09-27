
import style from "./iink.css"
import { IBehaviors, OIBehaviors, RestBehaviors, TBehaviorOptions, WSBehaviors } from "./behaviors"
import { DeferredPromise, PartialDeep, mergeDeep } from "./utils"
import { LoggerClass, LoggerManager } from "./logger"
import { Intention } from "./Constants"
import { DefaultLoggerConfiguration, TConfiguration, TConverstionState, TLoggerConfiguration } from "./configuration"
import { IModel, TExport, TJIIXExport } from "./model"
import { TSymbol, TStroke } from "./primitive"
import { InternalEvent, PublicEvent } from "./event"
import { TUndoRedoContext } from "./history"
import { IGrabber } from "./grabber"
import { TPenStyle, TTheme } from "./style"
import { EditorLayer } from "./EditorLayer"

/**
 * @group Editor
 */
export type HTMLEditorElement = HTMLElement &
{
  editor: Editor
}

/**
 * @group Editor
 */
export class Editor
{
  logger = LoggerManager.getLogger(LoggerClass.EDITOR)
  layers: EditorLayer

  #behaviors!: IBehaviors
  #initializationDeferred: DeferredPromise<void>

  #loggerConfiguration!: TLoggerConfiguration

  constructor(rootElement: HTMLElement, options: PartialDeep<TBehaviorOptions>, globalClassCss = "ms-editor")
  {
    this.logger.info("constructor", { rootElement, options, globalClassCss })

    this.#initializationDeferred = new DeferredPromise<void>()
    this.loggerConfiguration = mergeDeep({}, options.logger, DefaultLoggerConfiguration)

    this.events.setElement(rootElement)
    this.layers = new EditorLayer(rootElement, globalClassCss)
    this.layers.onCloseModal = this.closeMessageModal.bind(this)

    const styleElement = document.createElement("style")
    styleElement.appendChild(document.createTextNode(style as string))
    this.layers.root.prepend(styleElement)

    this.#instantiateBehaviors(options)
  }

  //#region Properties

  get loggerConfiguration(): TLoggerConfiguration
  {
    return this.#loggerConfiguration
  }

  set loggerConfiguration(loggerConfig: TLoggerConfiguration)
  {
    this.#loggerConfiguration = Object.assign({}, DefaultLoggerConfiguration, loggerConfig)
    LoggerManager.setLoggerLevel(this.#loggerConfiguration)
  }

  get initializationPromise(): Promise<void>
  {
    return this.#initializationDeferred.promise
  }

  get model(): IModel
  {
    return this.behaviors.model
  }

  get behaviors(): IBehaviors
  {
    return this.#behaviors
  }

  get configuration(): TConfiguration
  {
    return this.behaviors.configuration
  }
  set configuration(configuration: TConfiguration)
  {
    this.logger.info("set configuration", { configuration })
    this.#instantiateBehaviors({ configuration })
    this.initialize()
  }

  get intention(): Intention
  {
    return this.behaviors.intention
  }
  set intention(i: Intention)
  {
    this.logger.info("set intention", i)
    this.behaviors.intention = i
  }

  get events(): PublicEvent
  {
    return PublicEvent.getInstance()
  }

  get internalEvents(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get context(): TUndoRedoContext
  {
    return this.behaviors.history.context
  }

  get grabber(): IGrabber
  {
    return this.behaviors.grabber
  }

  get currentPenStyle(): TPenStyle
  {
    return this.behaviors.currentPenStyle
  }

  get penStyle(): TPenStyle
  {
    return this.behaviors.penStyle
  }
  set penStyle(ps: PartialDeep<TPenStyle>)
  {
    this.logger.info("set penStyle", { ps })
    this.behaviors.setPenStyle(ps)
  }

  get theme(): TTheme
  {
    return this.behaviors.theme
  }
  set theme(theme: PartialDeep<TTheme>)
  {
    this.logger.info("set theme", { t: theme })
    this.behaviors.setTheme(theme)
  }

  get penStyleClasses(): string
  {
    return this.behaviors.penStyleClasses
  }
  set penStyleClasses(styleClasses: string)
  {
    this.logger.info("set penStyleClasses", { psc: styleClasses })
    this.behaviors.setPenStyleClasses(styleClasses)
  }

  //#endregion

  #instantiateBehaviors(options: PartialDeep<TBehaviorOptions>)
  {
    this.logger.info("instantiateBehaviors", { options })
    if (!options?.configuration) {
      throw new Error("Configuration required")
    }
    this.internalEvents.removeAllListeners()
    if (this.#behaviors) {
      this.#behaviors.destroy()
    }
    if (options.configuration.offscreen) {
      this.#behaviors = new OIBehaviors(options, this.layers)
    }
    else if (options.configuration.server?.protocol === "REST") {
      this.#behaviors = new RestBehaviors(options, this.layers)
    } else {
      this.#behaviors = new WSBehaviors(options, this.layers)
    }
    this.logger.debug("instantiateBehaviors", this.#behaviors)
  }

  async #initializeBehaviors(): Promise<void>
  {
    this.logger.info("initializeBehaviors", "start")
    this.#initializationDeferred = new DeferredPromise<void>()
    this.layers.showLoader()
    this.closeMessageModal()
    return this.behaviors.init()
      .then(async () =>
      {
        this.logger.info("initializeBehaviors", "then");
        (this.layers.root as HTMLEditorElement).editor = this
        this.#initializationDeferred.resolve()
        this.events.emitLoaded()
      })
      .catch((error: Error) =>
      {
        this.logger.error("initializeBehaviors", error)
        this.#initializationDeferred.reject(error)
        this.layers.showMessageError(error)
      })
      .finally(() =>
      {
        this.logger.debug("initializeBehaviors", "finally")
        this.layers.hideLoader()
        this.layers.updateState(true)
        return this.#initializationDeferred.promise
      })
  }

  closeMessageModal(inError?: boolean): void
  {
    if (inError) {
      this.behaviors.destroy()
        .then(() => this.initialize())
    }
  }

  #addInternalListeners(): void
  {
    this.internalEvents.removeAllListeners()
    this.internalEvents.addConvertListener(this.convert.bind(this))
    this.internalEvents.addExportedListener(this.#onExport.bind(this))
    this.internalEvents.addContextChangeListener(this.#onContextChange.bind(this))
    this.internalEvents.addIdleListener(this.#onIdleChange.bind(this))
    this.internalEvents.addSelectedListener(this.#onSelectionChange.bind(this))
    this.internalEvents.addIntentionListener(this.#onIntentionChange.bind(this))

    this.internalEvents.addErrorListener(this.layers.showMessageError.bind(this.layers))
    this.internalEvents.addNotifListener(this.layers.showMessageInfo.bind(this.layers))
    this.internalEvents.addClearMessageListener(this.layers.closeMessageModal.bind(this.layers))
  }

  #onSelectionChange = (symbols: TSymbol[]) =>
  {
    this.events.emitSelected(symbols)
  }

  #onIntentionChange = (intention: Intention) =>
  {
    this.intention = intention
    this.events.emitIntention(intention)
  }

  #onContextChange = (context: TUndoRedoContext) =>
  {
    this.events.emitChanged(context)
  }

  #onIdleChange = (idle: boolean) =>
  {
    this.layers.updateState(idle)
    this.events.emitIdle(idle)
  }

  #onExport(exports: TExport): void
  {
    this.logger.info("onExport", { exports })
    this.events.emitExported(exports)
  }

  async initialize(): Promise<void>
  {
    this.logger.info("initialize")
    this.#addInternalListeners()
    await this.#initializeBehaviors()
  }

  async waitForIdle(): Promise<void>
  {
    if (this.behaviors.waitForIdle) {
      return this.behaviors.waitForIdle()
    }
    return
  }

  async undo(): Promise<IModel>
  {
    this.logger.info("undo")
    await this.#initializationDeferred.promise
    await this.behaviors.undo()
    this.logger.debug("undo", this.model)
    return this.model
  }

  async redo(): Promise<IModel>
  {
    this.logger.info("redo")
    await this.#initializationDeferred.promise
    await this.behaviors.redo()
    this.logger.debug("redo", this.model)
    return this.model
  }

  async clear(): Promise<IModel>
  {
    this.logger.info("clear")
    await this.#initializationDeferred.promise
    await this.behaviors.clear()
    this.events.emitCleared(this.model)
    this.logger.debug("clear", this.model)
    return this.model
  }

  async resize(): Promise<IModel>
  {
    this.logger.info("resize")
    await this.#initializationDeferred.promise
    const compStyles = window.getComputedStyle(this.layers.root)
    const height = Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    const width = Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    await this.behaviors.resize(height, width)
    this.logger.debug("resize", this.model)
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    this.logger.info("export", { mimeTypes })
    await this.#initializationDeferred.promise
    await this.behaviors.export(mimeTypes)
    this.logger.debug("export", this.model)
    return this.model
  }

  async convert(params?: { conversionState?: TConverstionState, mimeTypes?: string[] }): Promise<IModel | never>
  {
    this.logger.info("export", { params })
    await this.#initializationDeferred.promise
    await this.behaviors.convert(params?.conversionState, params?.mimeTypes)
    this.events.emitConverted(this.model.converts as TExport)
    this.logger.debug("convert", this.model)
    return this.model
  }

  async import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<IModel | never>
  {
    this.logger.info("import", { data, mimeType })
    await this.#initializationDeferred.promise
    if (this.behaviors.import) {
      let blobToImport: Blob
      if (data instanceof Blob) {
        blobToImport = data
      }
      else if (typeof data === "string") {
        blobToImport = new Blob([data])
      }
      else {
        blobToImport = new Blob([JSON.stringify(data)])
      }
      await this.behaviors.import(blobToImport, mimeType)
      this.events.emitImported(this.model.exports as TExport)
      this.logger.debug("import", this.model)
      return this.model
    }
    return Promise.reject("Import impossible, behaviors has no import function")
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<IModel>
  {
    this.logger.info("importPointEvents", { strokes })
    await this.#initializationDeferred.promise
    await this.behaviors.importPointEvents(strokes)
    this.events.emitImported(this.model.exports as TExport)
    this.logger.debug("importPointEvents", this.model)
    return this.model
    return Promise.reject("Import impossible, behaviors has no importPointEvents function")
  }
}
