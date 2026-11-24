/** @group DOM */
export type TInputElConfig = {
  id?: string
  value?: string | number
  placeholder?: string
  disabled?: boolean
  step?: string | number
  min?: number
  max?: number
  name?: string
  fullWidth?: boolean
}

/** @group DOM */
export type TCheckboxElConfig = {
  id?: string
  checked?: boolean
  disabled?: boolean
  indeterminate?: boolean
  name?: string
}

/** @group DOM */
export type TRangeElConfig = {
  id?: string
  min: number
  max: number
  step: number
  value?: number
  name?: string
}

/** @group DOM */
export type TFileInputElConfig = {
  id?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
}

const DEFAULT_INPUT_STYLE = `
  padding: var(--ms-ink-spacing-sm) var(--ms-ink-spacing-md);
  border: 1px solid var(--ms-ink-input-border);
  border-radius: var(--ms-ink-radius-sm);
  font-size: 14px;
`

/** @group DOM */
export function buildTextInput(config: TInputElConfig): HTMLInputElement {
  const input = document.createElement("input")
  input.type = "text"
  if (config.id) {
    input.id = config.id
  }
  if (config.value !== undefined) {
    input.value = String(config.value)
  }
  input.placeholder = config.placeholder ?? ""
  input.disabled = config.disabled ?? false
  if (config.name) {
    input.name = config.name
  }
  if (config.step !== undefined) {
    input.step = String(config.step)
  }
  if (config.min !== undefined) {
    input.min = String(config.min)
  }
  if (config.max !== undefined) {
    input.max = String(config.max)
  }
  input.style.cssText = DEFAULT_INPUT_STYLE
  if (config.fullWidth) {
    input.style.width = "100%"
  }
  return input
}

/** @group DOM */
export function buildNumberInput(config: TInputElConfig): HTMLInputElement {
  const input = document.createElement("input")
  input.type = "number"
  if (config.id) {
    input.id = config.id
  }
  if (config.value !== undefined) {
    input.value = String(config.value)
  }
  input.placeholder = config.placeholder ?? ""
  input.disabled = config.disabled ?? false
  input.step = config.step !== undefined ? String(config.step) : "any"
  if (config.min !== undefined) {
    input.min = String(config.min)
  }
  if (config.max !== undefined) {
    input.max = String(config.max)
  }
  input.style.cssText = DEFAULT_INPUT_STYLE
  if (config.fullWidth) {
    input.style.width = "100%"
  }
  return input
}

/** @group DOM */
export function buildCheckbox(config: TCheckboxElConfig): HTMLInputElement {
  const checkbox = document.createElement("input")
  checkbox.type = "checkbox"
  if (config.id) {
    checkbox.id = config.id
  }
  checkbox.checked = config.checked ?? false
  checkbox.disabled = config.disabled ?? false
  if (config.indeterminate) {
    checkbox.indeterminate = true
  }
  if (config.name) {
    checkbox.name = config.name
  }
  return checkbox
}

/** @group DOM */
export function buildRange(config: TRangeElConfig): HTMLInputElement {
  const input = document.createElement("input")
  input.type = "range"
  if (config.id) {
    input.id = config.id
  }
  input.min = String(config.min)
  input.max = String(config.max)
  input.step = String(config.step)
  if (config.value !== undefined) {
    input.value = String(config.value)
  }
  if (config.name) {
    input.name = config.name
  }
  return input
}

/** @group DOM */
export function buildFileInput(config: TFileInputElConfig): HTMLInputElement {
  const input = document.createElement("input")
  input.type = "file"
  if (config.id) {
    input.id = config.id
  }
  input.accept = config.accept ?? "*"
  input.multiple = config.multiple ?? false
  input.disabled = config.disabled ?? false
  return input
}
