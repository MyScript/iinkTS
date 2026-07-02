import loadingDotsIcon from "@/assets/svg/loading-dots.svg"
import loadingRingIcon from "@/assets/svg/loading-ring.svg"
import syncIcon from "@/assets/svg/sync.svg"
import warningTriangleIcon from "@/assets/svg/warning-triangle.svg"
import wifiIcon from "@/assets/svg/wifi.svg"
import wifiOffIcon from "@/assets/svg/wifi-off.svg"
import { DOMFactory } from "@/components/dom"
import { Modal } from "@/components/Modal"
import type { TEditorConnectionState } from "@/editor/EditorEvent"
import style from "@/iink.css"

/**
 * @group Editor
 */
export type TEditorLayerUIState = {
  root: HTMLDivElement
  icon: HTMLDivElement
  count: HTMLSpanElement
  tooltip: HTMLDivElement
}

/**
 * @group Editor
 */
export type TEditorLayerUI = {
  root: HTMLDivElement
  loader: HTMLDivElement
  state: TEditorLayerUIState
}

/**
 * @group Editor
 */
export type TEditorStateDetail = {
  /** Number of addStrokes batches queued locally while offline (only relevant for `syncing`). */
  queuedCount: number
  /** Labels of operations currently running (only relevant for `online-working`), e.g. `["Converting"]`. */
  activeOperations: string[]
}

const CONNECTION_STATE_INFO: Record<TEditorConnectionState, { icon: string; tooltip: string }> = {
  initializing: { icon: loadingRingIcon, tooltip: "Connecting…" },
  "online-idle": { icon: wifiIcon, tooltip: "Connected" },
  "online-working": { icon: loadingDotsIcon, tooltip: "Processing…" },
  syncing: { icon: syncIcon, tooltip: "Reconnecting — strokes queued to send" },
  offline: { icon: wifiOffIcon, tooltip: "Offline — reconnecting…" },
  error: { icon: warningTriangleIcon, tooltip: "Sync failed — reconnection attempts exhausted" },
}

/**
 * @group Editor
 */
export class EditorLayer {
  root: HTMLElement
  ui: TEditorLayerUI
  rendering: HTMLElement

  onCloseModal?: (inError?: boolean) => void

  #modal?: Modal
  #documentPointerdownHandler?: (e: PointerEvent) => void

  constructor(root: HTMLElement, rootClassCss: string = "ms-editor") {
    this.root = root
    this.root.classList.add(rootClassCss)
    this.rendering = this.createLayerRender()
    this.ui = this.createLayerUI()
  }

  render(): void {
    const styleElement = DOMFactory.style(style as string)
    this.root.prepend(styleElement)

    this.root.appendChild(this.rendering)
    this.root.appendChild(this.ui.root)
  }

  createLoader(): HTMLDivElement {
    return DOMFactory.div({
      className: "loader",
      style: "display: none",
    })
  }
  showLoader(): void {
    this.ui.loader.style.display = "block"
  }
  hideLoader(): void {
    this.ui.loader.style.display = "none"
  }

  clearModal(): void {
    this.#modal?.destroySilent()
    this.#modal = undefined
  }

  showMessageInfo(notif: { message: string; timeout?: number }): void {
    this.#modal?.destroySilent()
    this.#modal = new Modal({
      title: "Info",
      type: "info",
      fields: [],
      customContent: DOMFactory.p({
        text: notif.message,
      }),
      container: this.root,
      onClose: () => this.onCloseModal?.(false),
    })
    this.#modal.open()
    setTimeout(() => this.#modal?.close(), notif.timeout ?? 2500)
  }

  showMessageError(err: Error | string): void {
    this.#modal?.destroySilent()
    this.#modal = new Modal({
      title: "Error",
      type: "error",
      fields: [],
      customContent: DOMFactory.p({
        text: typeof err === "string" ? err : err.message,
      }),
      container: this.root,
      onClose: () => this.onCloseModal?.(true),
    })
    this.#modal.open()
  }

  createState(): TEditorLayerUIState {
    const root = DOMFactory.div({ className: "editor-state" })
    const icon = DOMFactory.div({ className: "editor-state-icon" })
    root.appendChild(icon)
    const count = DOMFactory.span({
      className: "editor-state-count",
      style: "display: none",
    })
    root.appendChild(count)
    const tooltip = DOMFactory.div({ className: "editor-state-tooltip" })
    root.appendChild(tooltip)

    root.addEventListener("pointerdown", (e) => {
      e.stopPropagation()
      tooltip.classList.toggle("open")
    })
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!root.contains(e.target as HTMLElement)) {
        tooltip.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return { root, icon, count, tooltip }
  }

  /**
   * Reflect the editor's derived state (see `TEditorConnectionState`) on the state badge:
   * icon, color (via CSS class), and the explanatory tooltip shown next to the badge on click
   * (including active operation labels or queued count).
   */
  updateEditorState(state: TEditorConnectionState, detail: TEditorStateDetail): void {
    const { root, icon, count, tooltip } = this.ui.state
    const info = CONNECTION_STATE_INFO[state]
    root.className = `editor-state editor-state-${state}`
    icon.innerHTML = info.icon
    if (state === "syncing" && detail.queuedCount > 0) {
      tooltip.textContent = `${info.tooltip} — ${detail.queuedCount} stroke batch(es) waiting to be sent`
      count.textContent = String(detail.queuedCount)
      count.style.display = "flex"
    } else if (state === "online-working" && detail.activeOperations.length > 0) {
      tooltip.textContent = detail.activeOperations.join(", ")
      count.style.display = "none"
    } else {
      tooltip.textContent = info.tooltip
      count.style.display = "none"
    }
  }

  createLayerUI(): TEditorLayerUI {
    const root = DOMFactory.div({
      className: "ms-layer-ui",
    })

    const loader = this.createLoader()
    root.appendChild(loader)

    const state = this.createState()
    root.appendChild(state.root)

    return {
      root,
      loader,
      state,
    }
  }

  createLayerRender(): HTMLDivElement {
    return DOMFactory.div({
      className: "ms-layer-rendering",
    })
  }

  destroy(): void {
    this.#modal = undefined
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    while (this.root.lastChild) {
      this.root.removeChild(this.root.lastChild)
    }
  }
}
