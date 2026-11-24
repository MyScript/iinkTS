/** @group DOM */
export type TButtonElConfig = {
  id?: string
  label?: string
  html?: string
  icon?: string
  className?: string | string[]
  disabled?: boolean
  title?: string
  type?: "button" | "submit" | "reset"
  variant?: "primary" | "secondary" | "tertiary" | "success" | "danger" | "warning" | "info"
  onClick?: (e: MouseEvent) => void
  onPointerUp?: (e: PointerEvent) => void
  onPointerDown?: (e: PointerEvent) => void
}

function applyButton(btn: HTMLButtonElement, config: TButtonElConfig, extraClasses: string[] = []): void {
  if (config.id) {
    btn.id = config.id
  }
  if (config.label) {
    btn.textContent = config.label
  }
  if (config.html) {
    btn.innerHTML = config.html
  }
  if (config.icon) {
    btn.innerHTML = config.icon
  }
  if (config.disabled) {
    btn.disabled = true
  }
  if (config.title) {
    btn.title = config.title
  }
  if (config.type) {
    btn.type = config.type
  }
  if (config.variant) {
    btn.classList.add(config.variant)
  }

  const cls = config.className ? (Array.isArray(config.className) ? config.className : [config.className]) : []
  const all = [...extraClasses, ...cls].flatMap((c) => c.split(" ")).filter((c) => c.length > 0)
  if (all.length) {
    btn.classList.add(...all)
  }

  if (config.onClick) {
    btn.addEventListener("click", config.onClick)
  }
  if (config.onPointerUp) {
    btn.addEventListener("pointerup", config.onPointerUp)
  }
  if (config.onPointerDown) {
    btn.addEventListener("pointerdown", config.onPointerDown)
  }
}

/** @group DOM */
export function buildButton(config: TButtonElConfig): HTMLButtonElement {
  const btn = document.createElement("button")
  applyButton(btn, config)
  return btn
}
