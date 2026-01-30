/**
 * @group Menu
 * @remarks Helper functions to reduce boilerplate code in menu creation
 */

/**
 * Creates a button element with common menu button styling
 * @param id - The button ID
 * @param innerHTML - The button content (can be HTML/SVG icon)
 * @param onClick - The click handler function
 * @param additionalClasses - Optional additional CSS classes
 * @returns The configured button element
 */
export function createMenuButton(
  id: string,
  innerHTML: string,
  onClick: () => void,
  additionalClasses: string[] = []
): HTMLButtonElement {
  const btn = document.createElement("button")
  btn.id = id
  btn.classList.add("ms-menu-button", "square", ...additionalClasses)
  btn.innerHTML = innerHTML
  btn.addEventListener("pointerup", onClick)
  return btn
}

/**
 * Creates a button with text content instead of HTML
 * @param id - The button ID
 * @param textContent - The button text
 * @param onClick - The click handler function
 * @param additionalClasses - Optional additional CSS classes
 * @returns The configured button element
 */
export function createMenuButtonWithText(
  id: string,
  textContent: string,
  onClick: () => void,
  additionalClasses: string[] = []
): HTMLButtonElement {
  const btn = document.createElement("button")
  btn.id = id
  btn.classList.add("ms-menu-button", ...additionalClasses)
  btn.textContent = textContent
  btn.addEventListener("pointerup", onClick)
  return btn
}
