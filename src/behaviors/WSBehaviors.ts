import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
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
import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"

export class WSBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: SVGRenderer
  recognizer: WSRecognizer
  undoRedoManager: UndoRedoManager
  initialized: DeferredPromise<void>

  #triggerConfiguration: TTriggerConfiguration
  #exportTimer?: ReturnType<typeof setTimeout>
  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportDeffered?: DeferredPromise<TExport>
  #convertDeffered?: DeferredPromise<TExport>
  #addStrokeDeffered?: DeferredPromise<TExport>
  #importDeffered?: DeferredPromise<TExport>
  #resizeDeffered?: DeferredPromise<void>
  #undoDeffered?: DeferredPromise<void>
  #redoDeffered?: DeferredPromise<void>
  #clearDeffered?: DeferredPromise<void>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new SVGRenderer(configuration.rendering)
    this.recognizer = new WSRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new UndoRedoManager(configuration["undo-redo"], model.getClone())
    this.#triggerConfiguration = configuration.triggers
    this.initialized = new DeferredPromise<void>()
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

    return this.initialized.promise
  }

  private onConnectionActive = () =>
  {
    this.initialized.resolve()
  }

  // private onPartChange = (evt: TWebSocketPartChangeEvent) =>
  // {
  //   console.log('onPartChange evt:', evt)
  // }

  // private onContentChange = (evt: TWebSocketContentChangeEvent) =>
  private onContentChange = () =>
  {
    this.#resizeDeffered?.resolve()
    this.#undoDeffered?.resolve()
    this.#redoDeffered?.resolve()
    this.#clearDeffered?.resolve()
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
    if (this.initialized.isPending) {
      this.initialized.reject(err)
    }
    this.globalEvent.emitError(err)
  }

  private onExport = (exportMessage: TWebSocketExportEvent) =>
  {
    this.#importDeffered?.resolve(exportMessage.exports)
    this.#addStrokeDeffered?.resolve(exportMessage.exports)
    this.#exportDeffered?.resolve(exportMessage.exports)
    this.#convertDeffered?.resolve(exportMessage.exports)

    clearTimeout(this.#exportTimer)
    this.#exportTimer = setTimeout(async () =>
    {
      this.globalEvent.emitExported(exportMessage.exports)
    }, this.#triggerConfiguration.exportContentDelay)
  }

  private onDisconnected = (event: CloseEvent) =>
  {
    const err = new Error(event.reason)
    err.name = event.code.toString()
    if (this.initialized.isPending) {
      if (event.code === 1000) {
        this.initialized.resolve()
      } else {
        this.initialized.reject(err)
      }
    }
    if (this.#addStrokeDeffered?.isPending) {
      this.#addStrokeDeffered?.reject(err)
    }
    if (this.#exportDeffered?.isPending) {
      this.#exportDeffered?.reject(err)
    }
    if (this.#convertDeffered?.isPending) {
      this.#convertDeffered?.reject(err)
    }
    if (this.#importDeffered?.isPending) {
      this.#importDeffered?.reject(err)
    }
    if (this.#resizeDeffered?.isPending) {
      this.#resizeDeffered?.reject(err)
    }
    if (this.#undoDeffered?.isPending) {
      this.#undoDeffered?.reject(err)
    }
    if (this.#redoDeffered?.isPending) {
      this.#redoDeffered?.reject(err)
    }
    if (this.#clearDeffered?.isPending) {
      this.#clearDeffered?.reject(err)
    }
  }

  setPenStyle(penStyle: TPenStyle): void
  {
    this.recognizer.setPenStyle(penStyle)
  }

  setPenStyleClasses(penStyleClasses: string): void
  {
    this.recognizer.setPenStyleClasses(penStyleClasses)
  }

  setTheme(theme: TTheme): void
  {
    this.recognizer.setTheme(theme)
  }

  drawCurrentStroke(model: IModel): void
  {
    const currentStroke = model.currentStroke as TStroke
    if (currentStroke) {
      currentStroke.id = `pendingStroke-${ model.rawStrokes.length }`
      this.renderer.drawPendingStroke(currentStroke)
    }
  }

  async updateModelRendering(model: IModel): Promise<IModel | never>
  {
    if (this.#triggerConfiguration.exportContent !== "DEMAND") {
      await this.initialized.promise
      model.updatePositionSent()
      this.undoRedoManager.addModelToStack(model)
      this.#addStrokeDeffered = new DeferredPromise<TExport>()
      this.recognizer.addStrokes(model)

      const exports: TExport = await this.#addStrokeDeffered.promise
      model.updatePositionReceived()
      if (model.exports) {
        Object.assign(model.exports, exports)
      } else {
        model.exports = exports
      }
      this.undoRedoManager.updateModelInStack(model)
      this.renderer.clearPendingStroke()
      this.#addStrokeDeffered = undefined
    }
    return model
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    let exports: TExport
    await this.initialized.promise
    if (this.#triggerConfiguration.exportContent === "DEMAND") {
      this.#addStrokeDeffered = new DeferredPromise<TExport>()
      this.recognizer.addStrokes(model)
      exports = await this.#addStrokeDeffered.promise
      this.#addStrokeDeffered = undefined
    } else {
      this.undoRedoManager.addModelToStack(model)
      this.#exportDeffered = new DeferredPromise<TExport>()
      await this.recognizer.export(model, mimeTypes)
      exports = await this.#exportDeffered.promise
      this.#exportDeffered = undefined
    }
    model.updatePositionReceived()
    if (model.exports) {
      Object.assign(model.exports, exports)
    } else {
      model.exports = exports
    }

    this.undoRedoManager.updateModelInStack(model)
    return model
  }

  async convert(model: IModel, conversionState?: TConverstionState): Promise<IModel | never>
  {
    await this.initialized.promise
    this.undoRedoManager.addModelToStack(model)
    this.#convertDeffered = new DeferredPromise<TExport>()
    this.recognizer.convert(conversionState)

    const myExportConverted: TExport = await this.#convertDeffered.promise
    model.updatePositionReceived()
    if (model.converts) {
      Object.assign(model.converts, myExportConverted)
    } else {
      model.converts = myExportConverted
    }
    this.undoRedoManager.updateModelInStack(model)
    this.#convertDeffered = undefined
    return model
  }

  async import(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>
  {
    await this.initialized.promise
    this.undoRedoManager.addModelToStack(model)
    this.#importDeffered = new DeferredPromise<TExport>()
    this.recognizer.import(data, mimeType)

    const myImportExport: TExport = await this.#importDeffered.promise
    model.updatePositionReceived()
    if (model.exports) {
      Object.assign(model.exports, myImportExport)
    } else {
      model.exports = myImportExport
    }
    this.undoRedoManager.updateModelInStack(model)
    this.#importDeffered = undefined
    return model
  }

  async resize(model: IModel): Promise<IModel>
  {
    await this.initialized.promise
    this.renderer.resize(model)
    this.#resizeDeffered = new DeferredPromise<void>()
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      this.recognizer.resize(model)
    }, this.#triggerConfiguration.resizeTriggerDelay)
    await this.#resizeDeffered.promise
    this.#resizeDeffered = undefined
    return model
  }

  async undo(): Promise<IModel>
  {
    await this.initialized.promise
    this.#undoDeffered = new DeferredPromise<void>()
    this.recognizer.undo()
    await this.#undoDeffered.promise
    this.#undoDeffered = undefined
    return this.undoRedoManager.undo()
  }

  async redo(): Promise<IModel>
  {
    await this.initialized.promise
    this.#redoDeffered = new DeferredPromise<void>()
    this.recognizer.redo()
    await this.#redoDeffered.promise
    this.#redoDeffered = undefined
    return this.undoRedoManager.redo()
  }

  async clear(model: IModel): Promise<IModel>
  {
    await this.initialized.promise
    this.#clearDeffered = new DeferredPromise<void>()
    this.recognizer.clear()
    const myModel = model.getClone()
    myModel.clear()
    this.undoRedoManager.addModelToStack(myModel)
    await this.#clearDeffered?.promise
    this.#clearDeffered = undefined
    return myModel
  }

  async destroy(): Promise<void>
  {
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.close(1000, WSMessage.CLOSE_RECOGNIZER)
    // this.undoRedoManager.reset(model)
    return Promise.resolve()
  }
}
