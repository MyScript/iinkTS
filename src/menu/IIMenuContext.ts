import ArrowDown from "../assets/svg/nav-arrow-down.svg"
import { SELECTION_MARGIN } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { DecoratorKind, IIDecorator, IIRecognizedText, IIStroke, IISymbolGroup, IIText, RecognizedKind, SymbolType, TIISymbol } from "../symbol"
import { IIMenu, TMenuItemBoolean, TMenuItemButton, TMenuItemColorList } from "./IIMenu"
import { createUUID } from "../utils"
import { IIMenuSub, TSubMenuParam } from "./IIMenuSub"
import { InteractiveInkEditor } from "../editor"
/**
 * @group Menu
 */
export class IIMenuContext extends IIMenu
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLElement
  editMenu?: HTMLDivElement
  editInput?: HTMLInputElement
  editSaveBtn?: HTMLButtonElement
  reorderMenu?: HTMLDivElement
  decoratorMenu?: HTMLDivElement
  menuExport?: HTMLDivElement
  duplicateBtn?: HTMLButtonElement
  groupBtn?: HTMLButtonElement
  convertBtn?: HTMLButtonElement
  removeBtn?: HTMLButtonElement

  position: {
    x: number,
    y: number,
    scrollTop: number,
    scrollLeft: number
  }

  constructor(editor: InteractiveInkEditor, id = "ms-menu-context")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
    this.position = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 }
  }

  get symbolsSelected(): TIISymbol[]
  {
    return this.editor.model.symbolsSelected
  }

  get haveSymbolsSelected(): boolean
  {
    return this.symbolsSelected.length > 0
  }

  get symbolsDecorable(): (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  {
    return this.symbolsSelected.filter(s => [SymbolType.Stroke, SymbolType.Text, SymbolType.Group].includes(s.type) || (s.type === SymbolType.Recognized && s.kind === RecognizedKind.Text)) as (IIStroke | IIText | IISymbolGroup | IIRecognizedText)[]
  }

  get showDecorator(): boolean
  {
    return this.symbolsDecorable.length > 0
  }

  protected createMenuEdit(): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-edit-trigger`
    trigger.classList.add("ms-menu-button")
    const label = document.createElement("span")
    label.innerText = "Edit"
    trigger.appendChild(label)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    this.editInput = document.createElement("input")
    subMenuWrapper.appendChild(this.editInput)
    this.editSaveBtn = document.createElement("button")
    this.editSaveBtn.classList.add("ms-menu-button")
    this.editSaveBtn.innerText = "Save"
    subMenuWrapper.appendChild(this.editSaveBtn)
    this.editSaveBtn.addEventListener("pointerdown", async (e) =>
    {
      e.stopPropagation()
      const textSymbol = this.editor.model.symbolsSelected.find(s => s.type === SymbolType.Text) as IIText
      if (textSymbol) {
        const firstChar = textSymbol.chars[0]
        textSymbol.chars = []
        for (let i = 0; i < this.editInput!.value.length; i++) {
          textSymbol.chars.push({
            label: this.editInput!.value.charAt(i),
            id: createUUID(),
            color: firstChar.color,
            fontSize: firstChar.fontSize,
            fontWeight: firstChar.fontWeight,
            bounds: firstChar.bounds
          })
        }
        await this.editor.updateSymbol(textSymbol)
        this.editor.selector.resetSelectedGroup([textSymbol])
      }
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.editMenu = new IIMenuSub(params).element

    return this.editMenu
  }

  protected createMenuDuplicate(): HTMLElement
  {
    this.duplicateBtn = document.createElement("button")
    this.duplicateBtn.id = `${ this.id }-duplicate`
    this.duplicateBtn.textContent = "Duplicate"
    this.duplicateBtn.classList.add("ms-menu-button")
    this.duplicateBtn.addEventListener("pointerup", async () =>
    {
      const symbolsToDuplicate = this.symbolsSelected

      const updateDeepIdInGroup = (gr: IISymbolGroup) =>
      {
        gr.children.forEach(s =>
        {
          s.id = s.id.slice(0, -36) + `-${ createUUID() }`
          switch (s.type) {
            case SymbolType.Group:
              updateDeepIdInGroup(s)
              break
            case SymbolType.Recognized:
              s.strokes.forEach(s => s.id = s.id.slice(0, -36) + `-${ createUUID() }`)
              break
          }
        })
      }
      const duplicatedSymbols = symbolsToDuplicate.map(s =>
      {
        const clone = s.clone()
        while (this.editor.model.symbols.find(s => s.id === clone.id)) {
          clone.id = clone.id.slice(0, -36) + `-${ createUUID() }`
          if (clone.type === SymbolType.Group) {
            updateDeepIdInGroup(clone)
          }
          else if (clone.type === SymbolType.Recognized) {
            clone.strokes.forEach(s => s.id = s.id.slice(0, -36) + `-${ createUUID() }`)
          }
        }
        clone.selected = true
        this.editor.translator.applyToSymbol(clone, SELECTION_MARGIN, SELECTION_MARGIN)
        return clone
      })

      this.editor.unselectAll()
      await this.editor.addSymbols(duplicatedSymbols)
      this.editor.selector.drawSelectedGroup(duplicatedSymbols)
    })
    return this.duplicateBtn
  }

  protected createMenuGroup(): HTMLElement
  {
    this.groupBtn = document.createElement("button")
    this.groupBtn.id = `${ this.id }-duplicate`
    this.groupBtn.textContent = "Group"
    this.groupBtn.classList.add("ms-menu-button")
    this.groupBtn.addEventListener("pointerup", async () =>
    {
      if (this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Group) {
        const symbols = this.editor.ungroupSymbol(this.symbolsSelected[0] as IISymbolGroup)
        this.editor.select(symbols.map(s => s.id))
      }
      else {
        const symbols = this.symbolsSelected.slice()
        this.editor.unselectAll()
        const group = this.editor.groupSymbols(symbols)
        group.selected = true
        this.editor.select([group.id])
      }
    })
    return this.groupBtn
  }

  protected createMenuConvert(): HTMLElement
  {
    this.convertBtn = document.createElement("button")
    this.convertBtn.id = `${ this.id }-convert`
    this.convertBtn.textContent = "Convert"
    this.convertBtn.classList.add("ms-menu-button")
    this.convertBtn.addEventListener("pointerup", () => this.editor.convertSymbols(this.symbolsSelected))
    return this.convertBtn
  }

  protected createMenuRemove(): HTMLButtonElement
  {
    this.removeBtn = document.createElement("button")
    this.removeBtn.id = `${ this.id }-remove`
    this.removeBtn.textContent = "Remove"
    this.removeBtn.classList.add("ms-menu-button")
    this.removeBtn.addEventListener("pointerup", async () =>
    {
      this.editor.selector.removeSelectedGroup()
      await this.editor.removeSymbols(this.symbolsSelected.map(s => s.id))
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
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "last")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-forward`,
        label: "Bring forward",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "forward")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-backward`,
        label: "Send backward",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected, "backward")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
      {
        type: "button",
        id: `${ this.id }-reorder-last`,
        label: "Send to back",
        callback: () =>
        {
          this.editor.changeOrderSymbols(this.symbolsSelected.slice().reverse(), "first")
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.reorderMenu = new IIMenuSub(params).element
    return this.reorderMenu
  }

  protected createDecoratorSubMenu(label: string, kind: DecoratorKind): HTMLElement
  {
    const trigger = document.createElement("button")
    trigger.id = `${ this.id }-decorator-${ kind }`
    trigger.classList.add("ms-menu-button")
    const labelEL = document.createElement("span")
    labelEL.innerText = label
    trigger.appendChild(labelEL)
    const icon = document.createElement("span")
    icon.style.setProperty("width", "32px")
    icon.style.setProperty("transform", "rotate(270deg)")
    icon.innerHTML = ArrowDown
    trigger.appendChild(icon)

    const menuItems: (TMenuItemBoolean | TMenuItemColorList)[] = [
      {
        type: "checkbox",
        id: `${ this.id }-decorator-${ kind }-enable`,
        label: "Enable",
        initValue: false,
        callback: (enable) =>
        {
          this.symbolsDecorable.forEach(s =>
          {
            if (enable) {
              if (!s.decorators.some(d => d.kind === kind)) {
                s.decorators.push(new IIDecorator(kind, this.editor.penStyle))
              }
            }
            else {
              const decoIndex = s.decorators.findIndex(d => d.kind === kind)
              if (decoIndex > -1) {
                s.decorators.splice(decoIndex, 1)
              }
            }
            this.editor.model.updateSymbol(s)
            this.editor.renderer.drawSymbol(s)
          })

          document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
          {
            (b as HTMLButtonElement).disabled = !enable
            b.classList.remove("active")
          })
          if (enable) {
            document.querySelector(`#${ this.id }-decorator-${ kind }-color button`)?.classList.add("active")
          }
        }
      },
      {
        type: "colors",
        label: "Colors",
        id: `${ this.id }-decorator-${ kind }-color`,
        fill: false,
        values: this.colors.filter((_c, i) => !(i % 4)),
        initValue: this.colors[0],
        disabled: true,
        callback: (color) =>
        {
          this.symbolsDecorable.forEach(s =>
          {
            const deco = s.decorators.find(d => d.kind === kind)
            if (deco) {
              deco.style.color = color
              this.editor.model.updateSymbol(s)
              this.editor.renderer.drawSymbol(s)
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
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    return this.decoratorMenu = new IIMenuSub(params).element
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

    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.decoratorMenu = new IIMenuSub(params).element
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
        callback: () => this.editor.downloadAsJson(this.haveSymbolsSelected)
      },
      {
        type: "button",
        id: `${ this.id }-export-svg`,
        label: "svg",
        callback: () => this.editor.downloadAsSVG(this.haveSymbolsSelected)
      },
      {
        type: "button",
        id: `${ this.id }-export-png`,
        label: "png",
        callback: () => this.editor.downloadAsPNG(this.haveSymbolsSelected)
      },
    ]
    const subMenuWrapper = document.createElement("div")
    subMenuWrapper.classList.add("ms-menu-colmun")
    menuItems.forEach(i =>
    {
      subMenuWrapper.appendChild(this.createMenuItem(i))
    })
    const params: TSubMenuParam = {
      trigger: trigger,
      subMenu: subMenuWrapper,
      position: "right"
    }
    this.menuExport = new IIMenuSub(params).element
    return this.menuExport
  }

  protected createMenuSelectAll(): HTMLElement
  {
    const btn = document.createElement("button")
    btn.id = `${ this.id }-duplicate`
    btn.textContent = "Select all"
    btn.classList.add("ms-menu-button")
    btn.addEventListener("pointerup", async () => this.editor.selectAll())
    return btn
  }

  protected updateDecoratorSubMenu(): void
  {
    if (this.showDecorator) {
      this.decoratorMenu?.style.removeProperty("display")

      Object.values(DecoratorKind).forEach(kind =>
      {
        const checkbox = document.getElementById(`${ this.id }-decorator-${ kind }-enable`) as HTMLInputElement
        if (checkbox) {
          document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(e => e.classList.remove("active"))
          const decos = this.symbolsDecorable.flatMap(s => s.decorators).filter(d => d.kind === kind)

          if (decos.length && decos.every(d => d.style.color === decos[0].style.color)) {
            const btnToActivate = document.getElementById(`${ this.id }-decorator-${ kind }-color-${ decos[0].style.color?.replace("#", "") }-btn`)
            btnToActivate?.classList.add("active")
          }

          if (this.symbolsDecorable.filter(s => s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = true

            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
            checkbox.indeterminate = false
          }
          else if (this.symbolsDecorable.filter(s => !s.decorators.some(d => d.kind === kind)).length === this.symbolsDecorable.length) {
            checkbox.checked = false
            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = true
            })
            checkbox.indeterminate = false
          }
          else {
            checkbox.setAttribute("indeterminate", "true")
            checkbox.indeterminate = true
            document.querySelectorAll(`#${ this.id }-decorator-${ kind }-color button`).forEach(b =>
            {
              (b as HTMLButtonElement).disabled = false
            })
          }
        }

      })
    }
    else {
      this.decoratorMenu?.style.setProperty("display", "none")
    }
  }

  protected updateGroupMenu(): void
  {
    if (this.groupBtn && this.haveSymbolsSelected) {
      this.groupBtn.style.removeProperty("display")
      if (this.symbolsSelected.length === 1 && this.symbolsSelected[0].type === SymbolType.Group) {
        this.groupBtn.textContent = "UnGroup"
      }
      else {
        this.groupBtn.textContent = "Group"
      }
    }
    else {
      this.groupBtn?.style.setProperty("display", "none")
    }
  }

  update(): void
  {
    this.wrapper?.style.setProperty("left", `${ this.position.x - this.position.scrollLeft }px`)
    this.wrapper?.style.setProperty("top", `${ this.position.y - this.position.scrollTop }px`)

    if (this.haveSymbolsSelected) {
      const textSymbol = this.editor.model.symbolsSelected.find(s => s.type === SymbolType.Text)
      if (this.editMenu && this.editInput && this.editor.model.symbolsSelected.length === 1 && textSymbol) {
        this.editMenu.style.removeProperty("display")
        this.editInput.value = (textSymbol as IIText).label
      }
      else {
        this.editMenu?.style.setProperty("display", "none")
      }

      if (this.editor.extractStrokesFromSymbols(this.symbolsSelected).length) {
        this.convertBtn?.style.removeProperty("display")
      }
      else {
        this.convertBtn?.style.setProperty("display", "none")
      }


      this.reorderMenu?.style.removeProperty("display")
      this.duplicateBtn?.style.removeProperty("display")
      this.removeBtn?.style.removeProperty("display")
      this.menuExport?.style.removeProperty("display")
    }
    else {
      this.editMenu?.style.setProperty("display", "none")
      this.convertBtn?.style.setProperty("display", "none")
      this.reorderMenu?.style.setProperty("display", "none")
      this.duplicateBtn?.style.setProperty("display", "none")
      this.removeBtn?.style.setProperty("display", "none")
      this.menuExport?.style.setProperty("display", "none")
    }
    this.updateDecoratorSubMenu()
    this.updateGroupMenu()
  }

  render(layer: HTMLElement): void
  {
    this.wrapper = document.createElement("div")
    this.wrapper.id = `${ this.id }-wrapper`
    this.wrapper.classList.add("ms-menu", "ms-menu-context")
    this.wrapper.appendChild(this.createMenuEdit())
    this.wrapper.appendChild(this.createMenuDecorator())
    this.wrapper.appendChild(this.createMenuReorder())
    this.wrapper.appendChild(this.createMenuExport())
    this.wrapper.appendChild(this.createMenuConvert())
    this.wrapper.appendChild(this.createMenuGroup())
    this.wrapper.appendChild(this.createMenuDuplicate())
    this.wrapper.appendChild(this.createMenuRemove())
    this.wrapper.appendChild(this.createMenuSelectAll())
    this.wrapper.style.setProperty("display", "none")
    layer.appendChild(this.wrapper)

    this.editor.layers.rendering.addEventListener("scroll", () =>
    {
      this.position.scrollLeft = this.editor.layers.rendering.scrollLeft || 0
      this.position.scrollTop = this.editor.layers.rendering.scrollTop || 0
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
    while (this.wrapper?.lastChild) {
      this.wrapper.removeChild(this.wrapper.lastChild)
    }
    this.wrapper?.remove()
  }
}
