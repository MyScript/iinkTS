import type { TConnectionStatus, TServerHTTPConfiguration } from "@/client"
import { getApiInfos, type TApiInfos } from "@/client"
import type { TPartialDeep } from "@/core"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration, LoggerCategory, LoggerManager } from "@/logger"
import type { TLayoutConfiguration } from "@/manager"
import { CanvasTool } from "@/manager"

import type { TCanvasConnectionState } from "./CanvasEvent"
import { CanvasEvent } from "./CanvasEvent"
import { CanvasLayer } from "./CanvasLayer"
import type { TCanvasOperationLabel } from "./TCanvasOperationLabel"

/**
 * @hidden
 * @group Canvas
 */
export type TCanvasConfiguration = {
  logger: TLoggerConfiguration
  ui?: {
    /** Whether to show the connection-state badge (bottom-left icon). Defaults to `true`. */
    showConnectionState?: boolean
  }
  /** Where the menus, the connection state and the minimap sit; see {@link TLayoutConfiguration} */
  layout?: TLayoutConfiguration
}

/**
 * @group Canvas
 * @remarks "INK_V1" is deprecated use "INK_V2" instead.
 */
export type TCanvasType = "INTERACTIVE_INK" | "INK_V1" | "INTERACTIVE_INK_SSR" | "INK_V2"

/**
 * @hidden
 * @group Canvas
 */
export type TCanvasOptionsBase = {
  configuration: TCanvasConfiguration
  override?: {
    cssClass?: string
  }
}

declare global {
  interface HTMLElement {
    /** The iink canvas instance mounted on this element by {@link Canvas.load}. */
    iink?: AbstractCanvas
  }
}

/**
 * @group Canvas
 */
export abstract class AbstractCanvas {
  /** Logger instance for this canvas. */
  logger = LoggerManager.getLogger(LoggerCategory.CANVAS)
  /** DOM layer manager handling rendering, UI, and modal elements. */
  layers: CanvasLayer
  /** Event bus for subscribing to canvas lifecycle and content events. */
  event: CanvasEvent
  /** Server API information (version, etc.) loaded on first connection. */
  info?: TApiInfos

  #loggerConfiguration!: TLoggerConfiguration
  #resizeObserver?: ResizeObserver
  #resizeDebounceTimer?: ReturnType<typeof setTimeout>

  #activeOperations = new Map<TCanvasOperationLabel, number>()
  #hasConnectedOnce = false
  #connectionStatus: TConnectionStatus = "connected"
  #offlineQueueLength = 0
  #connectionState: TCanvasConnectionState = "initializing"

  constructor(rootElement: HTMLElement, options?: TPartialDeep<TCanvasOptionsBase>) {
    this.loggerConfiguration = {
      ...DefaultLoggerConfiguration,
      ...options?.configuration?.logger,
    }
    this.logger.info("constructor", {
      rootElement,
      options,
    })

    this.event = new CanvasEvent(rootElement)
    this.layers = new CanvasLayer(rootElement, options?.override?.cssClass || "ms-ink")
    if (options?.configuration?.ui?.showConnectionState === false) {
      this.layers.ui.state.root.style.display = "none"
    }
    this.layers.updateCanvasState(this.#connectionState, { queuedCount: 0, activeOperations: [] })

    rootElement.iink = this
  }

  /**
   * Derived, UI-oriented canvas state — see {@link TCanvasConnectionState}.
   * Listen to `event.addConnectionStateChangedListener` for change notifications.
   */
  get connectionState(): TCanvasConnectionState {
    return this.#connectionState
  }

  /**
   * Run `fn`, marking `label` as an active operation for the duration (shown on the canvas
   * state badge tooltip). Safe against overlapping/concurrent calls with the same or different
   * labels, and against `fn` throwing (the operation is always ended).
   */
  async trackOperation<T>(label: TCanvasOperationLabel, fn: () => Promise<T>): Promise<T> {
    this.startOperation(label)
    try {
      return await fn()
    } finally {
      this.endOperation(label)
    }
  }

  /**
   * @remarks The client's `idle` event only fires in response to an explicit
   * `client.waitForIdle()` call (a request/response pair, not a push notification) — it does
   * NOT fire automatically after every `addStrokes()`/transform/etc. So it cannot be used to end
   * a "Recognizing" operation reliably. This only preserves the public `event.emitIdle` passthrough
   * for consumers who call `waitForIdle()` themselves.
   */
  protected manageIdleState(idle: boolean): void {
    this.event.emitIdle(idle)
  }

  /** Mark `label` as active. Prefer `trackOperation` unless the operation isn't promise-shaped. */
  startOperation(label: TCanvasOperationLabel): void {
    this.#activeOperations.set(label, (this.#activeOperations.get(label) ?? 0) + 1)
    this.#recomputeConnectionState()
  }

  /** Mark one occurrence of `label` as finished. Must be paired with a prior `startOperation`. */
  endOperation(label: TCanvasOperationLabel): void {
    const count = this.#activeOperations.get(label) ?? 0
    if (count <= 1) {
      this.#activeOperations.delete(label)
    } else {
      this.#activeOperations.set(label, count - 1)
    }
    this.#recomputeConnectionState()
  }

  /**
   * Force `label` fully inactive regardless of how many `startOperation` calls are pending.
   * For level-triggered signals with a single external "done" event (e.g. the client's
   * `idle` event) rather than one end call per start call.
   */
  protected clearOperation(label: TCanvasOperationLabel): void {
    this.#activeOperations.delete(label)
    this.#recomputeConnectionState()
  }

  /** Whether `label` is currently active (at least one unmatched `startOperation` call). */
  hasOperation(label: TCanvasOperationLabel): boolean {
    return this.#activeOperations.has(label)
  }

  /** Called once the canvas has connected to its backend for the first time. */
  protected markConnectedOnce(): void {
    this.#hasConnectedOnce = true
    this.#recomputeConnectionState()
  }

  /** Only relevant for WebSocket-backed canvas; other variants never call this. */
  protected manageConnectionStatus(status: TConnectionStatus, offlineQueueLength = 0): void {
    this.event.emitConnectionStatusChanged(status)
    this.#connectionStatus = status
    this.#offlineQueueLength = offlineQueueLength
    this.#recomputeConnectionState()
  }

  #computeConnectionState(): TCanvasConnectionState {
    if (!this.#hasConnectedOnce) {
      return "initializing"
    }
    if (this.#connectionStatus === "error") {
      return "error"
    }
    if (this.#connectionStatus === "offline") {
      return this.#offlineQueueLength > 0 ? "syncing" : "offline"
    }
    return this.#activeOperations.size > 0 ? "online-working" : "online-idle"
  }

