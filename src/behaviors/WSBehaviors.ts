import { IBehaviors, TBehaviorOptions } from "../@types/Behaviors"
import { TConfiguration } from "../@types/Configuration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TStroke } from "../@types/model/Stroke"
import { TConverstionState } from "../@types/configuration/RecognitionConfiguration"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { TTheme } from "../@types/style/Theme"
import { TPenStyle } from "../@types/style/PenStyle"
import { TPointer } from "../@types/geometry"

import { PointerEventGrabber } from "../grabber/PointerEventGrabber"
import { WSRecognizer } from "../recognizer/WSRecognizer"
import { ModeInteraction, WSMessage } from "../Constants"
import { InternalEvent } from "../event/InternalEvent"
import { DeferredPromise } from "../utils/DeferredPromise"
import { WSSVGRenderer } from "../renderer/svg/WSSVGRenderer"
import { StyleManager } from "../style/StyleManager"
import { Configuration } from "../configuration/Configuration"
import { Model } from "../model/Model"

export class WSBehaviors implements IBehaviors
{
  name = "WSBehaviors"
  options: TBehaviorOptions
  grabber: PointerEventGrabber
  renderer: WSSVGRenderer
  recognizer: WSRecognizer
  context: TUndoRedoContext
  styleManager: StyleManager
  #configuration: TConfiguration
  #model: IModel
  mode: ModeInteraction

  #resizeTimer?: ReturnType<typeof setTimeout>

  constructor(options: TBehaviorOptions)
  {
    this.options = options
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options.penStyle, options.theme)

    this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    this.renderer = new WSSVGRenderer(this.#configuration.rendering)
    this.recognizer = new WSRecognizer(this.#configuration.server, this.#configuration.recognition)

    this.mode = ModeInteraction.Writing
    this.#model = new Model()
    this.context = {
      canRedo: false,
      canUndo: false,
      empty: true,
      stackIndex: -1,
      possibleUndoCount: 0,
      stack: []
    }
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get model(): IModel
  {
    return this.#model
  }

  get configuration(): TConfiguration
  {
    return this.#configuration
  }

  get currentPenStyle(): TPenStyle
  {
    return this.styleManager.currentPenStyle
  }

  get penStyle(): TPenStyle
  {
    return this.styleManager.penStyle
  }
  setPenStyle(ps?: TPenStyle): Promise<void>
  {
    this.styleManager.setPenStyle(ps)
    return this.recognizer.setPenStyle(this.styleManager.penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  setPenStyleClasses(psc?: string): Promise<void>
  {
    this.styleManager.setPenStyleClasses(psc)
    return this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  setTheme(t: TTheme): Promise<void>
  {
    this.styleManager.setTheme(t)
    return this.recognizer.setTheme(this.styleManager.theme)
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    this.#model.width = Math.max(domElement.clientWidth, this.#configuration.rendering.minWidth)
    this.#model.height = Math.max(domElement.clientHeight, this.#configuration.rendering.minHeight)
    this.context.stack.push(this.model.getClone())
    this.context.stackIndex = 0

    this.renderer.init(domElement)

    this.grabber.attach(domElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    this.internalEvent.addSVGPatchListener(this.onSVGPatch)
    this.internalEvent.addContextChangeListener(this.onContextChange)

    await this.recognizer.init(this.#model.height, this.#model.width)
    await this.setPenStyle(this.penStyle)
    await this.setTheme(this.theme)
    await this.setPenStyleClasses(this.penStyleClasses)
  }

  private onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    let { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    if (this.mode === ModeInteraction.Erasing) {
      pointerType = "eraser"
    }
    this.model.initCurrentStroke(point, evt.pointerId, pointerType, style)
    this.drawCurrentStroke()
  }

  private onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.model.appendToCurrentStroke(point)
    this.drawCurrentStroke()
  }

  private onPointerUp(_evt: PointerEvent, point: TPointer): void
  {
    this.model.endCurrentStroke(point)
    this.updateModelRendering()
      .then(newModel => Object.assign(this.#model, newModel))
      .catch(error => this.internalEvent.emitError(error as Error))
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

  drawCurrentStroke(): void
  {
    const currentStroke = this.model.currentStroke as TStroke
    if (currentStroke) {
      this.renderer.drawPendingStroke(currentStroke)
    }
  }

  async updateModelRendering(): Promise<IModel>
  {
    this.context.stack.push(this.model.getClone())
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      this.model.updatePositionSent()
      const updatedModel = await this.recognizer.addStrokes(this.model)
      this.model.mergeExport(updatedModel.exports as TExport)
      this.model.updatePositionReceived()
    }
    return this.model
  }

  async importPointEvents(strokes: TStroke[]): Promise<IModel | never>
  {
    const exportPoints = await this.recognizer.importPointEvents(strokes)
    this.model.mergeExport(exportPoints)
    return this.model
  }

  async export(mimeTypes?: string[]): Promise<IModel | never>
  {
    try {
      if (this.#configuration.triggers.exportContent === "DEMAND") {
        return this.recognizer.addStrokes(this.model)
      } else {
        return this.recognizer.export(this.model, mimeTypes)
      }
    } catch (error) {
      this.internalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(conversionState?: TConverstionState): Promise<IModel | never>
  {
    this.context.stack.push(this.model.getClone())
    this.#model = await this.recognizer.convert(this.model, conversionState)
    return this.model
  }

  async import(data: Blob, mimeType?: string): Promise<IModel | never>
  {
    this.context.stack.push(this.model.getClone())
    return this.recognizer.import(this.model, data, mimeType)
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    const deferredResize = new DeferredPromise<IModel>()
    this.model.height = height
    this.model.width = width
    const clonedModel = this.model.getClone()
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
    }, this.#configuration.triggers.resizeTriggerDelay)

    this.#model = await deferredResize.promise
    this.internalEvent.emitExported(this.model.exports as TExport)
    return this.model
  }

  async undo(): Promise<IModel>
  {
    if (this.context.canUndo) {
      this.#model = this.context.stack[this.context.stackIndex - 1]
      return this.recognizer.undo(this.#model)
    }
    else {
      throw new Error("Undo not allowed")
    }
  }

  async redo(): Promise<IModel>
  {
    if (this.context.canRedo) {
      this.#model = this.context.stack[this.context.stackIndex + 1]
      return this.recognizer.redo(this.#model)
    }
    else {
      throw new Error("Redo not allowed")
    }
  }

  async clear(): Promise<IModel>
  {
    const clearedModel = this.model.getClone()
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
