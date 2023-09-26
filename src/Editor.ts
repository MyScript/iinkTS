import
{
  TConfiguration,
  IGrabber,
  TStroke,
  IModel,
  TExport,
  TJIIXExport,
  TPenStyle,
  TTheme,
  IBehaviors,
  TBehaviorOptions,
  TConverstionState,
  TMarginConfiguration,
  TUndoRedoContext,
  TLoggerConfiguration
} from "./@types"

import { ExportType, Intention, LoggerClass} from "./Constants"
import { PublicEvent } from "./event/PublicEvent"
import { InternalEvent } from "./event/InternalEvent"
import { SmartGuide } from "./smartguide/SmartGuide"
import { DeferredPromise } from "./utils/DeferredPromise"
import { RestBehaviors } from "./behaviors/RestBehaviors"
import { WSBehaviors } from "./behaviors/WSBehaviors"
import { LoggerManager } from "./logger"
import { DefaultLoggerConfiguration } from "./configuration"

import "./iink.css"

export type HTMLEditorElement = HTMLElement &
{
  editor: Editor
}

export class Editor
{
  wrapperHTML: HTMLEditorElement
  #loaderHTML: HTMLDivElement
  #messageHTML: HTMLDivElement
  #behaviors!: IBehaviors
  #smartGuide?: SmartGuide
  #initializationDeferred: DeferredPromise<void>

  logger = LoggerManager.getLogger(LoggerClass.EDITOR)
  #loggerConfiguration!: TLoggerConfiguration

  showStrokesPan = false

