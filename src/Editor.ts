
import style from "./iink.css"
import { IBehaviors, OIBehaviors, RestBehaviors, TBehaviorOptions, WSBehaviors } from "./behaviors"
import { SmartGuide } from "./smartguide"
import { DeferredPromise, PartialDeep, mergeDeep } from "./utils"
import { LoggerManager } from "./logger"
import { ExportType, Intention, LoggerClass } from "./Constants"
import { DefaultLoggerConfiguration, TConfiguration, TConverstionState, TLoggerConfiguration, TMarginConfiguration } from "./configuration"
import { IModel, TExport, TJIIXExport } from "./model"
import { TOISymbol, TStroke } from "./primitive"
import { InternalEvent, PublicEvent } from "./event"
import { TUndoRedoContext } from "./history"
import { IGrabber } from "./grabber"
import { TPenStyle, TTheme } from "./style"

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
  wrapperHTML: HTMLEditorElement
  #layerInfos!: HTMLDivElement
  #loaderHTML!: HTMLDivElement
  #messageEl!: HTMLDivElement
  #messageText!: HTMLParagraphElement
  #stateHTML!: HTMLDivElement
  #busyHTML!: HTMLDivElement
  #idleHTML!: HTMLDivElement
  #behaviors!: IBehaviors
  #smartGuide?: SmartGuide
  #initializationDeferred: DeferredPromise<void>

  #loggerConfiguration!: TLoggerConfiguration

  constructor(wrapperHTML: HTMLElement, options: PartialDeep<TBehaviorOptions>, globalClassCss = "ms-editor")
  {
    this.#initializationDeferred = new DeferredPromise<void>()
    this.loggerConfiguration = mergeDeep({}, options.logger, DefaultLoggerConfiguration)
    this.logger.info("constructor", { wrapperHTML, options, globalClassCss })

    this.wrapperHTML = wrapperHTML as HTMLEditorElement
    this.wrapperHTML.classList.add(globalClassCss)
    this.wrapperHTML.classList.add("draw")
    this.events.setElement(this.wrapperHTML)

    const styleElement = document.createElement("style")
    styleElement.appendChild(document.createTextNode(style as string))
    this.wrapperHTML.appendChild(styleElement)

    this.wrapperHTML.appendChild(this.#createLayerInfos())

    this.#instantiateBehaviors(options)
  }

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
    this.#setCursorIntention()
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

  #setCursorIntention(): void
  {
    switch (this.behaviors.intention) {
      case Intention.Erase:
        this.wrapperHTML.classList.remove("draw")
        this.wrapperHTML.classList.add("erase")
        this.wrapperHTML.classList.remove("select")
        break
      case Intention.Select:
        this.wrapperHTML.classList.remove("draw")
        this.wrapperHTML.classList.remove("erase")
        this.wrapperHTML.classList.add("select")
        break
      default:
        this.wrapperHTML.classList.add("draw")
        this.wrapperHTML.classList.remove("erase")
        this.wrapperHTML.classList.remove("select")
        break
    }
  }

  #createLayerInfos(): HTMLDivElement
  {
    this.#layerInfos = document.createElement("div")
    this.#layerInfos.classList.add("ms-layer-infos")
    this.#layerInfos.appendChild(this.#createLoader())
    this.#layerInfos.appendChild(this.#createMessage())
    this.#layerInfos.appendChild(this.#createEditorState())
    return this.#layerInfos
  }

  #createLoader(): HTMLDivElement
  {
    this.#loaderHTML = document.createElement("div")
    this.#loaderHTML.classList.add("loader")
    this.#loaderHTML.style.display = "none"
    return this.#loaderHTML
  }

  #createMessage(): HTMLDivElement
  {
    this.#messageEl = document.createElement("div")
    this.#messageEl.classList.add("message")
    const closeBtn = document.createElement("button")
    closeBtn.classList.add("ms-button", "close")
    closeBtn.addEventListener("pointerup", this.cleanMessage.bind(this))
    this.#messageEl.appendChild(closeBtn)
    this.#messageEl.style.display = "none"

    this.#messageText = document.createElement("p")
    this.#messageEl.appendChild(this.#messageText)
    return this.#messageEl
  }

  #createEditorState(): HTMLDivElement
  {
    this.#stateHTML = document.createElement("div")
    this.#stateHTML.classList.add("state")
    this.#idleHTML = document.createElement("div")
    this.#idleHTML.textContent = "idle"
    this.#idleHTML.style.display = "block"
    this.#stateHTML.appendChild(this.#idleHTML)
    this.#busyHTML = document.createElement("div")
    this.#busyHTML.classList.add("busy")
    this.#busyHTML.style.display = "none"
    this.#stateHTML.appendChild(this.#busyHTML)
    this.#stateHTML.style.display = "none"
    return this.#stateHTML
  }

  #updateEditorState(idle: boolean): void
  {
    if (this.configuration.offscreen) {
      this.#stateHTML.style.display = "block"
      if (idle) {
        this.#idleHTML.style.display = "block"
        this.#busyHTML.style.display = "none"
      }
      else {
        this.#idleHTML.style.display = "none"
        this.#busyHTML.style.display = "block"
      }
    }
    else {
      this.#stateHTML.style.display = "none"
    }
  }

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
      this.#behaviors = new OIBehaviors(options, this.#layerInfos)
    }
    else if (options.configuration.server?.protocol === "REST") {
      this.#behaviors = new RestBehaviors(options)
    } else {
      this.#behaviors = new WSBehaviors(options)
    }
    this.logger.debug("instantiateBehaviors", this.#behaviors)
  }

  async #initializeBehaviors(): Promise<void>
  {
    this.logger.info("initializeBehaviors", "start")
    this.#initializationDeferred = new DeferredPromise<void>()
    this.#loaderHTML.style.display = "initial"
    this.cleanMessage()
    return this.behaviors.init(this.wrapperHTML)
      .then(async () =>
      {
        this.logger.info("initializeBehaviors", "then")
        this.wrapperHTML.editor = this
        this.#initializationDeferred.resolve()
        this.events.emitLoaded()
      })
      .catch((error: Error) =>
      {
        this.logger.error("initializeBehaviors", error)
        this.#initializationDeferred.reject(error)
        this.showError(error)
      })
      .finally(() =>
      {
        this.logger.debug("initializeBehaviors", "finally")
        this.#loaderHTML.style.display = "none"
        this.#updateEditorState(true)
        return this.#initializationDeferred.promise
      })
  }

  #initializeSmartGuide(): void
  {
    this.#smartGuide?.destroy()
    this.logger.info("initializeSmartGuide", { smartGuide: this.configuration.rendering.smartGuide })
    if (this.configuration.rendering.smartGuide.enable) {
      this.#smartGuide = new SmartGuide()
      let margin: TMarginConfiguration
      switch (this.configuration.recognition.type) {
        case "TEXT":
          margin = this.configuration.recognition.text.margin
          break
        case "MATH":
          margin = this.configuration.recognition.math.margin
          break
        default:
          margin = {
            top: 20,
            left: 10,
            right: 10,
            bottom: 10
          }
          break
      }
      this.#smartGuide.init(this.#layerInfos, margin, this.configuration.rendering)
    }
  }

  cleanMessage()
  {
    this.#messageEl.style.display = "none"
    this.#messageText.innerText = ""
  }

  showError(err: Error | string)
  {
    this.#messageEl.style.display = "initial"
    this.#messageEl.classList.add("error-msg")
    this.#messageEl.classList.remove("info-msg")
    this.#messageText.innerText = typeof err === "string" ? err : err.message
  }

  showNotif(notif: { message: string, timeout?: number })
  {
    this.#messageEl.style.display = "initial"
    this.#messageEl.classList.add("info-msg")
    this.#messageEl.classList.remove("error-msg")
    this.#messageText.innerText = notif.message
    setTimeout(() =>
    {
      this.cleanMessage()
    }, notif.timeout || 2500)
  }

  #addInternalListeners(): void
  {
    this.internalEvents.addConvertListener(this.convert.bind(this))
    this.internalEvents.addClearListener(this.clear.bind(this))
    this.internalEvents.addErrorListener(this.showError.bind(this))
    this.internalEvents.addNotifListener(this.showNotif.bind(this))
    this.internalEvents.addClearMessageListener(this.cleanMessage.bind(this))
    this.internalEvents.addImportJIIXListener(this.#onImportJIIX.bind(this))
    this.internalEvents.addExportedListener(this.#onExport.bind(this))
    this.internalEvents.addContextChangeListener(this.#onContextChange.bind(this))
    this.internalEvents.addIdleListener(this.#onIdleChange.bind(this))
    this.internalEvents.addSelectedListener(this.#onSelectionChange.bind(this))
    this.internalEvents.addIntentionListener(this.#onIntentionChange.bind(this))
  }

  #onSelectionChange = (symbols: TOISymbol[]) =>
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
    this.#updateEditorState(idle)
    this.events.emitIdle(idle)
  }

  #onExport(exports: TExport): void
  {
    this.logger.info("onExport", { exports })
    if (this.configuration.rendering.smartGuide.enable) {
      if (exports && exports["application/vnd.myscript.jiix"]) {
        const jjix = exports["application/vnd.myscript.jiix"] as TJIIXExport
        this.#smartGuide?.update(jjix)
      }
    }
    this.events.emitExported(exports)
  }

  #onImportJIIX(jiix: TJIIXExport): void
  {
    this.logger.info("onImportJIIX", { jiix })
    this.import(new Blob([JSON.stringify(jiix)], { type: ExportType.JIIX }), ExportType.JIIX)
  }

  async initialize(): Promise<void>
  {
    this.logger.info("initialize")
    this.#addInternalListeners()
    await this.#initializeBehaviors()
    this.#initializeSmartGuide()
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
    if (this.configuration.rendering.smartGuide.enable) {
      this.#smartGuide?.resize()
    }
    const compStyles = window.getComputedStyle(this.wrapperHTML)
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
