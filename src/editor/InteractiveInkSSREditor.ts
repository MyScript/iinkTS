import { EditorTool } from "../Constants"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { Model, TExport, TJIIXExport } from "../model"
import { TRecognizerWebSocketSSRMessageSVGPatch, RecognizerWebSocketSSR, DefaultMarginConfiguration, TConverstionState, TMarginConfiguration } from "../recognizer"
import { InteractiveInkSSRSmartGuide } from "../smartguide"
import { InteractiveInkSSRSVGRenderer } from "../renderer"
import { DefaultPenStyle, StyleManager, TPenStyle, TTheme } from "../style"
import { HistoryManager, THistoryContext } from "../history"
import { DeferredPromise, PartialDeep } from "../utils"
import { Stroke, TStroke, TPointer } from "../symbol"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InteractiveInkSSREditorConfiguration } from "./InteractiveInkSSREditorConfiguration"

/**
 * @group Editor
 */
export type TInteractiveInkSSREditorOptions = PartialDeep<EditorOptionsBase &
  {
    configuration: InteractiveInkSSREditorConfiguration
  }> &
  {
    override?: {
      grabber?: PointerEventGrabber
      recognizer?: RecognizerWebSocketSSR
    }
  }

/**
 * @group Editor
 */
export class InteractiveInkSSREditor extends AbstractEditor
{
  #configuration: InteractiveInkSSREditorConfiguration
  #model: Model
  #resizeTimer?: ReturnType<typeof setTimeout>

  smartGuide?: InteractiveInkSSRSmartGuide
  grabber: PointerEventGrabber
  renderer: InteractiveInkSSRSVGRenderer
  recognizer: RecognizerWebSocketSSR
  history: HistoryManager
  styleManager: StyleManager
  #tool: EditorTool = EditorTool.Write

