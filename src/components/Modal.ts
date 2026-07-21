import type { TButtonElConfig } from "@/components/dom"
import { DOMFactory } from "@/components/dom"

/** @group Components */
export type TModalType = "info" | "success" | "warning" | "error" | "primary"

const MODAL_TYPE_STYLE: Record<TModalType, { bg: string; color: string; icon: string }> = {
  info: {
    bg: "color-mix(in srgb, var(--ms-ink-info) 14%, var(--ms-ink-canvas-bg))",
    color: "var(--ms-ink-info)",
    icon: "ℹ",
  },
  success: {
    bg: "color-mix(in srgb, var(--ms-ink-success) 14%, var(--ms-ink-canvas-bg))",
    color: "var(--ms-ink-success)",
    icon: "✓",
  },
  warning: {
    bg: "color-mix(in srgb, var(--ms-ink-warning) 14%, var(--ms-ink-canvas-bg))",
    color: "var(--ms-ink-warning)",
    icon: "⚠",
  },
  error: {
    bg: "color-mix(in srgb, var(--ms-ink-error) 14%, var(--ms-ink-canvas-bg))",
    color: "var(--ms-ink-error)",
    icon: "✗",
  },
  primary: {
    bg: "color-mix(in srgb, var(--ms-ink-primary) 14%, var(--ms-ink-canvas-bg))",
    color: "var(--ms-ink-primary)",
    icon: "",
  },
}

function getModalTitleStyle(type?: TModalType): {
  bg: string
  color: string
  icon: string
} {
  if (!type) {
    return {
      bg: "var(--ms-ink-canvas-bg)",
      color: "var(--ms-ink-color)",
      icon: "",
    }
  }
  return MODAL_TYPE_STYLE[type]
}

/**
 * @group Components
 */
export type TModalFieldOption = {
  value: string
  label: string
}

/**
 * @group Components
 */
export type TModalField = {
  id: string
  label: string
  type: "text" | "number" | "select"
  defaultValue?: string | number
  placeholder?: string
  options?: TModalFieldOption[]
}

/**
 * @group Components
 */
export type TModalConfig = {
  title: string
  fields: TModalField[]
  type?: TModalType
  buttons?: TButtonElConfig[]
  customContent?: HTMLElement
  /** Element to mount the modal into. Defaults to document.body (viewport-fixed). */
  container?: HTMLElement
  /** Container width (px) below which the modal opens in fullscreen. Defaults to 480. */
  mobileBreakpoint?: number
  /** Called when the modal closes (close button, backdrop click, or timeout). */
  onClose?: () => void
}

/**
 * @group Components
 */
export class Modal {
  private modal: HTMLDivElement
  private backdrop: HTMLDivElement
  private isOpen = false
  private isFullscreen = false
  private isDragging = false
  private dragOffset = { x: 0, y: 0 }
  private modalPosition = { x: 0, y: 0 }
  private fullscreenButton?: HTMLButtonElement
  private titleBar?: HTMLDivElement
  private contentWrapper?: HTMLDivElement

  private get container(): HTMLElement {
    return this.config.container ?? document.body
  }

  private get isAnchored(): boolean {
    return !!this.config.container && this.config.container !== document.body
  }

  constructor(private config: TModalConfig) {
    this.backdrop = this.createBackdrop()
    this.modal = this.createModal()
    this.setupDragging()
  }

  private createBackdrop(): HTMLDivElement {
    const backdrop = DOMFactory.div({
      className: "ms-modal-backdrop",
      style: "display: none;",
    })
    backdrop.addEventListener("click", () => this.close())
    return backdrop
  }

  private createModal(): HTMLDivElement {
    const modal = this.createModalContainer()
    const titleBar = this.createTitleBar()
    this.contentWrapper = this.createContentWrapper()
    modal.appendChild(titleBar)
    modal.appendChild(this.contentWrapper)
    return modal
  }

  private createModalContainer(): HTMLDivElement {
    const position = this.isAnchored ? "absolute" : "fixed"
    return DOMFactory.div({
      className: "ms-modal",
      style: `
        position: ${position};
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: none;
      `,
    })
  }

