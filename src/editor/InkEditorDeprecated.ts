import { EditorTool } from "../Constants"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { Model, TExport } from "../model"
import { Stroke, TStroke, TPointer } from "../symbol"
import { InkDeprecatedRecognizer, TConverstionState } from "../recognizer"
import { CanvasRenderer } from "../renderer"
import { DefaultPenStyle, StyleManager, TPenStyle, TTheme } from "../style"
import { HistoryManager } from "../history"
import { DeferredPromise, PartialDeep } from "../utils"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InkEditorDeprecatedConfiguration, TInkEditorDeprecatedConfiguration } from "./InkEditorDeprecatedConfiguration"

/**
 * @group Editor
 */
export type TInkEditorDeprecatedOptions = PartialDeep<EditorOptionsBase &
  {
    configuration: TInkEditorDeprecatedConfiguration
  }> &
  {
    override?: {
      grabber?: PointerEventGrabber
      recognizer?: InkDeprecatedRecognizer
    }
  }

/**
 * @group Editor
 */
export class InkEditorDeprecated extends AbstractEditor
{
  #configuration: InkEditorDeprecatedConfiguration
  #model: Model
  #resizeTimer?: ReturnType<typeof setTimeout>
  #exportTimer?: ReturnType<typeof setTimeout>

  grabber: PointerEventGrabber
  renderer: CanvasRenderer
  recognizer: InkDeprecatedRecognizer
  history: HistoryManager
  styleManager: StyleManager
  #tool: EditorTool = EditorTool.Write

