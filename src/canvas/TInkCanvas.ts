import type { HTTPClientV2, TExportV2 } from "@/client"
import type { TPartialDeep } from "@/core"
import type { IHistoryManager } from "@/history"
import type { CanvasTool, LayoutManager } from "@/manager"
import type { IModel } from "@/model"
import type { SVGRenderer } from "@/renderer"
import type { TStyle } from "@/style"
import type { TStroke } from "@/symbol"

import type { CanvasEvent, TCanvasConnectionState } from "./CanvasEvent"
import type { CanvasLayer } from "./CanvasLayer"
import type { InkCanvasConfiguration } from "./variants/InkCanvasConfiguration"

/**
 * Structural type for {@link InkCanvas} — the INK_V2 canvas — and the counterpart of
 * {@link TInteractiveInkCanvas}.
 *
 * The managers under `manager/base` and `manager/debug` serve both variants, so they must be typed
 * against a shape rather than a class: `EraseManager` already takes
 * `TInteractiveInkCanvas | InkCanvas` and narrows with a type guard, which only worked because one
 * half of that union happened to be an interface. With this type the union is symmetrical, no shared
 * manager names a concrete canvas, and neither canvas has to exist for one of them to be tested.
 * @group Canvas
 */
export type TInkCanvas = {
  // ── Core state ─────────────────────────────────────────────────────
  readonly model: IModel
  readonly configuration: InkCanvasConfiguration
  readonly event: CanvasEvent
  readonly layers: CanvasLayer
  readonly layout: LayoutManager<TInkCanvas>
  readonly renderer: SVGRenderer
  readonly client: HTTPClientV2
  get penStyle(): TStyle
  set penStyle(v: TPartialDeep<TStyle>)
  tool: CanvasTool
  get initializationPromise(): Promise<void>

  // ── Canvas state (busy/connection badge) ───────────────────────────
  get connectionState(): TCanvasConnectionState

  // ── Sub-managers ───────────────────────────────────────────────────
  readonly history: IHistoryManager

  // ── Content ────────────────────────────────────────────────────────
  updateSymbolsStyle(symbolIds: string[], style: TPartialDeep<TStyle>): void
  importStrokes(strokes: TPartialDeep<TStroke>[]): Promise<TExportV2>
  removeStrokes(strokeIds: string[]): Promise<void>

  // ── Recognition ────────────────────────────────────────────────────
  export(requestedMimeTypes?: string[]): Promise<TExportV2>

  // ── History ────────────────────────────────────────────────────────
  undo(): Promise<void>
  redo(): Promise<void>

  // ── Lifecycle ──────────────────────────────────────────────────────
  initialize(): Promise<void>
  clear(): Promise<void>
  destroy(): Promise<void>
  resize(dims?: { height?: number; width?: number }): Promise<void>
}
