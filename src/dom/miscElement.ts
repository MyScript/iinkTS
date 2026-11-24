/** @group DOM */
export function buildCanvas(config?: { id?: string; className?: string }): HTMLCanvasElement {
  const el = document.createElement("canvas")
  if (config?.id) {
    el.id = config.id
  }
  if (config?.className) {
    el.classList.add(config.className)
  }
  return el
}
