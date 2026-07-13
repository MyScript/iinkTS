import { DOMFactory } from "@/components/dom"
import { EditorTool, SELECTION_MARGIN } from "@/Constants"
import type { TEditorOptionsBase } from "@/editor/AbstractEditor"
import { AbstractEditor } from "@/editor/AbstractEditor"
import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { THistoryContext, TIIHistoryBackendChanges, TIIHistoryChanges, TIIHistoryStackItem } from "@/history"
import { extractIIBackendChanges, IIHistoryManager } from "@/history"
import {
  EraseManager,
  IIConnectorManager,
  IIConversionManager,
  IIGestureManager,
  IIJiixQueryManager,
  IIKeyboardManager,
  IIMathManager,
  IIMoveManager,
  IIOverlayManager,
  IISelectionManager,
  IISnapManager,
  IISynchronizerManager,
  IITransformManager,
  IITypesetManager,
  IIWriterManager,
} from "@/manager"
import type { IIMenuAction, IIMenuStyle, IIMenuTool } from "@/menu"
import { IIMenuManager } from "@/menu"
import type { TExport } from "@/model"
import { IIModel } from "@/model"
import { RecognizerWebSocket } from "@/recognizer"
import type { TIIRendererConfiguration } from "@/renderer"
import { SVGBuilder, SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TBox, TDecorator, TMath, TStroke, TSymbol, TText } from "@/symbol"
import type { TBaseSymbol } from "@/symbol"
import {
  cloneSymbol,
  extractStrokes,
  isDecorator,
  isMath,
  isStroke,
  isStrokeSolverOutput,
  isText,
  StrokeOps,
} from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import { MathOps } from "@/symbol/math/Math"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps } from "@/symbol/primitives/OBB"
import { TextOps } from "@/symbol/text/Text"
import { createSymbolFromPartial, createSymbolsFromPartial, registerBuiltinSymbolUtils } from "@/symbol-utils"
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"
import type { SymbolUtil } from "@/symbol-utils/SymbolUtil"
import { MatrixTransform } from "@/transform"
import type { TPartialDeep } from "@/utils"
import { createUUID, mergeDeep } from "@/utils"

import type { TInteractiveInkEditorConfiguration } from "./InteractiveInkEditorConfiguration"
import { InteractiveInkEditorConfiguration } from "./InteractiveInkEditorConfiguration"

/**
 * @group Editor
 */
export type TInteractiveInkEditorOptions = TPartialDeep<
  TEditorOptionsBase & {
    configuration: TInteractiveInkEditorConfiguration
  }
> & {
  override?: {
    recognizer?: RecognizerWebSocket
    menu?: {
      style?: IIMenuStyle
      tool?: IIMenuTool
      action?: IIMenuAction
    }
  }
}

/**
 * @group Editor
 */
export class InteractiveInkEditor extends AbstractEditor implements TInteractiveInkEditor {
  static readonly PASTE_OFFSET = 20
  static readonly ZOOM_FIT_MARGIN = 40

  #configuration: InteractiveInkEditorConfiguration
  #model: IIModel
  #tool: EditorTool = EditorTool.Write
  #layerUITimer?: ReturnType<typeof setTimeout>
  #recognizeStrokeTimer?: ReturnType<typeof setTimeout>
  #clipboard: TSymbol[] = []
  #renderedWidth = 0
  #renderedHeight = 0

  /** SVG renderer responsible for drawing symbols onto the canvas layer. */
  renderer: SVGRenderer
  /** WebSocket recognizer handling real-time communication with the MyScript backend. */
  recognizer: RecognizerWebSocket

  #penStyle: TStyle

  /** Manages undo/redo history stack for all symbol changes. */
  history: IIHistoryManager
  /** Handles ink input: captures pointer events and creates strokes. */
  writer: IIWriterManager
  /** Handles keyboard shortcuts and hotkey-based tool switching. */
  keyboard: IIKeyboardManager
  /** Handles erasing strokes and symbols via pointer interaction. */
  eraser: EraseManager
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
  /** Synchronizes the local model with the JIIX export from the backend recognizer. */
  synchronizer: IISynchronizerManager
  /** Queries and maps JIIX data to local symbols for math/text label resolution. */
  jiix: IIJiixQueryManager
  /** Manages math recognition: variables, computation, and evaluation rendering. */
  math: IIMathManager
  /** Manages smart connectors and anchor-based endpoint updates. */
  connector: IIConnectorManager
  /** Manages the floating UI menu (tool selector, style panel, action buttons). */
  menu: IIMenuManager
  /** Static utility class for creating DOM elements. */
  readonly dom = DOMFactory

