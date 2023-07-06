import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TStroke } from "../@types/model/Stroke"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { GlobalEvent } from "../event/GlobalEvent"
import { SVGRenderer } from "../renderer/svg/SVGRenderer"
import { UndoRedoManager } from "../undo-redo/UndoRedoManager"
import { WSMessage } from "../Constants"

export class WSBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: SVGRenderer
  recognizer: WSRecognizer
  undoRedoManager: UndoRedoManager

  #triggerConfiguration: TTriggerConfiguration

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new SVGRenderer(configuration.rendering)
    this.recognizer = new WSRecognizer(configuration.server, configuration.recognition)
    this.undoRedoManager = new UndoRedoManager(configuration["undo-redo"], model.getClone())
    this.#triggerConfiguration = configuration.triggers
  }

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    const model = this.undoRedoManager.getLastModel()
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.recognizer.wsEvent.addSVGPatchListener(this.onSVGPatch)
    return this.recognizer.init(model.height, model.width)
  }

  private onSVGPatch = (evt: TWebSocketSVGPatchEvent) =>
  {
    this.renderer.updatesLayer(evt.layer, evt.updates)
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
    try {
      if (this.#triggerConfiguration.exportContent !== "DEMAND") {
        model.updatePositionSent()
        this.undoRedoManager.addModelToStack(model)
        const updatedModel = await this.recognizer.addStrokes(model)
        this.undoRedoManager.updateModelInStack(updatedModel)
        this.renderer.clearPendingStroke()
        model.updatePositionReceived()
        model.mergeExport(updatedModel.exports as TExport)
      }
      return model
    } catch (error) {
      this.globalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    try {
      if (this.#triggerConfiguration.exportContent === "DEMAND") {
        this.undoRedoManager.addModelToStack(model)
        const modelUpdated = await this.recognizer.addStrokes(model)
        this.undoRedoManager.updateModelInStack(modelUpdated)
        return modelUpdated
      } else {
        this.undoRedoManager.addModelToStack(model)
        const modelUpdated = await this.recognizer.export(model, mimeTypes)
        this.undoRedoManager.updateModelInStack(modelUpdated)
        return modelUpdated
      }
    } catch (error) {
      this.globalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(model: IModel, conversionState?: TConverstionState): Promise<IModel | never>
  {
    const newModel = model.getClone()
    this.undoRedoManager.addModelToStack(newModel)
    const modelUpdated = await this.recognizer.convert(newModel, conversionState)
    this.undoRedoManager.updateModelInStack(modelUpdated)
    return modelUpdated
  }

  async import(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>
  {
    const newModel = model.getClone()
    this.undoRedoManager.addModelToStack(newModel)
    const myImportExport = await this.recognizer.import(data, mimeType)
    newModel.updatePositionReceived()
    newModel.mergeExport(myImportExport)
    this.undoRedoManager.updateModelInStack(newModel)
    return newModel
  }

  async resize(model: IModel): Promise<IModel>
  {
    const newModel = model.getClone()
    this.renderer.resize(newModel)
    await new Promise(resolve => setTimeout(resolve, this.#triggerConfiguration.resizeTriggerDelay))
    this.globalEvent.emitExported(newModel.exports as TExport)
    return this.recognizer.resize(newModel)
  }

  async undo(model: IModel): Promise<IModel>
  {
    const newModel = await this.recognizer.undo(model)
    this.undoRedoManager.updateModelInStack(newModel)
    return this.undoRedoManager.undo()
  }

  async redo(model: IModel): Promise<IModel>
  {
    const newModel = await this.recognizer.redo(model)
    this.undoRedoManager.updateModelInStack(newModel)
    return this.undoRedoManager.redo()
  }

  async clear(model: IModel): Promise<IModel>
  {
    const newModel = await this.recognizer.clear(model)
    this.undoRedoManager.addModelToStack(newModel)
    return newModel
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
