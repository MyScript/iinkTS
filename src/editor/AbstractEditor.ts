import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration, LoggerCategory, LoggerManager } from "@/logger"
import type { TConnectionStatus, TServerHTTPConfiguration } from "@/recognizer"
import type { TApiInfos, TPartialDeep } from "@/utils"
import { getApiInfos } from "@/utils"

import type { TEditorConnectionState } from "./EditorEvent"
import { EditorEvent } from "./EditorEvent"
import { EditorLayer } from "./EditorLayer"

/**
 * @hidden
 * @group Editor
 */
export type TEditorConfiguration = {
  logger: TLoggerConfiguration
}

/**
 * @group Editor
 * @remarks "INKV1" is deprecated use "INKV2" instead.
 */
export type TEditorType = "INTERACTIVEINK" | "INKV1" | "INTERACTIVEINKSSR" | "INKV2"

/**
 * @hidden
 * @group Editor
 */
export type TEditorOptionsBase = {
  configuration: TEditorConfiguration
  override?: {
    cssClass?: string
  }
}

/**
 * @hidden
 * @group Editor
 */
export abstract class AbstractEditor {
  /** Logger instance for this editor. */
  logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  /** DOM layer manager handling rendering, UI, and modal elements. */
  layers: EditorLayer
  /** Event bus for subscribing to editor lifecycle and content events. */
  event: EditorEvent
  /** Server API information (version, etc.) loaded on first connection. */
  info?: TApiInfos

  #loggerConfiguration!: TLoggerConfiguration
  #resizeObserver?: ResizeObserver
  #resizeDebounceTimer?: ReturnType<typeof setTimeout>

  #activeOperations = new Map<string, number>()
  #hasConnectedOnce = false
  #connectionStatus: TConnectionStatus = "connected"
  #offlineQueueLength = 0
  #connectionState: TEditorConnectionState = "initializing"

  constructor(rootElement: HTMLElement, options?: TPartialDeep<TEditorOptionsBase>) {
    this.loggerConfiguration = {
      ...DefaultLoggerConfiguration,
      ...options?.configuration?.logger,
    }
    this.logger.info("constructor", {
      rootElement,
      options,
    })

    this.event = new EditorEvent(rootElement)
    this.layers = new EditorLayer(rootElement, options?.override?.cssClass || "ms-editor")
    this.layers.updateEditorState(this.#connectionState, { queuedCount: 0, activeOperations: [] })

    //@ts-ignore
    rootElement.editor = this
  }

  /**
   * Derived, UI-oriented editor state — see {@link TEditorConnectionState}.
   * Listen to `event.addConnectionStateChangedListener` for change notifications.
   */
  get connectionState(): TEditorConnectionState {
    return this.#connectionState
  }

  /**
   * Run `fn`, marking `label` as an active operation for the duration (shown on the editor
   * state badge tooltip). Safe against overlapping/concurrent calls with the same or different
   * labels, and against `fn` throwing (the operation is always ended).
   */
  async trackOperation<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startOperation(label)
    try {
      return await fn()
    } finally {
      this.endOperation(label)
    }
  }

  /**
   * @remarks The recognizer's `idle` event only fires in response to an explicit
   * `recognizer.waitForIdle()` call (a request/response pair, not a push notification) — it does
   * NOT fire automatically after every `addStrokes()`/transform/etc. So it cannot be used to end
   * a "Recognizing" operation reliably. This only preserves the public `event.emitIdle` passthrough
   * for consumers who call `waitForIdle()` themselves.
   */
  protected manageIdleState(idle: boolean): void {
    this.event.emitIdle(idle)
  }

  /** Mark `label` as active. Prefer `trackOperation` unless the operation isn't promise-shaped. */
  startOperation(label: string): void {
    this.#activeOperations.set(label, (this.#activeOperations.get(label) ?? 0) + 1)
    this.#recomputeConnectionState()
  }

  /** Mark one occurrence of `label` as finished. Must be paired with a prior `startOperation`. */
  endOperation(label: string): void {
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
   * For level-triggered signals with a single external "done" event (e.g. the recognizer's
   * `idle` event) rather than one end call per start call.
   */
  protected clearOperation(label: string): void {
    this.#activeOperations.delete(label)
    this.#recomputeConnectionState()
  }

  /** Called once the editor has connected to its backend for the first time. */
  protected markConnectedOnce(): void {
    this.#hasConnectedOnce = true
    this.#recomputeConnectionState()
  }

  /** Only relevant for WebSocket-backed editors; other variants never call this. */
  protected manageConnectionStatus(status: TConnectionStatus, offlineQueueLength = 0): void {
    this.event.emitConnectionStatusChanged(status)
    this.#connectionStatus = status
    this.#offlineQueueLength = offlineQueueLength
    this.#recomputeConnectionState()
  }

  #computeConnectionState(): TEditorConnectionState {
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
    this.layers.updateEditorState(next, {
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
