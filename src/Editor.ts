import { TEditorOptions } from "./@types/Editor"
import { TConfiguration, TConfigurationClient } from "./@types/Configuration"
import { IGrabber } from "./@types/grabber/Grabber"
import { TStroke, TStrokeGroup } from "./@types/model/Stroke"
import { IModel, TExport, TJIIXExport } from "./@types/model/Model"
import { TPoint } from "./@types/renderer/Point"
import { TPenStyle } from "./@types/style/PenStyle"
import { TTheme } from "./@types/style/Theme"
import { IBehaviors } from "./@types/Behaviors"
import { TConverstionState } from "./@types/configuration/RecognitionConfiguration"
import { TMarginConfiguration } from "./@types/configuration/recognition/MarginConfiguration"

import { EventType } from "./Constants"
import { BehaviorsManager } from "./behaviors/BehaviorsManager"
import { Configuration } from "./configuration/Configuration"
import { GlobalEvent } from "./event/GlobalEvent"
import { Model } from "./model/Model"
import { StyleManager } from "./style/StyleManager"
import { SmartGuide } from "./smartguide/SmartGuide"
import { DeferredPromise } from "./utils/DeferredPromise"

import "./iink.css"

export enum EditorMode
{
  Writing = "writing",
  Erasing = "erasing",
  // Selecting = "selecting"
}

export type HTMLEditorElement = HTMLElement &
{
  editor: Editor
}

export class Editor
{
  wrapperHTML: HTMLEditorElement
  #loaderHTML: HTMLDivElement
  #messageHTML: HTMLDivElement
  #configuration: Configuration
  #behaviorsManager: BehaviorsManager
  #styleManager: StyleManager
  #localPenStyle: TPenStyle
  #smartGuide?: SmartGuide
  #mode: EditorMode
  #initializationDeferred: DeferredPromise<boolean>

  model: IModel
  debug = false

