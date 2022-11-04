import { IBehaviors } from "../@types/Behaviors"
import { IStroker } from "../@types/stroker/Stroker"
import { TConfiguration } from "../@types/Configuration"
import { IRenderer } from "../@types/renderer/Renderer"
import { IModel, TExport } from "../@types/model/Model"

import { PointerEventGrabber } from '../grabber/PointerEventGrabber'
import { CanvasRenderer } from "../renderer/canvas/CanvasRenderer"
import { QuadraticCanvasStroker } from "../renderer/canvas/CanvasQuadraticStroker"
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { TWebSocketContentChangeEvent, TWebSocketExportEvent, TWebSocketPartChangeEvent, TWebSocketPatchEvent } from "../@types/recognizer/WSRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { Model } from "../model/Model"
import { GlobalEvent } from "../event/GlobalEvent"

export class WSBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  stroker: IStroker
  renderer: IRenderer
  recognizer: WSRecognizer
  initalise: DeferredPromise<void>
  exportDeffered?: DeferredPromise<TExport>
  addStrokeDeffered?: DeferredPromise<IModel>

  constructor(configuration: TConfiguration)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.stroker = new QuadraticCanvasStroker()
    this.renderer = new CanvasRenderer(configuration.rendering)
    this.recognizer = new WSRecognizer(configuration.server, configuration.recognition)
    this.initalise = new DeferredPromise<void>()
  }

  get globalEvents(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  init(domElement: HTMLElement, model: IModel): Promise<void>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.recognizer.init(model.height, model.width)

    this.recognizer.wsEvent.addConnectionActiveListener(this.onConnectionActive)
    this.recognizer.wsEvent.addPartChangeListener(this.onPartChange)
    this.recognizer.wsEvent.addContentChangeListener(this.onContentChange)
    this.recognizer.wsEvent.addPatchListener(this.onPatch)
    this.recognizer.wsEvent.addExportListener(this.onExport)
    this.recognizer.wsEvent.addDisconnectedListener(this.onDisconnected)

    return this.initalise.promise
  }

  private onConnectionActive = () => {
    this.initalise.resolve()
  }

  private onPartChange = (evt: TWebSocketPartChangeEvent) =>
  {
    console.log('onPartChange evt:', evt)
  }

  private onContentChange = (evt: TWebSocketContentChangeEvent) =>
  {
    console.log('onContentChange evt:', evt)
    this.addStrokeDeffered?.resolve({} as IModel)
  }

  private onPatch = (evt: TWebSocketPatchEvent) =>
  {
    console.log('onContentChange evt:', evt)
  }

  private onExport = (exportMessage: TWebSocketExportEvent) =>
  {
    console.log('WSBehaviors => callback on WSExported exportMessage: ', exportMessage)
    this.exportDeffered?.resolve(exportMessage.exports)
    this.globalEvents.emitExported(exportMessage.exports)
  }

  private onDisconnected = (event: CloseEvent) =>
  {
    if (this.initalise.isPending) {
      if (event.code === 1000) {
        this.initalise.resolve()
      } else {
        const err = new Error(event.reason)
        err.name = event.code.toString()
        this.initalise.reject(err)
      }
    }
  }

  drawCurrentStroke(model: IModel): void
  {
    this.renderer.drawCurrentStroke(model, this.stroker)
  }

  drawModel(model: IModel): void
  {
    this.renderer.drawModel(model, this.stroker)
  }

  async addStrokes(model: IModel): Promise<IModel | never>
  {
    await this.initalise.promise
    this.addStrokeDeffered = new DeferredPromise<IModel>()
    console.log('WSBehaviors => addStrokes model: ', model)
    this.recognizer.addStrokes(model)

    await this.addStrokeDeffered.promise
    this.addStrokeDeffered = undefined
    return model
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    await this.initalise.promise
    this.exportDeffered = new DeferredPromise<TExport>()
    await this.recognizer.export(model, mimeTypes)

    const exports: TExport = await this.exportDeffered.promise

    model.updatePositionReceived()
    // model.rawResults.exports = exports
    if (model.exports) {
      Object.assign(model.exports, exports)
    } else {
      model.exports = exports
    }
    this.exportDeffered = undefined
    return model
  }

  async resize(model: IModel): Promise<IModel>
  {
    await this.initalise.promise
    return this.recognizer.resize(model)
  }

  async undo(): Promise<IModel>
  {
    await this.initalise.promise
    // TODO
    return new Model(1, 1)
    // const oldModel = this.undoRedoManager.undo()
    // this.drawModel(oldModel)
    // const modelUpdated = await this._export(oldModel)
    // this.undoRedoManager.updateModelInStack(modelUpdated)
    // return modelUpdated
  }

  async redo(): Promise<IModel>
  {
    await this.initalise.promise
    // TODO
    return new Model(1, 1)
    // const newModel = this.undoRedoManager.redo()
    // this.drawModel(newModel)
    // const modelUpdated = await this._export(newModel)
    // this.undoRedoManager.updateModelInStack(modelUpdated)
    // return modelUpdated
  }

  async clear(model: IModel): Promise<IModel>
  {
    await this.initalise.promise
    const myModel = model.getClone()
    myModel.clear()
    // this.undoRedoManager.addModelToStack(myModel)
    // this.behaviors.drawModel(myModel)
    // this.globalEvents.emitExported(myModel.exports as TExport)
    // this.globalEvents.emitCleared(myModel)
    return myModel
  }
}
