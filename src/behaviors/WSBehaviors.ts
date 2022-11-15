import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"

import { PointerEventGrabber } from '../grabber/PointerEventGrabber'
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { TWebSocketExportEvent, TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { DeferredPromise } from "../utils/DeferredPromise"
import { GlobalEvent } from "../event/GlobalEvent"
import { SVGRenderer } from "../renderer/svg/SVGRenderer"
import { UndoRedoManager } from "../undo-redo/UndoRedoManager"
import { TStroke } from "../@types/model/Stroke"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { WSMessage } from "../Constants"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"

export class WSBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: SVGRenderer
  recognizer: WSRecognizer
  undoRedoManager: UndoRedoManager
  private _triggerConfiguration: TTriggerConfiguration
  private _resizeTimer?: ReturnType<typeof setTimeout>
  private _exportDeffered?: DeferredPromise<TExport>
  private _convertDeffered?: DeferredPromise<TExport>
  private _addStrokeDeffered?: DeferredPromise<TExport>
  private _importDeffered?: DeferredPromise<TExport>
  private _resizeDeffered?: DeferredPromise<void>
  private _undoDeffered?: DeferredPromise<void>
  private _redoDeffered?: DeferredPromise<void>
  private _clearDeffered?: DeferredPromise<void>
  initalise: DeferredPromise<void>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new SVGRenderer(configuration.rendering)
    this.recognizer = new WSRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new UndoRedoManager(configuration["undo-redo"], model.getClone())
    this._triggerConfiguration = configuration.triggers
    this.initalise = new DeferredPromise<void>()
  }

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  init(domElement: HTMLElement): Promise<void>
  {
    const model = this.undoRedoManager.getLastModel()
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.recognizer.init(model.height, model.width)

    this.recognizer.wsEvent.addConnectionActiveListener(this.onConnectionActive)
    // this.recognizer.wsEvent.addPartChangeListener(this.onPartChange)
    this.recognizer.wsEvent.addContentChangeListener(this.onContentChange)
    this.recognizer.wsEvent.addSVGPatchListener(this.onSVGPatch)
    this.recognizer.wsEvent.addExportListener(this.onExport)
    this.recognizer.wsEvent.addDisconnectedListener(this.onDisconnected)
    this.recognizer.wsEvent.addErrorListener(this.onError)

    return this.initalise.promise
  }

  private onConnectionActive = () => {
    this.initalise.resolve()
  }

  // private onPartChange = (evt: TWebSocketPartChangeEvent) =>
  // {
  //   console.log('onPartChange evt:', evt)
  // }

  // private onContentChange = (evt: TWebSocketContentChangeEvent) =>
  private onContentChange = () =>
  {
    this._resizeDeffered?.resolve()
    this._undoDeffered?.resolve()
    this._redoDeffered?.resolve()
    this._clearDeffered?.resolve()
  }

  private onSVGPatch = (evt: TWebSocketSVGPatchEvent) =>
  {
    // TODO analyse if required ...
    // if (evt.updates.length) {
    //   if (model.recognizedSymbols) {
    //     model.recognizedSymbols.push(res)
    //   } else {
    //     model.recognizedSymbols = [res]
    //   }
    // }
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  private onError = (err: Error) =>
  {
    if (this.initalise.isPending) {
      this.initalise.reject(err)
    }
    this.globalEvent.emitError(err)
  }

  private onExport = (exportMessage: TWebSocketExportEvent) =>
  {
    this._addStrokeDeffered?.resolve(exportMessage.exports)
    this._exportDeffered?.resolve(exportMessage.exports)
    this.globalEvent.emitExported(exportMessage.exports)
  }

  private onDisconnected = (event: CloseEvent) =>
  {
    const err = new Error(event.reason)
    err.name = event.code.toString()
    if (this.initalise.isPending) {
      if (event.code === 1000) {
        this.initalise.resolve()
      } else {
        this.initalise.reject(err)
      }
    }
    if (this._addStrokeDeffered?.isPending) {
      this._addStrokeDeffered?.reject(err)
    }
    if (this._resizeDeffered?.isPending) {
      this._resizeDeffered?.reject(err)
    }
    if (this._undoDeffered?.isPending) {
      this._undoDeffered?.reject(err)
    }
    if (this._redoDeffered?.isPending) {
      this._redoDeffered?.reject(err)
    }
    if (this._clearDeffered?.isPending) {
      this._clearDeffered?.reject(err)
    }
  }

  drawCurrentStroke(model: IModel): void
  {
    const currentStroke = model.currentStroke as TStroke
    if (currentStroke) {
      currentStroke.id = `pendingStroke-${model.rawStrokes.length}`
      this.renderer.drawPendingStroke(currentStroke)
    }
  }

  async updateModelRendering(model: IModel): Promise<IModel | never>
  {
    await this.initalise.promise
    model.updatePositionSent()
    this.undoRedoManager.addModelToStack(model)
    this._addStrokeDeffered = new DeferredPromise<TExport>()
    this.recognizer.addStrokes(model)

    const exports: TExport = await this._addStrokeDeffered.promise
    model.updatePositionReceived()
    if (model.exports) {
      Object.assign(model.exports, exports)
    } else {
      model.exports = exports
    }
    this.undoRedoManager.updateModelInStack(model)
    this.renderer.clearPendingStroke()
    this._addStrokeDeffered = undefined
    return model
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    await this.initalise.promise
    this.undoRedoManager.addModelToStack(model)
    this._exportDeffered = new DeferredPromise<TExport>()
    await this.recognizer.export(model, mimeTypes)

    const exports: TExport = await this._exportDeffered.promise

    model.updatePositionReceived()
    if (model.exports) {
      Object.assign(model.exports, exports)
    } else {
      model.exports = exports
    }

    this.undoRedoManager.updateModelInStack(model)
    this._exportDeffered = undefined
    return model
  }

  async convert(model: IModel, conversionState?: TConverstionState): Promise<IModel | never>
  {
    await this.initalise.promise
    this.undoRedoManager.addModelToStack(model)
    this._convertDeffered = new DeferredPromise<TExport>()
    this.recognizer.convert(conversionState)

    const myExportConverted: TExport = await this._convertDeffered.promise
    model.updatePositionReceived()
    if (model.converts) {
      Object.assign(model.converts, myExportConverted)
    } else {
      model.converts = myExportConverted
    }
    this.undoRedoManager.updateModelInStack(model)
    this._convertDeffered = undefined
    return model
  }

  async import(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>
  {
    await this.initalise.promise
    this.undoRedoManager.addModelToStack(model)
    this._importDeffered = new DeferredPromise<TExport>()
    this.recognizer.import(data, mimeType)

    const myImportExport: TExport = await this._importDeffered.promise
    model.updatePositionReceived()
    if (model.exports) {
      Object.assign(model.exports, myImportExport)
    } else {
      model.exports = myImportExport
    }
    this.undoRedoManager.updateModelInStack(model)
    this._importDeffered = undefined
    return model
  }

  async resize(model: IModel): Promise<IModel>
  {
    await this.initalise.promise
    this.renderer.resize(model)
    this._resizeDeffered = new DeferredPromise<void>()
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(async () =>
    {
      this.recognizer.resize(model)
    }, this._triggerConfiguration.resizeTriggerDelay)
    await this._resizeDeffered.promise
    this._resizeDeffered = undefined
    return model
  }

  async undo(): Promise<IModel>
  {
    await this.initalise.promise
    this._undoDeffered = new DeferredPromise<void>()
    this.recognizer.undo()
    await this._undoDeffered.promise
    return this.undoRedoManager.undo()
  }

  async redo(): Promise<IModel>
  {
    await this.initalise.promise
    this._redoDeffered = new DeferredPromise<void>()
    this.recognizer.redo()
    await this._redoDeffered.promise
    return this.undoRedoManager.redo()
  }

  async clear(model: IModel): Promise<IModel>
  {
    await this.initalise.promise
    this._clearDeffered = new DeferredPromise<void>()
    this.recognizer.clear()
    const myModel = model.getClone()
    myModel.clear()
    this.undoRedoManager.addModelToStack(myModel)
    await this._clearDeffered?.promise
    this._clearDeffered = undefined
    return myModel
  }

  async destroy(): Promise<void>
  {
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.close(1000, WSMessage.CLOSE_RECOGNIZER)
    return Promise.resolve()
  }
}