  #recomputeConnectionState(): void {
    const next = this.#computeConnectionState()
    if (next !== this.#connectionState) {
      this.#connectionState = next
      this.event.emitConnectionStateChanged(next)
    }
    // Always refresh the badge: the operation list or queued count can change
    // while the discrete state itself stays the same (e.g. two operations overlapping).
    this.layers.updateCanvasState(next, {
      queuedCount: this.#offlineQueueLength,
      activeOperations: Array.from(this.#activeOperations.keys()),
    })
  }

  get loggerConfiguration(): TLoggerConfiguration {
    return this.#loggerConfiguration
  }

  set loggerConfiguration(loggerConfig: TLoggerConfiguration) {
    this.#loggerConfiguration = {
      ...DefaultLoggerConfiguration,
      ...loggerConfig,
    }
    LoggerManager.setLoggerLevel(this.#loggerConfiguration)
  }

  abstract initialize(): Promise<void>

  abstract clear(): Promise<void>

  /** The variant's rendering backend, declared here only so {@link teardownCommon} can tear it down generically. */
  abstract renderer: { destroy(): void }

  abstract destroy(): Promise<void>

  /**
   * Clears the `rootElement.iink` back-reference set in the constructor, guarded so it only
   * clears the reference if it's still pointing at this instance — a newer canvas mounted on
   * the same element (e.g. `Canvas.load()` replacing an instance) must not have its own
   * reference clobbered by this (older) instance's `destroy()` running after the fact.
   * Every `destroy()` implementation must call this, or the mounting DOM element keeps a
   * strong reference to the entire destroyed canvas graph.
   */
  protected clearRootElementReference(): void {
    if (this.layers.root.iink === this) {
      this.layers.root.iink = undefined
    }
  }

  /**
   * Common teardown shared by every variant's `destroy()`: stops the resize observer, removes
   * all `event` listeners, and destroys the DOM layers and the renderer. Each variant calls this
   * in addition to its own teardown (input-handler detach, client/menu/model/history cleanup,
   * etc.) and must still call {@link clearRootElementReference} itself afterwards.
   */
  protected teardownCommon(): void {
    this.stopResizeObserver()
    this.event.removeAllListeners()
    this.layers.destroy()
    this.renderer.destroy()
  }

  abstract resize(dims?: { height?: number; width?: number }): Promise<void>

  /**
   * Minimum height/width for `resolveDimensions`, from the variant's own rendering configuration.
   * @hidden
   */
  protected abstract get minDimensions(): { minHeight: number; minWidth: number }

  /**
   * Resolves the target height/width for `resize()`: an explicit value wins, otherwise falls
   * back to the mounting root element's computed size, clamped to `minDimensions`.
   */
  protected resolveDimensions(height?: number, width?: number): { height: number; width: number } {
    const compStyles = window.getComputedStyle(this.layers.root)
    return {
      height: height || Math.max(parseInt(compStyles.height.replace("px", "")), this.minDimensions.minHeight),
      width: width || Math.max(parseInt(compStyles.width.replace("px", "")), this.minDimensions.minWidth),
    }
  }

  abstract get tool(): CanvasTool

  /**
   * Toggles the `draw`/`erase` CSS classes on the mounting root element to reflect the
   * current tool. Default 2-state (Write/Erase) implementation shared by variants with no
   * other tool; `InteractiveInkCanvas` overrides it for its 4-state tool set.
   */
  /**
   * CSS classes toggled by {@link setCursorStyle} to reflect the current tool on the mounting
   * root element. Default 2-state (`draw`/`erase`) set; override alongside {@link getCursorClass}
   * for variants with additional tools.
   */
  protected get cursorClasses(): string[] {
    return ["draw", "erase"]
  }

  /** The single class from {@link cursorClasses} that should be active for the current tool. */
  protected getCursorClass(): string {
    return this.tool === CanvasTool.Erase ? "erase" : "draw"
  }

  protected setCursorStyle(): void {
    const activeClass = this.getCursorClass()
    this.cursorClasses.forEach((cssClass) => {
      this.layers.root.classList.toggle(cssClass, cssClass === activeClass)
    })
  }

  protected startResizeObserver(): void {
    this.#resizeObserver = new ResizeObserver(() => {
      clearTimeout(this.#resizeDebounceTimer)
      this.#resizeDebounceTimer = setTimeout(() => this.resize(), 150)
    })
    this.#resizeObserver.observe(this.layers.root)
  }

  protected stopResizeObserver(): void {
    clearTimeout(this.#resizeDebounceTimer)
    this.#resizeObserver?.disconnect()
    this.#resizeObserver = undefined
  }

  async loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos> {
    if (!this.info) {
      this.info = await getApiInfos({ server })
    }
    return this.info
  }
}