  constructor(wrapperHTML: HTMLElement, options: TBehaviorOptions, globalClassCss = "ms-editor")
  {
    this.#initializationDeferred = new DeferredPromise<void>()
    this.loggerConfiguration = options.logger || DefaultLoggerConfiguration
    this.logger.info("constructor", { wrapperHTML, options, globalClassCss })

    this.wrapperHTML = wrapperHTML as HTMLEditorElement
    this.wrapperHTML.classList.add(globalClassCss)
    this.wrapperHTML.classList.add("draw")
    this.events.setElement(this.wrapperHTML)

    this.#loaderHTML = document.createElement("div")
    this.#loaderHTML.classList.add("loader")
    this.#loaderHTML.style.display = "none"
    this.wrapperHTML.appendChild(this.#loaderHTML)

    this.#messageHTML = document.createElement("div")
    this.#messageHTML.classList.add("message")
    this.#messageHTML.style.display = "none"
    this.wrapperHTML.appendChild(this.#messageHTML)

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
    this.behaviors.intention = i
    switch (this.behaviors.intention) {
      case Intention.Erase:
        this.wrapperHTML.classList.remove("draw")
        this.wrapperHTML.classList.add("erase")
        this.wrapperHTML.classList.remove("select")
        break
      default:
        this.wrapperHTML.classList.add("draw")
        this.wrapperHTML.classList.remove("erase")
        this.wrapperHTML.classList.remove("select")
        break
    }
    this.logger.debug("set intention", this.wrapperHTML)
  }

  get events(): PublicEvent
  {
    return PublicEvent.getInstance()
  }

  get context(): TUndoRedoContext
  {
    return this.behaviors.context
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
  set penStyle(ps: TPenStyle)
  {
    this.logger.info("set penStyle", { ps })
    this.behaviors.setPenStyle(ps)
  }

  get theme(): TTheme
  {
    return this.behaviors.theme
  }
  set theme(t: TTheme)
  {
    this.logger.info("set theme", { t })
    this.behaviors.setTheme(t)
  }

  get penStyleClasses(): string
  {
    return this.behaviors.penStyleClasses
  }
  set penStyleClasses(psc: string)
  {
    this.logger.info("set penStyleClasses", { psc })
    this.behaviors.setPenStyleClasses(psc)
  }

  get gestures(): boolean
  {
    return this.configuration.recognition.gesture.enable
  }
  set gestures(apply: boolean)
  {
    this.configuration.recognition.gesture.enable = apply
    this.#instantiateBehaviors({ configuration: this.configuration })
    this.initialize()
  }

  #instantiateBehaviors(options: TBehaviorOptions)
  {
    this.logger.info("instantiateBehaviors", { options })
    if (!options?.configuration) {
      throw new Error("Configuration required")
    }
    InternalEvent.getInstance().removeAllListeners()
    if (this.#behaviors) {
      this.#behaviors.destroy()
    }
    let defaultBehaviors: IBehaviors
    if (options.configuration.server?.protocol === "REST") {
      defaultBehaviors = new RestBehaviors(options)
    } else {
      defaultBehaviors = new WSBehaviors(options)
    }
    this.#behaviors = Object.assign(defaultBehaviors, options.behaviors)
    this.logger.debug("instantiateBehaviors", this.#behaviors)
  }

  async #initializeBehaviors(): Promise<void>
  {
    this.logger.info("initializeBehaviors", "start")
    this.#initializationDeferred = new DeferredPromise<void>()
    this.#loaderHTML.style.display = "initial"
    this.#cleanMessage()
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
        this.#showError(error)
      })
      .finally(() =>
      {
        this.logger.debug("initializeBehaviors", "finally")
        this.#loaderHTML.style.display = "none"
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
      this.#smartGuide.init(this.wrapperHTML, margin, this.configuration.rendering)
    }
  }

  #cleanMessage()
  {
    this.#messageHTML.style.display = "none"
    this.#messageHTML.innerHTML = ""
  }

  #showError(err: Error | string)
  {
    this.#messageHTML.style.display = "initial"
    this.#messageHTML.classList.add("error-msg")
    this.#messageHTML.classList.remove("info-msg")
    this.#messageHTML.innerText = typeof err === "string" ? err : err.message
  }

  #showNotif(notif: { message: string, timeout?: number })
  {
    this.#messageHTML.style.display = "initial"
    this.#messageHTML.classList.add("info-msg")
    this.#messageHTML.classList.remove("error-msg")
    this.#messageHTML.innerText = notif.message
    setTimeout(() =>
    {
      this.#cleanMessage()
    }, notif.timeout || 2500)
  }

  #showStrokesIfDebug(): void
  {
    if (this.showStrokesPan) {
      let panel = document.getElementById("stroke-panel")
      const text = JSON.stringify(this.model.strokes.map((s: TStroke) => ({ pointerType: s.pointerType, pointerId: s.pointerId, pointers: s.pointers })))
      if (!panel) {
        panel = document.createElement("div")
        panel.id = "stroke-panel"
        panel.addEventListener("click", (e) =>
        {
          e.preventDefault()
          e.stopPropagation()
          navigator.clipboard.writeText(panel?.innerText as string)
          this.#showNotif({ message: "strokes copied to clipboard!", timeout: 1500 })
        })
        this.wrapperHTML.appendChild(panel)
      }
      panel.innerText = text
    }
  }

  #addListeners(): void
  {
    InternalEvent.getInstance().addConvertListener(this.convert.bind(this))
    InternalEvent.getInstance().addClearListener(this.clear.bind(this))
    InternalEvent.getInstance().addErrorListener(this.#showError.bind(this))
    InternalEvent.getInstance().addImportJIIXListener(this.#onImportJIIX.bind(this))
    InternalEvent.getInstance().addExportedListener(this.#onExport.bind(this))
    InternalEvent.getInstance().addNotifListener(this.#showNotif.bind(this))
    InternalEvent.getInstance().addClearMessageListener(this.#cleanMessage.bind(this))
    InternalEvent.getInstance().addContextChangeListener(this.#onContextChange.bind(this))
    InternalEvent.getInstance().addIdleListener(this.#onIdleChange.bind(this))
  }

  #onContextChange = (context: TUndoRedoContext) =>
  {
    this.events.emitChanged(context)
  }

  #onIdleChange = (idle: boolean) =>
  {
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
    this.#showStrokesIfDebug()
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
    await this.#initializeBehaviors()
    this.#initializeSmartGuide()
    this.#addListeners()
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
    this.#showStrokesIfDebug()
    this.logger.debug("undo", this.model)
    return this.model
  }

  async redo(): Promise<IModel>
  {
    this.logger.info("redo")
    await this.#initializationDeferred.promise
    await this.behaviors.redo()
    this.#showStrokesIfDebug()
    this.logger.debug("redo", this.model)
    return this.model
  }

  async clear(): Promise<IModel>
  {
    this.logger.info("clear")
    await this.#initializationDeferred.promise
    await this.behaviors.clear()
    this.events.emitCleared(this.model)
    this.#showStrokesIfDebug()
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
    const height = Math.max(parseInt(compStyles.height.replace("px","")), this.configuration.rendering.minHeight)
    const width = Math.max(parseInt(compStyles.width.replace("px","")), this.configuration.rendering.minWidth)
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

  async importPointEvents(strokes: TStroke[]): Promise<IModel>
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
