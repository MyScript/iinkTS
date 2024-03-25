import ArrowDown from "../assets/svg/nav-arrow-down.svg"
import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { Box, DecoratorKind, OIDecorator, OIStroke, OIText, SymbolType, TOISymbol } from "../primitive"
import { OIMenu, TMenuItemBoolean, TMenuItemButton, TMenuItemColorList } from "./OIMenu"
import { TStyle } from "../style"

/**
 * Menu
 */
export class OIMenuContext extends OIMenu
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)
  behaviors: OIBehaviors
  id: string
  wrapper?: HTMLElement
  reorderMenu?: HTMLDivElement
  decoratorMenu?: HTMLDivElement
  menuExport?: HTMLDivElement
  duplicateBtn?: HTMLButtonElement
  removeBtn?: HTMLButtonElement

  position: {
    x: number,
    y: number,
    scrollTop: number,
    scrollLeft: number
  }

  constructor(behaviors: OIBehaviors, id = "ms-menu-context")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.behaviors = behaviors
    this.position = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 }
  }

  get symbols(): TOISymbol[]
  {
    return this.behaviors.model.symbolsSelected
  }

  get symbolsDecorable(): (OIStroke | OIText)[]
  {
    return this.symbols.filter(s => s.type === SymbolType.Stroke || s.type === SymbolType.Text) as (OIStroke | OIText)[]
  }
  get showDecorator(): boolean
  {
    return this.symbolsDecorable.length > 0
  }

  protected createMenuDuplicate(): HTMLElement
  {
    this.duplicateBtn = document.createElement("button")
    this.duplicateBtn.id = `${ this.id }-duplicate`
    this.duplicateBtn.textContent = "Duplicate"
    this.duplicateBtn.classList.add("ms-menu-button")
    this.duplicateBtn.addEventListener("pointerup", async () =>
    {
      const symbolsToDuplicate = this.behaviors.model.symbolsSelected
      const selectionBox = Box.createFromBoxes(symbolsToDuplicate.map(s => s.boundingBox))
      const duplicatedSymbols = symbolsToDuplicate.map(s =>
      {
        const clone = s.clone()
        let duplicateNumber = 1
        while (this.behaviors.model.symbols.find(s => s.id === clone.id)) {
          clone.id = clone.id.split("_")[0] + `_${ duplicateNumber }`
          duplicateNumber++
        }
        clone.selected = true
        this.behaviors.translator.applyToSymbol(clone, selectionBox.width + 2 * SELECTION_MARGIN, 0)
        return clone
      })

      this.behaviors.unselectAll()
      await this.behaviors.addSymbols(duplicatedSymbols)
      this.behaviors.selector.drawSelectedGroup(duplicatedSymbols)
    })
    return this.duplicateBtn
  }

  protected createMenuRemove(): HTMLButtonElement
  {
    this.removeBtn = document.createElement("button")
    this.removeBtn.id = `${ this.id }-remove`
    this.removeBtn.textContent = "Remove"
    this.removeBtn.classList.add("ms-menu-button")
    this.removeBtn.addEventListener("pointerup", async () =>
    {
      this.behaviors.selector.removeSelectedGroup()
      await this.behaviors.removeSymbols(this.behaviors.model.symbolsSelected.map(s => s.id))
      this.behaviors.menu.update()
    })
    return this.removeBtn
  }

  protected createMenuReorder(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-reorder`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Reorder"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-reorder-first`,
        label: "Bring to front",
        callback: () => {
          this.behaviors.changeOrderSymbols(this.behaviors.model.symbolsSelected, "last")
          this.behaviors.selector.resetSelectedGroup(this.behaviors.model.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-forward`,
        label: "Bring forward",
        callback: () => {
          this.behaviors.changeOrderSymbols(this.behaviors.model.symbolsSelected, "forward")
          this.behaviors.selector.resetSelectedGroup(this.behaviors.model.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-backward`,
        label: "Send backward",
        callback: () => {
          this.behaviors.changeOrderSymbols(this.behaviors.model.symbolsSelected, "backward")
          this.behaviors.selector.resetSelectedGroup(this.behaviors.model.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-last`,
        label: "Send to back",
        callback: () => {
          this.behaviors.changeOrderSymbols(this.behaviors.model.symbolsSelected.slice().reverse(), "first")
          this.behaviors.selector.resetSelectedGroup(this.behaviors.model.symbolsSelected)
        }
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    this.reorderMenu = this.createSubMenu(trigger, subMenuWrapper, "right").element
    return this.reorderMenu
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-decorator-${kind}`
    trigger.classList.add("ms-menu-button")
    const labelEL = document.createElement("span")
    labelEL.innerText = label
    trigger.appendChild(labelEL)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const decoStyles = this.symbolsDecorable.map(s => s.decorators.find(d => d.kind === kind)?.style).filter(style => !!style) as TStyle[]
    const hasUniqColor = decoStyles.length && decoStyles.every(st => st.color === decoStyles[0]?.color)
    const color = hasUniqColor && decoStyles[0]?.color ? decoStyles[0]?.color : (this.behaviors.currentPenStyle.color || "rgb(0, 0, 0)") as string
    const menuItems: (TMenuItemBoolean | TMenuItemColorList )[] = [
      {
        type: "checkbox",
        id: `${ this.id }-decorator-${kind}-enable`,
        label: "Enable",
        initValue: false,
        callback: (value) => {
          this.symbolsDecorable.forEach(s => {
            const stroke = s as OIStroke | OIText
            if (value) {
              if (!stroke.decorators.some(d => d.kind === kind)) {
                stroke.decorators.push(new OIDecorator(kind, this.behaviors.currentPenStyle))
              }
            }
            else {
              stroke.decorators = []
            }
            this.behaviors.updateSymbol(stroke)
          })
        }
      },
      {
        type: "colors",
        label: "Colors",
        id: `${ this.id }-decorator-${kind}-color`,
        fill: false,
        values: this.colors.filter((_c, i) => !(i % 4)),
        initValue: color,
        callback: (color) => {
          this.symbolsDecorable.forEach(s => {
            const decos = s.decorators.find(d => d.kind === kind)
            if (decos) {
              decos.style.color = color
              this.behaviors.model.updateSymbol(s)
              this.behaviors.renderer.drawSymbol(s)
            }
          })
        },
      }
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    return this.decoratorMenu = this.createSubMenu(trigger, subMenuWrapper, "right").element
  }

  protected createMenuDecorator(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-decorator`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Decorator"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Hightlight", DecoratorKind.Highlight))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Surround", DecoratorKind.Surround))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Underline", DecoratorKind.Underline))
    subMenuWrapper.appendChild(this.createDecoratorSubMenu("Strikethrough", DecoratorKind.Strikethrough))

    this.decoratorMenu = this.createSubMenu(trigger, subMenuWrapper, "right").element
    return this.decoratorMenu
  }

  protected createMenuExport(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-export`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Export"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: TMenuItemButton[] = [
      {
        type: "button",
        id: `${ this.id }-export-json`,
        label: "json",
        callback: () => this.behaviors.downloadAsJson(this.behaviors.model.symbolsSelected.length > 0)
      },
      {
        type: "button",
        id: `${ this.id }-export-svg`,
        label: "svg",
        callback: () => this.behaviors.downloadAsSVG(this.behaviors.model.symbolsSelected.length > 0)
      },
      {
        type: "button",
        id: `${ this.id }-export-jpg`,
        label: "jpg",
        callback: () => this.behaviors.downloadAsJPG(this.behaviors.model.symbolsSelected.length > 0)
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    this.menuExport = this.createSubMenu(trigger, subMenuWrapper, "right").element
    return this.menuExport
  }

  protected createMenuSelectAll(): HTMLElement
  {
    const btn = document.createElement("button")
    btn.id = `${ this.id }-duplicate`
    btn.textContent = "Select all"
    btn.classList.add("ms-menu-button")
    btn.addEventListener("pointerup", async () => this.behaviors.selectAll())
    return btn
  }

  protected createMenuUnSelectAll(): HTMLElement
  {
    const btn = document.createElement("button")
    btn.id = `${ this.id }-duplicate`
    btn.textContent = "Unselect all"
    btn.classList.add("ms-menu-button")
    btn.addEventListener("pointerup", async () => this.behaviors.unselectAll())
    return btn
  }

  update(): void
  {
    this.wrapper?.style.setProperty("left", `${ this.position.x - this.position.scrollLeft }px`)
    this.wrapper?.style.setProperty("top", `${ this.position.y - this.position.scrollTop }px`)
    if (this.behaviors.model.symbolsSelected.length > 0)
    {
      this.reorderMenu?.style.removeProperty("display")
      this.duplicateBtn?.style.removeProperty("display")
      this.menuExport?.style.removeProperty("display")
      this.removeBtn?.style.removeProperty("display")
    }
    else {
      this.reorderMenu?.style.setProperty("display", "none")
      this.duplicateBtn?.style.setProperty("display", "none")
      this.menuExport?.style.setProperty("display", "none")
      this.removeBtn?.style.setProperty("display", "none")
    }
    if (this.showDecorator) {
      this.decoratorMenu?.style.removeProperty("display")
    }
    else {
      this.decoratorMenu?.style.setProperty("display", "none")
    }
  }

  render(domElement: HTMLElement): void
  {
    this.wrapper = document.createElement("div")
    this.wrapper.id = `${ this.id }-wrapper`
    this.wrapper.classList.add("ms-menu", "ms-menu-context")
    this.wrapper.appendChild(this.createMenuDecorator())
    this.wrapper.appendChild(this.createMenuDuplicate())
    this.wrapper.appendChild(this.createMenuReorder())
    this.wrapper.appendChild(this.createMenuExport())
    this.wrapper.appendChild(this.createMenuSelectAll())
    this.wrapper.appendChild(this.createMenuUnSelectAll())
    this.wrapper.appendChild(this.createMenuRemove())
    this.wrapper.style.setProperty("display", "none")
    domElement.appendChild(this.wrapper)
    domElement.parentElement?.addEventListener("scroll", () => {
      this.position.scrollLeft = domElement.parentElement?.scrollLeft || 0
      this.position.scrollTop = domElement.parentElement?.scrollTop || 0
      this.update()
    })
  }

  show(): void
  {
    this.update()
    this.wrapper?.style.setProperty("display", "block")
  }

  hide(): void
  {
    this.wrapper?.style.setProperty("display", "none")
  }

  destroy(): void
  {

  }
}