  constructor(wrapperHTML: HTMLElement, options?: TEditorOptions)
  {
    this.#initializationDeferred = new DeferredPromise<boolean>()

    this.wrapperHTML = wrapperHTML as HTMLEditorElement
    this.wrapperHTML.classList.add(options?.globalClassCss || "ms-editor")
    this.events.setElement(this.wrapperHTML)

    this.#loaderHTML = document.createElement("div")
    this.#loaderHTML.classList.add("loader")
    this.#loaderHTML.style.display = "initial"
    this.wrapperHTML.appendChild(this.#loaderHTML)

    this.#messageHTML = document.createElement("div")
    this.#messageHTML.classList.add("message")
    this.#messageHTML.style.display = "none"
    this.wrapperHTML.appendChild(this.#messageHTML)

    this.#mode = EditorMode.Writing

    this.#styleManager = new StyleManager(options?.penStyle, options?.theme)
    this.#localPenStyle = this.#styleManager.penStyle

    this.#configuration = new Configuration(options?.configuration)


    const width = Math.max(this.wrapperHTML.clientWidth, this.configuration.rendering.minWidth)
    const height = Math.max(this.wrapperHTML.clientHeight, this.configuration.rendering.minHeight)
    this.model = new Model(width, height)

    this.#behaviorsManager = new BehaviorsManager(this.configuration, this.model, options?.behaviors)

    this.#initalizeBehaviors()
    this.#initializeSmartGuide()
    this.#addListeners()
  }

  get initializationPromise(): Promise<boolean>
  {
    return this.#initializationDeferred.promise
  }

  get configuration(): TConfiguration
  {
    return this.#configuration
  }

  set configuration(config: TConfigurationClient)
  {
    this.#initializationDeferred = new DeferredPromise<boolean>()
    this.#configuration.overrideDefaultConfiguration(config)

    this.model.clear()
    this.model.height = Math.max(this.wrapperHTML.clientHeight, this.#configuration.rendering.minHeight)
    this.model.width = Math.max(this.wrapperHTML.clientWidth, this.#configuration.rendering.minWidth)

    this.#behaviorsManager.overrideDefaultBehaviors(this.#configuration, this.model)
    this.#initalizeBehaviors()

    this.#initializeSmartGuide()
  }

  get mode(): EditorMode
  {
    return this.#mode
  }

  set mode(m: EditorMode)
  {
    this.#mode = m
    switch (this.#mode) {
      case EditorMode.Erasing:
        this.wrapperHTML.classList.add("erasing")
        this.wrapperHTML.classList.remove("selecting")
        break;
      // case EditorMode.Selecting:
      //   this.model.resetSelectedStrokes()
      //   this.wrapperHTML.classList.remove("erasing")
      //   this.wrapperHTML.classList.add("selecting")
      //   break;
      default:
        document.body.style.cursor = "initial"
        this.wrapperHTML.classList.remove("erasing")
        this.wrapperHTML.classList.remove("selecting")
        break;
    }
  }

  get events(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  get behaviors(): IBehaviors
  {
    return this.#behaviorsManager.behaviors
  }

  get #grabber(): IGrabber
  {
    return this.#behaviorsManager.behaviors.grabber
  }

  get theme(): TTheme
  {
    return this.#styleManager.theme
  }

  set theme(t: TTheme)
  {
    this.#styleManager.overrideDefaultTheme(t)
    if (this.behaviors.setTheme) {
      this.behaviors.setTheme(this.theme)
    }
  }

  get penStyleClasses(): string
  {
    return this.#styleManager.penStyleClasses
  }

  set penStyleClasses(psc: string)
  {
    this.#styleManager.penStyleClasses = psc
    this.#localPenStyle = (this.theme[`.${this.penStyleClasses}`]) as TPenStyle
    if (this.behaviors.setPenStyleClasses) {
      this.behaviors.setPenStyleClasses(psc)
    }
  }

  get penStyle(): TPenStyle
  {
    return this.#styleManager.penStyle
  }

  set penStyle(ps: TPenStyle)
  {
    this.#styleManager.overrideDefaultPenStyle(ps)
    this.#localPenStyle = this.penStyle
    if (this.behaviors.setPenStyle) {
      this.behaviors.setPenStyle(this.penStyle)
    }
  }

  #initializeSmartGuide(): void
  {
    this.#smartGuide?.destroy()
    if (this.configuration.rendering.smartGuide.enable) {
      this.#smartGuide = new SmartGuide()
      let margin
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
      this.#smartGuide.init(this.wrapperHTML, margin as TMarginConfiguration, this.configuration.rendering)
    }
  }

  #initalizeBehaviors(): void
  {
    this.#cleanMessage()
    this.#behaviorsManager.init(this.wrapperHTML)
      .then(async () =>
      {
        this.#grabber.onPointerDown = (evt: PointerEvent, point: TPoint) => this.onPointerDown(evt, point)
        this.#grabber.onPointerMove = (evt: PointerEvent, point: TPoint) => this.onPointerMove(evt, point)
        this.#grabber.onPointerUp = (evt: PointerEvent, point: TPoint) => this.onPointerUp(evt, point)

        if (this.behaviors.setPenStyle) {
          this.behaviors.setPenStyle(this.penStyle)
        }
        if (this.behaviors.setTheme) {
          this.behaviors.setTheme(this.theme)
        }
        if (this.behaviors.setPenStyleClasses) {
          this.behaviors.setPenStyleClasses(this.penStyleClasses)
        }

        this.wrapperHTML.editor = this
        this.#initializationDeferred.resolve(true)
        this.events.emitLoaded()
      })
      .catch((e: Error) =>
      {
        this.#initializationDeferred.resolve(false)
        this.#showError(e)
        this.events.emitError(e)
      })
      .finally(() =>
      {
        this.#loaderHTML.style.display = "none"
      })
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

  #showNotif(message: string, timeout = 1000)
  {
    this.#messageHTML.style.display = "initial"
    this.#messageHTML.classList.add("info-msg")
    this.#messageHTML.classList.remove("error-msg")
    this.#messageHTML.innerText = message
    setTimeout(() => {
      this.#cleanMessage()
    }, timeout)
  }

  #addListeners(): void
  {
    this.events.addEventListener(EventType.CONVERT, () => this.convert({ conversionState: "DIGITAL_EDIT" }))
    this.events.addEventListener(EventType.CLEAR, () => this.clear())
    this.events.addEventListener(EventType.ERROR, (evt: Event) => this.#onError(evt))
    this.events.addEventListener(EventType.IMPORT, (evt: Event) => this.#onImport(evt))
    this.events.addEventListener(EventType.EXPORTED, (evt: Event) => this.#onExport(evt))
    this.events.addEventListener(EventType.NOTIF, (evt: Event) => this.#onNotif(evt))
    this.events.addEventListener(EventType.CLEAR_MESSAGE, () => this.#cleanMessage())
  }

  #onNotif(evt: Event): void
  {
    const payload = (evt as CustomEvent).detail as { message: string, timeout: number }
    this.#showNotif(payload.message, payload.timeout)
  }

  #onExport(evt: Event): void
  {
    if (this.configuration.rendering.smartGuide.enable) {
      const exports = (evt as CustomEvent).detail as TExport
      if (exports && exports["application/vnd.myscript.jiix"]) {
        const jjix = (exports["application/vnd.myscript.jiix"] as unknown) as string
        this.#smartGuide?.update(JSON.parse(jjix))
      }
    }
  }

  #onImport(evt: Event): void
  {
    const customEvent = evt as CustomEvent
    const jiix: string = customEvent.detail.jiix
    const mimeType: string = customEvent.detail.mimeType
    this.importBlob(new Blob([JSON.stringify(jiix)], { type: mimeType }), mimeType)
  }

  #onError(evt: Event)
  {
    const customEvent = evt as CustomEvent
    const err = customEvent?.detail as Error
    this.#showError(err)
  }

  onPointerDown(evt: PointerEvent, point: TPoint): void
  {
    const target: Element = (evt.target as Element)
    const pointerDownOnEditor = target?.id === this.wrapperHTML.id || target?.classList?.contains("ms-canvas")
    if (pointerDownOnEditor) {
      let { pointerType } = evt
      const style: TPenStyle = Object.assign({}, this.theme?.ink, this.#localPenStyle)
      switch (this.#mode) {
        // case EditorMode.Selecting:
        //   this.model.appendSelectedStrokesFromPoint(point)
        //   break;
        case EditorMode.Erasing:
          if (this.configuration.server.protocol === "WEBSOCKET") {
            pointerType = "eraser"
            this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
            this.behaviors.drawCurrentStroke(this.model)
          } else {
            if (this.model.removeStrokesFromPoint(point) > 0) {
              this.model.endCurrentStroke(point, this.penStyle)
              this.behaviors.updateModelRendering(this.model)
                .then(model => this.model = model)
                .catch(error => this.#showError(error as Error))
            }
          }
          break;
        default:
          this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
          this.behaviors.drawCurrentStroke(this.model)
          break;
      }
    }
  }

  onPointerMove(_evt: PointerEvent, point: TPoint): void
  {
    switch (this.#mode) {
      // case EditorMode.Selecting:
      //   this.model.appendSelectedStrokesFromPoint(point)
      //   break;
      case EditorMode.Erasing:
        if (this.configuration.server.protocol === "WEBSOCKET") {
          this.model.appendToCurrentStroke(point)
        } else {
          if (this.model.removeStrokesFromPoint(point) > 0) {
            this.model.endCurrentStroke(point, this.penStyle)
            this.behaviors.updateModelRendering(this.model)
              .then(model => this.model = model)
              .catch(error => this.#showError(error as Error))
          }
        }
        break;
      default:
        this.model.appendToCurrentStroke(point)
        break;
    }
    this.behaviors.drawCurrentStroke(this.model)
  }

  onPointerUp(_evt: PointerEvent, point: TPoint): void
  {
    switch (this.#mode) {
      // case EditorMode.Selecting:
      //   this.model.appendSelectedStrokesFromPoint(point)
      //   break;
      case EditorMode.Erasing:
        if (this.configuration.server.protocol === "WEBSOCKET") {
          this.model.endCurrentStroke(point, this.penStyle)
          this.behaviors.updateModelRendering(this.model)
            .then(model => this.model = model)
            .catch(error => this.#showError(error as Error))
        } else {
          if (this.model.removeStrokesFromPoint(point) > 0) {
            this.model.endCurrentStroke(point, this.penStyle)
            this.behaviors.updateModelRendering(this.model)
              .then(model => this.model = model)
              .catch(error => this.#showError(error as Error))
          }
        }
        break;
      default:
        this.model.endCurrentStroke(point, this.penStyle)
        this.behaviors.updateModelRendering(this.model)
          .then(model => this.model = model)
          .catch(error => this.#showError(error as Error))
        break;
    }
    if (this.debug) {
      this.showStrokes()
    }
  }

  showStrokes(): void
  {
    let panel = document.getElementById("stroke-panel")
    const text = JSON.stringify(this.model.rawStrokes.map((s: TStroke) => ({ pointerType: s.pointerType, pointerId: s.pointerId, x: s.x, y: s.y, t: s.t, p: s.p, })))
    if (!panel) {
      panel = document.createElement("div")
      panel.id = "stroke-panel"
      panel.addEventListener("click", () => {
        navigator.clipboard.writeText(panel?.innerText as string)
        this.#showNotif("strokes copied to clipboard!")
      })
      this.wrapperHTML.appendChild(panel)
    }
    panel.innerText = text
  }

  async undo(): Promise<IModel>
  {
    this.model = await this.behaviors.undo(this.model)
    return this.model
  }

  async redo(): Promise<IModel>
  {
    this.model = await this.behaviors.redo(this.model)
    return this.model
  }

  async clear(): Promise<IModel>
  {
    this.model = await this.behaviors.clear(this.model)
    this.events.emitCleared(this.model)
    return this.model
  }

  async importPointEvents(strokes: TStroke[]): Promise<IModel>
  {
    if(this.behaviors.importPointEvents)
    {
      this.model = await this.behaviors.importPointEvents(this.model, strokes)
    }
    else
    {
      throw new Error("Import points not implemented");

    }
    return this.model
  }

  async resize(): Promise<IModel>
  {
    if (this.configuration.rendering.smartGuide.enable) {
      this.#smartGuide?.resize()
    }
    this.model.height = Math.max(this.wrapperHTML.clientHeight, this.configuration.rendering.minHeight)
    this.model.width = Math.max(this.wrapperHTML.clientWidth, this.configuration.rendering.minWidth)
    this.model = await this.behaviors.resize(this.model)
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    this.model = await this.behaviors.export(this.model, mimeTypes)
    return this.model
  }

  async convert(params?: { conversionState?: TConverstionState, mimeTypes?: string[] }): Promise<IModel | never>
  {
    this.model = await this.behaviors.convert(this.model, params?.conversionState, params?.mimeTypes)
    this.events.emitConverted(this.model.converts as TExport)
    return this.model
  }

  async importBlob(data: Blob, mimeType?: string): Promise<IModel | never>
  {
    if (this.behaviors.import) {
      this.model = await this.behaviors.import(this.model, data, mimeType)
      this.events.emitImported(this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport)
      return this.model
    }
    return Promise.reject("Import impossible, behaviors has no import function")
  }

  async importText(data: string, mimeType?: string): Promise<IModel | never>
  {
    if (this.behaviors.import) {
      const dataToImport = new Blob([data])
      this.model = await this.behaviors.import(this.model, dataToImport, mimeType)
      this.events.emitImported(this.model.exports?.["application/vnd.myscript.jiix"] as TJIIXExport)
      return this.model
    }
    return Promise.reject("Import impossible, behaviors has no import function")
  }

  async reDraw (rawStrokes: TStroke[], strokeGroups: TStrokeGroup[]) {
    rawStrokes.forEach((stroke) => {
      this.model.addStroke(stroke)
    })
    strokeGroups.forEach((group) => {
      group.strokes.forEach((strokeFromGroup) => {
        this.model.addStrokeToGroup(strokeFromGroup, group.penStyle)
      })
    })
    return this.behaviors.updateModelRendering(this.model)
  }
}
