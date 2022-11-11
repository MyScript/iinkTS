import { TConfiguration, TConfigurationClient } from "./@types/Configuration"
import { TEditorOptions } from "./@types/Editor"
import { IGrabber } from "./@types/grabber/Grabber"
import { IModel, TExport } from "./@types/model/Model"
import { TPoint } from "./@types/renderer/Point"
import { TPenStyle } from "./@types/style/PenStyle"
import { TTheme } from "./@types/style/Theme"

import { EventType } from "./Constants"
import { BehaviorsManager } from "./behaviors/BehaviorsManager"
import { Configuration } from "./configuration/Configuration"
import { GlobalEvent } from "./event/GlobalEvent"
import { Model } from "./model/Model"
import { StyleManager } from "./style/StyleManager"

import './iink.css'
import { IBehaviors } from "./@types/Behaviors"
import { TConverstionState } from "./@types/configuration/RecognitionConfiguration"

export enum EditorMode
{
  Mouse = 'mouse',
  Pen = 'pen',
  Touche = 'touch',
  Eraser = 'eraser'
}

export type HTMLEditorElement = HTMLElement &
{
  editor: Editor
}

export class Editor
{
  wrapperHTML: HTMLEditorElement
  private _loaderHTML: HTMLDivElement
  private _errorHTML: HTMLDivElement
  private _configuration: Configuration
  private _behaviorsManager: BehaviorsManager
  private _styleManager: StyleManager
  private _mode: EditorMode
  private _initialized = false
  // private _exportTimer?: ReturnType<typeof setTimeout>

  model: IModel
  debug = false

  constructor(wrapperHTML: HTMLElement, options?: TEditorOptions)
  {
    this.wrapperHTML = wrapperHTML as HTMLEditorElement
    this.wrapperHTML.classList.add(options?.globalClassCss || 'ms-editor')

    this._loaderHTML = document.createElement('div')
    this._loaderHTML.classList.add('loader')
    this._loaderHTML = this.wrapperHTML.appendChild(this._loaderHTML)
    this._loaderHTML.style.display = 'initial'

    this._errorHTML = document.createElement('div')
    this._errorHTML.classList.add('error-msg')
    this._errorHTML = this.wrapperHTML.appendChild(this._errorHTML)
    this._errorHTML.style.display = 'none'

    this._mode = EditorMode.Pen

    this._styleManager = new StyleManager(options?.penStyle, options?.theme)

    this._configuration = new Configuration(options?.configuration)

    const width = Math.max(this.wrapperHTML.clientWidth, this.configuration.rendering.minWidth)
    const height = Math.max(this.wrapperHTML.clientHeight, this.configuration.rendering.minHeight)
    this.model = new Model(width, height)

    this._behaviorsManager = new BehaviorsManager(this.configuration, this.model, options?.behaviors)
    this.initalizeBehaviors()
  }

  get initialized(): boolean
  {
    return this._initialized
  }

