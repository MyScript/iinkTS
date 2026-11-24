/** @group DOM */
export type TTableBaseElConfig = {
  id?: string
  className?: string | string[]
  style?: string
}

/** @group DOM */
export type TTableCellElConfig = TTableBaseElConfig & {
  text?: string
  colSpan?: number
}

function applyTable(el: HTMLElement, config?: TTableBaseElConfig): void {
  if (!config) {
    return
  }
  if (config.id) {
    el.id = config.id
  }
  if (config.style) {
    el.style.cssText = config.style
  }
  if (config.className) {
    const list = Array.isArray(config.className) ? config.className : [config.className]
    el.classList.add(...list)
  }
}

/** @group DOM */
export function buildTable(config?: TTableBaseElConfig): HTMLTableElement {
  const el = document.createElement("table")
  applyTable(el, config)
  return el
}

/** @group DOM */
export function buildTHead(config?: TTableBaseElConfig): HTMLTableSectionElement {
  const el = document.createElement("thead")
  applyTable(el, config)
  return el
}

/** @group DOM */
export function buildTBody(config?: TTableBaseElConfig): HTMLTableSectionElement {
  const el = document.createElement("tbody")
  applyTable(el, config)
  return el
}

/** @group DOM */
export function buildTr(config?: TTableBaseElConfig): HTMLTableRowElement {
  const el = document.createElement("tr")
  applyTable(el, config)
  return el
}

/** @group DOM */
export function buildTd(config?: TTableCellElConfig): HTMLTableCellElement {
  const el = document.createElement("td")
  applyTable(el, config)
  if (config?.text) {
    el.textContent = config.text
  }
  if (config?.colSpan) {
    el.colSpan = config.colSpan
  }
  return el
}

/** @group DOM */
export function buildTh(config?: TTableCellElConfig): HTMLTableCellElement {
  const el = document.createElement("th")
  applyTable(el, config)
  if (config?.text) {
    el.textContent = config.text
  }
  return el
}
