import ArrowDown from "@/assets/svg/nav-arrow-down.svg"
import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TGenericMenuItem } from "@/menu/items/BaseMenuItem"
import { BaseMenuItem } from "@/menu/items/BaseMenuItem"
import { DEFAULT_MENU_COLORS } from "@/menu/MenuConstants"
import type { TText } from "@/symbol"
import { DecoratorKind, isRecognizedMath, isText } from "@/symbol"
import { DecoratorOps } from "@/symbol/decorator/Decorator"

/** @group Menu */
export type TContextDecoratorItemsConfig = {
  highlight?: boolean
  surround?: boolean
  underline?: boolean
  strikethrough?: boolean
}
/** @group Menu */
export type TContextDecoratorConfig = boolean | TContextDecoratorItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Decorator - Décore les symboles sélectionnés
 */
export class DecoratorContextMenu extends BaseMenuItem<HTMLElement> {
  #documentPointerdownHandler?: (e: PointerEvent) => void
  #subMenuPointerdownHandlers: Array<(e: PointerEvent) => void> = []
  declare protected config: TGenericMenuItem & {
    idPrefix: string
  }
  #itemsConfig?: TContextDecoratorItemsConfig

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context", itemsConfig?: TContextDecoratorItemsConfig) {
    const config: TGenericMenuItem & {
      idPrefix: string
    } = {
      type: "custom",
      id: `${idPrefix}-decorator`,
      label: "Decorator",
      idPrefix,
    }
    super(config, canvas)
    this.#itemsConfig = itemsConfig
  }

  get symbolsDecorable(): TText[] {
    return this.canvas.model.symbolsSelected.filter(isText) as TText[]
  }

  get showDecorator(): boolean {
    return this.symbolsDecorable.length > 0
  }

  get hasSingleMathSymbol(): boolean {
    const selected = this.canvas.model.symbolsSelected
    return selected.length === 1 && isRecognizedMath(selected[0])
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement {
    const idPrefix = this.config.idPrefix

    const trigger = this.dom.button({
      id: `${idPrefix}-decorator-${kind}`,
    })
    const labelEL = this.dom.span({ text: label })
    trigger.appendChild(labelEL)
    const icon = this.dom.span({})
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    // Enable checkbox
    const enableWrapper = this.dom.div({
      className: ["ms-menu-item", "checkbox"],
    })
    const enableLabel = this.dom.span({
      text: "Enable",
    })
    enableWrapper.appendChild(enableLabel)
    const checkbox = this.dom.checkbox({
      id: `${idPrefix}-decorator-${kind}-enable`,
      checked: false,
    })
    checkbox.addEventListener("change", (e) => {
      const enable = (e.target as HTMLInputElement).checked
      const symbolsDecorable = this.symbolsDecorable

      symbolsDecorable.forEach((s) => {
        if (enable) {
          if (!s.decorators.some((d) => d.kind === kind)) {
            s.decorators.push(DecoratorOps.create(kind, this.canvas.penStyle))
          }
        } else {
          const decoIndex = s.decorators.findIndex((d) => d.kind === kind)
          if (decoIndex > -1) {
            s.decorators.splice(decoIndex, 1)
          }
        }
      })
      this.canvas.updateSymbols(symbolsDecorable)

      document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
        ;(b as HTMLButtonElement).disabled = !enable
        b.classList.remove("active")
      })
      if (enable) {
        document.querySelector(`#${idPrefix}-decorator-${kind}-color button`)?.classList.add("active")
      }
    })
    enableWrapper.appendChild(checkbox)
    subMenuWrapper.appendChild(enableWrapper)

    // Color list
    const colorWrapper = this.dom.div({
      id: `${idPrefix}-decorator-${kind}-color`,
      className: ["ms-menu-item", "colors"],
    })
    const colorLabel = this.dom.span({
      text: "Colors",
    })
    colorWrapper.appendChild(colorLabel)

    const colorList = this.dom.div({
      id: `${idPrefix}-decorator-${kind}-color-list`,
      className: ["ms-menu-row", "list"],
    })

    const colors = DEFAULT_MENU_COLORS.filter((_c, i) => !(i % 4))
    colors.forEach((color) => {
      const btn = this.dom.button({
        id: `${idPrefix}-decorator-${kind}-color-${color.replace("#", "")}-btn`,
        className: "square",
      })
      btn.disabled = true
      const colorEl = this.dom.div({
        className: "color",
      })
      colorEl.style.setProperty("background-color", "transparent")
      colorEl.style.setProperty("border", `3px solid ${color}`)
      if (color === "#ffffff") {
        colorEl.style.setProperty("border", "1px solid black")
      }
      if (color === "transparent") {
        colorEl.style.setProperty(
          "background-image",
          "linear-gradient(45deg, #AAA 10%, transparent 20%, #AAA 30%, transparent 40%, #AAA 50%, transparent 60%, #AAA 70%, transparent 80%, #AAA 90%, transparent 100%)"
        )
      }
      btn.appendChild(colorEl)
      btn.addEventListener("pointerup", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const symbolsDecorable = this.symbolsDecorable

        symbolsDecorable.forEach((s) => {
          const deco = s.decorators.find((d) => d.kind === kind)
          if (deco) {
            deco.style.color = color
          }
        })
        this.canvas.updateSymbols(symbolsDecorable.filter((s) => s.decorators.some((d) => d.kind === kind)))
        colorList.querySelectorAll("*").forEach((e) => e.classList.remove("active"))
        btn.classList.add("active")
      })
      colorList.appendChild(btn)
    })

    colorWrapper.appendChild(colorList)
    subMenuWrapper.appendChild(colorWrapper)

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(trigger)

    const content = this.dom.div({
      className: ["sub-menu-content", "right"],
    })
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
    const subMenuHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    this.#subMenuPointerdownHandlers.push(subMenuHandler)
    document.addEventListener("pointerdown", subMenuHandler)

    return wrapper
  }

  createElement(): HTMLElement {
    const enabled = (key: keyof TContextDecoratorItemsConfig) => this.#itemsConfig?.[key] !== false

    const trigger = this.dom.button({
      id: this.config.id,
    })
    const label = this.dom.span({
      text: "Decorator",
    })
    trigger.appendChild(label)
    const icon = this.dom.span({})
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = this.dom.div({
      className: "ms-menu-column",
    })

    if (enabled("highlight")) {
      subMenuWrapper.appendChild(this.createDecoratorSubMenu("Highlight", DecoratorKind.Highlight))
    }
    if (enabled("surround")) {
      subMenuWrapper.appendChild(this.createDecoratorSubMenu("Surround", DecoratorKind.Surround))
    }
    if (enabled("underline")) {
      subMenuWrapper.appendChild(this.createDecoratorSubMenu("Underline", DecoratorKind.Underline))
    }
    if (enabled("strikethrough")) {
      subMenuWrapper.appendChild(this.createDecoratorSubMenu("Strikethrough", DecoratorKind.Strikethrough))
    }

    const wrapper = this.dom.div({
      className: "sub-menu",
    })
    wrapper.appendChild(trigger)

    const content = this.dom.div({
      className: ["sub-menu-content", "right"],
    })
    content.appendChild(subMenuWrapper)
    wrapper.appendChild(content)

    // Event listeners
    trigger.addEventListener("pointerdown", () => content.classList.toggle("open"))
    this.#documentPointerdownHandler = (e: PointerEvent) => {
      if (!wrapper.contains(e.target as HTMLElement)) {
        content.classList.remove("open")
      }
    }
    document.addEventListener("pointerdown", this.#documentPointerdownHandler)

    return wrapper
  }

  destroy(): void {
    if (this.#documentPointerdownHandler) {
      document.removeEventListener("pointerdown", this.#documentPointerdownHandler)
      this.#documentPointerdownHandler = undefined
    }
    this.#subMenuPointerdownHandlers.forEach((h) => document.removeEventListener("pointerdown", h))
    this.#subMenuPointerdownHandlers = []
    super.destroy()
  }

  update(): void {
    this.updateDisabled()
    this.updateVisible()

    const idPrefix = this.config.idPrefix
    const wrapper = this.getElement()

    if (this.showDecorator && !this.hasSingleMathSymbol) {
      wrapper.style.removeProperty("display")

      Object.values(DecoratorKind).forEach((kind) => {
        const checkbox = document.getElementById(`${idPrefix}-decorator-${kind}-enable`) as HTMLInputElement
        if (checkbox) {
          document
            .querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`)
            .forEach((e) => e.classList.remove("active"))
          const decos = this.symbolsDecorable.flatMap((s) => s.decorators).filter((d) => d.kind === kind)

          if (decos.length && decos.every((d) => d.style.color === decos[0].style.color)) {
            const btnToActivate = document.getElementById(
              `${idPrefix}-decorator-${kind}-color-${decos[0].style.color?.replace("#", "")}-btn`
            )
            btnToActivate?.classList.add("active")
          }

          if (
            this.symbolsDecorable.filter((s) => s.decorators.some((d) => d.kind === kind)).length ===
            this.symbolsDecorable.length
          ) {
            checkbox.checked = true

            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = false
            })
            checkbox.indeterminate = false
          } else if (
            this.symbolsDecorable.filter((s) => !s.decorators.some((d) => d.kind === kind)).length ===
            this.symbolsDecorable.length
          ) {
            checkbox.checked = false
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = true
            })
            checkbox.indeterminate = false
          } else {
            checkbox.setAttribute("indeterminate", "true")
            checkbox.indeterminate = true
            document.querySelectorAll(`#${idPrefix}-decorator-${kind}-color button`).forEach((b) => {
              ;(b as HTMLButtonElement).disabled = false
            })
          }
        }
      })
    } else {
      wrapper.style.setProperty("display", "none")
    }
  }
}