  constructor(rootElement: HTMLElement, options?: TInteractiveInkSSREditorOptions)
  {
    super(rootElement, options)

    this.#configuration = new InteractiveInkSSREditorConfiguration(options?.configuration)
    this.styleManager = new StyleManager(options?.configuration?.penStyle, options?.configuration?.theme)

    if (options?.override?.grabber) {
      const CustomGrabber = options.override.grabber as unknown as typeof PointerEventGrabber
      this.grabber = new CustomGrabber(this.#configuration.grabber)
    }
    else {
      this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    }

    if (options?.override?.recognizer) {
      const CustomRecognizer = options.override.recognizer as unknown as typeof RecognizerWebSocketSSR
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new RecognizerWebSocketSSR(this.#configuration)
    }

    this.renderer = new InteractiveInkSSRSVGRenderer(this.#configuration.rendering)

    this.tool = EditorTool.Write
    this.#model = new Model()
    this.history = new HistoryManager(this.#configuration["undo-redo"], this.event)
  }

  get initializationPromise(): Promise<void>
  {
    return this.recognizer.initialized.promise
  }

  get tool(): EditorTool
  {
    return this.#tool
  }
  set tool(i: EditorTool)
  {
    this.#tool = i
    this.setCursorStyle()
  }

  protected setCursorStyle(): void
  {
    switch (this.tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        break
      default:
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        break
    }
  }

  get model(): Model
  {
    return this.#model
  }

  get configuration(): InteractiveInkSSREditorConfiguration
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
  set penStyle(penStyle: PartialDeep<TPenStyle>)
  {
    this.logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
    this.logger.debug("setPenStyle", this.styleManager.penStyle)
    this.recognizer.setPenStyle(this.styleManager.penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  set penStyleClasses(penClass: string)
  {
    this.logger.info("setPenStyleClasses", { penClass })
    this.styleManager.setPenStyleClasses(penClass)
    this.logger.debug("setPenStyleClasses", this.styleManager.penStyleClasses)
    this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  set theme(theme: PartialDeep<TTheme>)
  {
    this.logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
    this.logger.debug("setTheme", this.styleManager.theme)
    this.recognizer.setTheme(this.styleManager.theme)
  }

  protected async syncStyle(): Promise<void>
  {
    await Promise.all([
      this.recognizer.setPenStyle(this.styleManager.penStyle),
      this.recognizer.setPenStyleClasses(this.styleManager.penStyleClasses),
      this.recognizer.setTheme(this.styleManager.theme)
    ])
  }

  protected onExport(exports: TExport): void
  {
    this.logger.debug("onExport", { exports })
    if (this.smartGuide && exports?.["application/vnd.myscript.jiix"]) {
      const jjix = exports["application/vnd.myscript.jiix"] as TJIIXExport
      this.smartGuide.update(jjix)
    }
    this.model.mergeExport(exports)
    this.event.emitExported(exports)
  }

  protected onPointerDown(info: PointerInfo): void
  {
    this.logger.info("onPointerDown", { tool: this.tool, info })
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    this.model.initCurrentStroke(info.pointer, this.tool === EditorTool.Erase ? "eraser" : info.pointerType, style)
    this.drawCurrentStroke()
  }

  protected onPointerMove(info: PointerInfo): void
  {
    this.logger.info("onPointerMove", { tool: this.tool, info })
    this.model.appendToCurrentStroke(info.pointer)
    this.drawCurrentStroke()
  }

  protected async onPointerUp(info: PointerInfo): Promise<void>
  {
    try {
      this.logger.info("onPointerUp", { tool: this.tool, info })
      this.model.endCurrentStroke(info.pointer)
      await this.synchronizeModelWithBackend()
    } catch (error) {
      this.event.emitError(error as Error)
    }
  }

  protected onSVGPatch(evt: TRecognizerWebSocketSSRMessageSVGPatch): void
  {
    this.logger.info("onSVGPatch", { evt })
    this.renderer.updatesLayer(evt.layer, evt.updates)
  }

  protected initializeSmartGuide(): void
  {
    this.smartGuide?.destroy()
    this.logger.info("initializeSmartGuide", { smartGuide: this.configuration.smartGuide })
    if (this.configuration.smartGuide.enable) {
      this.smartGuide = new InteractiveInkSSRSmartGuide(this)
      let margin: TMarginConfiguration = DefaultMarginConfiguration
      switch (this.configuration.recognition.type) {
        case "TEXT":
          margin = this.configuration.recognition.text.margin
          break
        case "MATH":
          margin = this.configuration.recognition.math.margin
          break
      }
      this.smartGuide.init(this.layers.ui.root, margin)
    }
  }

  protected onContentChanged(undoRedoContext: THistoryContext): void
  {
    this.history.context = undoRedoContext
    this.event.emitChanged(undoRedoContext)
  }

  protected onError(error: Error): void
  {
    this.layers.showMessageError(error)
    this.event.emitError(error)
  }

  async initialize(): Promise<void>
  {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
      this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.rendering.minHeight)
      this.history.push(this.model)
      this.renderer.init(this.layers.rendering)

      this.grabber.attach(this.layers.rendering)
      this.grabber.onPointerDown = this.onPointerDown.bind(this)
      this.grabber.onPointerMove = this.onPointerMove.bind(this)
      this.grabber.onPointerUp = this.onPointerUp.bind(this)

      this.initializeSmartGuide()

      if(!this.recognizer.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.recognizer.configuration.server.version = this.info!.version
      }
      await this.recognizer.init(this.model.height, this.model.width)
      this.recognizer.event.addExportedListener(this.onExport.bind(this))
      this.recognizer.event.addSVGPatchListener(this.onSVGPatch.bind(this))
      this.recognizer.event.addContentChangedListener(this.onContentChanged.bind(this))
      this.recognizer.event.addIdleListener(this.event.emitIdle.bind(this.event))
      this.recognizer.event.addErrorListener(this.onError.bind(this))

      await this.syncStyle()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    }
    finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.layers.updateState(true)
    }
  }

  drawCurrentStroke(): void
  {
    this.logger.debug("drawCurrentStroke", { stroke: this.model.currentSymbol })
    const currentSymbol = this.model.currentSymbol as Stroke
    if (currentSymbol) {
      this.renderer.drawPendingStroke(currentSymbol)
    }
  }

  async synchronizeModelWithBackend(): Promise<Model>
  {
    this.logger.info("synchronizeModelWithBackend")
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      const unsentStrokes = this.model.extractUnsentStrokes()
      this.model.updatePositionSent()
      this.history.push(this.model)
      this.renderer.clearErasingStrokes()
      const exports = await this.recognizer.addStrokes(unsentStrokes)
      this.model.mergeExport(exports)
      this.history.updateStack(this.model)
    }
    this.logger.debug("synchronizeModelWithBackend", this.model)
    return this.model
  }

  async waitForIdle(): Promise<void>
  {
    return this.recognizer.waitForIdle()
  }

  async export(mimeTypes?: string[]): Promise<Model>
  {
    this.logger.info("export", { mimeTypes })
    try {
      if (this.#configuration.triggers.exportContent === "DEMAND") {
        const unsentStrokes = this.model.extractUnsentStrokes()
        this.history.push(this.model)
        this.history.stack.push(this.model.clone())
        this.model.updatePositionSent()
        const exports = await this.recognizer.addStrokes(unsentStrokes)
        this.model.updatePositionReceived()
        this.model.mergeExport(exports)
        this.logger.debug("export", this.model)
      } else {
        return await this.recognizer.export(this.model, mimeTypes)
      }
    } catch (error) {
      this.logger.error("export", { error })
      this.event.emitError(error as Error)
      return Promise.reject(error)
    }
    return this.model
  }

  async convert(params?: { conversionState?: TConverstionState }): Promise<Model>
  {
    this.logger.info("convert", { params })
    this.history.push(this.model)
    this.history.stack.push(this.model.clone())
    this.#model = await this.recognizer.convert(this.model, params?.conversionState)
    this.logger.debug("convert", this.model)
    this.history.push(this.model)
    this.event.emitConverted(this.model.converts as TExport)
    return this.model
  }

  async import(data: Blob | string | TJIIXExport, mimeType?: string): Promise<Model>
  {
    let blobToImport: Blob
    if (data instanceof Blob) {
      blobToImport = data
    }
    else if (typeof data === "string") {
      blobToImport = new Blob([data])
    }
    else {
      blobToImport = new Blob([JSON.stringify(data)])
    }
    this.logger.info("import", { data, mimeType })
    this.history.stack.push(this.model.clone())
    this.#model = await this.recognizer.import(this.model, blobToImport, mimeType)
    this.history.push(this.model)
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>
  {
    this.logger.info("importPointEvents", { strokes })
    const errors: string[] = []
    const strokesToImport = strokes.map((s, strokeIndex) =>
    {
      const str = new Stroke(s.style || DefaultPenStyle, s.pointerType)
      if (s.id) str.id = s.id
      if (s.pointerType) str.pointerType = s.pointerType
      if (!s.pointers?.length) {
        errors.push(`stroke ${ strokeIndex + 1 } has not pointers`)
      }
      let flag = true
      s.pointers?.forEach((pp, pIndex) =>
      {
        flag = true
        if (!pp) {
          errors.push(`stroke ${ strokeIndex + 1 } has no pointer at ${ pIndex }`)
          return
        }
        const pointer: TPointer = {
          p: pp.p || 1,
          t: pp.t || pIndex,
          x: 0,
          y: 0
        }
        if (pp?.x == undefined || pp?.x == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no x at pointer at ${ pIndex }`)
          flag = false
        }
        else {
          pointer.x = pp.x
        }
        if (pp?.y == undefined || pp?.y == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no y at pointer at ${ pIndex }`)
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
      this.event.emitError(new Error(errors.join("\n")))
    }
    strokesToImport.map(s => this.model.addStroke(s))
    const exportPoints = await this.recognizer.importPointEvents(strokesToImport)
    this.model.mergeExport(exportPoints)
    this.event.emitImported(this.model.exports as TExport)
    this.logger.debug("importPointEvents", this.model)
    return this.model
  }

  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void>
  {
    this.logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<Model>()
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    this.model.width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    const clonedModel = this.model.clone()
    this.renderer.resize(clonedModel)
    clearTimeout(this.#resizeTimer)
    this.#resizeTimer = setTimeout(async () =>
    {
      try {
        const resizeModel = await this.recognizer.resize(clonedModel)
        deferredResize.resolve(resizeModel)
      } catch (error) {
        this.logger.error("resize", { height, width, error })
        deferredResize.reject(error as Error)
      }
    }, this.#configuration.triggers.resizeTriggerDelay)

    this.#model = await deferredResize.promise
    this.smartGuide?.resize()
    this.event.emitExported(this.model.exports as TExport)
    this.logger.debug("resize", this.model)
  }

  async undo(): Promise<Model>
  {
    this.logger.info("undo")
    if (this.history.context.canUndo) {
      this.#model = this.history.undo() as Model
      return this.recognizer.undo(this.model)
    }
    else {
      throw new Error("Undo not allowed")
    }
  }

  async redo(): Promise<Model>
  {
    this.logger.info("redo")
    if (this.history.context.canRedo) {
      this.#model = this.history.redo() as Model
      this.logger.debug("undo", this.#model)
      return this.recognizer.redo(this.model)
    }
    else {
      throw new Error("Redo not allowed")
    }
  }

  async clear(): Promise<void>
  {
    this.logger.info("clear")
    this.model.clear()
    this.history.push(this.model)
    await this.recognizer.clear(this.model)
    this.event.emitCleared()
  }

  async destroy(): Promise<void>
  {
    this.logger.info("destroy")
    this.event.removeAllListeners()
    this.grabber.detach()
    this.layers.destroy()
    this.renderer.destroy()
    this.recognizer.destroy()
    this.smartGuide?.destroy()
    return Promise.resolve()
  }
}