  private createTitleBar(): HTMLDivElement {
    this.titleBar = DOMFactory.div({
      className: "ms-modal-title-bar",
    })

    const style = getModalTitleStyle(this.config.type)
    this.titleBar.style.background = style.bg
    this.titleBar.style.color = style.color

    const titleText = style.icon ? `${style.icon} ${this.config.title}` : this.config.title
    const title = DOMFactory.h3({
      className: "ms-modal-title",
      text: titleText,
    })
    const buttonsContainer = this.createTitleBarButtons()

    this.titleBar.appendChild(title)
    this.titleBar.appendChild(buttonsContainer)
    return this.titleBar
  }

  private createTitleBarButtons(): HTMLDivElement {
    const container = DOMFactory.div({
      className: "ms-modal-title-buttons",
    })
    this.fullscreenButton = this.createIconButton("⛶", "Toggle fullscreen", () => this.toggleFullscreen())
    const closeButton = this.createIconButton("✕", "Close", () => this.close())
    container.appendChild(this.fullscreenButton)
    container.appendChild(closeButton)
    return container
  }

  private createIconButton(html: string, title: string, onClick: () => void): HTMLButtonElement {
    const button = DOMFactory.button({
      html,
      title,
      className: "ms-modal-icon-btn",
    })
    button.addEventListener("click", (e) => {
      e.stopPropagation()
      onClick()
    })
    return button
  }

  private createContentWrapper(): HTMLDivElement {
    const wrapper = DOMFactory.div({
      className: "ms-modal-content",
    })
    const form = this.createForm()
    wrapper.appendChild(form)
    if (this.config.customContent) {
      wrapper.appendChild(this.config.customContent)
    }
    wrapper.appendChild(this.createActionButtons())
    return wrapper
  }

  private createForm(): HTMLFormElement {
    const form = document.createElement("form")
    form.className = "ms-modal-form"
    this.config.fields.forEach((field) => form.appendChild(this.createFormField(field)))
    return form
  }

  private createFormField(field: TModalField): HTMLDivElement {
    const wrapper = DOMFactory.div({
      className: "ms-modal-field-wrapper",
    })
    const label = DOMFactory.label({
      text: field.label,
      htmlFor: field.id,
      className: "ms-modal-field-label",
    })
    const input = field.type === "select" ? this.createSelectInput(field) : this.createTextInput(field)
    wrapper.appendChild(label)
    wrapper.appendChild(input)
    return wrapper
  }

  private createSelectInput(field: TModalField): HTMLSelectElement {
    return DOMFactory.select({
      id: field.id,
      className: "ms-menu-input",
      options: (field.options ?? []).map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
      defaultValue: field.defaultValue !== undefined ? String(field.defaultValue) : undefined,
    })
  }

  private createTextInput(field: TModalField): HTMLInputElement {
    const input =
      field.type === "number"
        ? DOMFactory.numberInput({
            id: field.id,
            value: field.defaultValue,
            placeholder: field.placeholder,
          })
        : DOMFactory.textInput({
            id: field.id,
            value: field.defaultValue,
            placeholder: field.placeholder,
          })
    input.classList.add("ms-menu-input")
    return input
  }

  private createActionButtons(): HTMLDivElement {
    const wrapper = DOMFactory.div({
      className: "ms-modal-actions",
    })
    this.config.buttons?.forEach((button) => wrapper.appendChild(this.createActionButton(button)))
    return wrapper
  }

  private createActionButton(button: TButtonElConfig): HTMLButtonElement {
    return DOMFactory.button({
      type: "button",
      ...button,
    })
  }

  private setupDragging(): void {
    if (!this.titleBar) {
      return
    }

    this.titleBar.addEventListener("pointerdown", (e: PointerEvent) => {
      if (this.isFullscreen) {
        return
      }
      if ((e.target as HTMLElement).tagName === "BUTTON") {
        return
      }

      this.isDragging = true
      const rect = this.modal.getBoundingClientRect()
      this.dragOffset.x = e.clientX - rect.left
      this.dragOffset.y = e.clientY - rect.top
      this.titleBar!.style.cursor = "grabbing"
      this.titleBar!.setPointerCapture(e.pointerId)
    })

    this.titleBar.addEventListener("pointermove", (e: PointerEvent) => {
      if (!this.isDragging || this.isFullscreen) {
        return
      }
      e.preventDefault()
      const { x, y } = this.computeDragPosition(e.clientX, e.clientY)
      this.modalPosition = { x, y }
      this.modal.style.transform = "none"
      this.modal.style.left = `${x}px`
      this.modal.style.top = `${y}px`
    })

    const endDrag = (e: PointerEvent) => {
      if (!this.isDragging) {
        return
      }
      this.isDragging = false
      this.titleBar!.style.cursor = "move"
      if (this.titleBar!.hasPointerCapture(e.pointerId)) {
        this.titleBar!.releasePointerCapture(e.pointerId)
      }
    }

    this.titleBar.addEventListener("pointerup", endDrag)
    this.titleBar.addEventListener("pointercancel", endDrag)
  }

