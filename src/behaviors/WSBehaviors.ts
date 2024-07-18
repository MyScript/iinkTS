import { Intention } from "../Constants"
import { Configuration, TConfiguration, TConverstionState } from "../configuration"
import { InternalEvent } from "../event"
import { PointerEventGrabber } from "../grabber"
import { LoggerClass, LoggerManager } from "../logger"
import { IModel, Model, TExport } from "../model"
import { TWSMessageEventSVGPatch, WSRecognizer } from "../recognizer"
import { WSSVGRenderer } from "../renderer"
import { DefaultPenStyle, StyleManager, TPenStyle, TTheme } from "../style"
import { HistoryManager } from "../history"
import { DeferredPromise, PartialDeep } from "../utils"
import { Stroke, TStroke, TPointer } from "../primitive"
import { IBehaviors, TBehaviorOptions } from "./IBehaviors"

/**
 * @group Behavior
 */
export class WSBehaviors implements IBehaviors
{
  name = "WSBehaviors"
  #logger = LoggerManager.getLogger(LoggerClass.BEHAVIORS)
  #configuration: TConfiguration
  #model: Model
  #resizeTimer?: ReturnType<typeof setTimeout>

  grabber: PointerEventGrabber
  renderer: WSSVGRenderer
  recognizer: WSRecognizer
  history: HistoryManager
  styleManager: StyleManager
  intention: Intention