  /**
   * Create and attach an InteractiveInk editor to the given DOM element.
   * Use `Editor.load()` instead of calling this constructor directly.
   * @param rootElement - Host DOM element that will contain the editor layers
   * @param options - Editor options: configuration, CSS vars, manager overrides
   */
  constructor(rootElement: HTMLElement, options?: TInteractiveInkEditorOptions) {
    super(rootElement, options)

    registerBuiltinSymbolUtils()
    this.#configuration = new InteractiveInkEditorConfiguration(options?.configuration)
    this.#penStyle = Object.assign({}, this.#configuration.penStyle)
    if (options?.override?.recognizer) {
      const CustomRecognizer = options?.override.recognizer as unknown as typeof RecognizerWebSocket
      this.recognizer = new CustomRecognizer(this.#configuration)
    } else {
      this.recognizer = new RecognizerWebSocket(this.#configuration)
    }
    this.recognizer.event.addErrorListener(this.manageError.bind(this))
    this.recognizer.event.addExportedListener(this.event.emitExported.bind(this.event))
    this.recognizer.event.addContentChangedListener(this.onContentChanged.bind(this))
    this.recognizer.event.addSessionOpenedListener(this.event.emitSessionOpened.bind(this.event))
    this.recognizer.event.addEndInitialization(this.layers.clearModal.bind(this.layers))
    this.recognizer.event.addEndInitialization(this.markConnectedOnce.bind(this))
    this.recognizer.event.addIdleListener(this.updateLayerState.bind(this))
    this.recognizer.event.addConnectionStatusChangedListener((status) =>
      this.manageConnectionStatus(status, this.recognizer.offlineQueueLength)
    )

    this.renderer = new SVGRenderer(this.#configuration.rendering)

    this.#model = new IIModel(this.configuration.rendering.guides.gap)

    this.history = new IIHistoryManager(this.#configuration["undo-redo"], this.event)

    this.keyboard = new IIKeyboardManager(this)
    this.writer = new IIWriterManager(this)
    this.eraser = new EraseManager(this)
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
    this.math = new IIMathManager(this, this.#configuration.math)
    this.connector = new IIConnectorManager(this)
    this.menu = new IIMenuManager(this, options?.override?.menu)
  }

  /**
   * Promise that resolves when the WebSocket session is fully initialized.
   * Await this before calling any recognition methods.
   */
  get initializationPromise(): Promise<void> {
    return this.recognizer.initialized.promise
  }

  /**
   * True while strokes are queued locally waiting for reconnection.
   * Listen to `event.addConnectionStatusChangedListener` for change notifications.
   */
  get isOffline(): boolean {
    return this.recognizer.isOffline
  }

  /**
   * Active editing tool.
   * Setting this switches cursor style, attaches/detaches the corresponding manager,
   * clears selection, and emits a `toolChanged` event.
   */
  get tool(): EditorTool {
    return this.#tool
  }
  set tool(i: EditorTool) {
    this.#tool = i
    this.menu.tool.update()
    this.setCursorStyle()
    this.unselectAll()

    if (i !== EditorTool.Move) {
      this.keyboard.resetStoredTool()
    }

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()
    switch (this.#tool) {
      case EditorTool.Erase:
        this.eraser.attach(this.layers.rendering)
        break
      case EditorTool.Select:
        this.selector.attach(this.layers.rendering)
        break
      case EditorTool.Move:
        this.move.attach(this.layers.rendering)
        break
      default:
        this.writer.attach(this.layers.rendering)
        break
    }
    this.event.emitToolChanged(i)
  }

  /**
   * Current symbol model containing all ink, text, math, and shape symbols.
   */
  get model(): IIModel {
    return this.#model
  }

  /**
   * Active editor configuration (recognition, rendering, menu, math, etc.).
   */
  get configuration(): InteractiveInkEditorConfiguration {
    return this.#configuration
  }
  /**
   * Apply a partial rendering configuration at runtime.
   * Triggers a resize and guide-row recompute.
   * @param renderingConfiguration - Partial rendering config to merge
   */
  set renderingConfiguration(renderingConfiguration: TIIRendererConfiguration) {
    this.configuration.rendering = mergeDeep(this.configuration.rendering, renderingConfiguration)
    const height = Math.max(this.renderer.parent.clientHeight, this.configuration.rendering.minHeight)
    const width = Math.max(this.renderer.parent.clientWidth, this.configuration.rendering.minWidth)
    this.renderer.resize(height, width)
    this.model.rowHeight = this.configuration.rendering.guides.gap
    this.history.stack.forEach((i) => (i.model.rowHeight = this.model.rowHeight))
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
  }

  protected updateLayerState(idle: boolean): void {
    this.manageIdleState(idle)
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
   * Display an error in the editor overlay and emit an `error` event.
   * @param error - Error to display and emit
   */
  manageError(error: Error): void {
    this.layers.showMessageError(error)
    this.event.emitError(error)
  }

  registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void {
    symbolRegistry.register(util)
  }

  getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined {
    return symbolRegistry.getUtil<T>(type)
  }

  protected setCursorStyle(): void {
    switch (this.#tool) {
      case EditorTool.Erase:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.add("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Select:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.add("select")
        this.layers.root.classList.remove("move")
        break
      case EditorTool.Move:
        this.layers.root.classList.remove("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.add("move")
        break
      default:
        this.layers.root.classList.add("draw")
        this.layers.root.classList.remove("erase")
        this.layers.root.classList.remove("select")
        this.layers.root.classList.remove("move")
        break
    }
  }

  protected async onContentChanged(undoRedoContext: THistoryContext): Promise<void> {
    clearTimeout(this.#recognizeStrokeTimer)
    this.#recognizeStrokeTimer = setTimeout(async () => {
      try {
        await this.synchronize()
      } finally {
        // Clears every "Recognizing" started since the last synchronize (writer/transform pointerDown,
        // programmatic API calls) in one shot — not a matched start/end pair, since several may have
        // accumulated before this single debounced synchronize() ran.
        this.clearOperation("Recognizing")
      }
      this.updateLayerUI(0)
      this.event.emitChanged(undoRedoContext)
    }, 500)
  }

  /**
   * Initialize the editor: render layers, attach input handlers, connect to the
   * WebSocket recognizer, and load the initial session.
   * Called automatically by `Editor.load()` — do not call manually.
   * @throws If the recognizer connection or session setup fails
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("initialize")
      this.layers.render()
      this.layers.showLoader()
      this.tool = EditorTool.Write
      this.renderer.init(this.layers.rendering)
      this.menu.render(this.layers.ui.root)
      this.setCssVars(this.#configuration.cssVars)

      this.keyboard.attach()
      this.layers.root.addEventListener("wheel", this.handleWheel)
      this.startResizeObserver()

      this.model.rowHeight = this.configuration.rendering.guides.gap
      this.history.init(this.model)

      if (!this.recognizer.configuration.server.version) {
        await this.loadInfo(this.configuration.server)
        this.recognizer.configuration.server.version = this.info!.version
      }
      await this.recognizer.init()
    } catch (error) {
      this.logger.error("initialize", error)
      this.layers.showMessageError(error as Error)
      throw error
    } finally {
      this.logger.debug("initialize", "finally")
      this.layers.hideLoader()
      this.updateLayerState(true)
    }
  }

  /**
   * Switch the recognition language without destroying the editor.
   * Opens a new backend session and re-sends all existing strokes.
   * @param code - BCP 47 language code (e.g. `"en_US"`, `"fr_FR"`)
   * @throws If the new session fails to open
   */
  async changeLanguage(code: string): Promise<void> {
    try {
      this.logger.info("changeLanguage", { code })
      this.updateLayerState(false)
      this.configuration.recognition.lang = code
      await this.recognizer.newSession(this.configuration)
      const strokes = this.extractStrokesFromSymbols(this.model.symbols)
      if (strokes.length > 0) {
        this.startOperation("Recognizing")
        this.recognizer.addStrokes(strokes, false)
      }
      this.layers.hideLoader()
      this.event.emitLoaded()
    } catch (error) {
      this.logger.error("changeLanguage", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
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
      this.logger.error("buildSymbol", error)
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Optimizes recognizer calls by comparing old and new strokes
   * and calling the most appropriate method (erase, add, or replace)
   * @param oldStrokes - Strokes before the change
   * @param newStrokes - Strokes after the change
   */
  #optimizeRecognizerCall(oldStrokes: TStroke[], newStrokes: TStroke[]): void {
    const oldStrokeIds = new Set(oldStrokes.map((s) => s.id))
    const newStrokeIds = new Set(newStrokes.map((s) => s.id))

    const addedStrokes = newStrokes.filter((s) => !oldStrokeIds.has(s.id))
    const removedStrokeIds = oldStrokes.filter((s) => !newStrokeIds.has(s.id)).map((s) => s.id)

    if (removedStrokeIds.length > 0 && addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.recognizer.replaceStrokes(removedStrokeIds, addedStrokes)
    } else if (removedStrokeIds.length > 0) {
      this.startOperation("Recognizing")
      this.recognizer.eraseStrokes(removedStrokeIds)
    } else if (addedStrokes.length > 0) {
      this.startOperation("Recognizing")
      this.recognizer.addStrokes(addedStrokes, false)
    }
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
      this.logger.error("createSymbol", error)
      this.manageError(error as Error)
      throw error
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
      this.logger.error("createSymbols", error)
      this.manageError(error as Error)
      throw error
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
    this.logger.info("addSymbol", { sym })
    this.updateLayerState(false)
    this.updateTypesetBounds(sym)
    this.model.addSymbol(sym)
    this.renderer.drawSymbol(sym)

    const strokes = this.extractStrokesFromSymbols([sym])
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
    }
    this.recognizer.addStrokes(strokes, false)

    if (addToHistory) {
      this.history.push(this.model, {
        added: [sym],
      })
    }
    this.updateLayerUI()
    return sym
  }

  /**
   * Add multiple symbols to the model and renderer
   * @param symList - Array of symbols to add
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to array of added symbols
   */
  async addSymbols(symList: TSymbol[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("addSymbol", { symList })
    this.updateLayerState(false)
    symList.forEach((s) => {
      this.updateTypesetBounds(s)
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    const strokes = this.extractStrokesFromSymbols(symList)
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
    }
    this.recognizer.addStrokes(strokes, false)
    if (addToHistory) {
      this.history.push(this.model, {
        added: symList,
      })
    }
    this.updateLayerUI()
    return symList
  }

  /**
   * Update an existing symbol
   * @param sym - Symbol to update
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to updated symbol
   */
  async updateSymbol(sym: TSymbol, addToHistory = true): Promise<TSymbol> {
    this.logger.info("updateSymbol", { sym })
    this.updateLayerState(false)
    this.updateTypesetBounds(sym)

    const oldSymbol = this.history.stack.at(-1)?.model.getRootSymbol(sym.id) ?? this.model.getRootSymbol(sym.id)
    const oldStrokes = oldSymbol ? this.extractStrokesFromSymbols([oldSymbol]) : []

    this.model.updateSymbol(sym)
    this.renderer.drawSymbol(sym)

    const newStrokes = this.extractStrokesFromSymbols([sym])

    this.#optimizeRecognizerCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push(this.model, {
        updated: [sym],
      })
    }
    this.updateLayerUI()
    return sym
  }

  /**
   * Update multiple existing symbols
   * @param symList - Array of symbols to update
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise resolving to array of updated symbols
   */
  async updateSymbols(symList: TSymbol[], addToHistory = true): Promise<TSymbol[]> {
    this.logger.info("updateSymbol", { symList })
    this.updateLayerState(false)

    const oldSymbolsMap = new Map<string, TSymbol>()
    symList.forEach((sym) => {
      const oldSymbol = this.history.stack.at(-1)?.model.getRootSymbol(sym.id) ?? this.model.getRootSymbol(sym.id)
      if (oldSymbol) {
        oldSymbolsMap.set(sym.id, oldSymbol)
      }
    })
    const oldStrokes = this.extractStrokesFromSymbols(Array.from(oldSymbolsMap.values()))

    symList.forEach((s) => {
      this.updateTypesetBounds(s)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
    })

    const newStrokes = this.extractStrokesFromSymbols(symList)
    this.#optimizeRecognizerCall(oldStrokes, newStrokes)

    if (addToHistory) {
      this.history.push(this.model, {
        updated: symList,
      })
    }
    this.updateLayerUI()
    return symList
  }

  /**
   * Update style of multiple symbols
   * @param symbolIds - Array of symbol IDs to update
   * @param style - Partial style to apply
   * @param addToHistory - Whether to add to history (default: true)
   */
  updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>, addToHistory = true): void {
    this.logger.info("updateSymbolsStyle", {
      symbolIds,
      style,
    })
    const symbols: TSymbol[] = []
    this.model.symbols.forEach((s) => {
      if (symbolIds.includes(s.id)) {
        s.style = Object.assign({}, s.style, style)
        if (isText(s)) {
          TextOps.updateChildrenStyle(s)
        }
        this.renderer.drawSymbol(s)
        this.model.updateSymbol(s)
        s.modificationDate = Date.now()
        symbols.push(s)
      }
    })
    if (symbols.length) {
      symbols.forEach((s) => {
        if (isText(s)) {
          const lastWidth = s.bounds.width
          this.typeset.updateBounds(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            this.typeset.moveTextAfter(s, tx)
          }
        }
      })
    }
    if (addToHistory && symbols.length) {
      this.history.push(this.model, {
        style: { symbols, style },
      })
    }
  }

  /**
   * Update font style of text symbols
   * @param textIds - Array of text symbol IDs
   * @param options - Font style options (fontSize, fontWeight)
   */
  updateTextFontStyle(
    textIds: string[],
    {
      fontSize,
      fontWeight,
    }: {
      fontSize?: number
      fontWeight?: "normal" | "bold" | "auto"
    }
  ): void {
    this.logger.info("updateTextFontStyle", {
      textIds,
      fontSize,
      fontWeight,
    })
    const symbols: TText[] = []
    const translate: {
      symbols: TSymbol[]
      tx: number
      ty: number
    }[] = []
    this.model.symbols.forEach((s) => {
      if (textIds.includes(s.id)) {
        if (isText(s)) {
          TextOps.updateChildrenFont(s, {
            fontSize,
            fontWeight: fontWeight === "auto" ? undefined : fontWeight,
          })
          const lastWidth = s.bounds.width
          this.typeset.updateBounds(s)
          this.renderer.drawSymbol(s)
          const tx = s.bounds.width - lastWidth
          if (tx !== 0) {
            const symbolsTranslated = this.typeset.moveTextAfter(s, tx)
            if (symbolsTranslated?.length) {
              translate.push({
                symbols: symbolsTranslated,
                tx,
                ty: 0,
              })
            }
          }
          s.modificationDate = Date.now()
          symbols.push(s)
        }
      }
    })
    if (symbols.length) {
      this.history.push(this.model, {
        style: { symbols, fontSize },
        translate,
      })
    }
  }

  /**
   * Replace old symbols with new symbols
   * @param oldSymbols - Array of old symbols to be replaced
   * @param newSymbols - Array of new symbols to replace with
   * @param addToHistory - Whether to add this operation to history (default: true)
   */
  async replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory = true): Promise<void> {
    this.logger.info("replaceSymbol", {
      oldSymbols,
      newSymbols,
    })
    this.updateLayerState(false)

    const oldStrokes = this.extractStrokesFromSymbols(oldSymbols)
    const newStrokes = this.extractStrokesFromSymbols(newSymbols)

    const symToReplace = oldSymbols.shift()

    if (symToReplace) {
      oldSymbols.forEach((s) => {
        this.renderer.removeSymbol(s.id)
        this.model.removeSymbol(s.id)
      })

      this.model.replaceSymbol(symToReplace.id, newSymbols)
      this.renderer.replaceSymbol(symToReplace.id, newSymbols)

      this.#optimizeRecognizerCall(oldStrokes, newStrokes)

      // All old symbols (including symToReplace) are gone; new symbols replace them
      const allOldIds = new Set([symToReplace.id, ...oldSymbols.map((s) => s.id)])
      const newIds = new Set(newSymbols.map((s) => s.id))
      // Only clean up decorators whose targets are fully gone (not re-created by newSymbols)
      const removedIds = new Set([...allOldIds].filter((id) => !newIds.has(id)))
      const { erased: decErased, updated: decUpdated } = this.#cleanupDecoratorsForRemovedIds(removedIds)

      if (addToHistory) {
        const changes: TIIHistoryChanges = {
          replaced: {
            oldSymbols: [symToReplace, ...oldSymbols],
            newSymbols,
          },
        }
        if (decErased.length) {
          changes.erased = decErased
        }
        if (decUpdated.length) {
          changes.updated = decUpdated
        }
        this.history.push(this.model, changes)
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
    this.model.changeOrderSymbol(symbol.id, position)
    this.renderer.changeOrderSymbol(symbol, position)
    this.history.push(this.model, {
      order: { symbols: [symbol], position },
    })
  }

  /**
   * Change the order of multiple symbols in the rendering stack
   * @param symbols - Symbols to reorder
   * @param position - New position (first, last, forward, backward)
   */
  changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward") {
    symbols.forEach((s) => {
      this.model.changeOrderSymbol(s.id, position)
      this.renderer.changeOrderSymbol(s, position)
    })
    this.history.push(this.model, {
      order: { symbols, position },
    })
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
   * After removing strokes, clean up orphaned/partial standalone decorators.
   * Returns erased and updated decorators so callers can include them in history.
   */
  #cleanupDecoratorsForRemovedIds(removedIds: Set<string>): {
    erased: TDecorator[]
    updated: TDecorator[]
  } {
    const erased: TDecorator[] = []
    const updated: TDecorator[] = []

    for (const sym of [...this.model.symbols]) {
      if (!isDecorator(sym)) {
        continue
      }
      const dec = sym as TDecorator
      const remaining = dec.targetIds.filter((id) => !removedIds.has(id))
      if (remaining.length === 0) {
        this.model.removeSymbol(dec.id)
        this.renderer.removeElement(dec.id)
        erased.push(dec)
      } else if (remaining.length < dec.targetIds.length) {
        dec.targetIds = remaining
        const targetSyms = remaining.map((id) => this.model.getRootSymbol(id)).filter((s): s is TSymbol => !!s)
        if (targetSyms.length) {
          DecoratorOps.setBounds(dec, OBBOps.createFromOBBs(targetSyms.map((s) => s.bounds)))
        }
        this.model.updateSymbol(dec)
        this.renderer.drawSymbol(dec)
        updated.push(dec)
      }
    }

    return { erased, updated }
  }

  /**
   * Remove a symbol from the model
   * @param id - ID of symbol to remove
   * @param addToHistory - Whether to add to history (default: true)
   * @returns Promise that resolves when symbol is removed
   */
  async removeSymbol(id: string, addToHistory = true): Promise<void> {
    this.logger.info("removeSymbol", { id })
    const symbol = this.model.getRootSymbol(id)
    if (symbol) {
      this.updateLayerState(false)
      this.startOperation("Recognizing")
      this.recognizer.eraseStrokes([id])
      if (
        isStroke(symbol) &&
        symbol.jiixBlockType === "Math" &&
        symbol.jiixBlockId &&
        this.math.hasGhostStrokes(symbol.jiixBlockId)
      ) {
        this.math.clearGhostStrokes(symbol.jiixBlockId)
      }
      this.model.removeSymbol(symbol.id)
      this.renderer.removeSymbol(symbol.id)
      const { erased: decErased, updated: decUpdated } = this.#cleanupDecoratorsForRemovedIds(new Set([id]))
      if (addToHistory) {
        const changes: TIIHistoryChanges = {
          erased: [symbol],
        }
        if (decErased.length) {
          changes.erased = [...changes.erased!, ...decErased]
        }
        if (decUpdated.length) {
          changes.updated = decUpdated
        }
        this.history.push(this.model, changes)
      }
      this.updateLayerUI()
    } else {
      this.renderer.removeSymbol(id)
      this.startOperation("Recognizing")
      this.recognizer.eraseStrokes([id])
    }
    this.selector.removeSelectedGroup()
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
      const sym = this.model.getRootSymbol(id)
      if (sym) {
        symbolsRemoved.push(sym)
        if (isStroke(sym)) {
          strokesIds.push(sym.id)
          if (sym.jiixBlockType === "Math" && sym.jiixBlockId && this.math.hasGhostStrokes(sym.jiixBlockId)) {
            this.math.clearGhostStrokes(sym.jiixBlockId)
          }
        }
        this.model.removeSymbol(sym.id)
        this.renderer.removeSymbol(sym.id)
      }
    })
    if (strokesIds.length > 0) {
      this.startOperation("Recognizing")
      this.recognizer.eraseStrokes(strokesIds)
    }

    const removedIds = new Set(symbolsRemoved.map((s) => s.id))
    const { erased: decErased, updated: decUpdated } = this.#cleanupDecoratorsForRemovedIds(removedIds)

    if (addToHistory && symbolsRemoved.length) {
      const changes: TIIHistoryChanges = {
        erased: symbolsRemoved,
      }
      if (decErased.length) {
        changes.erased = [...changes.erased!, ...decErased]
      }
      if (decUpdated.length) {
        changes.updated = decUpdated
      }
      this.history.push(this.model, changes)
      this.updateLayerUI()
    }
    this.updateLayerState(false)
    this.selector.removeSelectedGroup()
    return symbolsRemoved
  }

  /**
   * Select symbols by their IDs
   * @param ids - Array of symbol IDs to select
   */
  select(ids: string[]): void {
    this.tool = EditorTool.Select
    this.model.symbols.forEach((s) => {
      const shouldBeSelected = ids.includes(s.id)
      const wasSelected = this.model.selectedIds.has(s.id)
      if (wasSelected !== shouldBeSelected) {
        if (shouldBeSelected) {
          this.model.selectedIds.add(s.id)
        } else {
          this.model.selectedIds.delete(s.id)
        }
        this.renderer.updateSelectedState(s, shouldBeSelected)
      }
    })
    this.selector.expandSelectionForMathBlocks()
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
   * Select all symbols
   */
  selectAll(): void {
    this.tool = EditorTool.Select
    this.model.symbols.forEach((s) => {
      this.model.selectedIds.add(s.id)
      this.renderer.updateSelectedState(s, true)
    })
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
    this.logger.info("importPointEvents", {
      partialStrokes,
    })
    this.updateLayerState(false)
    const strokes = partialStrokes.map(StrokeOps.createFromPartial)
    strokes.forEach((s) => {
      this.model.addSymbol(s)
      this.renderer.drawSymbol(s)
    })
    if (strokes.length > 0) {
      this.startOperation("Recognizing")
      this.recognizer.addStrokes(strokes, false)
    }
    this.history.push(this.model, {
      added: strokes,
    })
    this.logger.debug("importPointEvents", this.model)
    this.updateLayerUI()
    this.event.emitImported(this.model.exports as TExport)
    return this.model
  }

  protected triggerDownload(fileName: string, urlData: string): void {
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", urlData)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  /**
   * Get bounding box for a list of symbols
   * @param symbols - Symbols to calculate bounds for
   * @param margin - TMargin to add around bounds (default: SELECTION_MARGIN)
   * @returns Bounding box containing all symbols
   */
  getSymbolsBounds(symbols: TSymbol[], margin: number = SELECTION_MARGIN): TBox {
    const box = BoxOps.createFromBoxes(symbols.map((s) => OBBOps.toBox(s.bounds)))
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
    const margin = InteractiveInkEditor.ZOOM_FIT_MARGIN
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

  protected buildBlobFromSymbols(symbols: TSymbol[], box: TBox): Blob {
    const svgNode = SVGBuilder.createLayer(box)
    symbols.forEach((s) => {
      const el = this.renderer.getElementById(s.id)?.cloneNode(true)
      if (el) {
        svgNode.appendChild(el)
      }
    })

    const svgString = new XMLSerializer().serializeToString(svgNode)

    return new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })
  }

  protected getExportName(extension: string): string {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
    try {
      return `iink-ts-${new Date().toLocaleDateString(navigator.language, options)}.${extension}`
    } catch {
      return `iink-ts-${new Date().toLocaleDateString("en-US", options)}.${extension}`
    }
  }

  /**
   * Download symbols as SVG file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsSVG(selection = false) {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)
    const url = URL.createObjectURL(svgBlob)
    this.triggerDownload(this.getExportName("svg"), url)
  }

  /**
   * Download symbols as PNG file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsPNG(selection = false) {
    const symbols = selection ? this.model.symbolsSelected : this.model.symbols
    const box = this.getSymbolsBounds(symbols)
    const svgBlob = this.buildBlobFromSymbols(symbols, box)

    const url = URL.createObjectURL(svgBlob)
    const image = new Image(box.width, box.height)
    image.src = url
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height

      const ctx = canvas.getContext("2d") as CanvasRenderingContext2D
      ctx.drawImage(image, 0, 0)
      URL.revokeObjectURL(url)

      const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")

      this.triggerDownload(this.getExportName("png"), imgURI)
    }
  }

  /**
   * Download symbols as JSON file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsJson(selection = false) {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols

    const clonedSymbols = symbolsToExport.map((s) => cloneSymbol(s))
    const filteredSymbols = clonedSymbols

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredSymbols, null, 2))
    this.triggerDownload(this.getExportName("json"), dataStr)
  }

  /**
   * Download symbols as plain text file, either all symbols or only selected ones
   * @param selection - Whether to download only selected symbols (default: false, downloads all symbols)
   */
  downloadAsText(selection = false) {
    const symbolsToExport = selection ? this.model.symbolsSelected : this.model.symbols
    const text = this.extractTextFromSymbols(symbolsToExport)
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    this.triggerDownload(this.getExportName("txt"), dataStr)
  }

  protected extractTextFromSymbols(symbols: TSymbol[]): string {
    const entries: { box: TBox; label: string }[] = []
    const seenElementIds = new Set<string>()

    symbols.forEach((s) => {
      if (isText(s)) {
        const content = TextOps.getLabel(s)
        if (content) {
          entries.push({ box: BoxOps.createFromPoints(s.vertices), label: content })
        }
      } else if (isMath(s)) {
        const content = MathOps.getLabel(s)
        if (content) {
          entries.push({ box: BoxOps.createFromPoints(s.vertices), label: content })
        }
      } else if (isStroke(s)) {
        // Stroke with JIIX metadata (text or math recognized from backend).
        // A block (word or math expression) can span several strokes: use
        // the block label so the block is emitted once, and its own
        // bounding box (not draw order) so it sorts into reading order.
        const element = this.jiix.getElementForStroke(s.id)
        if (element && !seenElementIds.has(element.id)) {
          seenElementIds.add(element.id)
          const label = this.jiix.getBlockLabel(element.id)
          if (label) {
            const box = element["bounding-box"] ?? BoxOps.createFromPoints(s.vertices)
            entries.push({ box, label })
          }
        }
      }
    })

    return this.groupEntriesIntoLines(entries)
      .map((line) => line.map((e) => e.label).join(" "))
      .join("\n")
  }

  /**
   * Groups entries (words, math expressions) sharing a vertical extent into
   * the same reading line, ordered top-to-bottom then left-to-right, so
   * words drawn on the same line stay on the same line in the export.
   */
  private groupEntriesIntoLines<T extends { box: TBox }>(entries: T[]): T[][] {
    const sortedByTop = [...entries].sort((a, b) => a.box.y - b.box.y)
    const lines: { bottom: number; entries: T[] }[] = []

    sortedByTop.forEach((entry) => {
      const bottom = entry.box.y + entry.box.height
      const currentLine = lines[lines.length - 1]
      if (currentLine && entry.box.y < currentLine.bottom) {
        currentLine.entries.push(entry)
        currentLine.bottom = Math.max(currentLine.bottom, bottom)
      } else {
        lines.push({ bottom, entries: [entry] })
      }
    })

    return lines.map((line) => line.entries.sort((a, b) => a.box.x - b.box.x))
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
    if (!symbols?.length) {
      return []
    }
    return symbols.filter(isMath)
  }

  protected handleWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      const zoomIntensity = 0.001
      const zoom = this.renderer.getZoom() * Math.exp(-event.deltaY * zoomIntensity)
      const rect = this.layers.root.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      const offsetY = event.clientY - rect.top
      this.renderer.setZoom(zoom, offsetX, offsetY)
      this.menu.action.update()
    }
  }

  /**
   * Undo the last action
   * @returns Promise resolving to updated model
   */
  async undo(): Promise<IIModel> {
    this.logger.info("undo")
    if (this.history.context.canUndo) {
      return this.#undoInternal()
    }
    return this.model
  }

  #hasBackendActions(actions: TIIHistoryBackendChanges): boolean {
    return !!(
      actions.added?.length ||
      actions.erased?.length ||
      actions.replaced ||
      actions.matrix ||
      actions.translate?.length ||
      actions.scale?.length ||
      actions.rotate?.length
    )
  }

  #applyHistoryStackItem(stackItem: TIIHistoryStackItem): TIIHistoryBackendChanges {
    this.updateLayerState(false)
    this.unselectAll()
    const modifications = stackItem.model.extractDifferenceSymbols(this.model)
    this.#model = stackItem.model.clone()
    modifications.removed.forEach((s) => this.renderer.removeSymbol(s.id))
    modifications.added.forEach((s) => this.renderer.drawSymbol(s))
    return extractIIBackendChanges(stackItem.changes)
  }

  async #undoInternal(): Promise<IIModel> {
    const previousStackItem = this.history.undo()
    this.logger.debug("undo", {
      previousStackItem,
    })
    const actionsToBackend = this.#applyHistoryStackItem(previousStackItem)
    if (this.#hasBackendActions(actionsToBackend)) {
      this.startOperation("Recognizing")
      await this.recognizer.undo(actionsToBackend)
    }
    this.updateLayerUI()
    return this.model
  }

