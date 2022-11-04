import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"

import { PointerEventGrabber } from '../grabber/PointerEventGrabber'
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { QuadraticCanvasStroker } from "../renderer/canvas/CanvasQuadraticStroker"
import { RestRecognizer } from "../recognizer/RestRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { GlobalEvent } from "../event/GlobalEvent"
import { UndoRedoManager } from "../undo-redo/UndoRedoManager"

export class RestBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  stroker: QuadraticCanvasStroker
  renderer: CanvasRenderer
  recognizer: RestRecognizer
  undoRedoManager: UndoRedoManager
  private _triggerConfiguration: TTriggerConfiguration
  private _resizeTimer?: ReturnType<typeof setTimeout>
  private _exportTimer?: ReturnType<typeof setTimeout>
  initalise: DeferredPromise<void | Error>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.stroker = new QuadraticCanvasStroker()
    this.renderer = new CanvasRenderer(configuration.rendering)
    this.recognizer = new RestRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new UndoRedoManager(configuration["undo-redo"], model.getClone())

    this._triggerConfiguration = configuration.triggers
    this.initalise = new DeferredPromise<void | Error>()
  }

  get globalEvents(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  private async _export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    const newModel = await this.recognizer.export(model, mimeTypes)
    this.globalEvents.emitExported(newModel?.exports as TExport)
    return newModel
  }

  init(domElement: HTMLElement): Promise<void | Error>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.initalise.resolve()
    return this.initalise.promise
  }

  drawCurrentStroke(model: IModel): void
  {
    this.renderer.drawCurrentStroke(model, this.stroker)
  }

  drawModel(model: IModel): void
  {
    this.renderer.drawModel(model, this.stroker)
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    const deferred = new DeferredPromise<IModel | never>()
    this.undoRedoManager.addModelToStack(model)
    if (this._triggerConfiguration.exportContent !== "DEMAND") {
      clearTimeout(this._exportTimer)
      let currentModel = model.getClone()
      this._exportTimer = setTimeout(async () =>
      {
        currentModel = await this._export(currentModel, mimeTypes)
        this.undoRedoManager.updateModelInStack(currentModel)
        if (model.modificationDate === currentModel.modificationDate) {
          model.exports = currentModel.exports
        }
        deferred.resolve(model)
      }, this._triggerConfiguration.exportContentDelay)
    } else {
      deferred.resolve(model)
    }
    return deferred.promise
  }

  async resize(model: IModel): Promise<IModel>
  {
    this.renderer.resize(model, this.stroker)
    if (model.strokeGroups.length) {
      const deferredResize = new DeferredPromise<IModel>()
      clearTimeout(this._resizeTimer)
      this._resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(model)
        deferredResize.resolve(resizeModel)
      }, this._triggerConfiguration.resizeTriggerDelay)
      return deferredResize.promise
    } else {
      return Promise.resolve(model)
    }
  }

  async undo(): Promise<IModel>
  {
    const oldModel = this.undoRedoManager.undo()
    this.drawModel(oldModel)
    const modelUpdated = await this._export(oldModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    return modelUpdated
  }

  async redo(): Promise<IModel>
  {
    const newModel = this.undoRedoManager.redo()
    this.drawModel(newModel)
    const modelUpdated = await this._export(newModel)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    return modelUpdated
  }

  async clear(model: IModel): Promise<IModel>
  {
    const myModel = model.getClone()
    myModel.clear()
    this.undoRedoManager.addModelToStack(myModel)
    this.drawModel(myModel)
    myModel.modificationDate = new Date().getTime()
    console.log('myModel.exports: ', myModel.exports);
    this.globalEvents.emitExported(myModel.exports as TExport)
    this.globalEvents.emitCleared(myModel)
    return myModel
  }
}
