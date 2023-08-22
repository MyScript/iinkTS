import { TConfiguration } from "./@types/Configuration"
import { IGrabber } from "./@types/grabber/Grabber"
import { TStroke } from "./@types/model/Stroke"
import { IModel, TExport, TJIIXExport } from "./@types/model/Model"
import { TPenStyle } from "./@types/style/PenStyle"
import { TTheme } from "./@types/style/Theme"
import { IBehaviors, TBehaviorOptions } from "./@types/Behaviors"
import { TConverstionState } from "./@types/configuration/RecognitionConfiguration"
import { TMarginConfiguration } from "./@types/configuration/recognition/MarginConfiguration"
import { TUndoRedoContext } from "./@types/undo-redo/UndoRedoContext"

import { Exports, ModeInteraction } from "./Constants"
import { PublicEvent } from "./event/PublicEvent"
import { InternalEvent } from "./event/InternalEvent"
import { SmartGuide } from "./smartguide/SmartGuide"
import { DeferredPromise } from "./utils/DeferredPromise"
import { RestBehaviors } from "./behaviors/RestBehaviors"
import { WSBehaviors } from "./behaviors/WSBehaviors"

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

  debug = false

  constructor(wrapperHTML: HTMLElement, options: TBehaviorOptions, globalClassCss = "ms-editor")
  {
    this.#initializationDeferred = new DeferredPromise<void>()

    this.wrapperHTML = wrapperHTML as HTMLEditorElement
    this.wrapperHTML.classList.add(globalClassCss)
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
    this.#addListeners()
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
    this.#instantiateBehaviors({ configuration })
    this.initialize()
  }

  get mode(): ModeInteraction
  {
    return this.behaviors.mode
  }
  set mode(m: ModeInteraction)
  {
    this.behaviors.mode = m
    switch (this.behaviors.mode) {
      case ModeInteraction.Erasing:
        this.wrapperHTML.classList.add("erasing")
        this.wrapperHTML.classList.remove("selecting")
        break
      // case ModeInteraction.Selecting:
      //   this.model.resetSelectedStrokes()
      //   this.wrapperHTML.classList.remove("erasing")
      //   this.wrapperHTML.classList.add("selecting")
      //   break;
      default:
        document.body.style.cursor = "initial"
        this.wrapperHTML.classList.remove("erasing")
        this.wrapperHTML.classList.remove("selecting")
        break
    }
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
    this.behaviors.setPenStyle(ps)
  }

  get theme(): TTheme
  {
    return this.behaviors.theme
  }
  set theme(t: TTheme)
  {
    this.behaviors.setTheme(t)
  }

  get penStyleClasses(): string
  {
    return this.behaviors.penStyleClasses
  }
  set penStyleClasses(psc: string)
  {
    this.behaviors.setPenStyleClasses(psc)
  }

  #instantiateBehaviors(options: TBehaviorOptions)
  {
    if (!options?.configuration) {
      throw new Error("Configuration required")
    }
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
  }

  #initializeBehaviors(): Promise<void>
  {
    this.#initializationDeferred = new DeferredPromise<void>()
    this.#loaderHTML.style.display = "initial"
    this.#cleanMessage()
    return this.behaviors.init(this.wrapperHTML)
      .then(async () =>
      {
        this.wrapperHTML.editor = this
        this.#initializationDeferred.resolve()
        this.events.emitLoaded()
      })
      .catch((e: Error) =>
      {
        this.#initializationDeferred.reject(e)
        this.#showError(e)
      })
      .finally(() =>
      {
        this.#loaderHTML.style.display = "none"
        return this.#initializationDeferred.promise
      })
  }

  #initializeSmartGuide(): void
  {
    this.#smartGuide?.destroy()
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

  #showError(err: Error)
  {
    this.#messageHTML.style.display = "initial"
    this.#messageHTML.classList.add("error-msg")
    this.#messageHTML.classList.remove("info-msg")
    this.#messageHTML.innerText = err.message
    if (this.debug) {
      const pName = document.createElement("p")
      pName.innerHTML = err.name
      this.#messageHTML.prepend(pName)

      const pStack = document.createElement("p")
      pStack.style.width = "50vw"
      pStack.style.marginLeft = "calc(-25vw + 100px)"
      pStack.innerHTML = err.stack || ""
      this.#messageHTML.appendChild(pStack)
    }
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
    if (this.debug) {
      let panel = document.getElementById("stroke-panel")
      const text = JSON.stringify(this.model.rawStrokes.map((s: TStroke) => ({ pointerType: s.pointerType, pointerId: s.pointerId, pointers: s.pointers })))
      if (!panel) {
        panel = document.createElement("div")
        panel.id = "stroke-panel"
        panel.addEventListener("click", () =>
        {
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
    this.model.mergeExport(exports)
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
    this.import(new Blob([JSON.stringify(jiix)], { type: Exports.JIIX }), Exports.JIIX)
  }

  async initialize(): Promise<void>
  {
    await this.#initializeBehaviors()
    this.#initializeSmartGuide()
  }

  async waitForIdle(): Promise<void>
  {
    if (this.behaviors.waitForIdle)
    {
      return this.behaviors.waitForIdle()
    }
    return
  }

  async undo(): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    await this.behaviors.undo()
    this.#showStrokesIfDebug()
    return this.model
  }

  async redo(): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    await this.behaviors.redo()
    this.#showStrokesIfDebug()
    return this.model
  }

  async clear(): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    await this.behaviors.clear()
    this.events.emitCleared(this.model)
    this.#showStrokesIfDebug()
    return this.model
  }

  async resize(): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    if (this.configuration.rendering.smartGuide.enable) {
      this.#smartGuide?.resize()
    }
    const height = Math.max(this.wrapperHTML.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.wrapperHTML.clientWidth, this.configuration.rendering.minWidth)
    await this.behaviors.resize(height, width)
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    await this.behaviors.export(mimeTypes)
    return this.model
  }

  async convert(params?: { conversionState?: TConverstionState, mimeTypes?: string[] }): Promise<IModel | never>
  {
    await this.#initializationDeferred.promise
    await this.behaviors.convert(params?.conversionState, params?.mimeTypes)
    this.events.emitConverted(this.model.converts as TExport)
    return this.model
  }

  async import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<IModel | never>
  {
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
      return this.model
    }
    return Promise.reject("Import impossible, behaviors has no import function")
  }

  async importPointEvents(strokes: TStroke[]): Promise<IModel>
  {
    await this.#initializationDeferred.promise
    if (this.behaviors.importPointEvents) {
      await this.behaviors.importPointEvents(strokes)
      this.events.emitImported(this.model.exports as TExport)
      return this.model
    }
    return Promise.reject("Import impossible, behaviors has no importPointEvents function")
  }

}
