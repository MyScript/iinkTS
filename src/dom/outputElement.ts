/** @group DOM */
export type TOutputElConfig = {
  id?: string
  htmlFor?: string
  text?: string
}

/** @group DOM */
export function buildOutput(config?: TOutputElConfig): HTMLOutputElement {
  const el = document.createElement("output")
  if (config?.id) {
    el.id = config.id
  }
  if (config?.htmlFor) {
    el.setAttribute("for", config.htmlFor)
  }
  if (config?.text) {
    el.innerHTML = config.text
  }
  return el
}