  /**
   * Redo the previously undone action
   * @returns Promise resolving to updated model
   */
  async redo(): Promise<IIModel> {
    this.logger.info("redo")

    if (this.history.context.canRedo) {
      return this.#redoInternal()
    }
    return this.model
  }

  async #redoInternal(): Promise<IIModel> {
    const nextStackItem = this.history.redo()
    this.logger.debug("redo", { nextStackItem })
    const actionsToBackend = this.#applyHistoryStackItem(nextStackItem)
    if (this.#hasBackendActions(actionsToBackend)) {
      this.startOperation("Recognizing")
      await this.recognizer.redo(actionsToBackend)
    }
    this.updateLayerUI()
    return this.model
  }

  /**
   * Export content to specified MIME types
   * @param mimeTypes - Array of MIME types to export
   * @returns Promise resolving with exports
   */
  async export(mimeTypes?: string[]): Promise<TExport> {
    try {
      this.logger.info("export", { mimeTypes })
      const exports = await this.recognizer.export(mimeTypes)
      this.model.mergeExport(exports as TExport)
      return exports
    } catch (error) {
      this.logger.error("export", { error })
      this.manageError(error as Error)
      throw error
    }
  }

  /**
   * Convert specific symbols, or all symbols if none specified
   * @param symbols - Symbols to convert (defaults to all symbols)
   * @returns Promise that resolves when conversion is complete
   */
  async convert(symbols?: TSymbol[]): Promise<void> {
    try {
      this.updateLayerState(false)
      const addedSymbols = await this.converter.apply(symbols)
      this.select(addedSymbols.map((s) => s.id))
      this.event.emitConverted()
    } catch (error) {
      this.logger.error("convert", error)
      this.manageError(error as Error)
      throw error
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
      this.updateLayerState(false)
      const symbolsToDuplicate = symbols ?? this.model.symbols
      const bounds = BoxOps.createFromBoxes(symbolsToDuplicate.map((s) => OBBOps.toBox(s.bounds)))

      const duplicatedSymbols = symbolsToDuplicate.map((s) => {
        const clone = cloneSymbol(s)

        // Generate unique ID for cloned symbols
        while (this.model.symbols.find((sym) => sym.id === clone.id)) {
          clone.id = `${clone.type}-${createUUID()}`
        }

        const matrix = MatrixTransform.identity().translate(SELECTION_MARGIN, bounds.height + SELECTION_MARGIN)
        this.transform.translate.applyToSymbol(clone, matrix)
        return clone
      })
      this.unselectAll()
      const syms = await this.addSymbols(duplicatedSymbols)
      this.select(syms.map((s) => s.id))
      return syms
    } catch (error) {
      this.logger.error("duplicate", error)
      this.manageError(error as Error)
      throw error
    } finally {
      this.updateLayerUI()
    }
  }

  /**
   * Wait for the recognizer to become idle
   * @returns Promise that resolves when idle
   */
  async waitForIdle(): Promise<void> {
    return this.recognizer.waitForIdle()
  }

  /**
   * Resize the editor
   * @param dimensions - New height and/or width
   * @returns Promise that resolves when resize is complete
   */
  async resize({
    height,
    width,
  }: {
    height?: number
    width?: number
  } = {}): Promise<void> {
    try {
      this.logger.info("resize", {
        height,
        width,
      })
      const compStyles = window.getComputedStyle(this.layers.root)
      height = height || Math.max(parseInt(compStyles.height.replace("px", "")), this.configuration.rendering.minHeight)
      width = width || Math.max(parseInt(compStyles.width.replace("px", "")), this.configuration.rendering.minWidth)

      if (height === this.#renderedHeight && width === this.#renderedWidth) {
        this.logger.debug("resize", "no change")
        return
      }
      this.#renderedHeight = height
      this.#renderedWidth = width

      this.updateLayerState(false)
      this.renderer.resize(height, width)
      this.updateLayerUI(50)
      this.updateLayerState(true)
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  /**
   * Apply or replace CSS custom properties on the editor root element.
   * Clears all existing `--iink-*` properties first, then sets the provided vars.
   * Does not reinitialize — current model and session are preserved.
   * Pass `undefined` to reset to stylesheet defaults.
   * @group Editor
   */
  setCssVars(vars: Record<string, string> | undefined): void {
    const rootStyle = this.layers.root.style
    Array.from(rootStyle)
      .filter((p) => p.startsWith("--iink-"))
      .forEach((p) => rootStyle.removeProperty(p))
    if (vars) {
      Object.entries(vars).forEach(([key, value]) => rootStyle.setProperty(key, value))
    }
    this.#configuration.cssVars = vars
  }

  /**
   * Clear all content from the editor
   * @returns Promise that resolves when cleared
   */
  async clear(): Promise<void> {
    try {
      this.logger.info("clear")
      this.updateLayerState(false)
      if (this.model.symbols.length) {
        this.selector.removeSelectedGroup()
        const erased = this.model.symbols
        this.renderer.clear()
        this.model.clear()
        this.history.push(this.model, { erased })
        this.startOperation("Recognizing")
        this.recognizer.clear()
        this.event.emitSelected(this.model.symbolsSelected)
      }
      this.updateLayerUI()
      this.event.emitCleared()
    } catch (error) {
      this.manageError(error as Error)
    }
  }

  #isCopyableSymbol(symbol: TSymbol): boolean {
    if (isDecorator(symbol)) {
      return false
    }
    if (isStrokeSolverOutput(symbol)) {
      return false
    }
    return true
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
    this.logger.info("paste", {
      count: this.#clipboard.length,
    })
    const clones = this.#clipboard.map((s) =>
      this.#cloneSymbolForPaste(s, InteractiveInkEditor.PASTE_OFFSET, InteractiveInkEditor.PASTE_OFFSET)
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
   * Destroy the editor and clean up resources
   * @returns Promise that resolves when destruction is complete
   */
  async destroy(): Promise<void> {
    this.logger.info("destroy")

    this.keyboard.detach()
    this.layers.root.removeEventListener("wheel", this.handleWheel)
    this.stopResizeObserver()

    this.layers.root.classList.remove("draw")
    this.layers.root.classList.remove("erase")
    this.layers.root.classList.remove("select")
    this.layers.root.classList.remove("move")

    this.eraser.detach()
    this.selector.detach()
    this.move.detach()
    this.writer.detach()

    this.renderer.destroy()
    this.layers.destroy()
    this.menu.destroy()
    this.recognizer.destroy()
    this.model.clear()
    this.history.clear()
    return Promise.resolve()
  }
}
