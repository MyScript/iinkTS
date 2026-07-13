/** @group DOM */
export type TSelectElOption = {
  value: string
  label: string
  selected?: boolean
}

/** @group DOM */
export type TSelectElConfig = {
  id: string
  options?: TSelectElOption[]
  defaultValue?: string
  disabled?: boolean
  className?: string
  customStyle?: string
  onChange?: (value: string) => void
}

const DEFAULT_SELECT_STYLE = `
  padding: var(--ms-ink-spacing-xs) var(--ms-ink-spacing-sm);
  border: 1px solid var(--ms-ink-input-border);
  border-radius: var(--ms-ink-radius-sm);
  font-size: 12px;
  background: var(--ms-ink-input-bg);
  cursor: pointer;
`

/** @group DOM */
export function buildOption(opt: TSelectElOption): HTMLOptionElement {
  const el = document.createElement("option")
  el.value = opt.value
  el.textContent = opt.label
  if (opt.selected) {
    el.selected = true
  }
  return el
}

/** @group DOM */
export function buildSelect(config: TSelectElConfig): HTMLSelectElement {
  const select = document.createElement("select")
  select.id = config.id
  select.style.cssText = config.customStyle ?? DEFAULT_SELECT_STYLE
  if (config.className) {
    select.classList.add(config.className)
  }
  if (config.disabled) {
    select.disabled = true
  }
  config.options?.forEach((opt) => select.appendChild(buildOption(opt)))
  if (config.defaultValue !== undefined) {
    select.value = config.defaultValue
  }
  if (config.onChange) {
    select.addEventListener("change", () => config.onChange!(select.value))
  }
  return select
}
