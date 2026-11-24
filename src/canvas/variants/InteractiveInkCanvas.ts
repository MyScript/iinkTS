import type { TExport, TRecognitionWebSocketConfiguration } from "@/client"
import { WebSocketClient } from "@/client"
import { DUPLICATE_OFFSET, SELECTION_PADDING } from "@/constants"
import type { TBox, TDraft, TPartialDeep } from "@/core"
import { BoxOps, createUUID, isIdentityMatrix, MatrixTransform, mergeDeep, OBBOps, overrideDeep } from "@/core"
import { DOMFactory, RafCoalescer } from "@/dom"
import type { TIIHistoryBackendChanges, TIIHistoryChanges } from "@/history"
import { appendUpdated, extractIIBackendChanges, IIHistoryManager } from "@/history"
import type { TDownloadFormat, TExportFormat, TExportOptions, TExportResultMap, TPDFDownloadOptions } from "@/manager"
import {
  CanvasTool,
  EraseManager,
  GESTURE_OPERATION_LABELS,
  IIConnectorManager,
  IIConversionManager,
  IIExportManager,
  IIGestureManager,
  IIJiixQueryManager,
  IIKeyboardManager,
  IIMathManager,
  IIMoveManager,
  IIOverlayManager,
  IIPlaybackManager,
  IISelectionManager,
  IISnapManager,
  IISynchronizerManager,
  IITransformManager,
  IITypesetManager,
  IIWriterManager,
  LayoutManager,
  PDFExportManager,
  type TLayoutOccupant,
} from "@/manager"
import type { TMenuItemRegistration, TMenuOverride } from "@/menu"
import { IIMenuManager } from "@/menu"
import { IIModel } from "@/model"
import type { TIIRendererConfiguration } from "@/renderer"
import { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TAnchor, TBaseSymbol, TDecorator, TMath, TStroke, TSymbol, TText } from "@/symbol"
import { cloneSymbol, extractStrokes, isDecorator, isMath, isStroke, isStrokeSolverOutput, isText } from "@/symbol"
import type { SymbolUtil } from "@/symbol-utils"
import {
  createSymbolFromPartial,
  createSymbolsFromPartial,
  DecoratorUtil,
  EdgeUtil,
  registerBuiltinSymbolUtils,
  StrokeUtil,
  SymbolGeometry,
  symbolRegistry,
  TextUtil,
} from "@/symbol-utils"

import type { TCanvasOptionsBase } from "../AbstractCanvas"
import { AbstractCanvas } from "../AbstractCanvas"
import type { TCanvasOperationLabel } from "../TCanvasOperationLabel"
import type { TInteractiveInkCanvas, TSymbolPatch, TSymbolUpdate } from "../TInteractiveInkCanvas"
import type { TInteractiveInkCanvasConfiguration } from "./InteractiveInkCanvasConfiguration"
import { InteractiveInkCanvasConfiguration } from "./InteractiveInkCanvasConfiguration"

/**
 * What cleaning up after a removal changed, for the history entry of that removal
 * @hidden
 */
type TRemovalCleanup = {
  erased: TDecorator[]
  updated: NonNullable<TIIHistoryChanges["updated"]>
}

/** The cursor class of each tool; any other one draws */
const TOOL_CURSOR_CLASSES: Partial<Record<CanvasTool, string>> = {
  [CanvasTool.Erase]: "erase",
  [CanvasTool.Select]: "select",
  [CanvasTool.Move]: "move",
}

/** The occupants the layout of an interactive ink canvas can place */
const INTERACTIVE_INK_LAYOUT_OCCUPANTS = ["action", "style", "tool", "state", "minimap"] as const

/**
 * @group Canvas
 */
export type TInteractiveInkCanvasOptions = TPartialDeep<
  TCanvasOptionsBase & {
    configuration: TInteractiveInkCanvasConfiguration
  }
> & {
  override?: {
    /** A `WebSocketClient` subclass, instantiated by the canvas with its configuration */
    client?: typeof WebSocketClient
    menu?: TMenuOverride
  }
  /** Content added at load, so it is there from the first render (functions: hence not in `configuration`) */
  extend?: {
    /** Items added to the menus, like `canvas.menu.addItem` */
    menuItems?: TMenuItemRegistration[]
    /** Custom occupants of the layout, like `canvas.layout.add` */
    layout?: TLayoutOccupant<TInteractiveInkCanvas>[]
  }
}

/**
 * @group Canvas
 */
export class InteractiveInkCanvas extends AbstractCanvas implements TInteractiveInkCanvas {
  static readonly PASTE_OFFSET = 20
  static readonly ZOOM_FIT_MARGIN = 40

  #configuration: InteractiveInkCanvasConfiguration
  #model: IIModel
  #tool: CanvasTool = CanvasTool.Write
  #readOnly = false
  #recognitionUpdate: Promise<void> = Promise.resolve()
  #pendingRecognitionOverride?: TPartialDeep<TRecognitionWebSocketConfiguration>
  #layerUITimer?: ReturnType<typeof setTimeout>
  #recognizeStrokeTimer?: ReturnType<typeof setTimeout>
  #exportRetryTimer?: ReturnType<typeof setTimeout>
  #pendingExportRetry?: Promise<TExport>
  #settleExportRetry?: { resolve: (exports: TExport) => void; reject: (reason: unknown) => void }
  #pendingExportRetryMimeTypes = new Set<string>()
  static readonly EXPORT_RETRY_DEBOUNCE_MS = 300
  #clipboard: TSymbol[] = []
  #renderedWidth = 0
  #renderedHeight = 0
  #wheelZoomCoalescer = new RafCoalescer()
  #pendingWheelDeltaY = 0
  #pendingWheelOffset?: { x: number; y: number }

  /** SVG renderer responsible for drawing symbols onto the canvas layer. */
  renderer: SVGRenderer
  /** WebSocket client handling real-time communication with the MyScript backend. */
  client: WebSocketClient

  #penStyle: TStyle

  /** Manages undo/redo history stack for all symbol changes. */
  history: IIHistoryManager
  /** Handles ink input: captures pointer events and creates strokes. */
  writer: IIWriterManager
  /** Handles keyboard shortcuts and hotkey-based tool switching. */
  keyboard: IIKeyboardManager
  /** Handles erasing strokes and symbols via pointer interaction. */
  eraser: EraseManager
  /** Builds print-only DOM/CSS layers and drives PDF export via native browser print. */
  pdfExport: PDFExportManager
  /** Detects and processes touch/pointer gestures (scratch-out, join, insert, etc.). */
  gesture: IIGestureManager
  /** Orchestrates translate, resize, and rotation transforms on selected symbols. */
  transform: IITransformManager
  /** Converts ink strokes to recognized text, math, or shape symbols. */
  converter: IIConversionManager
  /** Manages text and math symbol layout: bounds computation and reflow after edits. */
  typeset: IITypesetManager
  /** Handles symbol selection, selection group rendering, and hit-testing. */
  selector: IISelectionManager
  /** Manages all visual overlays: math/text block indicators, debug visualizations. */
  overlays: IIOverlayManager
  /** Manages snapping behavior for symbols during move/resize operations. */
  snaps: IISnapManager
  /** Handles canvas panning when the Move tool is active. */
  move: IIMoveManager
  /** Synchronizes the local model with the JIIX export from the backend client. */
  synchronizer: IISynchronizerManager
  /** Queries and maps JIIX data to local symbols for math/text label resolution. */
  jiix: IIJiixQueryManager
  /** Produces every export format and drives the file downloads. */
  exportManager: IIExportManager
  /** Manages math recognition: variables, computation, and evaluation rendering. */
  math: IIMathManager
  /** Manages smart connectors and anchor-based endpoint updates. */
  connector: IIConnectorManager
  /** Where the menus, the connection state and the minimap sit */
  layout: LayoutManager<TInteractiveInkCanvas>
  /** Manages the floating UI menu (tool selector, style panel, action buttons). */
  menu: IIMenuManager
  /** Replays a recorded set of strokes with play/pause/speed control. */
  playback: IIPlaybackManager
  /** Static utility class for creating DOM elements. */
  readonly dom = DOMFactory

