import { TConfiguration, TConfigurationClient } from "./@types/Configuration"
import { TEditorOptions } from "./@types/Editor"
import { IGrabber } from "./@types/grabber/Grabber"
import { IModel } from "./@types/model/Model"
import { TPoint } from "./@types/renderer/Point"
import { IRenderer } from "./@types/renderer/Renderer"
import { IStroker } from "./@types/stroker/Stroker"
import { TPenStyle } from "./@types/style/PenStyle"
import { TTheme } from "./@types/style/Theme"
import { BehaviorsManager } from "./behaviors/BehaviorsManager"
import { Configuration } from "./configuration/Configuration"

import './iink.css'
import { Model } from "./model/Model"
import { StyleManager } from "./style/StyleManager"

export enum EditorMode
{
  Mouse = 'mouse',
  Pen = 'pen',
  Touche = 'touch',
  Eraser = 'eraser'
}

export class Editor
{
  private _wrapperHTML: HTMLElement
  private _loaderHTML: HTMLDivElement
  private _errorHTML: HTMLDivElement
  private _configuration: Configuration
  private _behaviorsManager: BehaviorsManager
  private _styleManager: StyleManager
  private _mode: EditorMode

  model: IModel
  debug = false

  constructor(wrapperHTML: HTMLElement, options?: TEditorOptions)
  {
    this._wrapperHTML = wrapperHTML as HTMLElement
    this._wrapperHTML.classList.add(options?.globalClassCss || 'ms-editor')

    this._loaderHTML = document.createElement('div')
    this._loaderHTML.classList.add('loader')
    this._loaderHTML = this._wrapperHTML.appendChild(this._loaderHTML)
    this._loaderHTML.style.display = 'initial'

    this._errorHTML = document.createElement('div')
    this._errorHTML.classList.add('error-msg')
    this._errorHTML = this._wrapperHTML.appendChild(this._errorHTML)
    this._errorHTML.style.display = 'none'

    this._mode = EditorMode.Pen

    this.model = new Model(this._wrapperHTML.clientWidth, this._wrapperHTML.clientHeight)

    this._styleManager = new StyleManager(options?.penStyle, options?.theme)

    this._configuration = new Configuration(options?.configuration)

    this._behaviorsManager = new BehaviorsManager(this.configuration, options?.behaviors)
    this._behaviorsManager.init(this._wrapperHTML)
      .then(async () => {
        this.grabber.onPointerDown = (evt: PointerEvent, point: TPoint) => this.pointerDown(evt, point)
        this.grabber.onPointerMove = (evt: PointerEvent, point: TPoint) => this.pointerMove(evt, point)
        this.grabber.onPointerUp = (evt: PointerEvent, point: TPoint) => this.pointerUp(evt, point)
      })
      .catch((e: Error) =>
      {
        this.showError(e)
      })
      .finally(() =>
      {
        this._loaderHTML.style.display = 'none'
      })
  }

  get configuration(): TConfiguration
  {
    return this._configuration
  }
  set configuration(config: TConfigurationClient)
  {
    this.clear()
    if (this._configuration) {
      // TODO maybe need some removeListener are close connection
      this._configuration.overrideDefaultConfiguration(config)
    } else {
      this._configuration = new Configuration(config)
    }
  }
  get grabber(): IGrabber
  {
    return this._behaviorsManager.behaviors.grabber
  }
  get stroker(): IStroker
  {
    return this._behaviorsManager.behaviors.stroker
  }
  get renderer(): IRenderer
  {
    return this._behaviorsManager.behaviors.renderer
  }
  get theme(): TTheme
  {
    return this._styleManager.theme
  }
  get penStyle(): TPenStyle
  {
    return this._styleManager.penStyle
  }
  get mode(): EditorMode {
    return this._mode
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

  pointerDown(evt: PointerEvent, point: TPoint): void
  {
    const target: Element = (evt.target as Element)
    const pointerDownOnEditor = target?.id === this._wrapperHTML.id || target?.classList?.contains('ms-canvas')
    if (pointerDownOnEditor) {
      let { pointerType } = evt
      if (this._mode === EditorMode.Eraser) {
        pointerType = EditorMode.Eraser
      }
      const style: TPenStyle = Object.assign({}, this.theme?.ink, this.penStyle)
      this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
      this.renderer.drawCurrentStroke(this.model, this.stroker)
    }
  }

  pointerMove(_evt: PointerEvent, point: TPoint): void
  {
    this.model.appendToCurrentStroke(point)
    this.renderer.drawCurrentStroke(this.model, this.stroker)
  }

  pointerUp(_evt: PointerEvent, point: TPoint): void
  {
    this.model.endCurrentStroke(point, this.penStyle)
    this.renderer.drawModel(this.model, this.stroker)
  }

  setMode(mode: EditorMode): void
  {
    this._mode = mode
    if (this._mode === EditorMode.Eraser) {
      this._wrapperHTML.classList.add('erasing')
    } else {
      document.body.style.cursor = 'initial'
      this._wrapperHTML.classList.remove('erasing')
    }
  }

  clear(): void
  {
    this.model.clear()
    this.renderer.drawModel(this.model, this.stroker)
  }

  resize(): void
  {
    this.model.width = this._wrapperHTML.clientWidth
    this.model.height = this._wrapperHTML.clientHeight
    this.renderer.resize(this.model, this.stroker)
  }
}
