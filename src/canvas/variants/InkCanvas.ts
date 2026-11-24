import type { TExport, TExportV2 } from "@/client"
import { HTTPClientV2 } from "@/client"
import type { TPartialDeep } from "@/core"
import type { TIHistoryChanges } from "@/history"
import { IHistoryManager } from "@/history"
import {
  CanvasTool,
  EraseManager,
  IDebugSVGManager,
  IWriterManager,
  LayoutManager,
  type TLayoutOccupant,
} from "@/manager"
import { IModel } from "@/model"
import { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TStroke } from "@/symbol"
import { registerBuiltinSymbolUtils, StrokeUtil } from "@/symbol-utils"

import type { TCanvasOptionsBase } from "../AbstractCanvas"
import { AbstractCanvas } from "../AbstractCanvas"
import type { TInkCanvas } from "../TInkCanvas"
import type { TInkCanvasConfiguration } from "./InkCanvasConfiguration"
import { InkCanvasConfiguration } from "./InkCanvasConfiguration"

/** The occupants the layout of an ink canvas can place: no menus there */
const INK_LAYOUT_OCCUPANTS = ["state"] as const

/**
 * @group Canvas
 */
export type TInkCanvasOptions = TPartialDeep<
  TCanvasOptionsBase & {
    configuration: TInkCanvasConfiguration
  }
> & {
  override?: {
    /** An `HTTPClientV2` subclass, instantiated by the canvas with its configuration */
    client?: typeof HTTPClientV2
  }
  /** Content added at load, so it is there from the first render (functions: hence not in `configuration`) */
  extend?: {
    /** Custom occupants of the layout, like `canvas.layout.add` */
    layout?: TLayoutOccupant<TInkCanvas>[]
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
export class InkCanvas extends AbstractCanvas implements TInkCanvas {
  #configuration: InkCanvasConfiguration
  #model: IModel
  #penStyle: TStyle
  renderer: SVGRenderer
  client: HTTPClientV2
  history: IHistoryManager
  writer: IWriterManager
  eraser: EraseManager
  debugger: IDebugSVGManager
  /** Where the connection state and custom occupants sit */
  layout: LayoutManager<TInkCanvas>
  #tool: CanvasTool = CanvasTool.Write

  constructor(rootElement: HTMLElement, options?: TInkCanvasOptions) {
    super(rootElement, options)

    registerBuiltinSymbolUtils()
    this.#configuration = new InkCanvasConfiguration(options?.configuration)

    this.#penStyle = Object.assign({}, this.#configuration.penStyle)

    const Client = options?.override?.client ?? HTTPClientV2
    this.client = new Client(this.#configuration)
    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IModel()
    this.writer = new IWriterManager(this)
    this.eraser = new EraseManager(this)
    this.debugger = new IDebugSVGManager(this)
    this.layout = new LayoutManager<TInkCanvas>(
      this.layers,
      INK_LAYOUT_OCCUPANTS,
      options?.configuration?.layout,
      this,
      options?.extend?.layout
    )
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
        break
      default:
        this.writer.attach(this.layers.root)
        break
    }
    this.setCursorStyle()
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
      this.layout.render()
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
      this.history.init()
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

  async importStrokes(strokes: TPartialDeep<TStroke>[]): Promise<TExportV2> {
    return this.trackOperation("Importing", async () => this.#importStrokeInternal(strokes))
  }

  async #importStrokeInternal(pStrokes: TPartialDeep<TStroke>[]): Promise<TExportV2> {
    try {
      this.logger.info("import")
      this.#model = this.model.clone()
      const strokes = pStrokes.map(StrokeUtil.createFromPartial)
      strokes.map((s) => {
        this.model.addStroke(s)
        this.renderer.drawSymbol(s)
      })
      this.history.push({ added: strokes })
      const result = await this.client.send(strokes)
      this.model.mergeExport(result)
      return result
    } catch (error) {
      this.logger.error("import", error)
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
    const dims = this.resolveDimensions(height, width)
    this.model.height = dims.height
    this.model.width = dims.width
    this.renderer.resize(this.model.height, this.model.width)
    this.logger.debug("resize", {
      model: this.model,
    })
  }

  protected get minDimensions(): { minHeight: number; minWidth: number } {
    return this.configuration.rendering
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
    removedStrokes.forEach((s) => {
      this.renderer.removeSymbol(s.id)
      this.model.removeStroke(s.id)
    })
    this.history.push({
      removed: removedStrokes,
    })
    const exports = await this.client.send(this.model.strokes)
    this.model.mergeExport(exports)
    this.event.emitExported(this.model.exports as TExport)
    this.logger.debug("removeStrokes", {
      model: this.#model,
    })
  }

  #applyHistoryChanges(changes: TIHistoryChanges): void {
    changes.added?.forEach((s) => {
      this.model.addStroke(s)
      this.renderer.drawSymbol(s)
    })
    changes.removed?.forEach((s) => {
      this.model.removeStroke(s.id)
      this.renderer.removeSymbol(s.id)
    })
  }

  async undo(): Promise<void> {
    return this.trackOperation("Undoing", async () => {
      this.logger.info("undo")
      const changes = this.history.undo()
      this.#applyHistoryChanges(changes)
      await this.export()
    })
  }

  async redo(): Promise<void> {
    return this.trackOperation("Redoing", async () => {
      this.logger.info("redo")
      const changes = this.history.redo()
      this.#applyHistoryChanges(changes)
      await this.export()
    })
  }

  async clear(): Promise<void> {
    this.logger.info("clear")
    const erased = this.model.strokes
    this.model.clear()
    this.history.push({
      removed: erased,
    })
    this.renderer.clear()
    this.event.emitExported(this.#model.exports as TExport)
    this.event.emitCleared()
  }

  async destroy(): Promise<void> {
    this.logger.info("destroy")
    this.writer.detach()
    this.layout.destroy()
    this.teardownCommon()
    this.clearRootElementReference()
    return Promise.resolve()
  }
}