  /**
   * Create and attach an InteractiveInk canvas to the given DOM element.
   * Use `Canvas.load()` instead of calling this constructor directly.
   * @param rootElement - Host DOM element that will contain the canvas layers
   * @param options - Canvas options: configuration, CSS vars, manager overrides
   */
  constructor(rootElement: HTMLElement, options?: TInteractiveInkCanvasOptions) {
    super(rootElement, options)

    registerBuiltinSymbolUtils()
    this.#configuration = new InteractiveInkCanvasConfiguration(options?.configuration)
    this.#penStyle = Object.assign({}, this.#configuration.penStyle)
    const Client = options?.override?.client ?? WebSocketClient
    this.client = new Client(this.#configuration)
    this.client.event.addErrorListener(this.manageError.bind(this))
    this.client.event.addExportedListener(this.event.emitExported.bind(this.event))
    this.client.event.addContentChangedListener(this.onContentChanged.bind(this))
    this.event.addGesturedListener(this.onGestured.bind(this))
    this.client.event.addSessionOpenedListener(this.event.emitSessionOpened.bind(this.event))
    this.client.event.addEndInitialization(this.layers.clearModal.bind(this.layers))
    this.client.event.addEndInitialization(this.markConnectedOnce.bind(this))
    this.client.event.addIdleListener(this.manageIdleState.bind(this))
    this.client.event.addConnectionStatusChangedListener((status) =>
      this.manageConnectionStatus(status, this.client.offlineQueueLength)
    )

    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IIModel()

    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)

    this.keyboard = new IIKeyboardManager(this)
    this.writer = new IIWriterManager(this)
    this.eraser = new EraseManager(this)
    this.pdfExport = new PDFExportManager(this)
    this.selector = new IISelectionManager(this)
    this.move = new IIMoveManager(this)

    this.gesture = new IIGestureManager(this, this.#configuration.gesture)
    this.transform = new IITransformManager(this)
    this.converter = new IIConversionManager(this)
    this.typeset = new IITypesetManager(this)
    this.overlays = new IIOverlayManager(this, this.#configuration.overlays)
    this.snaps = new IISnapManager(this, this.#configuration.snap)
    this.synchronizer = new IISynchronizerManager(this)
    this.jiix = new IIJiixQueryManager(this)
    this.exportManager = new IIExportManager(this, this.pdfExport)
    this.math = new IIMathManager(this, this.#configuration.math)
    this.connector = new IIConnectorManager(this, this.#configuration.connector)
    this.layout = new LayoutManager<TInteractiveInkCanvas>(
      this.layers,
      INTERACTIVE_INK_LAYOUT_OCCUPANTS,
      options?.configuration?.layout,
      this,
      options?.extend?.layout
    )
    this.menu = new IIMenuManager(this, options?.override?.menu, options?.extend?.menuItems)
    this.playback = new IIPlaybackManager(this)
  }

  /**
   * Promise that resolves when the WebSocket session is fully initialized.
   * Await this before calling any recognition methods.
   */
  get initializationPromise(): Promise<void> {
    return this.client.initialized.promise
  }

  /**
   * True while the connection is down after a first one succeeded, changes queued or not.
   * Listen to `event.addConnectionStatusChangedListener` for change notifications.
   */
  get isOffline(): boolean {
    return this.client.isOffline
  }

  /**
   * Active editing tool.
   * Setting this switches cursor style, attaches/detaches the corresponding manager,
   * clears selection, and emits a `toolChanged` event.
   */
  get tool(): CanvasTool {
    return this.#tool
  }
  set tool(i: CanvasTool) {
    this.#tool = i
    this.menu.update()
    this.setCursorStyle()
    this.unselectAll()

    if (i !== CanvasTool.Move) {
      this.keyboard.resetStoredTool()
    }

    this.#detachToolManagers()
    this.#toolManager(i).attach(this.layers.rendering)
    this.event.emitToolChanged(i)
  }

  /** Whether real pointer input (write/erase/select/move) is currently blocked - see `readOnly` setter. */
  get readOnly(): boolean {
    return this.#readOnly
  }

  /**
   * Block or restore real pointer input across every tool at once (write/erase/select/move all
   * attach through `layers.rendering`), and reflect it with a "not-allowed" cursor. Used e.g. by
   * `canvas.playback` so a replayed stroke can't race the user's own input.
   */
  set readOnly(value: boolean) {
    this.#readOnly = value
    this.layers.rendering.style.pointerEvents = value ? "none" : ""
    this.layers.root.classList.toggle("read-only", value)
  }

  /**
   * Current symbol model containing all ink, text, math, and shape symbols.
   */
  get model(): IIModel {
    return this.#model
  }

  /**
   * Active canvas configuration (recognition, rendering, menu, math, etc.).
   */
  get configuration(): InteractiveInkCanvasConfiguration {
    return this.#configuration
  }
  /**
   * Apply a partial rendering configuration at runtime.
   * Triggers a resize and guide-row recompute.
   * @param renderingConfiguration - Partial rendering config to merge
   */
  set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration) {
    this.configuration.rendering = mergeDeep<TIIRendererConfiguration>(
      this.configuration.rendering,
      renderingConfiguration
    )
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
    this.event.emitUIpdated()
  }

  /**
   * Current pen style applied to new strokes.
   * Setting this merges the provided partial style with the current style.
   */
  get penStyle(): TStyle {
    return this.#penStyle
  }
  set penStyle(penStyle: TPartialDeep<TStyle>) {
    this.logger.info("set penStyle", { penStyle })
    this.#penStyle = Object.assign({}, this.#penStyle, penStyle)
    this.menu.update()
  }

  /**
   * Update layer UI with debouncing
   * @param timeout - Debounce timeout in milliseconds (default: 500ms)
   */
  updateLayerUI(timeout: number = 500): void {
    clearTimeout(this.#layerUITimer)
    this.#layerUITimer = setTimeout(() => {
      this.menu.update()
      this.overlays.apply()
      this.event.emitUIpdated()
    }, timeout)
  }

  /**
   * Display an error in the canvas overlay and emit an `error` event.
   * @param error - Error to display and emit
   */
  manageError(error: unknown): void {
    const reason = error instanceof Error ? error : new Error(String(error))
    this.layers.showMessageError(reason)
    this.event.emitError(reason)
  }

  /** Reports a failed call on the canvas, then rethrows it to the caller */
  #reportAndThrow(label: string, error: unknown): never {
    this.logger.error(label, error)
    this.manageError(error)
    throw error
  }

  registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void {
    symbolRegistry.register(util)
  }

  getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined {
    return symbolRegistry.getUtil<T>(type)
  }

  protected get cursorClasses(): string[] {
    return ["draw", "erase", "select", "move"]
  }

  protected getCursorClass(): string {
    return TOOL_CURSOR_CLASSES[this.#tool] ?? "draw"
  }

  /** The manager handling pointer input for a tool; writing is the default */
  #toolManager(tool: CanvasTool): EraseManager | IISelectionManager | IIMoveManager | IIWriterManager {
    const managers: Partial<Record<CanvasTool, EraseManager | IISelectionManager | IIMoveManager>> = {
      [CanvasTool.Erase]: this.eraser,
      [CanvasTool.Select]: this.selector,
      [CanvasTool.Move]: this.move,
    }
    return managers[tool] ?? this.writer
  }

  #detachToolManagers(): void {
    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()
  }

  /**
   * On top of the base badge tracking, cancels the pending debounced `synchronize()` as soon
   * as a new gesture starts - so a stroke/transform beginning right as the debounce timer would
   * otherwise fire never races it (it'll be rescheduled once that gesture's own content change
   * comes in).
   */
  override startOperation(label: TCanvasOperationLabel): void {
    super.startOperation(label)
    if (GESTURE_OPERATION_LABELS.includes(label)) {
      clearTimeout(this.#recognizeStrokeTimer)
    }
  }

  // The backend's undo/redo state is ignored: in this variant the local history drives undo/redo,
  // and `changed` must agree with what the history itself emits on push/undo/redo
  protected async onContentChanged(): Promise<void> {
    clearTimeout(this.#recognizeStrokeTimer)
    this.#recognizeStrokeTimer = setTimeout(async () => {
      try {
        await this.synchronize()
      } catch (error) {
        // Without this the rejection escapes the async setTimeout callback as an unhandled
        // rejection, and the two calls after the finally never run — so the UI never refreshes
        // and consumers never get `changed`, even though the local content did change.
        this.manageError(error)
      } finally {
        // Clears every "Recognizing" started since the last synchronize (writer/transform pointerDown,
        // programmatic API calls) in one shot — not a matched start/end pair, since several may have
        // accumulated before this single debounced synchronize() ran.
        this.clearOperation("Recognizing")
      }
      this.updateLayerUI(0)
      this.event.emitChanged(this.history.context)
    }, 500)
  }

  /**
   * With `ignoreGestureStrokes` the backend never emits a `contentChanged` for a gesture stroke,
   * so the debounced synchronize scheduled by `onContentChanged` has nothing left to reschedule it -
   * force one here instead of relying on that mechanism.
   */
  protected async onGestured(): Promise<void> {
    if (!this.client.configuration.recognition.gesture.ignoreGestureStrokes) {
      return
    }
    await this.synchronize()
    this.updateLayerUI(0)
  }

  /**
   * Initialize the canvas: render layers, attach input handlers, connect to the
   * WebSocket client, and load the initial session.
   * Called automatically by `Canvas.load()` — do not call manually.
   * @throws If the client connection or session setup fails
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = CanvasTool.Write
      this.renderer.init(this.layers.rendering)
      this.layout.render()
      this.menu.render(this.layers.ui.root)
      this.setCssVars(this.#configuration.cssVars)

      this.keyboard.attach()
      this.layers.root.addEventListener("wheel", this.handleWheel)
      this.startResizeObserver()

      this.history.init(this.model)

      if (!this.client.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.client.configuration.server.version = this.info!.version
      }
      await this.client.init()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    } finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.manageIdleState(true)
    }
  }

  /**
   * Change the recognition configuration (language, math solver…) without destroying the canvas.
   * Opens a new backend session with it and re-sends every user stroke; the canvas is read-only
   * meanwhile. Calls are serialized, and those waiting for a running one are applied together.
   * @param partial - Keys to change; an array replaces the current one, `undefined` clears a key
   * @throws If the new session fails to open; the previous configuration is then restored
   * @example
   * ```ts
   * await canvas.updateRecognitionConfiguration({ lang: "fr_FR" })
   * await canvas.updateRecognitionConfiguration({ math: { solver: { "angle-unit": "deg" } } })
   * ```
   */
  updateRecognitionConfiguration(partial: TPartialDeep<TRecognitionWebSocketConfiguration>): Promise<void> {
    const isAlreadyQueued = this.#pendingRecognitionOverride !== undefined
    this.#pendingRecognitionOverride = overrideDeep(this.#pendingRecognitionOverride ?? {}, partial)
    if (!isAlreadyQueued) {
      this.#recognitionUpdate = this.#recognitionUpdate
        .catch(() => undefined)
        .then(() => this.#applyPendingRecognitionOverride())
    }
    return this.#recognitionUpdate
  }

  async #applyPendingRecognitionOverride(): Promise<void> {
    const override = this.#pendingRecognitionOverride ?? {}
    this.#pendingRecognitionOverride = undefined
    const snapshot = structuredClone(this.configuration.recognition)
    const wasReadOnly = this.readOnly
    // Read before overrideDeep: afterwards the override's lang always equals the configured one
    const isLangChanged = !!override.lang && override.lang !== this.configuration.recognition.lang
    try {
      this.logger.info("updateRecognitionConfiguration", { override })
      this.readOnly = true
      overrideDeep(this.configuration.recognition, override)
      await this.#resynchronizeSession(isLangChanged)
    } catch (error) {
      this.configuration.recognition = snapshot
      this.#reportAndThrow("updateRecognitionConfiguration", error)
    } finally {
      this.readOnly = wasReadOnly
      this.updateLayerUI()
    }
  }

  /**
   * Opens a session with the current configuration and replays the user's strokes into it.
   * Solver outputs are cleared first: they were computed with the previous configuration and,
   * being strokes, would otherwise be sent back as ink.
   */
  async #resynchronizeSession(needNewSession: boolean): Promise<void> {
    this.manageIdleState(false)
    await this.math.clearAllSolverOutputs()
    // Reset the export to force synchronization.
    this.model.invalidateExports()
    if (needNewSession) {
      await this.client.newSession(this.configuration)
      const strokes = this.extractStrokesFromSymbols(this.model.symbols).filter((s) => !isStrokeSolverOutput(s))
      if (strokes.length > 0) {
        this.startOperation("Recognizing")
        await this.client.addStrokes(strokes, false)
      }
      if (strokes.length === 0) {
        this.clearOperation("Recognizing")
      }
    } else {
      await this.client.changeConfiguration(this.configuration)
    }
    this.layers.hideLoader()
    this.event.emitLoaded()
    if (this.math.getComputationConfig().autoCompute) {
      await this.math.tryAutoCompute()
    }
  }

