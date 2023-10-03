import { IBehaviors, TBehaviorOptions } from "../@types/Behaviors"
import { IModel, TExport } from "../@types/model/Model"
import { TConfiguration } from "../@types/Configuration"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { TPointer } from "../@types/geometry"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { RestRecognizer } from "../recognizer/RestRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { UndoRedoManager } from "../undo-redo/UndoRedoManager"
import { InternalEvent } from "../event/InternalEvent"
import { StyleManager } from "../style/StyleManager"
import { Configuration } from "../configuration/Configuration"
import { Model } from "../model/Model"
import { ModeInteraction } from "../Constants"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class RestBehaviors implements IBehaviors
{
  name = "RestBehaviors"
  options: TBehaviorOptions
  grabber: PointerEventGrabber
  renderer: CanvasRenderer
  recognizer: RestRecognizer
  undoRedoManager: UndoRedoManager
  styleManager: StyleManager
  #configuration: TConfiguration
  #model: IModel
  mode: ModeInteraction
  #logger: Logger

  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(options: TBehaviorOptions)
  {
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.BEHAVIORS)
    this.#logger.info("constructor", { options })
    this.options = options
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options.penStyle, options.theme)

    this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    this.renderer = new CanvasRenderer(this.#configuration.rendering)
    this.recognizer = new RestRecognizer(this.#configuration.server, this.#configuration.recognition)

    this.mode = ModeInteraction.Writing
    this.#model = new Model()
    this.undoRedoManager = new UndoRedoManager(this.#configuration["undo-redo"], this.model)
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get model(): IModel
  {
    return this.#model
  }

  get context(): TUndoRedoContext
  {
    return this.undoRedoManager.context
  }

  get currentPenStyle(): TPenStyle
  {
    return this.styleManager.currentPenStyle
  }

  get penStyle(): TPenStyle
  {
    return this.styleManager.penStyle
  }
  setPenStyle(ps?: TPenStyle)
  {
    this.#logger.info("setPenStyle", { ps })
    this.styleManager.setPenStyle(ps)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  setPenStyleClasses(psc?: string)
  {
    this.#logger.info("setPenStyleClasses", { psc })
    this.styleManager.setPenStyleClasses(psc)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  setTheme(t?: TTheme)
  {
    this.#logger.info("setTheme", { t })
    this.styleManager.setTheme(t)
  }

  get configuration(): TConfiguration
  {
    return this.#configuration
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    this.#logger.info("init", { domElement })
    this.model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
    this.model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
    this.undoRedoManager.updateModelInStack(this.model)

    this.renderer.init(domElement)

    this.grabber.attach(domElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)
  }

  private onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerDown", { evt, point })
    const { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    switch (this.mode) {
      case ModeInteraction.Erasing:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(model => Object.assign(this.model, model))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      default:
        this.#logger.warn("onPointerDown default", { evt, point })
        this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
        this.drawCurrentStroke()
        break
    }
  }

  private onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerMove", { _evt, point })
    switch (this.mode) {
      case ModeInteraction.Erasing:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(newModel => Object.assign(this.#model, newModel))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      default:
        this.#logger.warn("onPointerMove default", { _evt, point })
        this.model.appendToCurrentStroke(point)
        this.drawCurrentStroke()
        break
    }
  }

  private onPointerUp(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerUp", { _evt, point })
    switch (this.mode) {
      case ModeInteraction.Erasing:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(newModel => Object.assign(this.#model, newModel))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      default:
        this.#logger.warn("onPointerUp default", { _evt, point })
        this.model.endCurrentStroke(point)
        this.updateModelRendering()
          .then(newModel => Object.assign(this.#model, newModel))
          .catch(error => this.internalEvent.emitError(error as Error))
        break
    }
  }

  drawCurrentStroke(): void
  {
    this.renderer.drawPendingStroke(this.model.currentStroke)
  }

  async updateModelRendering(): Promise<IModel | never>
  {
    this.#logger.debug("updateModelRendering", this.model)
    this.renderer.drawModel(this.model)
    const deferred = new DeferredPromise<IModel | never>()
    this.undoRedoManager.addModelToStack(this.model)
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      let currentModel = this.model.getClone()
      this.#exportTimer = setTimeout(async () =>
      {
        try {
          currentModel = await this.recognizer.export(currentModel)
          this.undoRedoManager.updateModelInStack(currentModel)
          if (this.model.modificationDate === currentModel.modificationDate) {
            this.model.exports = currentModel.exports
          }
          deferred.resolve(this.model)
        } catch (error) {
          this.#logger.error("updateModelRendering", { error })
          deferred.reject(error as Error)
        }
      }, this.#configuration.triggers.exportContent === "QUIET_PERIOD" ? this.#configuration.triggers.exportContentDelay : 0)
    } else {
      deferred.resolve(this.model)
    }
    await deferred.promise
    this.internalEvent.emitExported(this.model.exports as TExport)
    this.#logger.debug("updateModelRendering", this.model.exports)
    return deferred.promise
  }

  async export(mimeTypes?: string[]): Promise<IModel | never>
  {
    this.#logger.debug("export", this.model)
    this.#logger.info("export", { mimeTypes })
    const newModel = await this.recognizer.export(this.model.getClone(), mimeTypes)
    if (this.model.modificationDate === newModel.modificationDate) {
      this.model.mergeExport(newModel.exports as TExport)
    }
    this.undoRedoManager.updateModelInStack(newModel)
    this.#logger.debug("export", this.model)
    return this.model
  }

  async convert(conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    this.#logger.debug("convert", this.model)
    this.#logger.info("convert", { conversionState, requestedMimeTypes })
    const newModel = await this.recognizer.convert(this.model, conversionState, requestedMimeTypes)
    Object.assign(this.#model, newModel)
    this.#logger.debug("convert", this.model)
    return this.model
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    this.#logger.debug("resize", this.model)
    this.#logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<IModel>()
    this.model.height = height
    this.model.width = width
    this.renderer.resize(this.model)
    if (this.model.rawStrokes.length) {
      clearTimeout(this.#resizeTimer)
      this.#resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(this.model)
        deferredResize.resolve(resizeModel)
      }, this.#configuration.triggers.resizeTriggerDelay)
    } else {
      deferredResize.resolve(this.model)
    }
    const newModel = await deferredResize.promise
    this.#logger.debug("resize", { newModel })
    this.internalEvent.emitExported(newModel.exports as TExport)
    return newModel
  }

  async undo(): Promise<IModel>
  {
    this.#logger.debug("undo", this.#model)
    this.#logger.info("undo", {})
    this.#model = this.undoRedoManager.undo()
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.undoRedoManager.updateModelInStack(this.#model)
    this.internalEvent.emitExported(this.#model.exports as TExport)
    this.#logger.debug("undo", this.#model)
    return this.#model
  }

  async redo(): Promise<IModel>
  {
    this.#logger.debug("redo", this.#model)
    this.#logger.info("redo", {})
    this.#model = this.undoRedoManager.redo()
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.undoRedoManager.updateModelInStack(this.#model)
    this.internalEvent.emitExported(this.#model.exports as TExport)
    this.#logger.debug("redo", this.#model)
    return this.#model
  }

  async clear(): Promise<IModel>
  {
    this.#logger.debug("clear", this.model)
    this.#logger.info("clear", {})
    this.model.clear()
    this.undoRedoManager.addModelToStack(this.model)
    this.renderer.drawModel(this.model)
    this.internalEvent.emitExported(this.model.exports as TExport)
    this.#logger.debug("clear", this.model)
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy", {})
    this.grabber.detach()
    this.renderer.destroy()
    return Promise.resolve()
  }
}
