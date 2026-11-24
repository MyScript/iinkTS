import type { TExport, TRecognitionWebSocketConfiguration, WebSocketClient } from "@/client"
import type { TBox, TDraft, TPartialDeep } from "@/core"
import type { DOMFactory } from "@/dom"
import type { IIHistoryManager } from "@/history"
import type {
  CanvasTool,
  EraseManager,
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
  TDownloadFormat,
  TExportFormat,
  TExportOptions,
  TExportResultMap,
  TPDFDownloadOptions,
} from "@/manager"
import type { IIMenuManager } from "@/menu"
import type { IIModel } from "@/model"
import type { SVGRenderer, TIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style"
import type { TBaseSymbol, TStroke, TSymbol } from "@/symbol"
import type { SymbolUtil } from "@/symbol-utils"

import type { CanvasEvent, TCanvasConnectionState } from "./CanvasEvent"
import type { CanvasLayer } from "./CanvasLayer"
import type { TCanvasOperationLabel } from "./TCanvasOperationLabel"
import type { InteractiveInkCanvasConfiguration } from "./variants/InteractiveInkCanvasConfiguration"

/**
 * What `updateSymbols(ids, patch)` changes on each symbol it names.
 * @group Canvas
 */
export type TSymbolPatch = {
  /** Merged into the symbol's style; a text hands it down to its chars */
  style?: TPartialDeep<TStyle>
  /** Applied to the chars of a text; any other symbol ignores it. `weight: "auto"` keeps each char's own weight */
  font?: { size?: number; weight?: "normal" | "bold" | "auto" }
}

/**
 * What `updateSymbols(ids, patch)` does to each symbol: an object patch, or a function that changes a
 * draft of the symbol at will.
 * @group Canvas
 */
export type TSymbolUpdate = TSymbolPatch | ((draft: TDraft<TSymbol>) => void)

/**
 * Structural type for InteractiveInkCanvas used by all managers.
 * Managers depend on this type rather than the concrete class to
 * enable isolation testing and future canvas variants.
 * @group Canvas
 */
export type TInteractiveInkCanvas = {
  // ── Core state ─────────────────────────────────────────────────────
  readonly model: IIModel
  readonly configuration: InteractiveInkCanvasConfiguration
  readonly event: CanvasEvent
  readonly layers: CanvasLayer
  readonly renderer: SVGRenderer
  readonly client: WebSocketClient
  readonly dom: typeof DOMFactory
  get penStyle(): TStyle
  set penStyle(v: TPartialDeep<TStyle>)
  tool: CanvasTool
  readOnly: boolean
  set renderingConfiguration(v: TIIRendererConfiguration)

  // ── Canvas state (busy/connection badge) ───────────────────────────
  get connectionState(): TCanvasConnectionState
  trackOperation<T>(label: TCanvasOperationLabel, fn: () => Promise<T>): Promise<T>
  startOperation(label: TCanvasOperationLabel): void
  endOperation(label: TCanvasOperationLabel): void
  hasOperation(label: TCanvasOperationLabel): boolean

  // ── Sub-managers ───────────────────────────────────────────────────
  readonly history: IIHistoryManager
  readonly writer: IIWriterManager
  readonly keyboard: IIKeyboardManager
  readonly eraser: EraseManager
  readonly selector: IISelectionManager
  readonly move: IIMoveManager
  readonly gesture: IIGestureManager
  readonly transform: IITransformManager
  readonly converter: IIConversionManager
  readonly typeset: IITypesetManager
  readonly overlays: IIOverlayManager
  readonly snaps: IISnapManager
  readonly synchronizer: IISynchronizerManager
  readonly jiix: IIJiixQueryManager
  readonly exportManager: IIExportManager
  readonly math: IIMathManager
  readonly connector: IIConnectorManager
  readonly layout: LayoutManager<TInteractiveInkCanvas>
  readonly menu: IIMenuManager
  readonly playback: IIPlaybackManager

  // ── Symbol mutation ────────────────────────────────────────────────
  createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>
  addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>
  addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>
  updateSymbol(id: string, patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol | undefined>
  updateSymbols(ids: string[], patch: TSymbolUpdate, addToHistory?: boolean): Promise<TSymbol[]>
  replaceSymbols(oldSymbols: TSymbol[], newSymbols: TSymbol[], addToHistory?: boolean): Promise<void>
  changeOrderSymbols(symbols: TSymbol[], position: "first" | "last" | "forward" | "backward"): void
  removeSymbol(id: string, addToHistory?: boolean): Promise<void>
  removeSymbols(ids: string[], addToHistory?: boolean): Promise<TSymbol[]>
  extractStrokesFromSymbols(symbols: TSymbol[] | undefined): TStroke[]
  duplicate(symbols?: TSymbol[]): Promise<TSymbol[]>

  // ── Selection ──────────────────────────────────────────────────────
  select(ids: string[]): void
  selectAll(): void
  unselectAll(): void

  // ── Viewport / bounds ──────────────────────────────────────────────
  getSymbolsBounds(symbols: TSymbol[], margin?: number): TBox
  zoomToFit(symbols?: TSymbol[]): void
  zoom(zoom: number, centerX?: number, centerY?: number): void

  // ── History ────────────────────────────────────────────────────────
  undo(): Promise<IIModel>
  redo(): Promise<IIModel>

  // ── Clipboard ─────────────────────────────────────────────────────
  copy(): void
  cut(): Promise<void>
  paste(): Promise<void>

  // ── Recognition / conversion ──────────────────────────────────────
  export(mimeTypes?: string[]): Promise<TExport>
  convert(symbols?: TSymbol[]): Promise<void>
  updateRecognitionConfiguration(partial: TPartialDeep<TRecognitionWebSocketConfiguration>): Promise<void>

  // ── Export / download ─────────────────────────────────────────────
  exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]>
  download(format: TDownloadFormat, options?: TPDFDownloadOptions): Promise<void>

  // ── Symbol plugin registry ────────────────────────────────────────
  registerSymbolUtil<T extends TBaseSymbol>(util: SymbolUtil<T>): void
  getSymbolUtil<T extends TBaseSymbol>(type: string): SymbolUtil<T> | undefined

  // ── Lifecycle / error handling ────────────────────────────────────
  clear(): Promise<void>
  destroy(): Promise<void>
  resize(dims?: { height?: number; width?: number }): Promise<void>
  setCssVars(vars: Record<string, string> | undefined): void
  manageError(error: Error): void
}