  get configuration(): TConfiguration
  {
    return this._configuration
  }
  set configuration(config: TConfigurationClient)
  {
    if (!this.model.isEmpty) {
      this.model.clear()
    }
    // TODO maybe need some removeListener are close connection
    this._configuration.overrideDefaultConfiguration(config)

    this.model.height = Math.max(this.wrapperHTML.clientHeight, this._configuration.rendering.minHeight)
    this.model.width = Math.max(this.wrapperHTML.clientWidth, this._configuration.rendering.minWidth)

    this._behaviorsManager.overrideDefaultBehaviors(this._configuration, this.model)
    this.initalizeBehaviors()
  }
  get behaviors(): IBehaviors
  {
    return this._behaviorsManager.behaviors
  }
  get grabber(): IGrabber
  {
    return this._behaviorsManager.behaviors.grabber
  }
  get theme(): TTheme
  {
    return this._styleManager.theme
  }
  get penStyle(): TPenStyle
  {
    return this._styleManager.penStyle
  }
  get mode(): EditorMode
  {
    return this._mode
  }
  get events(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  private initalizeBehaviors(): void
  {
    this._behaviorsManager.init(this.wrapperHTML)
      .then(async () =>
      {
        this.grabber.onPointerDown = (evt: PointerEvent, point: TPoint) => this.pointerDown(evt, point)
        this.grabber.onPointerMove = (evt: PointerEvent, point: TPoint) => this.pointerMove(evt, point)
        this.grabber.onPointerUp = (evt: PointerEvent, point: TPoint) => this.pointerUp(evt, point)

        this.events.addEventListener(EventType.ERROR, (evt: Event) => this.handleError(evt))
        this.events.addEventListener(EventType.CLEAR, this.clear)
        // this.events.addEventListener(EventType.IMPORT, this.import)

        this._initialized = true
        this.wrapperHTML.editor = this
        this.events.emitLoaded()
      })
      .catch((e: Error) =>
      {
        this._initialized = false
        this.showError(e)
        this.events.emitError(e)
      })
      .finally(() =>
      {
        this._loaderHTML.style.display = 'none'
      })
  }

  private showError(err: Error)
  {
    this._errorHTML.style.display = 'initial'
    this._errorHTML.innerText = err.message
    if (this.debug) {
      const pName = document.createElement('p')
      pName.innerHTML = err.name
      this._errorHTML.prepend(pName)

      const pStack = document.createElement('p')
      pStack.style.width = '50vw'
      pStack.style.marginLeft = 'calc(-25vw + 100px)'
      pStack.innerHTML = err.stack || ''
      this._errorHTML.appendChild(pStack)
    }
  }

  private handleError(evt: Event)
  {
    // const error = (evt as unknown) as
    // if (this._errorHTML.innerText === Constants.Error.TOO_OLD || evt.reason === 'CLOSE_RECOGNIZER') {
    //   this._errorHTML.style.display = 'none'
    // } else {
      const customEvent = evt as CustomEvent
      const err = customEvent?.detail as Error
      this.showError(err)
    // }
  }

  pointerDown(evt: PointerEvent, point: TPoint): void
  {
    const target: Element = (evt.target as Element)
    const pointerDownOnEditor = target?.id === this.wrapperHTML.id || target?.classList?.contains('ms-canvas')
    if (pointerDownOnEditor) {
      let { pointerType } = evt
      if (this._mode === EditorMode.Eraser) {
        pointerType = EditorMode.Eraser
      }
      const style: TPenStyle = Object.assign({}, this.theme?.ink, this.penStyle)
      this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
      this.behaviors.drawCurrentStroke(this.model)
    }
  }

  pointerMove(_evt: PointerEvent, point: TPoint): void
  {
    this.model.appendToCurrentStroke(point)
    this.behaviors.drawCurrentStroke(this.model)
  }

  async pointerUp(_evt: PointerEvent, point: TPoint): Promise<void>
  {
    this.model.endCurrentStroke(point, this.penStyle)
    try {
      this.model = await this.behaviors.updateModelRendering(this.model)
    } catch (error) {
      this.showError(error as Error)
    }
  }

  setMode(mode: EditorMode): void
  {
    this._mode = mode
    if (this._mode === EditorMode.Eraser) {
      this.wrapperHTML.classList.add('erasing')
    } else {
      document.body.style.cursor = 'initial'
      this.wrapperHTML.classList.remove('erasing')
    }
  }

  async undo(): Promise<IModel>
  {
    this.model = await this.behaviors.undo()
    return this.model
  }

  async redo(): Promise<IModel>
  {
    this.model = await this.behaviors.redo()
    return this.model
  }

  async clear(): Promise<IModel>
  {
    this.model = await this.behaviors.clear(this.model)
    return this.model
  }

  async resize(): Promise<IModel>
  {
    this.model.height = Math.max(this.wrapperHTML.clientHeight, this.configuration.rendering.minHeight)
    this.model.width = Math.max(this.wrapperHTML.clientWidth, this.configuration.rendering.minWidth)
    this.model = await this.behaviors.resize(this.model)
    return this.model
  }

  async export(mimeTypes: string[]): Promise<IModel>
  {
    this.model = await this.behaviors.export(this.model, mimeTypes)
    this.events.emitExported(this.model.exports as TExport)
    return this.model
  }

  async convert(params: {conversionState?: TConverstionState, mimeTypes?: string[]}): Promise<IModel | never>
  {
    this.model = await this.behaviors.convert(this.model, params.conversionState, params.mimeTypes)
    this.events.emitConvert(this.model.converts as TExport)
    return this.model
  }

  // import(evt: Event)
  // {
  //   if (this.behaviors.import) {
  //     const customEvent = evt as CustomEvent
  //     if (customEvent?.detail) {
  //       const jiix: string = customEvent.detail.jiix
  //       const mimeType: string = customEvent.detail.mimeType
  //       this.behaviors.import(jiix, mimeType)
  //     }
  //   }
  // }
}
