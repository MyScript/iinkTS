import type { TCanvasOptionsBase } from "@/canvas/AbstractCanvas"
import { AbstractCanvas } from "@/canvas/AbstractCanvas"
import { HTTPClientV2 } from "@/client"
import { CanvasTool } from "@/Constants"
import type { PointerEventGrabber } from "@/grabber"
import { IHistoryManager } from "@/history"
import { EraseManager, IDebugSVGManager, IWriterManager } from "@/manager"
import type { TExport, TExportV2 } from "@/model"
import { IModel } from "@/model"
import { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import { registerBuiltinSymbolUtils } from "@/symbol-utils"
import type { TPartialDeep } from "@/utils"

import type { TInkCanvasConfiguration } from "./InkCanvasConfiguration"
import { InkCanvasConfiguration } from "./InkCanvasConfiguration"

/**
 * @group Canvas
 */
export type TInkCanvasOptions = TPartialDeep<
  TCanvasOptionsBase & {
    configuration: TInkCanvasConfiguration
  }
> & {
  override?: {
    grabber?: PointerEventGrabber
    client?: HTTPClientV2
  }
}

/**
 * @group Canvas
 * @remarks InkCanvas is the core canvas variant focused on freeform ink input, rendering, and recognition. It provides a rich API for managing strokes, exports, and canvas state, and serves as the foundation for more specialized canvas variants.
 *
 * Key features include:
 * - Stroke management: Add, remove, and style ink strokes with real-time rendering.
 * - Recognition integration: Seamlessly send ink data to the client and handle results.
 * - Export capabilities: Support for exporting recognized content in various formats.
 * - History management: Undo/redo functionality for stroke modifications and exports.
 * - Tool support: Built-in tools for writing and erasing with customizable styles.
 *
 * The InkCanvas is designed for extensibility, allowing developers to override core components like the client or input grabber for custom behavior.
 */
export class InkCanvas extends AbstractCanvas {
  #configuration: InkCanvasConfiguration
  #model: IModel
  #penStyle: TStyle
  renderer: SVGRenderer
  client: HTTPClientV2
  history: IHistoryManager
  writer: IWriterManager
  eraser: EraseManager
  debugger: IDebugSVGManager
  #tool: CanvasTool = CanvasTool.Write

  constructor(rootElement: HTMLElement, options?: TInkCanvasOptions) {
    super(rootElement, options)

    registerBuiltinSymbolUtils()
    this.#configuration = new InkCanvasConfiguration(options?.configuration)

    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

    if (options?.override?.client) {
      const CustomRecognizer = options.override.client as unknown as typeof HTTPClientV2
      this.client = new CustomRecognizer(this.#configuration)
    } else {
      this.client = new HTTPClientV2(this.#configuration)
    }
    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IModel()
    this.writer = new IWriterManager(this)
    this.eraser = new EraseManager(this)
    this.debugger = new IDebugSVGManager(this)
    this.tool = CanvasTool.Write
    this.history = new IHistoryManager(this.#configuration["undo-redo"], this.event)
  }

  get penStyle(): TStyle {
    return this.#penStyle
  }
  set penStyle(penStyle: TPartialDeep<TStyle>) {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
  }

  get initializationPromise(): Promise<void> {
    return Promise.resolve()
  }

  get tool(): CanvasTool {
    return this.#tool
  }
  set tool(i: CanvasTool) {
    this.#tool = i
    this.writer.detach()
    this.eraser.detach()

    switch (this.tool) {
      case CanvasTool.Erase:
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

  get model(): IModel {
    return this.#model
  }

  get configuration(): InkCanvasConfiguration {
    return this.#configuration
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = CanvasTool.Write
      this.renderer.init(this.layers.rendering)

      const compStyles = window.getComputedStyle(this.layers.root)
      this.model.width = Math.max(parseInt(compStyles.width.replace("px", "")), this.#configuration.rendering.minWidth)
      this.model.height = Math.max(
        parseInt(compStyles.height.replace("px", "")),
        this.#configuration.rendering.minHeight
      )
      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.init(this.model)
      this.startResizeObserver()

      if (!this.client.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.client.configuration.server.version = this.info!.version
      }
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    } finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.markConnectedOnce()
    }
  }

  updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>): void {
    this.logger.info("updateSymbolsStyle", {
      symbolIds,
      style,
    })
    const symbolIdSet = new Set(symbolIds)
    this.model.strokes.forEach((s) => {
      if (symbolIdSet.has(s.id)) {
        s.style = Object.assign({}, s.style, style)
        this.renderer.drawSymbol(s)
        this.model.updateStroke(s)
        s.modificationDate = Date.now()
      }
    })
  }

  async export(requestedMimeTypes?: string[]): Promise<TExportV2> {
    return this.trackOperation("Exporting", async () => this.#exportInternal(requestedMimeTypes))
  }

  async #exportInternal(requestedMimeTypes?: string[]): Promise<TExportV2> {
    try {
      this.logger.info("export")
      const currentModel = this.model.clone()

      const exports = await this.client.send(currentModel.strokes, requestedMimeTypes)
      currentModel.mergeExport(exports)
      if (this.model.modificationDate === currentModel.modificationDate) {
        this.model.exports = currentModel.exports
      }
      this.history.updateModelStack(currentModel)
      this.event.emitExported(this.model.exports || {})
      if (this.debugger.recognitionBoxItemsVisibility) {
        this.debugger.debugRecognitionBoxItems()
      }
      if (this.debugger.recognitionBoxVisibility) {
        this.debugger.debugRecognitionBox()
      }
      return exports
    } catch (error) {
      this.logger.error("export", error)
      this.layers.showMessageError(error as Error)
      this.event.emitError(error as Error)
      throw error
    }
  }

  async resize({
    height,
    width,
  }: {
    height?: number
    width?: number
  } = {}): Promise<void> {
    this.logger.info("resize", { height, width })
    const compStyles = window.getComputedStyle(this.layers.root)
    this.model.height =
      height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
    this.model.width =
      width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)
    this.renderer.resize(this.model.height, this.model.width)
    this.logger.debug("resize", {
      model: this.model,
    })
  }

  async removeStrokes(strokeIds: string[]): Promise<void> {
    return this.trackOperation("Removing strokes", async () => this.#removeStrokesInternal(strokeIds))
  }

  async #removeStrokesInternal(strokeIds: string[]): Promise<void> {
    this.logger.info("removeStrokes", {
      strokeIds,
    })
    const strokeIdSet = new Set(strokeIds)
    const removedStrokes = this.model.strokes.filter((s) => strokeIdSet.has(s.id))
    if (removedStrokes.length === 0) {
      this.logger.warn("removeStrokes", "No strokes found to remove")
      return
    }
    this.#model = this.model.clone()
    removedStrokes.forEach((s) => {
      this.renderer.removeSymbol(s.id)
      this.model.removeStroke(s.id)
    })
    this.history.push(this.#model, {
      removed: removedStrokes,
    })
    const exports = await this.client.send(this.model.strokes)
    this.model.mergeExport(exports)
    this.history.updateModelStack(this.model)
    this.event.emitExported(this.#model.exports as TExport)
    this.logger.debug("removeStrokes", {
      model: this.#model,
    })
  }

  async undo(): Promise<void> {
    return this.trackOperation("Undoing", async () => {
      this.logger.info("undo")
      const previousStackItem = this.history.undo()
      const modifications = previousStackItem.model.extractDifferenceStrokes(this.model)
      this.#model = previousStackItem.model.clone()
      modifications.removed.forEach((s) => this.renderer.removeSymbol(s.id))
      modifications.added.forEach((s) => this.renderer.drawSymbol(s))
      await this.export()
    })
  }

  async redo(): Promise<void> {
    return this.trackOperation("Redoing", async () => {
      this.logger.info("redo")
      const previousStackItem = this.history.redo()
      const modifications = previousStackItem.model.extractDifferenceStrokes(this.model)
      this.#model = previousStackItem.model.clone()
      modifications.removed.forEach((s) => this.renderer.removeSymbol(s.id))
      modifications.added.forEach((s) => this.renderer.drawSymbol(s))
      await this.export()
    })
  }

  async clear(): Promise<void> {
    this.logger.info("clear")
    const erased = this.model.strokes
    this.model.clear()
    this.history.push(this.model, {
      removed: erased,
    })
    this.renderer.clear()
    this.event.emitExported(this.#model.exports as TExport)
    this.event.emitCleared()
  }

  async destroy(): Promise<void> {
    this.logger.info("destroy")
    this.stopResizeObserver()
    this.event.removeAllListeners()
    this.writer.detach()
    this.layers.destroy()
    this.renderer.destroy()
    return Promise.resolve()
  }
}