  constructor(rootElement: HTMLElement, options?: TInkEditorDeprecatedOptions)
  {
    super(rootElement, options)

    this.#configuration = new InkEditorDeprecatedConfiguration(options?.configuration)
    this.styleManager = new StyleManager(options?.configuration?.penStyle, options?.configuration?.theme)

    if (options?.override?.grabber) {
      const CustomGrabber = options.override.grabber as unknown as typeof PointerEventGrabber
      this.grabber = new CustomGrabber(this.#configuration.grabber)
    }
    else {
      this.grabber = new PointerEventGrabber(this.#configuration.grabber)
    }
    this.grabber.onPointerDown = this.onPointerDown.bind(this)
    this.grabber.onPointerMove = this.onPointerMove.bind(this)
    this.grabber.onPointerUp = this.onPointerUp.bind(this)

    if (options?.override?.recognizer) {
      const CustomRecognizer = options.override.recognizer as unknown as typeof InkDeprecatedRecognizer
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new InkDeprecatedRecognizer(this.#configuration)
    }
    this.renderer = new CanvasRenderer(this.#configuration.rendering)

    this.tool = EditorTool.Write
    this.#model = new Model()
    this.history = new HistoryManager(this.#configuration["undo-redo"], this.event)
  }

  protected onPointerDown(info: PointerInfo): void
  {
    this.logger.info("onPointerDown", { tool: this.tool, info })
    const style: TPenStyle = Object.assign({}, this.theme?.ink, this.currentPenStyle)
    switch (this.tool) {
      case EditorTool.Erase: {
        if (this.model.removeStrokesFromPoint(info.pointer).length > 0) {
          this.renderer.drawModel(this.model)
        }
        break
      }
      case EditorTool.Write:
        this.model.initCurrentStroke(info.pointer, info.pointerType, style)
        this.drawCurrentStroke()
        break
      default:
        this.logger.warn("#onPointerDown", `onPointerDown tool unknow: "${ this.tool }"`)
        break
    }
  }

  protected onPointerMove(info: PointerInfo): void
  {
    this.logger.info("onPointerMove", { tool: this.tool, info })
    switch (this.tool) {
      case EditorTool.Erase: {
        if (this.model.removeStrokesFromPoint(info.pointer).length > 0) {
          this.renderer.drawModel(this.model)
        }
        break
      }
      case EditorTool.Write:
        this.model.appendToCurrentStroke(info.pointer)
        this.drawCurrentStroke()
        break
      default:
        this.logger.warn("#onPointerMove", `onPointerMove tool unknow: "${ this.tool }"`)
        break
    }
  }

  protected async onPointerUp(info: PointerInfo): Promise<void>
  {
    this.logger.info("onPointerUp", { tool: this.tool, info })
    switch (this.tool) {
      case EditorTool.Erase:
        this.model.removeStrokesFromPoint(info.pointer)
        if (this.history.stack.at(-1)?.modificationDate !== this.model.modificationDate) {
          await this.updateModelRendering()
        }
        break
      case EditorTool.Write:
        this.model.endCurrentStroke(info.pointer)
        await this.updateModelRendering()
        break
      default:
        this.logger.warn("#onPointerUp", `onPointerUp tool unknow: "${ this.tool }"`)
        break
    }
  }

  get initializationPromise(): Promise<void>
  {
    return Promise.resolve()
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

  get currentPenStyle(): TPenStyle
  {
    return this.styleManager.currentPenStyle
  }

  get penStyle(): TPenStyle
  {
    return this.styleManager.penStyle
  }
  set penStyle(penStyle: TPenStyle | undefined)
  {
    this.logger.info("setPenStyle", { penStyle })
    this.styleManager.setPenStyle(penStyle)
  }

  get penStyleClasses(): string
  {
    return this.styleManager.penStyleClasses
  }
  set penStyleClasses(penStyleClasses: string | undefined)
  {
    this.logger.info("setPenStyleClasses", { penStyleClasses })
    this.styleManager.setPenStyleClasses(penStyleClasses)
  }

  get theme(): TTheme
  {
    return this.styleManager.theme
  }
  set theme(theme: PartialDeep<TTheme>)
  {
    this.logger.info("setTheme", { theme })
    this.styleManager.setTheme(theme)
  }

  get configuration(): InkEditorDeprecatedConfiguration
  {
    return this.#configuration
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
      this.layers.rendering.classList.add(this.configuration.recognition.type.toLowerCase().replace(" ", "-"))
      this.renderer.init(this.layers.rendering, { x: 50, y: 50 })
      this.grabber.attach(this.layers.rendering)
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
    this.renderer.drawPendingStroke(this.model.currentSymbol)
  }

  async updateModelRendering(): Promise<Model>
  {
    this.logger.info("updateModelRendering")
    this.renderer.drawModel(this.model)
    const deferred = new DeferredPromise<Model>()
    this.history.push(this.model)
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      let currentModel = this.model.clone()
      this.#exportTimer = setTimeout(async () =>
      {
        try {
          currentModel = await this.recognizer.export(currentModel)
          this.history.updateStack(currentModel)
          if (this.model.modificationDate === currentModel.modificationDate) {
            this.model.exports = currentModel.exports
          }
          deferred.resolve(this.model)
        } catch (error) {
          this.logger.error("updateModelRendering", { error })
          this.event.emitError(error as Error)
          deferred.reject(error as Error)
        }
      }, this.#configuration.triggers.exportContent === "QUIET_PERIOD" ? this.#configuration.triggers.exportContentDelay : 0)
    } else {
      deferred.resolve(this.model)
    }
    await deferred.promise
    this.event.emitExported(this.model.exports as TExport)
    this.logger.debug("updateModelRendering", this.model.exports)
    return deferred.promise
  }

  async export(mimeTypes?: string[]): Promise<Model>
  {
    this.logger.info("export", { mimeTypes })
    const newModel = await this.recognizer.export(this.model.clone(), mimeTypes)
    if (this.model.modificationDate === newModel.modificationDate) {
      this.model.mergeExport(newModel.exports as TExport)
    }
    this.history.updateStack(newModel)
    this.event.emitExported(this.model.exports as TExport)
    this.logger.debug("export", this.model)
    return this.model
  }

  async convert(params?: { conversionState?: TConverstionState, mimeTypes?: string[] }): Promise<Model>
  {
    this.logger.info("convert", { params })
    const newModel = await this.recognizer.convert(this.model, params?.conversionState, params?.mimeTypes)
    Object.assign(this.#model, newModel)
    this.event.emitConverted(this.model.converts as TExport)
    this.logger.debug("convert", this.model)
    return this.model
  }

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model>
  {
    const errors: string[] = []
    strokes.forEach((s, strokeIndex) =>
    {
      let flag = true
      const stroke = new Stroke(s.style || DefaultPenStyle, s.pointerType)
      if (s.id) stroke.id = s.id
      if (!s.pointers?.length) {
        errors.push(`stroke ${ strokeIndex + 1 } has not pointers`)
        flag = false
        return
      }
      s.pointers?.forEach((pp, pIndex) =>
      {
        if (!pp) {
          errors.push(`stroke ${ strokeIndex + 1 } has no pointer at ${ pIndex }`)
          flag = false
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
          return
        }
        else {
          pointer.x = pp.x
        }
        if (pp?.y == undefined || pp?.y == null) {
          errors.push(`stroke ${ strokeIndex + 1 } has no y at pointer at ${ pIndex }`)
          flag = false
          return
        }
        else {
          pointer.y = pp.y
        }
        if (flag) {
          stroke.pointers.push(pointer)
        }
      })
      if (flag) {
        this.model.addStroke(stroke)
      }
    })

    if (errors.length) {
      this.event.emitError(new Error(errors.join("\n")))
    }
    try {
      const newModel = await this.updateModelRendering()
      Object.assign(this.#model, newModel)
      this.event.emitImported(this.model.exports as TExport)
      return this.model
    } catch (error) {
      this.event.emitError(error as Error)
      throw error as Error
    }
  }
  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void>
  {
    this.logger.info("resize", { height, width })
    const deferredResize = new DeferredPromise<Model>()
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    this.model.width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    this.renderer.resize(this.model)
    if (this.model.symbols.length) {
      clearTimeout(this.#resizeTimer)
      this.#resizeTimer = setTimeout(async () =>
      {
        const resizeModel = await this.recognizer.resize(this.model)
        deferredResize.resolve(resizeModel)
      }, this.#configuration.triggers.resizeTriggerDelay)
    } else {
      deferredResize.resolve(this.model)
    }
    this.#model = await deferredResize.promise
    this.logger.debug("resize", { model: this.model })
    this.event.emitExported(this.model.exports as TExport)
  }

  async undo(): Promise<void>
  {
    this.logger.info("undo")
    this.#model = this.history.undo() as Model
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.history.updateStack(this.#model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("undo", this.#model)
  }

  async redo(): Promise<void>
  {
    this.logger.info("redo")
    this.#model = this.history.redo() as Model
    this.renderer.drawModel(this.#model)
    this.#model = await this.recognizer.export(this.#model)
    this.history.updateStack(this.#model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("redo", this.#model)
  }

  async clear(): Promise<void>
  {
    this.logger.info("clear")
    this.model.clear()
    this.history.push(this.model)
    this.renderer.drawModel(this.model)
    this.event.emitExported(this.model.exports as TExport)
    this.event.emitCleared()
    this.logger.debug("clear", this.model)
  }

  async destroy(): Promise<void>
  {
    this.logger.info("destroy")
    this.event.removeAllListeners()
    this.grabber.detach()
    this.layers.destroy()
    this.renderer.destroy()
    return Promise.resolve()
  }
}
