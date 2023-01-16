import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { RestRecognizer } from "../recognizer/RestRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { GlobalEvent } from "../event/GlobalEvent"
import { UndoRedoManager } from "../undo-redo/UndoRedoManager"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"

export class RestBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: CanvasRenderer
  recognizer: RestRecognizer
  undoRedoManager: UndoRedoManager
  initalise: DeferredPromise<void | Error>

  #triggerConfiguration: TTriggerConfiguration
  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportTimer?: ReturnType<typeof setTimeout>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new CanvasRenderer(configuration.rendering)
    this.recognizer = new RestRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new UndoRedoManager(configuration["undo-redo"], model.getClone())

    this.#triggerConfiguration = configuration.triggers
    this.initalise = new DeferredPromise<void | Error>()
  }

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  async #_export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    const newModel = await this.recognizer.export(model, mimeTypes)
    this.globalEvent.emitExported(newModel?.exports as TExport)
    return newModel
  }

  async init(domElement: HTMLElement): Promise<void | Error>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.initalise.resolve()
    return this.initalise.promise
  }

  drawCurrentStroke(model: IModel): void
  {
    this.renderer.drawPendingStroke(model.currentStroke)
  }

  async updateModelRendering(model: IModel): Promise<IModel | never>
  {
    this.renderer.drawModel(model)
    return this.export(model)
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    const deferred = new DeferredPromise<IModel | never>()
    this.undoRedoManager.addModelToStack(model)
    if (this.#triggerConfiguration.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      let currentModel = model.getClone()
      this.#exportTimer = setTimeout(async () =>
      {
        try {
          currentModel = await this.#_export(currentModel, mimeTypes)
          this.undoRedoManager.updateModelInStack(currentModel)
          if (model.modificationDate === currentModel.modificationDate) {
            model.exports = currentModel.exports
          }
          deferred.resolve(model)
        } catch (error) {
          deferred.reject(error as Error)
        }
      }, this.#triggerConfiguration.exportContentDelay)
    } else {
      deferred.resolve(model)
    }
    return deferred.promise
  }

  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    return this.recognizer.convert(model, conversionState, requestedMimeTypes)
  }

  async resize(model: IModel): Promise<IModel>
  {
    this.renderer.resize(model)
    if (model.strokeGroups.length) {
      const deferredResize = new DeferredPromise<IModel>()
      clearTimeout(this.#resizeTimer)
      this.#resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(model)
        deferredResize.resolve(resizeModel)
      }, this.#triggerConfiguration.resizeTriggerDelay)
      return deferredResize.promise
    } else {
      return Promise.resolve(model)
    }
  }

  async undo(): Promise<IModel>
  {
    const oldModel = this.undoRedoManager.undo()
    this.renderer.drawModel(oldModel)
    const modelUpdated = await this.#_export(oldModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    return modelUpdated
  }

  async redo(): Promise<IModel>
  {
    const newModel = this.undoRedoManager.redo()
    this.renderer.drawModel(newModel)
    const modelUpdated = await this.#_export(newModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    return modelUpdated
  }

  async clear(model: IModel): Promise<IModel>
  {
    const myModel = model.getClone()
    myModel.clear()
    this.undoRedoManager.addModelToStack(myModel)
    this.renderer.drawModel(myModel)
    myModel.modificationDate = new Date().getTime()
    this.globalEvent.emitCleared(myModel)
    this.globalEvent.emitExported(myModel.exports as TExport)
    return myModel
  }

  async destroy(model: IModel): Promise<void>
  {
    this.grabber.detach()
    this.renderer.destroy()
    this.undoRedoManager.reset(model)
    this.globalEvent.emitCleared(model)
    this.globalEvent.emitExported(model.exports as TExport)
    return Promise.resolve()
  }
}