  private computeDragPosition(clientX: number, clientY: number): { x: number; y: number } {
    if (this.isAnchored) {
      const containerRect = this.container.getBoundingClientRect()
      let x = clientX - this.dragOffset.x - containerRect.left
      let y = clientY - this.dragOffset.y - containerRect.top
      const maxX = this.container.offsetWidth - this.modal.offsetWidth
      const maxY = this.container.offsetHeight - this.modal.offsetHeight
      x = Math.max(0, Math.min(x, maxX))
      y = Math.max(0, Math.min(y, maxY))
      return { x, y }
    }
    return {
      x: clientX - this.dragOffset.x,
      y: clientY - this.dragOffset.y,
    }
  }

  private toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen

    if (this.isFullscreen) {
      this.modal.style.transform = ""
      this.modal.style.left = ""
      this.modal.style.top = ""
      this.modal.style.width = ""
      this.modal.style.height = ""
      this.modal.classList.add("ms-modal--fullscreen")
      if (this.titleBar) {
        this.titleBar.style.cursor = "default"
      }
    } else {
      this.modal.classList.remove("ms-modal--fullscreen")
      if (this.modalPosition.x === 0 && this.modalPosition.y === 0) {
        this.modal.style.left = "50%"
        this.modal.style.top = "50%"
        this.modal.style.transform = "translate(-50%, -50%)"
      } else {
        this.modal.style.left = `${this.modalPosition.x}px`
        this.modal.style.top = `${this.modalPosition.y}px`
      }
      if (this.titleBar) {
        this.titleBar.style.cursor = "move"
      }
    }

    if (this.fullscreenButton) {
      this.fullscreenButton.title = this.isFullscreen ? "Exit fullscreen" : "Toggle fullscreen"
    }
  }

  /**
   * Open the modal. Auto-fullscreen if container width < mobileBreakpoint.
   */
  open(): void {
    if (this.isOpen) {
      return
    }

    if (this.isAnchored) {
      const computed = getComputedStyle(this.container)
      if (computed.position === "static") {
        this.container.style.position = "relative"
      }
    }

    this.backdrop.style.display = "block"
    this.modal.style.display = "flex"

    if (!this.backdrop.parentElement) {
      this.container.appendChild(this.backdrop)
      this.container.appendChild(this.modal)
    }

    this.isOpen = true

    const { mobileBreakpoint = 480 } = this.config
    if (this.isAnchored && !this.isFullscreen && this.container.offsetWidth < mobileBreakpoint) {
      this.toggleFullscreen()
    }

    const firstInput = this.modal.querySelector("input") as HTMLInputElement | null
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 50)
    }
  }

  /**
   * Close the modal without removing it from the DOM. Fires onClose.
   */
  close(): void {
    if (!this.isOpen) {
      return
    }
    this.backdrop.style.display = "none"
    this.modal.style.display = "none"
    this.isOpen = false
    this.config.onClose?.()
    this.destroySilent()
  }

  /**
   * Dismiss the modal programmatically without firing onClose.
   */
  dismiss(): void {
    if (!this.isOpen) {
      return
    }
    this.backdrop.style.display = "none"
    this.modal.style.display = "none"
    this.isOpen = false
  }

  /**
   * Close and remove the modal from the DOM. Fires onClose.
   */
  destroy(): void {
    this.close()
    this.backdrop.remove()
    this.modal.remove()
  }

  /**
   * Remove the modal from the DOM without firing onClose.
   */
  destroySilent(): void {
    this.dismiss()
    this.backdrop.remove()
    this.modal.remove()
  }
}
