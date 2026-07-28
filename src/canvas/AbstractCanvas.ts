import type { TConnectionStatus, TServerHTTPConfiguration } from "@/client"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration, LoggerCategory, LoggerManager } from "@/logger"
import type { TApiInfos, TPartialDeep } from "@/utils"
import { getApiInfos } from "@/utils"

import type { TCanvasConnectionState } from "./CanvasEvent"
import { CanvasEvent } from "./CanvasEvent"
import { CanvasLayer } from "./CanvasLayer"

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
}

/**
 * @group Canvas
 * @remarks "INK_V1" is deprecated use "INK_V2" instead.
 */
export type TCanvasType = "INTERACTIVE_INK" | "INK_V1" | "INTERACTIVE_INK_SSR" | "INK_V2"

/**
 * Every label ever passed to `startOperation`/`endOperation`/`trackOperation` (shown on the
 * canvas state badge tooltip). `Writing`/`Translating`/`Resizing`/`Rotating` additionally
 * identify an in-progress user gesture — see {@link GESTURE_OPERATION_LABELS}.
 * @group Canvas
 */
export type TCanvasOperationLabel =
  | "Recognizing"
  | "Writing"
  | "Translating"
  | "Resizing"
  | "Rotating"
  | "Synchronizing"
  | "Applying gesture"
  | "Converting"
  | "Computing"
  | "Updating variables"
  | "Loading variables"
  | "Evaluating"
  | "Checking"
  | "Exporting"
  | "Importing"
  | "Undoing"
  | "Redoing"
  | "Clearing"
  | "Removing strokes"

/**
 * Operation labels that identify an in-progress user gesture (pointer down through pointer up).
 * While any of these is active, synchronizing with the backend should be deferred so it never
 * contends with the gesture for the main thread.
 * @group Canvas
 */
export const GESTURE_OPERATION_LABELS: readonly TCanvasOperationLabel[] = [
  "Writing",
  "Translating",
  "Resizing",
  "Rotating",
] as const

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
 * @hidden
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

  abstract destroy(): Promise<void>

  abstract resize(dims?: { height?: number; width?: number }): Promise<void>

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
