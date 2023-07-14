import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { RestRecognizer } from "../recognizer/RestRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { RestUndoRedoManager } from "../undo-redo/RestUndoRedoManager"
import { InternalEvent } from "../event/InternalEvent"

export class RestBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: CanvasRenderer
  recognizer: RestRecognizer
  undoRedoManager: RestUndoRedoManager

  #triggerConfiguration: TTriggerConfiguration
  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new CanvasRenderer(configuration.rendering)
    this.recognizer = new RestRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new RestUndoRedoManager(configuration["undo-redo"], model)

    this.#triggerConfiguration = configuration.triggers
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get context(): TUndoRedoContext
  {
    return this.undoRedoManager.context
  }

  async init(domElement: HTMLElement): Promise<void | Error>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.internalEvent.emitExported(this.context.stack[0].exports as TExport)
    return Promise.resolve()
  }

  drawCurrentStroke(model: IModel): void
  {
    this.renderer.drawPendingStroke(model.currentStroke)
  }

  async updateModelRendering(model: IModel): Promise<IModel | never>
  {
    this.renderer.drawModel(model)
    const deferred = new DeferredPromise<IModel | never>()
    this.undoRedoManager.addModelToStack(model)
    if (this.#triggerConfiguration.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      let currentModel = model.getClone()
      this.#exportTimer = setTimeout(async () =>
      {
        try {
          currentModel = await this.recognizer.export(currentModel)
          this.undoRedoManager.updateModelInStack(currentModel)
          if (model.modificationDate === currentModel.modificationDate) {
            model.exports = currentModel.exports
          }
          deferred.resolve(model)
        } catch (error) {
          deferred.reject(error as Error)
        }
      }, this.#triggerConfiguration.exportContent === "QUIET_PERIOD" ? this.#triggerConfiguration.exportContentDelay : 0)
    } else {
      deferred.resolve(model)
    }
    await deferred.promise
    this.internalEvent.emitExported(model.exports as TExport)
    return deferred.promise
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    const newModel = await this.recognizer.export(model.getClone(), mimeTypes)
    if (model.modificationDate === newModel.modificationDate) {
      model.mergeExport(newModel.exports as TExport)
    }
    this.undoRedoManager.updateModelInStack(newModel)
    return model
  }

  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    return this.recognizer.convert(model, conversionState, requestedMimeTypes)
  }

  async resize(model: IModel): Promise<IModel>
  {
    const deferredResize = new DeferredPromise<IModel>()
    this.renderer.resize(model)
    if (model.strokeGroups.length) {
      clearTimeout(this.#resizeTimer)
      this.#resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(model)
        deferredResize.resolve(resizeModel)
      }, this.#triggerConfiguration.resizeTriggerDelay)
    } else {
      deferredResize.resolve(model)
    }
    const newModel = await deferredResize.promise
    this.internalEvent.emitExported(newModel.exports as TExport)
    return newModel
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async undo(_model: IModel): Promise<IModel>
  {
    const oldModel = this.undoRedoManager.undo()
    this.renderer.drawModel(oldModel)
    const modelUpdated = await this.recognizer.export(oldModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    this.internalEvent.emitExported(modelUpdated.exports as TExport)
    return modelUpdated
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async redo(_model: IModel): Promise<IModel>
  {
    const newModel = this.undoRedoManager.redo()
    this.renderer.drawModel(newModel)
    const modelUpdated = await this.recognizer.export(newModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    this.internalEvent.emitExported(modelUpdated.exports as TExport)
    return modelUpdated
  }

  async clear(model: IModel): Promise<IModel>
  {
    const myModel = model.getClone()
    myModel.clear()
    this.undoRedoManager.addModelToStack(myModel)
    this.renderer.drawModel(myModel)
    myModel.modificationDate = new Date().getTime()
    this.internalEvent.emitExported(myModel.exports as TExport)
    return myModel
  }

  async destroy(model: IModel): Promise<void>
  {
    this.grabber.detach()
    this.renderer.destroy()
    this.undoRedoManager.reset(model)
    this.internalEvent.emitExported(model.exports as TExport)
    return Promise.resolve()
  }
}
