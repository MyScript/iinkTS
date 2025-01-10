
import style from "../iink.css"
/**
 * @group Editor
 */
export type EditorLayerUIInfoModal = {
  root: HTMLDivElement,
  text: HTMLParagraphElement
}

/**
 * @group Editor
 */
export type EditorLayerUIMessage = {
  root: HTMLDivElement
  overlay: HTMLDivElement
  modal: EditorLayerUIInfoModal
}

/**
 * @group Editor
 */
export type EditorLayerUIState = {
  root: HTMLDivElement
  busy: HTMLDivElement
}

/**
 * @group Editor
 */
export type EditorLayerUI = {
  root: HTMLDivElement
  loader: HTMLDivElement
  message: EditorLayerUIMessage
  state: EditorLayerUIState
}

/**
 * @group Editor
 */
export class EditorLayer
{
  root: HTMLElement
  ui: EditorLayerUI
  rendering: HTMLElement

  onCloseModal?: (inError?: boolean) => void

  constructor(root: HTMLElement, rootClassCss: string = "ms-editor")
  {
    this.root = root
    this.root.classList.add(rootClassCss)
    this.rendering = this.createLayerRender()
    this.ui = this.createLayerUI()
  }

  render(): void
  {
    const styleElement = document.createElement("style")
    styleElement.appendChild(document.createTextNode(style as string))
    this.root.prepend(styleElement)

    this.root.appendChild(this.rendering)
    this.root.appendChild(this.ui.root)
  }

  createLoader(): HTMLDivElement
  {
    const loaderHTML = document.createElement("div")
    loaderHTML.classList.add("loader")
    loaderHTML.style.display = "none"
    return loaderHTML
  }
  showLoader(): void
  {
    this.ui.loader.style.display = "block"
  }
  hideLoader(): void
  {
    this.ui.loader.style.display = "none"
  }

  createMessageOverlay(): HTMLDivElement
  {
    const overlay = document.createElement("div")
    overlay.classList.add("message-overlay")
    return overlay
  }
  closeMessageModal(): void
  {
    this.onCloseModal?.(this.ui.message.modal.root.classList.contains("error-msg"))
    this.hideMessageModal()
  }

  hideMessageModal(): void
  {
    this.ui.message.root.style.display = "none"
    this.ui.message.modal.text.innerText = ""
    this.ui.message.modal.root.classList.remove("error-msg")
    this.ui.message.modal.root.classList.remove("info-msg")
  }
  createMessageModal(): EditorLayerUIInfoModal
  {
    const element = document.createElement("div")
    element.classList.add("message-modal")

    const closeBtn = document.createElement("button")
    closeBtn.classList.add("ms-button", "close")
    closeBtn.addEventListener("pointerup", this.closeMessageModal.bind(this))
    element.appendChild(closeBtn)

    const text = document.createElement("p")
    element.appendChild(text)
    return { root: element, text }
  }
  createMessage(): EditorLayerUIMessage
  {
    const root = document.createElement("div")
    root.classList.add("message-container")
    root.style.display = "none"

    const overlay = this.createMessageOverlay()
    root.appendChild(overlay)

    const modal = this.createMessageModal()
    root.appendChild(modal.root)

    return {
      root,
      overlay,
      modal
    }
  }
  showMessageInfo(notif: { message: string, timeout?: number })
  {
    this.ui.message.modal.root.classList.add("info-msg")
    this.ui.message.modal.root.classList.remove("error-msg")
    this.ui.message.root.style.display = "block"
    this.ui.message.modal.text.innerText = notif.message
    setTimeout(() =>
    {
      this.closeMessageModal()
    }, notif.timeout || 2500)
  }
  showMessageError(err: Error | string)
  {
    this.ui.message.modal.root.classList.add("error-msg")
    this.ui.message.modal.root.classList.remove("info-msg")
    this.ui.message.root.style.display = "block"
    this.ui.message.modal.text.innerText = typeof err === "string" ? err : err.message
  }

  createBusy(): HTMLDivElement
  {
    const busy = document.createElement("div")
    busy.classList.add("busy")
    return busy
  }
  createState(): EditorLayerUIState
  {
    const root = document.createElement("div")
    root.classList.add("state")
    root.style.display = "none"

    const busy = this.createBusy()
    root.appendChild(busy)

    return {
      root,
      busy
    }
  }
  showState(): void
  {
    this.ui.state.root.style.display = "block"
  }
  hideState(): void
  {
    this.ui.state.root.style.display = "none"
  }
  updateState(idle: boolean): void
  {
    if (idle) {
      this.hideState()
    }
    else {
      this.showState()
    }
  }

  createLayerUI(): EditorLayerUI
  {
    const root = document.createElement("div")
    root.classList.add("ms-layer-ui")

    const loader = this.createLoader()
    root.appendChild(loader)

    const message = this.createMessage()
    root.appendChild(message.root)

    const state = this.createState()
    root.appendChild(state.root)

    return {
      root,
      loader,
      message,
      state
    }
  }

  createLayerRender(): HTMLDivElement
  {
    const render = document.createElement("div")
    render.classList.add("ms-layer-rendering")
    return render
  }

  destroy(): void
  {
    while (this.root.lastChild) {
      this.root.removeChild(this.root.lastChild)
    }
  }
}
