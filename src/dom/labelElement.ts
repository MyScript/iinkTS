/** @group DOM */
export type TLabelElConfig = {
  text: string
  htmlFor?: string
  className?: string | string[]
  style?: string
}

/** @group DOM */
export function buildLabel(config: TLabelElConfig): HTMLLabelElement {
  const el = document.createElement("label")
  el.textContent = config.text
  if (config.htmlFor) {
    el.htmlFor = config.htmlFor
  }
  if (config.style) {
    el.style.cssText = config.style
  }
  if (config.className) {
    const list = Array.isArray(config.className) ? config.className : [config.className]
    el.classList.add(...list)
  }
  return el
}
