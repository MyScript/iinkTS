import { EditorTool } from "../Constants"
import { PointerEventGrabber } from "../grabber"
import { IIModel, TExport } from "../model"
import { RecognizerHTTPV2 } from "../recognizer"
import { SVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { IIHistoryManager } from "../history"
import { PartialDeep } from "../utils"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InkEditorConfiguration, TInkEditorConfiguration } from "./InkEditorConfiguration"
import { IWriteManager } from "../manager/IWriterManager"

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
    recognizer?: RecognizerHTTPV2
  }
}

/**
 * @group Editor
 */
export class InkEditor extends AbstractEditor {
  #configuration: InkEditorConfiguration
  #model: IIModel
  #penStyle: TStyle
  renderer: SVGRenderer
  recognizer: RecognizerHTTPV2
  history: IIHistoryManager
  writer : IWriteManager
  #tool: EditorTool = EditorTool.Write

  constructor(rootElement: HTMLElement, options?: TInkEditorOptions) {
    super(rootElement, options)

    this.#configuration = new InkEditorConfiguration(options?.configuration)

    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

    if (options?.override?.recognizer) {
      const CustomRecognizer = options.override.recognizer as unknown as typeof RecognizerHTTPV2
      this.recognizer = new CustomRecognizer(this.#configuration)
    }
    else {
      this.recognizer = new RecognizerHTTPV2(this.#configuration)
    }
    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IIModel()
    this.writer = new IWriteManager(this)
    this.tool = EditorTool.Write
    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)
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
    this.writer.detach()
    switch (this.tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        break
      default:
        this.writer.attach(this.layers.root)
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        break
    }
  }

  get model(): IIModel {
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
      this.tool = EditorTool.Write
      this.renderer.init(this.layers.rendering)

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
      this.model.height = Math.max(parseInt(compStyles.height.replace("px", "")), this.#configuration.rendering.minHeight)
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.init(this.model)

      if(!this.recognizer.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.recognizer.configuration.server.version = this.info!.version
      }
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

  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void> {
    this.logger.info("resize", { height, width })
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    this.model.width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    this.renderer.resize(this.model.height, this.model.width)
    this.logger.debug("resize", { model: this.model })
    this.event.emitExported(this.model.exports as TExport)
  }

  async undo(): Promise<void> {
    this.logger.info("undo")
    const previousStackItem = this.history.undo()
    const modifications = previousStackItem.model.extractDifferenceSymbols(this.model)
    this.#model = previousStackItem.model.clone()
    this.event.emitExported(this.#model.exports as TExport)
    modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
    modifications.added.forEach(s => this.renderer.drawSymbol(s))
    this.logger.debug("undo", this.#model)
  }

  async redo(): Promise<void> {
    this.logger.info("redo")
    const previousStackItem = this.history.redo()
    const modifications = previousStackItem.model.extractDifferenceSymbols(this.model)
    this.#model = previousStackItem.model.clone()
    this.event.emitExported(this.#model.exports as TExport)
    modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
    modifications.added.forEach(s => this.renderer.drawSymbol(s))
    this.logger.debug("redo", this.#model)
  }

  async clear(): Promise<void> {
    this.logger.info("clear")
    const erased = this.model.symbols
    this.model.clear()
    this.history.push(this.model, { erased })
    this.renderer.clear()
    this.event.emitExported(this.#model.exports as TExport)
  }

  async destroy(): Promise<void> {
    this.logger.info("destroy")
    this.event.removeAllListeners()
    this.layers.destroy()
    this.renderer.destroy()
    return Promise.resolve()
  }
}
