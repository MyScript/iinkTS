import { EditorTool } from "../Constants"
import { PointerEventGrabber } from "../grabber"
import { IModel, TExport, TExportV2 } from "../model"
import { RecognizerHTTPV2 } from "../recognizer"
import { SVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { IHistoryManager } from "../history"
import { PartialDeep } from "../utils"
import { AbstractEditor, EditorOptionsBase } from "./AbstractEditor"
import { InkEditorConfiguration, TInkEditorConfiguration } from "./InkEditorConfiguration"
import { IWriterManager } from "../manager/IWriterManager"
import { IDebugSVGManager, EraseManager } from "../manager"

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
export class InkEditor extends AbstractEditor
{
  #configuration: InkEditorConfiguration
  #model: IModel
  #penStyle: TStyle
  renderer: SVGRenderer
  recognizer: RecognizerHTTPV2
  history: IHistoryManager
  writer: IWriterManager
  eraser: EraseManager
  debugger: IDebugSVGManager
  #tool: EditorTool = EditorTool.Write

  constructor(rootElement: HTMLElement, options?: TInkEditorOptions)
  {
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

    this.#model = new IModel()
    this.writer = new IWriterManager(this)
    this.eraser = new EraseManager(this)
    this.debugger = new IDebugSVGManager(this)
    this.tool = EditorTool.Write
    this.history = new IHistoryManager(this.#configuration["undo-redo"], this.event)
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
    this.writer.detach()
    this.eraser.detach()

    switch (this.tool) {
      case EditorTool.Erase:
        this.eraser.attach(this.layers.root)
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

  get model(): IModel
  {
    return this.#model
  }

  get configuration(): InkEditorConfiguration
  {
    return this.#configuration
  }

  async initialize(): Promise<void>
  {
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

      if (!this.recognizer.configuration.server.version) {
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

  //updateBoundingBox
  updateSymbolsStyle(symbolIds: string[], style: PartialDeep<TStyle>): void
  {
    this.logger.info("updateSymbolsStyle", { symbolIds, style })
    this.model.strokes.forEach(s =>
    {
      if (symbolIds.includes(s.id)) {
        s.style = Object.assign({}, s.style, style)
        this.renderer.drawSymbol(s)
        this.model.updateStroke(s)
        s.modificationDate = Date.now()
      }
    })
  }

  async export(requestedMimeTypes?: string[]): Promise<TExportV2>
  {
    this.logger.info("export")
    const currentModel = this.model.clone()

    const exports = await this.recognizer.send(currentModel.strokes, requestedMimeTypes)
    currentModel.mergeExport(exports)
    if (this.model.modificationDate === currentModel.modificationDate) {
      this.model.exports = currentModel.exports
    }
    this.history.updateModelStack(currentModel)
    this.event.emitExported(this.model.exports || {})
    return exports
  }

  async resize({ height, width }: { height?: number, width?: number } = {}): Promise<void>
  {
    this.logger.info("resize", { height, width })
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    this.model.width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    this.renderer.resize(this.model.height, this.model.width)
    this.logger.debug("resize", { model: this.model })
    this.event.emitExported(this.model.exports || {})
  }

  async removeStrokes(strokeIds: string[]): Promise<void>
  {
    this.logger.info("removeStrokes", { strokeIds })
    const removedStrokes = this.model.strokes.filter(s => strokeIds.includes(s.id))
    if (removedStrokes.length === 0) {
      this.logger.warn("removeStrokes", "No strokes found to remove")
      return
    }
    this.#model = this.model.clone()
    removedStrokes.forEach(s => {
      this.renderer.removeSymbol(s.id)
      this.model.removeStroke(s.id)
    })
    this.history.push(this.#model, { removed: removedStrokes })
    const exports = await this.recognizer.send(this.model.strokes)
    this.model.mergeExport(exports)
    this.history.updateModelStack(this.model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("removeStrokes", { model: this.#model })
  }

  async undo(): Promise<void>
  {
    this.logger.info("undo")
    const previousStackItem = this.history.undo()
    const modifications = previousStackItem.model.extractDifferenceStrokes(this.model)
    this.#model = previousStackItem.model.clone()
    modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
    modifications.added.forEach(s => this.renderer.drawSymbol(s))
    await this.export()
  }

  async redo(): Promise<void>
  {
    this.logger.info("redo")
    const previousStackItem = this.history.redo()
    const modifications = previousStackItem.model.extractDifferenceStrokes(this.model)
    this.#model = previousStackItem.model.clone()
    modifications.removed.forEach(s => this.renderer.removeSymbol(s.id))
    modifications.added.forEach(s => this.renderer.drawSymbol(s))
    await this.export()
  }

  async clear(): Promise<void>
  {
    this.logger.info("clear")
    const erased = this.model.strokes
    this.model.clear()
    this.history.push(this.model, { removed: erased })
    this.renderer.clear()
    this.event.emitExported(this.#model.exports as TExport)
  }

  async destroy(): Promise<void>
  {
    this.logger.info("destroy")
    this.event.removeAllListeners()
    this.writer.detach()
    this.layers.destroy()
    this.renderer.destroy()
    return Promise.resolve()
  }
}
