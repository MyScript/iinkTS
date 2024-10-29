
import style from "./iink.css"
import { IBehaviors, OIBehaviors, RestBehaviors, TBehaviorOptions, WSBehaviors } from "./behaviors"
import { PartialDeep, mergeDeep } from "./utils"
import { LoggerClass, LoggerManager } from "./logger"
import { EditorTool } from "./Constants"
import { DefaultLoggerConfiguration, TConfiguration, TConverstionState, TLoggerConfiguration } from "./configuration"
import { IModel, TJIIXExport } from "./model"
import { TStroke } from "./symbol"
import { TUndoRedoContext } from "./history"
import { IGrabber } from "./grabber"
import { TPenStyle, TTheme } from "./style"
import { EditorEvent } from "./EditorEvent"
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
  event: EditorEvent

  #behaviors!: IBehaviors

  #loggerConfiguration!: TLoggerConfiguration

  constructor(rootElement: HTMLElement, options: PartialDeep<TBehaviorOptions>, globalClassCss = "ms-editor")
  {
    this.logger.info("constructor", { rootElement, options, globalClassCss })

    this.loggerConfiguration = mergeDeep({}, options.logger, DefaultLoggerConfiguration)

    this.event = new EditorEvent(rootElement)
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
    return this.#behaviors.initPromise
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

  get tool(): EditorTool
  {
    return this.behaviors.tool
  }
  set tool(i: EditorTool)
  {
    this.logger.info("set tool", i)
    this.behaviors.tool = i
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
    if (this.behaviors) {
      this.behaviors.destroy()
    }
    if (options.configuration.offscreen) {
      this.#behaviors = new OIBehaviors(options, this.layers, this.event)
    }
    else if (options.configuration.server?.protocol === "REST") {
      this.#behaviors = new RestBehaviors(options, this.layers, this.event)
    }
    else {
      this.#behaviors = new WSBehaviors(options, this.layers, this.event)
    }
    this.logger.debug("instantiateBehaviors", this.#behaviors)
  }

  async #initializeBehaviors(): Promise<void>
  {
    this.logger.info("initializeBehaviors", "start")
    this.layers.showLoader()
    this.closeMessageModal()
    return this.behaviors.init()
      .then(async () =>
      {
        this.logger.info("initializeBehaviors", "then");
        (this.layers.root as HTMLEditorElement).editor = this
        this.event.emitLoaded()
      })
      .catch((error: Error) =>
      {
        this.logger.error("initializeBehaviors", error)
        this.layers.showMessageError(error)
        throw error
      })
      .finally(() =>
      {
        this.logger.debug("initializeBehaviors", "finally")
        this.layers.hideLoader()
        this.layers.updateState(true)
      })
  }

  closeMessageModal(inError?: boolean): void
  {
    if (inError) {
      this.behaviors.destroy()
        .then(() => this.initialize())
    }
  }

  async initialize(): Promise<void>
  {
    this.logger.info("initialize")
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
    try {
      this.logger.info("undo")
      await this.behaviors.undo()
      this.logger.debug("undo", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async redo(): Promise<IModel>
  {
    try {
      this.logger.info("redo")
      await this.behaviors.redo()
      this.logger.debug("redo", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async clear(): Promise<IModel>
  {
    try {
      this.logger.info("clear")
      await this.behaviors.clear()
      this.logger.debug("clear", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async resize(): Promise<IModel>
  {
    try {
      this.logger.info("resize")
      const compStyles = window.getComputedStyle(this.layers.root)
      const height = Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
      const width = Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
      await this.behaviors.resize(height, width)
      this.logger.debug("resize", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    try {
      this.logger.info("export", { mimeTypes })
      await this.behaviors.export(mimeTypes)
      this.logger.debug("export", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async convert(params?: { conversionState?: TConverstionState, mimeTypes?: string[] }): Promise<IModel | never>
  {
    try {
      this.logger.info("export", { params })
      await this.behaviors.convert(params?.conversionState, params?.mimeTypes)
      this.logger.debug("convert", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<IModel | never>
  {
    try {
      this.logger.info("import", { data, mimeType })
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
        this.logger.debug("import", this.model)
        return this.model
      }
      return Promise.reject("Import impossible, behaviors has no import function")
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<IModel>
  {
    try {
      this.logger.info("importPointEvents", { strokes })
      await this.behaviors.importPointEvents(strokes)
      this.logger.debug("importPointEvents", this.model)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      throw error
    }
  }
}