  constructor(options: PartialDeep<TBehaviorOptions>)
  {
    this.#logger.info("constructor", { options })
    this.#configuration = new Configuration(options?.configuration)
    this.styleManager = new StyleManager(options?.penStyle, options?.theme)

    if (options.behaviors?.grabber) {
      const CustomGrabber = options.behaviors?.grabber as unknown as typeof PointerEventGrabber
      this.grabber = new CustomGrabber(this.#configuration.grabber)
    }
    else {
      this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    }
    if (options.behaviors?.recognizer) {
      const CustomRecognizer = options.behaviors?.recognizer as unknown as typeof WSRecognizer
      this.recognizer = new CustomRecognizer(this.#configuration.server, this.#configuration.recognition)
    }
    else {
      this.recognizer = new WSRecognizer(this.#configuration.server, this.#configuration.recognition)
    }
    this.renderer = new WSSVGRenderer(this.#configuration.rendering)

    this.intention = Intention.Write
    this.#model = new Model()
    this.history = new HistoryManager(this.#configuration["undo-redo"])
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  get model(): Model
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
  setPenStyle(penStyle?: PartialDeep<TPenStyle>): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
    this.#logger.debug("setPenStyle", this.styleManager.penStyle)
    return this.recognizer.setPenStyle(this.styleManager.penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  setPenStyleClasses(penClass?: string): Promise<void>
  {
    this.#logger.info("setPenStyleClasses", { penClass })
    this.styleManager.setPenStyleClasses(penClass)
    this.#logger.debug("setPenStyleClasses", this.styleManager.penStyleClasses)
    return this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  setTheme(theme?: PartialDeep<TTheme>): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
    this.#logger.debug("setTheme", this.styleManager.theme)
    return this.recognizer.setTheme(this.styleManager.theme)
  }

  protected onExport(exports: TExport): void
  {
    this.#logger.debug("onExport", { exports })
    this.model.mergeExport(exports)
  }

  protected onPointerDown(evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerDown", { intention: this.intention, evt, point })
    let { pointerType } = evt
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    if (this.intention === Intention.Erase) {
      pointerType = "eraser"
    }
    this.model.initCurrentStroke(point, pointerType, style)
    this.drawCurrentStroke()
  }

  protected onPointerMove(_evt: PointerEvent, point: TPointer): void
  {
    this.#logger.info("onPointerMove", { intention: this.intention, point })
    this.model.appendToCurrentStroke(point)
    this.drawCurrentStroke()
  }

  protected async onPointerUp(_evt: PointerEvent, point: TPointer): Promise<void>
  {
    try {
      this.#logger.info("onPointerUp", { intention: this.intention, point })
      this.model.endCurrentStroke(point)
      await this.synchronizeModelWithBackend()
    } catch (error) {
      this.internalEvent.emitError(error as Error)
    }
  }

  protected onSVGPatch(evt: TWSMessageEventSVGPatch): void
  {
    this.#logger.info("onSVGPatch", { evt })
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  async init(domElement: HTMLElement): Promise<void>
  {
    this.#logger.info("init", { domElement })
    const compStyles = window.getComputedStyle(domElement);
    this.model.width = Math.max(parseInt(compStyles.width.replace("px","")), this.#configuration.rendering.minWidth)
    this.model.height = Math.max(parseInt(compStyles.height.replace("px","")), this.#configuration.rendering.minHeight)
    this.history.push(this.model)

    this.renderer.init(domElement)

    this.grabber.attach(domElement)
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    this.internalEvent.addExportedListener(this.onExport.bind(this))
    this.internalEvent.addSVGPatchListener(this.onSVGPatch.bind(this))

    await this.recognizer.init(this.model.height, this.model.width)
    await this.setPenStyle(this.penStyle)
    await this.setTheme(this.theme as PartialDeep<TTheme>)
    await this.setPenStyleClasses(this.penStyleClasses)
  }

  drawCurrentStroke(): void
  {
    this.#logger.debug("drawCurrentStroke", { stroke: this.model.currentSymbol })
    const currentSymbol = this.model.currentSymbol as Stroke
    if (currentSymbol) {
      this.renderer.drawPendingStroke(currentSymbol)
    }
  }

  async synchronizeModelWithBackend(): Promise<IModel>
  {
    this.#logger.info("synchronizeModelWithBackend")
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      const unsentStrokes = this.model.extractUnsentStrokes()
      this.model.updatePositionSent()
      this.history.push(this.model)
      this.renderer.clearErasingStrokes()
      const exports = await this.recognizer.addStrokes(unsentStrokes)
      this.model.mergeExport(exports)
      this.history.updateStack(this.model)
    }
    this.#logger.debug("synchronizeModelWithBackend", this.model)
    return this.model
  }

  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  async export(mimeTypes?: string[]): Promise<IModel>
  {
    this.#logger.info("export", { mimeTypes })
    try {
      if (this.#configuration.triggers.exportContent === "DEMAND") {
        const unsentStrokes = this.model.extractUnsentStrokes()
        this.model.updatePositionSent()
        const exports = await this.recognizer.addStrokes(unsentStrokes)
        this.model.updatePositionReceived()
        this.model.mergeExport(exports)
        this.#logger.debug("export", this.model)
        return this.model
      } else {
        return this.recognizer.export(this.model, mimeTypes)
      }
    } catch (error) {
      this.#logger.error("export", { error } )
      this.internalEvent.emitError(error as Error)
      return Promise.reject(error)
    }
  }

  async convert(conversionState?: TConverstionState): Promise<IModel>
  {
    this.#logger.info("convert", { conversionState })
    this.history.push(this.model)
    this.history.stack.push(this.model.clone())
    this.#model = await this.recognizer.convert(this.model, conversionState)
    this.#logger.debug("convert", this.model)
    this.history.push(this.model)
    return this.model
  }

  async import(data: Blob, mimeType?: string): Promise<IModel>
  {
    this.#logger.info("import", { data, mimeType })
    this.history.stack.push(this.model.clone())
    const m = await this.recognizer.import(this.model, data, mimeType)
    this.history.push(m)
    return m
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<IModel>
  {
    this.#logger.info("importPointEvents", { strokes })
    const errors: string[] = []
    const strokesToImport = strokes.map((s, strokeIndex) => {
      const str = new Stroke(s.style || DefaultPenStyle, s.pointerType)
      if (s.id) str.id = s.id
      if (s.pointerType) str.pointerType = s.pointerType
      if (!s.pointers?.length) {
        errors.push(`stroke ${strokeIndex + 1} has not pointers`)
      }
      let flag = true
      s.pointers?.forEach((pp, pIndex) => {
        flag = true
        if (!pp) {
          errors.push(`stroke ${strokeIndex + 1} has no pointer at ${pIndex}`)
          return
        }
        const pointer: TPointer = {
          p: pp.p || 1,
          t: pp.t || pIndex,
          x: 0,
          y: 0
        }
        if (pp?.x == undefined || pp?.x == null) {
          errors.push(`stroke ${strokeIndex + 1} has no x at pointer at ${pIndex}`)
          flag = false
        }
        else {
          pointer.x = pp.x
        }
        if (pp?.y == undefined || pp?.y == null) {
          errors.push(`stroke ${strokeIndex + 1} has no y at pointer at ${pIndex}`)
          flag = false
        }
        else {
          pointer.y = pp.y
        }
        if (flag) {
          str.pointers.push(pointer)
        }
      })
      return str
    })
    if (errors.length) {
      this.internalEvent.emitError( new Error(errors.join("\n")))
    }
    strokesToImport.map(s => this.model.addStroke(s))
    const exportPoints = await this.recognizer.importPointEvents(strokesToImport)
    this.model.mergeExport(exportPoints)
    this.#logger.debug("importPointEvents", this.model)
    return this.model
  }

  async resize(height: number, width: number): Promise<IModel>
  {
    this.#logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<Model>()
    this.model.height = height
    this.model.width = width
    const clonedModel = this.model.clone()
    this.renderer.resize(clonedModel)
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      try {
        const resizeModel = await this.recognizer.resize(clonedModel)
        deferredResize.resolve(resizeModel)
      } catch (error) {
        this.#logger.error("resize", { height, width, error } )
        deferredResize.reject(error as Error)
      }
    }, this.#configuration.triggers.resizeTriggerDelay)

    this.#model = await deferredResize.promise
    this.internalEvent.emitExported(this.model.exports as TExport)
    this.#logger.debug("resize", this.model)
    return this.model
  }

  async undo(): Promise<IModel>
  {
    this.#logger.info("undo")
    if (this.history.context.canUndo) {
      this.#model = this.history.undo() as Model
      return this.recognizer.undo(this.model)
    }
    else {
      throw new Error("Undo not allowed")
    }
  }

  async redo(): Promise<IModel>
  {
    this.#logger.info("redo")
    if (this.history.context.canRedo) {
      this.#model = this.history.redo() as Model
      this.#logger.debug("undo", this.#model)
      return this.recognizer.redo(this.model)
    }
    else {
      throw new Error("Redo not allowed")
    }
  }

  async clear(): Promise<IModel>
  {
    this.#logger.info("clear")
    this.model.clear()
    this.history.push(this.model)
    return this.recognizer.clear(this.model)
  }

  async destroy(): Promise<void>
  {
    this.#logger.info("destroy")
    this.grabber.detach()
    this.renderer.destroy()
    this.recognizer.destroy()
    return Promise.resolve()
  }
}
