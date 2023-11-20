import { Intention, LoggerClass } from "../Constants"
import { Configuration, TConfiguration, TConverstionState } from "../configuration"
import { InternalEvent } from "../event"
import { PointerEventGrabber } from "../grabber"
import { LoggerManager } from "../logger"
import { IModel, Model, Stroke, TExport, TStroke } from "../model"
import { RestRecognizer } from "../recognizer"
import { CanvasRenderer } from "../renderer"
import { StyleManager, TPenStyle, TTheme } from "../style"
import { TUndoRedoContext, UndoRedoManager } from "../undo-redo"
import { DeferredPromise, TPointer } from "../utils"
import { IBehaviors, TBehaviorOptions } from "./IBehaviors"

/**
 * @group Behavior
 */
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
  #model: Model
  intention: Intention
  #logger = LoggerManager.getLogger(LoggerClass.BEHAVIORS)

  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(options: TBehaviorOptions)
  {
    this.#logger.info("constructor", { options })
    this.options = options
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options.penStyle, options.theme)

    this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    this.renderer = new CanvasRenderer(this.#configuration.rendering)
    this.recognizer = new RestRecognizer(this.#configuration.server, this.#configuration.recognition)

    this.intention = Intention.Write
    this.#model = new Model()
    this.undoRedoManager = new UndoRedoManager(this.#configuration["undo-redo"], this.model)
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get model(): Model
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
  async setPenStyle(penStyle?: TPenStyle | undefined): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
    return Promise.resolve()
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  async setPenStyleClasses(penStyleClasses?: string | undefined): Promise<void>
  {
    this.#logger.info("setPenStyleClasses", { penStyleClasses })
    this.styleManager.setPenStyleClasses(penStyleClasses)
    return Promise.resolve()
  }


  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  async setTheme(theme?: TTheme): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
    return Promise.resolve()
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
    this.grabber.onPointerDown = this.#onPointerDown.bind(this)
    this.grabber.onPointerMove = this.#onPointerMove.bind(this)
    this.grabber.onPointerUp = this.#onPointerUp.bind(this)
    return Promise.resolve()
  }

  #onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerDown", { intention: this.intention, evt, point })
    const { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    switch (this.intention) {
      case Intention.Erase:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(model => Object.assign(this.model, model))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      case Intention.Write:
        this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
        this.drawCurrentStroke()
        break
      default:
        this.#logger.warn("#onPointerDown", `onPointerDown intention unknow: "${ this.intention }"`)
        break
    }
  }

  #onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerMove", { intention: this.intention, point })
    switch (this.intention) {
      case Intention.Erase:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(newModel => Object.assign(this.#model, newModel))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      case Intention.Write:
        this.model.appendToCurrentStroke(point)
        this.drawCurrentStroke()
        break
      default:
        this.#logger.warn("#onPointerMove", `onPointerMove intention unknow: "${ this.intention }"`)
        break
    }
  }

  #onPointerUp(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerUp", { intention: this.intention, point })
    switch (this.intention) {
      case Intention.Erase:
        if (this.model.removeStrokesFromPoint(point).length > 0) {
          this.model.endCurrentStroke(point)
          this.updateModelRendering()
            .then(newModel => Object.assign(this.#model, newModel))
            .catch(error => this.internalEvent.emitError(error as Error))
        }
        break
      case Intention.Write:
        this.model.endCurrentStroke(point)
        this.updateModelRendering()
          .then(newModel => Object.assign(this.#model, newModel))
          .catch(error => this.internalEvent.emitError(error as Error))
        break
      default:
        this.#logger.warn("#onPointerUp", `onPointerUp intention unknow: "${ this.intention }"`)
        break
    }
  }

  drawCurrentStroke(): void
  {
    this.#logger.debug("drawCurrentStroke", { stroke: this.model.currentStroke })
    this.renderer.drawPendingStroke(this.model.currentStroke)
  }

  async updateModelRendering(): Promise<IModel>
  {
    this.#logger.info("updateModelRendering")
    this.renderer.drawModel(this.model)
    const deferred = new DeferredPromise<Model | never>()
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

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    this.#logger.info("export", { mimeTypes })
    const newModel = await this.recognizer.export(this.model.getClone(), mimeTypes)
    if (this.model.modificationDate === newModel.modificationDate) {
      this.model.mergeExport(newModel.exports as TExport)
    }
    this.undoRedoManager.updateModelInStack(newModel)
    this.#logger.debug("export", this.model)
    return this.model
  }

  async convert(conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel>
  {
    this.#logger.info("convert", { conversionState, requestedMimeTypes })
    const newModel = await this.recognizer.convert(this.model, conversionState, requestedMimeTypes)
    Object.assign(this.#model, newModel)
    this.#logger.debug("convert", this.model)
    return this.model
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    this.#logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<Model>()
    this.model.height = height
    this.model.width = width
    this.renderer.resize(this.model)
    if (this.model.strokes.length) {
      clearTimeout(this.#resizeTimer)
      this.#resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(this.model)
        deferredResize.resolve(resizeModel)
      }, this.#configuration.triggers.resizeTriggerDelay)
    } else {
      deferredResize.resolve(this.model)
    }
    this.#model = await deferredResize.promise
    this.#logger.debug("resize", { model: this.model })
    this.internalEvent.emitExported(this.model.exports as TExport)
    return this.model
  }

  async undo(): Promise<IModel>
  {
    this.#logger.info("undo")
    this.#model = this.undoRedoManager.undo() as Model
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.undoRedoManager.updateModelInStack(this.#model)
    this.internalEvent.emitExported(this.#model.exports as TExport)
    this.#logger.debug("undo", this.#model)
    return this.#model
  }

  async redo(): Promise<IModel>
  {
    this.#logger.info("redo")
    this.#model = this.undoRedoManager.redo() as Model
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.undoRedoManager.updateModelInStack(this.#model)
    this.internalEvent.emitExported(this.#model.exports as TExport)
    this.#logger.debug("redo", this.#model)
    return this.#model
  }

  async clear(): Promise<IModel>
  {
    this.#logger.info("clear")
    this.model.clear()
    this.undoRedoManager.addModelToStack(this.model)
    this.renderer.drawModel(this.model)
    this.internalEvent.emitExported(this.model.exports as TExport)
    this.#logger.debug("clear", this.model)
    return this.model
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    return Promise.resolve()
  }

  async importPointEvents(strokes: TStroke[]): Promise<IModel>
  {
    strokes.forEach((s) =>
    {
      const stroke = new Stroke(s.style, Math.random())
      stroke.pointers = s.pointers
      this.model.addStroke(stroke)
    })

    try {
      const newModel = await this.updateModelRendering()
      Object.assign(this.#model, newModel)
      return this.model
    } catch (error) {
      this.internalEvent.emitError(error as Error)
      throw error as Error
    }
  }
}
