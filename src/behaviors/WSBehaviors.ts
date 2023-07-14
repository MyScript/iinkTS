import { IBehaviors } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TStroke } from "../@types/model/Stroke"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { SVGRenderer } from "../renderer/svg/SVGRenderer"
import { WSMessage } from "../Constants"
import { InternalEvent } from "../event/InternalEvent"
import { DeferredPromise } from "../utils/DeferredPromise"

export class WSBehaviors implements IBehaviors
{
  grabber: PointerEventGrabber
  renderer: SVGRenderer
  recognizer: WSRecognizer
  context: TUndoRedoContext

  #triggerConfiguration: TTriggerConfiguration
  #resizeTimer?: ReturnType<typeof setTimeout>

  constructor(configuration: TConfiguration, model: IModel)
  {
    this.grabber = new PointerEventGrabber(configuration.grabber)
    this.renderer = new SVGRenderer(configuration.rendering)
    this.recognizer = new WSRecognizer(configuration.server, configuration.recognition)
    this.context = {
      canRedo: false,
      canUndo: false,
      empty: true,
      stackIndex: 0,
      possibleUndoCount: 0,
      stack: [model.getClone()]
    }
    this.#triggerConfiguration = configuration.triggers
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    this.grabber.attach(domElement)
    this.renderer.init(domElement)
    this.internalEvent.addSVGPatchListener(this.onSVGPatch)
    this.internalEvent.addContextChangeListener(this.onContextChange)
    const model = this.context.stack[0]
    return this.recognizer.init(model.height, model.width)
  }

  private onSVGPatch = (evt: TWebSocketSVGPatchEvent) =>
  {
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  private onContextChange = (context: TUndoRedoContext) =>
  {
    this.context.canRedo = context.canRedo
    this.context.canUndo = context.canUndo
    this.context.empty = context.empty
    this.context.possibleUndoCount = context.possibleUndoCount
    this.context.stackIndex = context.stackIndex
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

  async updateModelRendering(model: IModel): Promise<IModel>
  {
    this.context.stack.push(model.getClone())
    if (this.#triggerConfiguration.exportContent !== "DEMAND") {
      model.updatePositionSent()
      const updatedModel = await this.recognizer.addStrokes(model)
      this.renderer.clearPendingStroke()
      model.mergeExport(updatedModel.exports as TExport)
      model.updatePositionReceived()
    }
    return model
  }

  async importPointEvents(model:IModel, strokes: TStroke[]): Promise<IModel | never>
  {
    const exportPoints = await this.recognizer.importPointEvents(strokes)
    model.mergeExport(exportPoints)
    return model
  }

  async export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  {
    try {
      if (this.#triggerConfiguration.exportContent === "DEMAND") {
        return this.recognizer.addStrokes(model)
      } else {
        return this.recognizer.export(model, mimeTypes)
      }
    } catch (error) {
      this.internalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(model: IModel, conversionState?: TConverstionState): Promise<IModel | never>
  {
    return this.recognizer.convert(model, conversionState)
  }

  async import(model: IModel, data: Blob, mimeType?: string): Promise<IModel | never>
  {
    return this.recognizer.import(model, data, mimeType)
  }

  async resize(model: IModel): Promise<IModel>
  {
    const deferredResize = new DeferredPromise<IModel>()
    const clonedModel = model.getClone()
    this.renderer.resize(clonedModel)
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      try {
        const resizeModel = await this.recognizer.resize(clonedModel)
        deferredResize.resolve(resizeModel)
      } catch (error) {
        deferredResize.reject(error as Error)
      }
    }, this.#triggerConfiguration.resizeTriggerDelay)

    const newModel = await deferredResize.promise
    this.internalEvent.emitExported(newModel.exports as TExport)
    return newModel
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async undo(_model: IModel): Promise<IModel>
  {
    if (this.context.canUndo) {
      const previousModel = this.context.stack[this.context.stackIndex - 1]
      return this.recognizer.undo(previousModel)
    }
    else {
      throw new Error("Undo not allowed")
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async redo(_model: IModel): Promise<IModel>
  {
    if (this.context.canRedo) {
      const nextModel = this.context.stack[this.context.stackIndex + 1]
      return this.recognizer.redo(nextModel)
    }
    else {
      throw new Error("Redo not allowed")
    }
  }

  async clear(model: IModel): Promise<IModel>
  {
    const clearedModel = model.getClone()
    clearedModel.clear()
    this.context.stack.push(clearedModel)
    return this.recognizer.clear(clearedModel)
  }

  async destroy(): Promise<void>
  {
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.close(1000, WSMessage.CLOSE_RECOGNIZER)
    return Promise.resolve()
  }
}
