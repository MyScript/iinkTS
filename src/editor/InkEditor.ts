import { EditorTool } from "../Constants"
import { PointerEventGrabber, PointerInfo } from "../grabber"
import { Model, TExport } from "../model"
import { TStroke, convertPartialStrokesToStrokes } from "../symbol"
import { InkRecognizer } from "../recognizer"
import { CanvasRenderer } from "../renderer"
import { TStyle } from "../style"
import { HistoryManager } from "../history"
import { DeferredPromise, PartialDeep } from "../utils"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InkEditorConfiguration, TInkEditorConfiguration } from "./InkEditorConfiguration"

/**
 * @group Editor
 */
export type TInkEditorOptions = PartialDeep<EditorOptionsBase &
{
  configuration: TInkEditorConfiguration
}> &
{
  override?: {
    grabber?: PointerEventGrabber
    recognizer?: InkRecognizer
  }
}

/**
 * @group Editor
 */
export class InkEditor extends AbstractEditor {
  #configuration: InkEditorConfiguration
  #model: Model
  #exportTimer?: ReturnType<typeof setTimeout>
  #penStyle: TStyle
  grabber: PointerEventGrabber
  renderer: CanvasRenderer
  recognizer: InkRecognizer
  history: HistoryManager
  #tool: EditorTool = EditorTool.Write

  constructor(rootElement: HTMLElement, options?: TInkEditorOptions) {
    super(rootElement, options)

    this.#configuration = new InkEditorConfiguration(options?.configuration)

    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

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
      const CustomRecognizer = options.override.recognizer as unknown as typeof InkRecognizer
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new InkRecognizer(this.#configuration)
    }
    this.renderer = new CanvasRenderer(this.#configuration.renderer)

    this.tool = EditorTool.Write
    this.#model = new Model()
    this.history = new HistoryManager(this.#configuration["undo-redo"], this.event)
  }

  protected onPointerDown(info: PointerInfo): void {
    this.logger.info("onPointerDown", { tool: this.tool, info })
    switch (this.tool) {
      case EditorTool.Erase: {
        if (this.model.removeStrokesFromPoint(info.pointer).length > 0) {
          this.renderer.drawModel(this.model)
        }
        break
      }
      case EditorTool.Write:
        this.model.initCurrentStroke(info.pointer, info.pointerType, this.penStyle)
        this.drawCurrentStroke()
        break
      default:
        this.logger.warn("#onPointerDown", `onPointerDown tool unknow: "${this.tool}"`)
        break
    }
  }

  protected onPointerMove(info: PointerInfo): void {
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
        this.logger.warn("#onPointerMove", `onPointerMove tool unknow: "${this.tool}"`)
        break
    }
  }

  protected async onPointerUp(info: PointerInfo): Promise<void> {
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
        this.logger.warn("#onPointerUp", `onPointerUp tool unknow: "${this.tool}"`)
        break
    }
  }

  get penStyle(): TStyle
  {
    return this.#penStyle
  }
  set penStyle(penStyle: PartialDeep<TStyle>)
  {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
  }

  get initializationPromise(): Promise<void> {
    return Promise.resolve()
  }

  get tool(): EditorTool {
    return this.#tool
  }
  set tool(i: EditorTool) {
    this.#tool = i
    this.setCursorStyle()
  }

  protected setCursorStyle(): void {
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

  get model(): Model {
    return this.#model
  }

  get configuration(): InkEditorConfiguration {
    return this.#configuration
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.renderer.minWidth)
      this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.renderer.minHeight)
      this.history.push(this.model)
      this.renderer.init(this.layers.rendering)
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

  drawCurrentStroke(): void {
    this.logger.debug("drawCurrentStroke", { stroke: this.model.currentSymbol })
    this.renderer.drawPendingStroke(this.model.currentSymbol)
  }

  async updateModelRendering(): Promise<Model> {
    this.logger.info("updateModelRendering")
    this.renderer.drawModel(this.model)
    const deferred = new DeferredPromise<Model>()
    this.history.push(this.model)
    if (this.#configuration.triggers.exportContent !== "DEMAND") {
      clearTimeout(this.#exportTimer)
      const currentModel = this.model.clone()
      this.#exportTimer = setTimeout(async () => {
        try {
          currentModel.mergeExport(await this.recognizer.send(currentModel.symbols))
          this.history.updateStack(currentModel)
          if (this.model.modificationDate === currentModel.modificationDate) {
            this.model.exports = currentModel.exports
          }
          deferred.resolve(this.model)
        } catch (error) {
          this.logger.error("updateModelRendering", { error })
          this.layers.showMessageError(error as Error)
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

  async importPointEvents(strokes: PartialDeep<TStroke>[]): Promise<Model> {
    try {
      convertPartialStrokesToStrokes(strokes)
        .forEach((stroke) => {
          this.model.addStroke(stroke)
        })
      const newModel = await this.updateModelRendering()
      Object.assign(this.#model, newModel)
      this.event.emitImported(this.model.exports as TExport)
      return this.model
    } catch (error) {
      this.layers.showMessageError(error as Error)
      this.event.emitError(error as Error)
      throw error as Error
    }
  }

  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void> {
    this.logger.info("resize", { height, width })
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.renderer.minHeight)
    this.model.width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.renderer.minWidth)
    this.renderer.resize(this.model)
    this.logger.debug("resize", { model: this.model })
    this.event.emitExported(this.model.exports as TExport)
  }

  async undo(): Promise<void> {
    this.logger.info("undo")
    this.#model = this.history.undo() as Model
    this.renderer.drawModel(this.#model)
    this.history.updateStack(this.#model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("undo", this.#model)
  }

  async redo(): Promise<void> {
    this.logger.info("redo")
    this.#model = this.history.redo() as Model
    this.renderer.drawModel(this.#model)
    this.history.updateStack(this.#model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("redo", this.#model)
  }

  async clear(): Promise<void> {
    this.logger.info("clear")
    this.model.clear()
    this.history.push(this.model)
    this.renderer.drawModel(this.model)
    this.event.emitExported(this.model.exports as TExport)
    this.event.emitCleared()
    this.logger.debug("clear", this.model)
  }

  async destroy(): Promise<void> {
    this.logger.info("destroy")
    this.event.removeAllListeners()
    this.grabber.detach()
    this.layers.destroy()
    this.renderer.destroy()
    return Promise.resolve()
  }
}