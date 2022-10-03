import { TConfiguration, TConfigurationClient } from "./@types/Configuration"
import { TEditorOptions } from "./@types/Editor"
import { IGrabber } from "./@types/grabber/Grabber"
import { IModel, TExport } from "./@types/model/Model"
import { IRecognizer } from "./@types/recognizer/Recognizer"
import { TPoint } from "./@types/renderer/Point"
import { IRenderer } from "./@types/renderer/Renderer"
import { IStroker } from "./@types/stroker/Stroker"
import { TPenStyle } from "./@types/style/PenStyle"
import { TTheme } from "./@types/style/Theme"

import Constants from "./Constants"
import { BehaviorsManager } from "./behaviors/BehaviorsManager"
import { Configuration } from "./configuration/Configuration"
import { EventHelper } from "./event/EventHelper"
import { Model } from "./model/Model"
import { StyleManager } from "./style/StyleManager"
import { UndoRedoManager } from "./undo-redo/UndoRedoManager"

import './iink.css'

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
  private _wrapperHTML: HTMLEditorElement
  private _loaderHTML: HTMLDivElement
  private _errorHTML: HTMLDivElement
  private _configuration: Configuration
  private _behaviorsManager: BehaviorsManager
  private _styleManager: StyleManager
  private _undoRedoManager: UndoRedoManager
  private _mode: EditorMode
  private _initialized = false
  private _resizeTimer?: ReturnType<typeof setTimeout>
  private _exportTimer?: ReturnType<typeof setTimeout>

  model: IModel
  debug = false

  constructor(wrapperHTML: HTMLElement, options?: TEditorOptions)
  {
    this._wrapperHTML = wrapperHTML as HTMLEditorElement
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

    this._undoRedoManager = new UndoRedoManager(this.configuration["undo-redo"], this.model.getClone())

    this._behaviorsManager = new BehaviorsManager(this.configuration, options?.behaviors)
    this._behaviorsManager.init(this._wrapperHTML)
      .then(async () =>
      {
        this.grabber.onPointerDown = (evt: PointerEvent, point: TPoint) => this.pointerDown(evt, point)
        this.grabber.onPointerMove = (evt: PointerEvent, point: TPoint) => this.pointerMove(evt, point)
        this.grabber.onPointerUp = (evt: PointerEvent, point: TPoint) => this.pointerUp(evt, point)

        this.events.addEventListener(Constants.EventType.ERROR, (evt: Event) => this.handleError(evt))
        this.events.addEventListener(Constants.EventType.CLEAR, this.clear)
        this.events.addEventListener(Constants.EventType.IMPORT, this.import)

        this._initialized = true
        this._wrapperHTML.editor = this
      })
      .catch((e: Error) =>
      {
        this.showError(e)
        this.events.emitError(e)
      })
      .finally(() =>
      {
        this._loaderHTML.style.display = 'none'
        this.events.emitLoaded()
      })
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
    this.clear()
    // TODO maybe need some removeListener are close connection
    this._configuration.overrideDefaultConfiguration(config)
    this._undoRedoManager = new UndoRedoManager(this.configuration["undo-redo"], this.model.getClone())
    this._behaviorsManager.overrideDefaultBehaviors(this._configuration)
    this._behaviorsManager.init(this._wrapperHTML)
      .then(async () =>
      {
        this.grabber.onPointerDown = (evt: PointerEvent, point: TPoint) => this.pointerDown(evt, point)
        this.grabber.onPointerMove = (evt: PointerEvent, point: TPoint) => this.pointerMove(evt, point)
        this.grabber.onPointerUp = (evt: PointerEvent, point: TPoint) => this.pointerUp(evt, point)

        this.events.addEventListener(Constants.EventType.ERROR, (evt: Event) => this.handleError(evt))
        this.events.addEventListener(Constants.EventType.CLEAR, this.clear)
        this.events.addEventListener(Constants.EventType.IMPORT, this.import)

        this._initialized = true
        this._wrapperHTML.editor = this
      })
      .catch((e: Error) =>
      {
        this.showError(e)
        this.events.emitError(e)
      })
      .finally(() =>
      {
        this._loaderHTML.style.display = 'none'
        this.events.emitLoaded()
      })
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
  get mode(): EditorMode
  {
    return this._mode
  }
  get events(): EventHelper
  {
    return EventHelper.getInstance()
  }
  get recognizer(): IRecognizer
  {
    return this._behaviorsManager.behaviors.recognizer
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
    const customEvent = evt as CustomEvent
    const err = customEvent?.detail as Error
    this.showError(err)
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
    this._undoRedoManager.addModelToStack(this.model)
    this.renderer.drawModel(this.model, this.stroker)
    if (this.configuration.triggers.exportContent !== "DEMAND") {
      const timeout = this.configuration.triggers.exportContentDelay
      clearTimeout(this._exportTimer)
      const currentModel = this.model.getClone()
      this._exportTimer = setTimeout(async () =>
      {
        try {
          await this.recognizer.export(currentModel)
          this._undoRedoManager.updateModelInStack(currentModel)
          if (this.model.modificationDate === currentModel.modificationDate) {
            this.model.exports = currentModel.exports
          }
          this.events.emitExported(currentModel.exports as TExport)
        } catch (error) {
          this.showError(error as Error)
        }
      }, timeout)
    }
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
    this._undoRedoManager.addModelToStack(this.model)
    this.renderer.drawModel(this.model, this.stroker)
    this.events.emitExported(this.model.exports as TExport)
    this.events.emitCleared(this.model)
  }

  async undo(): Promise<IModel>
  {
    this.model = this._undoRedoManager.undo()
    this.renderer.drawModel(this.model, this.stroker)
    await this.recognizer.export(this.model)
    this._undoRedoManager.updateModelInStack(this.model)
    this.events.emitExported(this.model.exports as TExport)
    return this.model
  }

  async redo(): Promise<IModel | false>
  {
    this.model = this._undoRedoManager.redo()
    this.renderer.drawModel(this.model, this.stroker)
    await this.recognizer.export(this.model)
    this._undoRedoManager.updateModelInStack(this.model)
    this.events.emitExported(this.model.exports as TExport)
    return this.model
  }

  resize(): void
  {
    this.model.width = this._wrapperHTML.clientWidth
    this.model.height = this._wrapperHTML.clientHeight
    this.renderer.resize(this.model, this.stroker)
    if (this.model.strokeGroups.length) {
      window.clearTimeout(this._resizeTimer)
      this._resizeTimer = setTimeout(() =>
      {
        this.recognizer.resize(this.model)
      }, this.configuration.triggers.resizeTriggerDelay)
    }
  }

  async export(mimeTypes: string[]): Promise<IModel | never>
  {
    return this.recognizer.export(this.model, mimeTypes)
  }

  import(evt: Event)
  {
    if (this.recognizer.import) {
      const customEvent = evt as CustomEvent
      if (customEvent?.detail) {
        const jiix: string = customEvent.detail.jiix
        const mimeType: string = customEvent.detail.mimeType
        this.recognizer.import(jiix, mimeType)
      }
    }
  }

}