  /**
   * Build a symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Complete symbol instance
   */
  protected buildSymbol(partialSymbol: TPartialDeep<TSymbol>): TSymbol {
    try {
      return createSymbolFromPartial(partialSymbol)
    } catch (error) {
      this.#reportAndThrow("buildSymbol", error)
    }
  }

  /**
   * Optimizes client calls by comparing old and new strokes
   * and calling the most appropriate method (erase, add, or replace)
   * @param oldStrokes - Strokes before the change
   * @param newStrokes - Strokes after the change
   * @returns Whether anything was sent
   */
  #optimizeClientCall(oldStrokes: TStroke[], newStrokes: TStroke[]): boolean {
    const oldStrokeIds = new Set(oldStrokes.map((s) => s.id))
    const newStrokeIds = new Set(newStrokes.map((s) => s.id))

    const addedStrokes = newStrokes.filter((s) => !oldStrokeIds.has(s.id))
    const removedStrokeIds = oldStrokes.filter((s) => !newStrokeIds.has(s.id)).map((s) => s.id)

    if (removedStrokeIds.length > 0 && addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.replaceStrokes(removedStrokeIds, addedStrokes)
    } else if (removedStrokeIds.length > 0) {
      this.startOperation("Recognizing")
      this.client.eraseStrokes(removedStrokeIds)
    } else if (addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.addStrokes(addedStrokes, false)
    }
    return removedStrokeIds.length > 0 || addedStrokes.length > 0
  }

  /**
   * Create a symbol from partial data
   * @param partialSymbol - Partial symbol data
   * @returns Promise resolving to created symbol
   */
  async createSymbol(partialSymbol: TPartialDeep<TSymbol>): Promise<TSymbol> {
    try {
      return await this.addSymbol(this.buildSymbol(partialSymbol))
    } catch (error) {
      this.#reportAndThrow("createSymbol", error)
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Create multiple symbols from partial data
   * @param partialSymbols - Array of partial symbol data
   * @returns Promise resolving to array of created symbols
   */
  async createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]> {
    try {
      const symbols = createSymbolsFromPartial(partialSymbols)
      return await this.addSymbols(symbols)
    } catch (error) {
      this.#reportAndThrow("createSymbols", error)
    }
  }

  /** @hidden */
  protected updateTypesetBounds(symbol: TSymbol): void {
    if (isText(symbol) || isMath(symbol)) {
      this.typeset.setBounds(symbol)
    }
  }

  /** @hidden */
  async addSymbol(sym: TSymbol, addToHistory = true): Promise<TSymbol> {
    await this.addSymbols([sym], addToHistory)
    return sym
  }

  /**
   * Add multiple symbols to the model and renderer
   * @param symList - Array of symbols to add
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to array of added symbols
   */
  async addSymbols(symList: TSymbol[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("addSymbols", { symList })
    this.manageIdleState(false)
    symList.forEach((s) => {
      this.updateTypesetBounds(s)
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
    }
    this.client.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push({
        added: symList,
      })
    }
    this.updateLayerUI()
    return symList
  }

  /**
   * Update one symbol: `updateSymbols([id], patch, addToHistory)`.
   * @returns The updated record, or undefined when no symbol has this id
   */
  async updateSymbol(id: string, patch: TSymbolUpdate, addToHistory = true): Promise<TSymbol | undefined> {
    const [updated] = await this.updateSymbols([id], patch, addToHistory)
    return updated
  }

  /**
   * Update symbols by id, each with the same patch.
   *
   * - an object patch: `style` is merged into each symbol's style, `font` is applied to the texts
   *   (any other symbol ignores it);
   * - a function patch: called with a draft of each symbol, to change it at will.
   *
   * Texts and maths are re-measured, and a text that gets wider or narrower slides the texts after it
   * on its row. The backend hears only of strokes that appeared or disappeared: style is not
   * recognized. Only the symbols named are touched, whatever the size of the document.
   * @param addToHistory - Whether to add to history (default: true). Texts slid along are part of the same entry.
   * @returns The updated records; an id with no symbol is skipped
   * @example
   * ```ts
   * await canvas.updateSymbols(ids, { style: { color: "#ff0000" } })
   * await canvas.updateSymbols(ids, { font: { size: 18, weight: "bold" } })
   * await canvas.updateSymbols([text.id], (draft) => { if (isText(draft)) draft.decorators = [] })
   * ```
   */
  async updateSymbols(ids: string[], patch: TSymbolUpdate, addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("updateSymbols", { ids, patch })
    const befores: TSymbol[] = []
    const afters: TSymbol[] = []
    // One flat list of before/after pairs: the symbols patched, and the texts that had to slide along
    // because a text got wider or narrower. Both are just symbols whose record changed.
    const updated: NonNullable<TIIHistoryChanges["updated"]> = []
    // Driven by the id list rather than by a scan of the document: drafting by id is O(m).
    ids.forEach((id) => {
      // The committed record is frozen, so it is the snapshot: nothing to clone
      const before = this.model.getSymbol(id)
      const draft = before && this.#isChangedBy(before, patch) ? this.model.draftSymbol(id) : undefined
      if (!before || !draft) {
        return
      }
      updated.push(...this.#applyPatch(draft, patch))
      this.renderer.drawSymbol(draft)
      const after = this.model.getSymbol(id) ?? draft
      updated.push({ before, after })
      befores.push(before)
      afters.push(after)
    })
    if (this.#optimizeClientCall(this.extractStrokesFromSymbols(befores), this.extractStrokesFromSymbols(afters))) {
      this.manageIdleState(false)
    }
    if (addToHistory && updated.length) {
      this.history.push({ updated })
    }
    this.updateLayerUI()
    return afters
  }

  /** A font alone changes nothing but a text */
  #isChangedBy(symbol: TSymbol, patch: TSymbolUpdate): boolean {
    return typeof patch === "function" || !!patch.style || isText(symbol)
  }

  /** Applies the patch to the draft and commits it. Returns the texts it slid along. */
  #applyPatch(draft: TDraft<TSymbol>, patch: TSymbolUpdate): NonNullable<TIIHistoryChanges["updated"]> {
    if (typeof patch === "function") {
      patch(draft)
    } else if (patch.style) {
      draft.style = { ...draft.style, ...patch.style }
    }
    if (isText(draft)) {
      return this.#retypesetText(draft, typeof patch === "function" ? {} : patch)
    }
    if (isMath(draft)) {
      // Measures the math and commits the draft in one call
      this.typeset.updateBounds(draft)
    } else {
      this.model.commitSymbol(draft)
    }
    return []
  }

  /**
   * Hands a text's new style and font down to its chars, re-measures it, commits the draft, and
   * slides the texts after it on its row by the width it gained or lost. Returns those moves.
   */
  #retypesetText(text: TText, { style, font }: TSymbolPatch): NonNullable<TIIHistoryChanges["updated"]> {
    if (style) {
      TextUtil.updateChildrenStyle(text)
    }
    if (font) {
      TextUtil.updateChildrenFont(text, {
        fontSize: font.size,
        fontWeight: font.weight === "auto" ? undefined : font.weight,
      })
    }
    // `typeset.updateBounds` measures the fresh box and commits the draft in the same call —
    // reading the width before and after *that* call, rather than after a separate
    // `commitSymbol`, is what keeps `text` mutable long enough for `updateBounds` to write
    // `bounds` at all: a committed symbol is frozen, and assigning into a frozen `bounds` throws.
    const lastWidth = SymbolGeometry.boundsOf(text).width
    this.typeset.updateBounds(text)
    const tx = SymbolGeometry.boundsOf(text).width - lastWidth
    return tx !== 0 ? (this.typeset.moveTextAfter(text, tx) ?? []) : []
  }

  /**
   * Replace old symbols with new symbols
   * @param oldSymbols - Array of old symbols to be replaced
   * @param newSymbols - Array of new symbols to replace with
   * @param addToHistory - Whether to add this operation to history (default: true)
   */
  async replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory = true): Promise<void> {
    this.logger.info("replaceSymbols", { oldSymbols, newSymbols })
    this.manageIdleState(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    // Destructured, not shifted: the caller's array is left as it was handed over
    const [symToReplace, ...otherOldSymbols] = oldSymbols

    if (symToReplace) {
      otherOldSymbols.forEach((s) => {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

      this.model.replaceSymbol(symToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symToReplace.id, newSymbols)

      this.#optimizeClientCall(oldStrokes, newStrokes)

      // Only clean up what pointed at symbols fully gone (not re-created by newSymbols)
      const newIds = new Set(newSymbols.map((s) => s.id))
      const cleanup = this.#cleanupAfterRemoval(oldSymbols.filter((s) => !newIds.has(s.id)))
      if (addToHistory) {
        this.history.push(this.#withRemovalCleanup({ replaced: { oldSymbols: [...oldSymbols], newSymbols } }, cleanup))
      }
      this.updateLayerUI()
    }
  }

  /**
   * Change the order of a symbol in the rendering stack
   * @param symbol - Symbol to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbol(symbol: TSymbol, position: "first" | "last" | "forward" | "backward"): void {
    this.changeOrderSymbols([symbol], position)
  }

  /**
   * Change the order of multiple symbols in the rendering stack
   * @param symbols - Symbols to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void {
    symbols.forEach((s) => {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push({ order: { symbols, position } })
  }

  /**
   * Synchronize strokes with JIIX export
   */
  async synchronize(): Promise<void> {
    await this.synchronizer.synchronize()
    if (this.model.symbolsSelected.length > 0) {
      this.selector.drawSelectedGroup(this.model.symbolsSelected)
    }
  }

  /**
   * After removing symbols, cleans up what pointed at them, in one pass over the document: a
   * standalone decorator left with no target is erased, one losing some shrinks to the rest, and an
   * edge anchor on a removed target is cleared. Returns what changed so callers can include it in
   * history - undoing the removal then also restores the decorator and the anchor.
   * `removedSymbols` must be the symbol objects captured *before* they left the model: their
   * `jiixBlockId` is what pre-convert anchors point at, and it can no longer be looked up here.
   */
  #cleanupAfterRemoval(removedSymbols: TSymbol[]): TRemovalCleanup {
    const cleanup: TRemovalCleanup = { erased: [], updated: [] }
    if (!removedSymbols.length) {
      return cleanup
    }
    const removedIds = new Set(removedSymbols.map((s) => s.id))
    const removedBlockIds = new Set(
      removedSymbols.flatMap((s) => (isStroke(s) && s.jiixBlockId ? [s.jiixBlockId] : []))
    )
    const isTargetRemoved = (symbolId: string): boolean => removedIds.has(symbolId) || removedBlockIds.has(symbolId)
    // `model.symbols` is a fresh array: removing or updating a symbol during the loop does not disturb it
    for (const sym of this.model.symbols) {
      if (isDecorator(sym)) {
        this.#detachRemovedTargets(sym, removedIds, cleanup)
      } else {
        this.#detachRemovedAnchors(sym, isTargetRemoved, cleanup)
      }
    }
    return cleanup
  }

  #detachRemovedTargets(dec: TDecorator, removedIds: Set<string>, cleanup: TRemovalCleanup): void {
    const remaining = dec.targetIds.filter((id) => !removedIds.has(id))
    if (remaining.length === dec.targetIds.length) {
      return
    }
    if (!remaining.length) {
      this.model.removeSymbol(dec.id)
      this.renderer.removeElement(dec.id)
      cleanup.erased.push(dec)
      return
    }
    // Drafted rather than mutated where it lies: `model.symbols` hands out the store's
    // deep-frozen committed records, so writing `targetIds` straight onto `dec` threw
    // `TypeError: Cannot assign to read only property`. That made this whole branch — losing
    // one target out of several — dead from the moment the store began freezing, and nothing
    // exercised it to say so.
    const draft = this.model.draftSymbol(dec.id)
    if (!draft || !isDecorator(draft)) {
      return
    }
    draft.targetIds = remaining
    // Whole-document scan (`this.model.symbols`): an unregistered target type must not
    // abort cleanup for every other decorator, so it is filtered out silently rather
    // than let `SymbolGeometry.boundsOf` throw.
    const geometryTargets = remaining
      .map((id) => this.model.getSymbol(id))
      .filter((s): s is TSymbol => !!s && symbolRegistry.has(s.type))
    if (geometryTargets.length) {
      // Losing a target shrinks the decorator: its box is an input, so nothing else would
      // narrow it and the underline would keep spanning the erased stroke.
      DecoratorUtil.refitTargetBounds(
        draft,
        geometryTargets.map((s) => SymbolGeometry.boundsOf(s))
      )
    }
    this.model.updateSymbol(draft)
    this.renderer.drawSymbol(draft)
    cleanup.updated.push({ before: { ...dec }, after: draft })
  }

  /** The anchors of an edge, or of a pre-convert Edge stroke; undefined for any other symbol */
  #anchorsOf(sym: TSymbol): { startAnchor?: TAnchor; endAnchor?: TAnchor } | undefined {
    if (EdgeUtil.isEdge(sym) && (EdgeUtil.isLineEdge(sym) || EdgeUtil.isPolyEdge(sym) || EdgeUtil.isArcEdge(sym))) {
      return sym
    }
    return isStroke(sym) && sym.jiixBlockType === "Edge" ? sym : undefined
  }

  #detachRemovedAnchors(sym: TSymbol, isTargetRemoved: (id: string) => boolean, cleanup: TRemovalCleanup): void {
    const anchors = this.#anchorsOf(sym)
    const hitStart = !!anchors?.startAnchor && isTargetRemoved(anchors.startAnchor.symbolId)
    const hitEnd = !!anchors?.endAnchor && isTargetRemoved(anchors.endAnchor.symbolId)
    if (!hitStart && !hitEnd) {
      return
    }
    // Guarded above on the committed record, drafted only now that it is actually losing an
    // anchor: the record itself is frozen.
    const draft = this.model.draftSymbol(sym.id)
    const draftAnchors = draft && this.#anchorsOf(draft)
    if (!draft || !draftAnchors) {
      return
    }
    if (hitStart) {
      draftAnchors.startAnchor = undefined
    }
    if (hitEnd) {
      draftAnchors.endAnchor = undefined
    }
    this.model.commitSymbol(draft)
    // A pre-convert stroke draws no anchor, so it has nothing to redraw
    if (!isStroke(draft)) {
      this.renderer.drawSymbol(draft)
    }
    cleanup.updated.push({ before: { ...sym }, after: draft })
  }

  /** Adds what cleaning up after a removal changed to the removal's own history entry */
  #withRemovalCleanup(changes: TIIHistoryChanges, { erased, updated }: TRemovalCleanup): TIIHistoryChanges {
    if (erased.length) {
      changes.erased = [...(changes.erased ?? []), ...erased]
    }
    appendUpdated(changes, updated)
    return changes
  }

  /**
   * Remove a symbol from the model
   * @param id - ID of symbol to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbol is removed
   */
  async removeSymbol(id: string, addToHistory = true): Promise<void> {
    this.logger.info("removeSymbol", { id })
    const symbol = this.model.getSymbol(id)
    if (symbol) {
      this.manageIdleState(false)
      this.startOperation("Recognizing")
      this.client.eraseStrokes([id])
      this.#clearGhostOf(symbol)
      this.model.removeSymbol(symbol.id)
      this.renderer.removeSymbol(symbol.id)
      const cleanup = this.#cleanupAfterRemoval([symbol])
      if (addToHistory) {
        this.history.push(this.#withRemovalCleanup({ erased: [symbol] }, cleanup))
      }
      this.updateLayerUI()
    } else {
      this.renderer.removeSymbol(id)
      this.startOperation("Recognizing")
      this.client.eraseStrokes([id])
    }
    this.selector.removeSelectedGroup()
  }

  /** A removed stroke of a math block takes the block's ghost result with it */
  #clearGhostOf(symbol: TSymbol): void {
    if (isStroke(symbol) && symbol.jiixBlockType === "Math" && symbol.jiixBlockId) {
      if (this.math.hasGhostStrokes(symbol.jiixBlockId)) {
        this.math.clearGhostStrokes(symbol.jiixBlockId)
      }
    }
  }

  /**
   * Remove multiple symbols from the model
   * @param ids - Array of symbol IDs to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbols are removed
   */
  async removeSymbols(ids: string[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("removeSymbols", { ids })
    const symbolsRemoved: TSymbol[] = []
    const strokesIds: string[] = []
    ids.forEach((id) => {
      const sym = this.model.getSymbol(id)
      if (sym) {
        symbolsRemoved.push(sym)
        if (isStroke(sym)) {
          strokesIds.push(sym.id)
          this.#clearGhostOf(sym)
        }
        this.model.removeSymbol(sym.id)
        this.renderer.removeSymbol(sym.id)
      }
    })
    if (strokesIds.length > 0) {
      this.startOperation("Recognizing")
      this.client.eraseStrokes(strokesIds)
    }

    const cleanup = this.#cleanupAfterRemoval(symbolsRemoved)
    if (addToHistory && symbolsRemoved.length) {
      this.history.push(this.#withRemovalCleanup({ erased: symbolsRemoved }, cleanup))
      this.updateLayerUI()
    }
    this.manageIdleState(false)
    this.selector.removeSelectedGroup()
    return symbolsRemoved
  }

  /**
   * Select symbols by their IDs
   * @param ids - Array of symbol IDs to select
   */
  select(ids: string[]): void {
    this.tool = CanvasTool.Select
    // A Set: `ids.includes` inside a pass over the whole document was O(n·m)
    const idsToSelect = new Set(ids)
    this.model.symbols.forEach((s) => {
      const shouldBeSelected = idsToSelect.has(s.id)
      const wasSelected = this.model.selectedIds.has(s.id)
      if (wasSelected !== shouldBeSelected) {
        if (shouldBeSelected) {
          this.model.selectSymbol(s.id)
        } else {
          this.model.unselectSymbol(s.id)
        }
        this.renderer.updateSelectedState(s, shouldBeSelected)
      }
    })
    this.selector.expandSelectionForMathBlocks()
    this.selector.expandSelectionForBlocks()
    this.#afterSelectionChanged()
  }

  /**
   * Select all symbols
   */
  selectAll(): void {
    this.tool = CanvasTool.Select
    this.model.symbols.forEach((s) => {
      this.model.selectSymbol(s.id)
      this.renderer.updateSelectedState(s, true)
    })
    this.#afterSelectionChanged()
  }

  /** Draws the selection, follows it with the math block selection, and tells the listeners */
  #afterSelectionChanged(): void {
    this.selector.drawSelectedGroup(this.model.symbolsSelected)

    const selectedMathJiixBlockId = this.selector.getSelectedMathJiixBlockId()
    if (selectedMathJiixBlockId) {
      this.math.selectBlock(selectedMathJiixBlockId)
    } else {
      this.math.clearBlockSelection()
    }
    this.updateLayerUI()
    this.event.emitSelected(this.model.symbolsSelected)
  }

  /**
   * Unselect all currently selected symbols
   */
  unselectAll(): void {
    if (this.model.symbolsSelected.length) {
      this.model.symbolsSelected.forEach((s) => {
        this.renderer.updateSelectedState(s, false)
      })
      this.model.resetSelection()
      this.selector.removeSelectedGroup()
      this.updateLayerUI()

      this.math.clearBlockSelection()
      setTimeout(() => this.event.emitSelected(this.model.symbolsSelected), 0)
    }
  }

  /**
   * Import strokes from point events
   * @param partialStrokes - Array of partial stroke data
   * @returns Promise resolving to updated model
   */
  async importPointEvents(partialStrokes: TPartialDeep<TStroke>[]): Promise<IIModel> {
    this.logger.info("importPointEvents", { partialStrokes })
    this.manageIdleState(false)
    const strokes = partialStrokes.map(StrokeUtil.createFromPartial)
    strokes.forEach((s) => {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
      this.client.addStrokes(strokes, false)
    }
    this.history.push({ added: strokes })
    this.logger.debug("importPointEvents", this.model)
    this.updateLayerUI()
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  /**
   * Get bounding box for a list of symbols
   * @param symbols - Symbols to calculate bounds for
   * @param margin - TMargin to add around bounds (default: SELECTION_PADDING)
   * @returns Bounding box containing all symbols
   */
  getSymbolsBounds(symbols: TSymbol[], margin: number = SELECTION_PADDING): TBox {
    // Public API: callers (export, minimap, viewport framing) can pass an arbitrary symbol
    // list, including a selection built with no registry check, so an unregistered type is
    // dropped from the bounds computation instead of throwing.
    const box = BoxOps.createFromBoxes(
      symbols.filter((s) => symbolRegistry.has(s.type)).map((s) => OBBOps.toBox(SymbolGeometry.boundsOf(s)))
    )
    box.x -= margin
    box.y -= margin
    box.width += margin * 2
    box.height += margin * 2
    return box
  }

  /**
   * Set the viewport zoom level, optionally anchored to a point.
   * @param zoom - Target zoom factor (e.g. 1.5 = 150 %)
   * @param centerX - X coordinate to zoom around (pixels, default: viewport center)
   * @param centerY - Y coordinate to zoom around (pixels, default: viewport center)
   */
  zoom(zoom: number, centerX?: number, centerY?: number): void {
    this.renderer.setZoom(zoom, centerX, centerY)
  }

  /**
   * Zoom and pan the view to fit the given symbols (or all symbols) within the viewport.
   * Resets to zoom 1 if there are no symbols.
   * @param symbols - Symbols to fit (default: all model symbols)
   */
  zoomToFit(symbols?: TSymbol[]): void {
    const targets = symbols ?? this.model.symbols
    const vpW = this.renderer.parent.clientWidth
    const vpH = this.renderer.parent.clientHeight

    if (!targets.length) {
      this.renderer.setZoom(1)
      this.renderer.setViewBox(0, 0, vpW, vpH)
      return
    }

    const bounds = this.getSymbolsBounds(targets, 0)
    const margin = InteractiveInkCanvas.ZOOM_FIT_MARGIN
    const zoom = Math.max(0.1, Math.min((vpW - margin * 2) / bounds.width, (vpH - margin * 2) / bounds.height))

    const vbW = vpW / zoom
    const vbH = vpH / zoom
    const vbX = bounds.x + bounds.width / 2 - vbW / 2
    const vbY = bounds.y + bounds.height / 2 - vbH / 2

    this.renderer.setZoom(zoom)
    this.renderer.setViewBox(vbX, vbY, vbW, vbH)
  }

  /**
   * Get the current viewport zoom level.
   * @returns Current zoom factor (1.0 = 100 %)
   */
  getZoom(): number {
    return this.renderer.getZoom()
  }

  /**
   * Shift the viewport by the given pixel delta without changing zoom.
   * @param dx - Horizontal offset in pixels (positive = pan right)
   * @param dy - Vertical offset in pixels (positive = pan down)
   */
  pan(dx: number, dy: number): void {
    this.renderer.pan(dx, dy)
  }

  /**
   * Export the content in the given format.
   *
   * `pdf` is not available here — printing produces no in-memory value, use
   * {@link InteractiveInkCanvas.download} instead.
   *
   * @param format - Format to export to; the resolved type follows from it
   * @param options - Which symbols to export (`scope`, or an explicit `symbols` list)
   * @returns Promise resolving with the exported content
   *
   * @example
   * ```typescript
   * const symbols = await canvas.exportAs("json")
   * const markdown = await canvas.exportAs("markdown")
   * const svg = await canvas.exportAs("svg", { scope: "selection" })
   * ```
   */
  exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]> {
    return this.exportManager.exportAs(format, options)
  }

  /**
   * Export the content and hand the resulting file to the browser.
   *
   * @param format - Format to download; `pdf` opens the print flow instead of saving a file
   * @param options - Which symbols to export, plus the file name. The PDF settings
   *                  (`format`/`orientation`/`mode`/`scale`) are ignored by every other format.
   *
   * @example
   * ```typescript
   * await canvas.download("svg")
   * await canvas.download("text", { scope: "selection", filename: "notes" })
   * await canvas.download("pdf", { orientation: "landscape" })
   * ```
   */
  download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void> {
    return this.exportManager.download(format, options)
  }

  /**
   * Extract all strokes from symbols recursively
   * @param symbols - Symbols to extract strokes from
   * @returns Array of extracted strokes
   */
  extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[] {
    return extractStrokes(symbols)
  }

  /**
   * Extract all math symbols recursively
   * @param symbols - Symbols to extract maths from
   * @returns Array of extracted math symbols
   */
  extractMathsFromSymbols(symbols: TSymbol[] | undefined): TMath[] {
    return symbols?.filter(isMath) ?? []
  }

  protected handleWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      const rect = this.layers.root.getBoundingClientRect()
      this.#pendingWheelDeltaY += event.deltaY
      this.#pendingWheelOffset = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      this.#scheduleWheelZoom()
    }
  }

  /**
   * Coalesces `setZoom()` (attribute mutation + virtualization reconciliation + guide redraw)
   * to at most one call per animation frame — a trackpad pinch/ctrl+scroll fires many `wheel`
   * events per frame. Summing `deltaY` across the coalesced events and applying it in one
   * `Math.exp()` against the pre-frame zoom is exactly equivalent to applying each event's zoom
   * factor in sequence (exponents add under multiplication), so no precision is lost.
   */
  #scheduleWheelZoom(): void {
    this.#wheelZoomCoalescer.schedule(() => {
      if (!this.#pendingWheelOffset) {
        return
      }
      const zoomIntensity = 0.001
      const zoom = this.renderer.getZoom() * Math.exp(-this.#pendingWheelDeltaY * zoomIntensity)
      this.renderer.setZoom(zoom, this.#pendingWheelOffset.x, this.#pendingWheelOffset.y)
      this.menu.action.update()
      this.#pendingWheelDeltaY = 0
      this.#pendingWheelOffset = undefined
    })
  }

  /**
   * Undo the last action
   * @returns Promise resolving to updated model
   */
  async undo(): Promise<IIModel> {
    this.logger.info("undo")
    return this.history.context.canUndo ? this.#replayHistory("undo") : this.model
  }

  #hasBackendActions(actions: TIIHistoryBackendChanges): boolean {
    return !!(actions.added?.length || actions.erased?.length || actions.replaced)
  }

  /**
   * Notes how far a math block's ghost result has to travel to stay with its expression.
   *
   * The delta is `restored ∘ current⁻¹` — read off the two records rather than taken from the
   * history entry, which no longer says *how* a symbol changed, only what it changed to. That is
   * enough here, and only here: a ghost is an overlay, not part of any record, so nothing else
   * would move it.
   *
   * Collected into a map keyed by block rather than applied on the spot. Every stroke of an
   * expression carries the same transform and produces the same delta, so applying it per stroke
   * moved the ghost by as many multiples as the expression had strokes.
   */
  #collectGhostDelta(into: Map<string, MatrixTransform>, current: TSymbol, restored: TSymbol): void {
    if (!isStroke(restored) || restored.jiixBlockType !== "Math" || !restored.jiixBlockId) {
      return
    }
    if (into.has(restored.jiixBlockId) || !this.math.hasGhostStrokes(restored.jiixBlockId)) {
      return
    }
    // `identity().multiply(m)` copies `m`: `invert` and `multiply` work in place, and a record is frozen
    const inverse = MatrixTransform.identity().multiply(current.transform).invert()
    const delta = MatrixTransform.identity().multiply(restored.transform).multiply(inverse)
    if (isIdentityMatrix(delta)) {
      return
    }
    into.set(restored.jiixBlockId, delta)
  }

  /**
   * The math blocks whose ghost result a replay invalidates, as opposed to merely repositions.
   *
   * Driven by the symbol-level changes rather than the backend ones: `extractIIBackendChanges`
   * folds `updated` into `replaced`, which loses the distinction this needs. A block whose strokes
   * were added, erased or genuinely replaced has a stale result and must lose its ghost; a block
   * that only moved keeps it, repositioned by {@link #moveGhostResultWith}.
   */
  #ghostBlocksInvalidatedBy(changes: TIIHistoryChanges): string[] {
    const touched = [
      ...(changes.added || []),
      ...(changes.erased || []),
      ...(changes.replaced?.oldSymbols || []),
      ...(changes.replaced?.newSymbols || []),
    ]
    const blockIds = extractStrokes(touched).map((stroke) => {
      // The live record first, the entry's snapshot second. A history entry holds a stroke as it
      // was when the step happened, and a stroke has no `jiixBlockId` at the moment it is written —
      // recognition assigns one later. Reading only the snapshot found no block for an undo of a
      // freshly drawn stroke, so a ghost result outlived the expression it belonged to.
      const live = this.model.getSymbol(stroke.id)
      return (live && isStroke(live) ? live.jiixBlockId : undefined) ?? stroke.jiixBlockId
    })
    return [...new Set(blockIds)].filter((id): id is string => !!id)
  }

  /**
   * Applies a history diff locally (model + renderer), replacing the model-clone-swap this
   * used to do. Backend replay is a separate, consolidated message sent by the caller via
   * extractIIBackendChanges - this method must never talk to `this.client` itself, or the
   * backend would receive the same action twice.
   */
  #applyHistoryChanges(changes: TIIHistoryChanges): void {
    this.manageIdleState(false)
    this.unselectAll()

    // A history entry is a value: putting one into the document hands over a copy, so the entry
    // stays replayable and the document never shares identity with the stack. Undo and redo entries
    // also share their arrays (see `reverseChanges`), so a stored reference would be reachable from
    // both directions.
    const restore = <T extends TSymbol>(sym: T): T => cloneSymbol(sym) as T

    changes.added?.forEach((sym) => {
      this.model.addSymbol(restore(sym))
      this.renderer.drawSymbol(sym)
    })
    changes.erased?.forEach((sym) => {
      this.model.removeSymbol(sym.id)
      this.renderer.removeSymbol(sym.id)
    })
    // One delta per math block, not per symbol: an expression is many strokes, they all move
    // together, and applying the delta once per stroke would shift the ghost by a multiple of it.
    const ghostDeltas = new Map<string, MatrixTransform>()
    changes.updated?.forEach(({ after }) => {
      // Read before the restore: a ghost result's coordinates come from the recognizer, in
      // millimetres, so it cannot be re-placed from the model — it is either carried by the same
      // matrix as its expression or thrown away. Restoring a record that only moved leaves the
      // result itself valid, so the delta between where the symbol is and where it is going back to
      // is what the ghost has to follow.
      const current = this.model.getSymbol(after.id)
      this.model.updateSymbol(restore(after))
      this.renderer.drawSymbol(after)
      if (current) {
        this.#collectGhostDelta(ghostDeltas, current, after)
      }
    })
    ghostDeltas.forEach((delta, jiixBlockId) => this.math.applyTransformToGhostStrokes(jiixBlockId, delta))
    if (changes.replaced) {
      const [anchor, ...rest] = changes.replaced.oldSymbols
      rest.forEach((s) => {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })
      this.model.replaceSymbol(anchor.id, changes.replaced.newSymbols.map(restore))
      this.renderer.replaceSymbol(anchor.id, changes.replaced.newSymbols)
    }
    const { order } = changes
    order?.symbols.forEach((sym) => {
      this.model.changeOrderSymbol(sym.id, order.position)
      this.renderer.changeOrderSymbol(sym, order.position)
    })
  }

  /** Steps the history back or forth: locally first, then on the backend as one consolidated message. */
  async #replayHistory(direction: "undo" | "redo"): Promise<IIModel> {
    const changes = direction === "undo" ? this.history.undo() : this.history.redo()
    this.logger.debug(direction, { changes })
    // Resolved before the replay: it reads each stroke's block off the document, and the replay is
    // about to remove some of them.
    const invalidatedGhostBlocks = this.#ghostBlocksInvalidatedBy(changes)
    this.#applyHistoryChanges(changes)
    const actionsToBackend = extractIIBackendChanges(changes)
    const hasBackendActions = this.#hasBackendActions(actionsToBackend)
    try {
      if (hasBackendActions) {
        invalidatedGhostBlocks.forEach((jiixBlockId) => this.math.clearGhostStrokes(jiixBlockId))
        this.startOperation("Recognizing")
        await this.client[direction](actionsToBackend)
      }
      if (changes.variables?.length) {
        await this.math.replayVariableChanges(changes.variables, hasBackendActions)
      }
    } finally {
      this.updateLayerUI()
    }
    return this.model
  }

  /**
   * Redo the previously undone action
   * @returns Promise resolving to updated model
   */
  async redo(): Promise<IIModel> {
    this.logger.info("redo")
    return this.history.context.canRedo ? this.#replayHistory("redo") : this.model
  }

  /**
   * Export content to specified MIME types
   * @param mimeTypes - Array of MIME types to export
   * @returns Promise resolving with exports
   */
  async export(mimeTypes?: string[]): Promise<TExport> {
    try {
      this.logger.info("export", { mimeTypes })
      const requestedMimeTypes = mimeTypes?.length ? mimeTypes : this.client.mimeTypes
      const missingMimeTypes = requestedMimeTypes.filter((mt) => !this.model.exports?.[mt])
      if (missingMimeTypes.length === 0) {
        return this.model.exports!
      }
      const versionAtRequest = this.model.version
      const exports = await this.client.export(missingMimeTypes)
      if (this.model.version !== versionAtRequest) {
        // The model mutated (e.g. a gesture-triggered stroke erase) while this export request
        // was in flight — the response reflects a server state that's already superseded, so
        // merging it would cache stale content. Debounce the retry so a burst of mutations
        // coalesces into a single re-fetch instead of one per mutation.
        return this.#debouncedExportRetry(missingMimeTypes)
      }
      this.model.mergeExport(exports as TExport)
      this.jiix.invalidateIndex()
      return this.model.exports!
    } catch (error) {
      this.#reportAndThrow("export", error)
    }
  }

  /**
   * Coalesces concurrent stale-export retries triggered within the debounce window into a
   * single re-fetch covering the union of requested mime types.
   */
  #debouncedExportRetry(mimeTypes: string[]): Promise<TExport> {
    mimeTypes.forEach((mt) => this.#pendingExportRetryMimeTypes.add(mt))
    if (!this.#pendingExportRetry) {
      this.#pendingExportRetry = new Promise<TExport>((resolve, reject) => {
        this.#settleExportRetry = { resolve, reject }
      })
    }
    // Re-armed on every call: clearing the timer without arming a new one left the shared retry
    // unscheduled, and every caller waiting on it hung.
    clearTimeout(this.#exportRetryTimer)
    this.#exportRetryTimer = setTimeout(() => this.#runExportRetry(), InteractiveInkCanvas.EXPORT_RETRY_DEBOUNCE_MS)
    return this.#pendingExportRetry
  }

  #runExportRetry(): void {
    const mimeTypesToRetry = [...this.#pendingExportRetryMimeTypes]
    const settle = this.#settleExportRetry
    this.#pendingExportRetryMimeTypes.clear()
    this.#pendingExportRetry = undefined
    this.#settleExportRetry = undefined
    this.export(mimeTypesToRetry).then(settle?.resolve, settle?.reject)
  }

  /**
   * Convert specific symbols, or all symbols if none specified
   * @param symbols - Symbols to convert (defaults to all symbols)
   * @returns Promise that resolves when conversion is complete
   */
  async convert(symbols?: TSymbol[]): Promise<void> {
    try {
      this.manageIdleState(false)
      const addedSymbols = await this.converter.apply(symbols)
      this.select(addedSymbols.map((s) => s.id))
      this.event.emitConverted()
    } catch (error) {
      this.#reportAndThrow("convert", error)
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Duplicate specific symbols, or all symbols if none specified
   * @param symbols - Symbols to duplicate (defaults to all symbols)
   * @returns Promise resolving with duplicated symbols
   */
  async duplicate(symbols?: TSymbol[]): Promise<TSymbol[]> {
    try {
      this.manageIdleState(false)
      const symbolsToDuplicate = symbols ?? this.model.symbols
      // `symbols` is caller-supplied and may include an unregistered type; skip it for the
      // placement-offset computation rather than abort the whole duplicate.
      const bounds = BoxOps.createFromBoxes(
        symbolsToDuplicate
          .filter((s) => symbolRegistry.has(s.type))
          .map((s) => OBBOps.toBox(SymbolGeometry.boundsOf(s)))
      )

      const duplicatedSymbols = symbolsToDuplicate.map((s) => {
        const clone = cloneSymbol(s)

        // Generate unique ID for cloned symbols
        while (this.model.getSymbol(clone.id)) {
          clone.id = `${clone.type}-${createUUID()}`
        }

        const matrix = MatrixTransform.identity().translate(DUPLICATE_OFFSET, bounds.height + DUPLICATE_OFFSET)
        this.transform.translate.applyToSymbol(clone, matrix)
        return clone
      })
      this.unselectAll()
      const syms = await this.addSymbols(duplicatedSymbols)
      this.select(syms.map((s) => s.id))
      return syms
    } catch (error) {
      this.#reportAndThrow("duplicate", error)
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Wait for the client to become idle
   * @returns Promise that resolves when idle
   */
  async waitForIdle(): Promise<void> {
    return this.client.waitForIdle()
  }

  /**
   * Resize the canvas
   * @param dimensions - New height and/or width
   * @returns Promise that resolves when resize is complete
   */
  async resize({ height, width }: { height?: number; width?: number } = {}): Promise<void> {
    try {
      this.logger.info("resize", { height, width })
      const dims = this.resolveDimensions(height, width)

      if (dims.height === this.#renderedHeight && dims.width === this.#renderedWidth) {
        this.logger.debug("resize", "no change")
        return
      }
      this.#renderedHeight = dims.height
      this.#renderedWidth = dims.width

      this.manageIdleState(false)
      this.renderer.resize(dims.height, dims.width)
      this.updateLayerUI(50)
      this.manageIdleState(true)
    } catch (error) {
      this.manageError(error)
    }
  }

  protected get minDimensions(): { minHeight: number; minWidth: number } {
    return this.configuration.rendering
  }

  /**
   * Apply or replace CSS custom properties on the canvas root element.
   * Clears all existing `--ms-ink-*` properties first, then sets the provided vars.
   * Does not reinitialize — current model and session are preserved.
   * Pass `undefined` to reset to stylesheet defaults.
   * @group Canvas
   */
  setCssVars(vars: Record<string, string> | undefined): void {
    const rootStyle = this.layers.root.style
    Array.from(rootStyle)
      .filter((p) => p.startsWith("--ms-ink-"))
      .forEach((p) => rootStyle.removeProperty(p))
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => rootStyle.setProperty(key, value))
    }
    this.#configuration.cssVars = vars
  }

  /**
   * Clear all content from the canvas
   * @returns Promise that resolves when cleared
   */
  async clear(): Promise<void> {
    try {
      this.logger.info("clear")
      this.manageIdleState(false)
      if (this.model.symbols.length) {
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.history.push({ erased })
        this.startOperation("Recognizing")
        await this.client.clear()
        this.event.emitSelected(this.model.symbolsSelected)
      }
      this.updateLayerUI()
      this.event.emitCleared()
    } catch (error) {
      // "Recognizing" is normally bulk-cleared by onContentChanged, which is driven by the
      // client's contentChanged event — that never arrives if the clear failed, so the badge
      // would stay lit forever.
      this.clearOperation("Recognizing")
      this.manageError(error)
    }
  }

  #isCopyableSymbol(symbol: TSymbol): boolean {
    return !isDecorator(symbol) && !isStrokeSolverOutput(symbol)
  }

  #cloneSymbolForPaste(symbol: TSymbol, tx: number, ty: number): TSymbol {
    const clone = cloneSymbol(symbol)
    clone.id = `${clone.type}-${createUUID()}`
    const matrix = MatrixTransform.identity().translate(tx, ty)
    this.transform.translate.applyToSymbol(clone, matrix)
    return clone
  }

  /**
   * Copy selected symbols (or all symbols if nothing selected) to the internal clipboard
   */
  copy(): void {
    this.logger.info("copy")
    const symbols = this.model.symbolsSelected.length ? this.model.symbolsSelected : this.model.symbols
    this.#clipboard = symbols.filter((s) => this.#isCopyableSymbol(s)).map((s) => cloneSymbol(s))
  }

  /**
   * Paste clipboard symbols at an offset and select them
   */
  async paste(): Promise<void> {
    if (!this.#clipboard.length) {
      return
    }
    this.logger.info("paste", { count: this.#clipboard.length })
    const clones = this.#clipboard.map((s) =>
      this.#cloneSymbolForPaste(s, InteractiveInkCanvas.PASTE_OFFSET, InteractiveInkCanvas.PASTE_OFFSET)
    )
    this.unselectAll()
    await this.addSymbols(clones)
    this.select(clones.map((c) => c.id))
  }

  /**
   * Cut selected symbols: copy them to clipboard, then remove from model
   */
  async cut(): Promise<void> {
    this.logger.info("cut")
    this.copy()
    const ids = this.model.symbolsSelected.map((s) => s.id)
    if (ids.length) {
      await this.removeSymbols(ids)
    }
  }

  /**
   * Tear down every manager the canvas owns that carries the {@link IIAbstractManager} lifecycle,
   * in reverse construction order so a manager is released before whatever it was built on.
   * `math` cascades to its own sub-managers.
   *
   * Deliberately an explicit list rather than enumerating the instance: a manager added later and
   * forgotten here is caught by the "should destroy every manager it owns" test, which does
   * enumerate at runtime.
   */
  #destroyManagers(): void {
    this.playback.destroy()
    this.connector.destroy()
    this.math.destroy()
    this.jiix.destroy()
    this.synchronizer.destroy()
    this.snaps.destroy()
    this.overlays.destroy()
    this.typeset.destroy()
    this.converter.destroy()
    this.transform.destroy()
    this.gesture.destroy()
    this.move.destroy()
    this.selector.destroy()
    this.keyboard.destroy()
  }

  /**
   * Destroy the canvas and clean up resources
   * @returns Promise that resolves when destruction is complete
   */
  async destroy(): Promise<void> {
    this.logger.info("destroy")

    this.keyboard.detach()
    this.layers.root.removeEventListener("wheel", this.handleWheel)
    this.#wheelZoomCoalescer.cancel()

    this.layers.root.classList.remove(...this.cursorClasses)
    this.#detachToolManagers()

    this.#destroyManagers()
    this.exportManager.destroy()
    this.teardownCommon()
    this.menu.destroy()
    this.layout.destroy()
    this.client.destroy()
    this.model.clear()
    this.history.clear()
    this.clearRootElementReference()
    return Promise.resolve()
  }
}
