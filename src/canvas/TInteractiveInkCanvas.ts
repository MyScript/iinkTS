import type { WebSocketClient } from "@/client"
import type { DOMFactory } from "@/components/dom"
import type { CanvasTool } from "@/Constants"
import type { IIHistoryManager } from "@/history"
import type {
  EraseManager,
  IIConnectorManager,
  IIConversionManager,
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
} from "@/manager"
import type { IIMenuManager } from "@/menu"
import type { IIModel, TExport } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { TIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style"
import type { TBaseSymbol, TBox, TStroke, TSymbol } from "@/symbol"
import type { SymbolUtil } from "@/symbol-utils/SymbolUtil"
import type { TPartialDeep } from "@/utils"

import type { CanvasEvent, TCanvasConnectionState } from "./CanvasEvent"
import type { CanvasLayer } from "./CanvasLayer"
import type { InteractiveInkCanvasConfiguration } from "./variants/InteractiveInkCanvasConfiguration"

/**
 * Structural type for InteractiveInkCanvas used by all managers.
 * Managers depend on this type rather than the concrete class to
 * enable isolation testing and future editor variants.
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
  set renderingConfiguration(v: TIIRendererConfiguration)

  // ── Canvas state (busy/connection badge) ───────────────────────────
  get connectionState(): TCanvasConnectionState
  trackOperation<T>(label: string, fn: () => Promise<T>): Promise<T>
  startOperation(label: string): void
  endOperation(label: string): void

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
  readonly math: IIMathManager
  readonly connector: IIConnectorManager
  readonly menu: IIMenuManager
  readonly playback: IIPlaybackManager

  // ── Symbol mutation ────────────────────────────────────────────────
  createSymbols(partialSymbols: TPartialDeep<TSymbol>[]): Promise<TSymbol[]>
  addSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>
  addSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>
  updateSymbol(sym: TSymbol, addToHistory?: boolean): Promise<TSymbol>
  updateSymbols(symList: TSymbol[], addToHistory?: boolean): Promise<TSymbol[]>
  updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>, addToHistory?: boolean): void
  updateTextFontStyle(
    textIds: string[],
    opts: {
      fontSize?: number
      fontWeight?: "normal" | "bold" | "auto"
    }
  ): void
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
  changeLanguage(code: string): Promise<void>

  // ── Download ──────────────────────────────────────────────────────
  downloadAsSVG(selection?: boolean): void
  downloadAsPNG(selection?: boolean): void
  downloadAsJson(selection?: boolean): void
  downloadAsText(selection?: boolean): void

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
