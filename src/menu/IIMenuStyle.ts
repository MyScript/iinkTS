import styleIcon from "../assets/svg/palette.svg"
import { EditorTool, EditorWriteTool } from "../Constants"
import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { SymbolType, TIISymbol } from "../symbol"
import { IIMenu, TMenuItemColorList } from "./IIMenu"
import { IIMenuSub } from "./IIMenuSub"
import { TSubMenuParam } from "./IIMenuSub"
import { InteractiveInkEditor } from "../editor"

/**
 * @group Menu
 */
export class IIMenuStyle extends IIMenu
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)

  editor: InteractiveInkEditor
  id: string
  wrapper?: HTMLDivElement
  subMenu?: IIMenuSub
  triggerBtn?: HTMLButtonElement
  menuColorStroke?: HTMLDivElement
  menuColorFill?: HTMLDivElement
  menuThickness?: HTMLDivElement
  menuFontSize?: HTMLDivElement
  menuFontWeight?: HTMLDivElement
  menuStrokeOpacity?: HTMLDivElement

  constructor(editor: InteractiveInkEditor, id = "ms-menu-style")
  {
    super()
    this.id = id
    this.#logger.info("constructor")
    this.editor = editor
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  get symbolsSelected(): TIISymbol[]
  {
    return this.model.symbolsSelected
  }

  get writeShape(): boolean
  {
    return ![EditorWriteTool.Arrow, EditorWriteTool.DoubleArrow, EditorWriteTool.Line, EditorWriteTool.Pencil].includes(this.editor.writer.tool)
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get isMobile(): boolean
  {
    return this.editor.renderer.parent.clientWidth < 700
  }

  protected createMenuStroke(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : this.editor.penStyle.color as string
    const menuColorStrokeDef: TMenuItemColorList = {
      type: "colors",
      label: "Colors",
      id: `${ this.id }-color`,
      fill: false,
      values: this.colors,
      initValue: color,
      callback: (color) =>
      {
        this.editor.penStyle = { color }
        this.editor.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { color })
      },
    }
    const menuColor = this.createColorList(menuColorStrokeDef)
    this.menuColorStroke = this.createWrapCollapsible(menuColor, "Colors")
    this.menuColorStroke.id = `${ this.id }-color`
    return this.menuColorStroke
  }

  protected createMenuColorFill(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0].color ? symbolsStyles[0].color : this.editor.penStyle.color as string
    const menuColorStrokeDef: TMenuItemColorList = {
      type: "colors",
      label: "Fill",
      id: `${ this.id }-fill`,
      fill: true,
      values: this.colors,
      initValue: color,
      callback: (fill) =>
      {
        this.editor.penStyle = { fill }
        this.editor.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { fill })
      },
    }
    const menuColor = this.createColorList(menuColorStrokeDef)
    this.menuColorFill = this.createWrapCollapsible(menuColor, "Fill")
    this.menuColorFill.id = `${ this.id }-fill`
    return this.menuColorFill
  }

  protected createMenuThickness(): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-thickness-list`
    wrapper.classList.add("ms-menu-row", "thickness-list")

    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqWidth = symbolsStyles.length && symbolsStyles.every(st => st.width === symbolsStyles[0].width)
    const width = hasUniqWidth ? symbolsStyles[0].width : this.editor.penStyle.width

    this.thicknessList.forEach((size) =>
    {
      const btn = document.createElement("button")
      btn.id = `${ this.id }-thickness-${ size.label }-btn`
      btn.classList.add("ms-menu-button", "square")
      btn.textContent = size.label
      if (width === size.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        this.editor.penStyle = { width: size.value }
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        if (this.symbolsSelected.length) {
          this.editor.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { width: size.value })
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      })
      wrapper.appendChild(btn)
    })
    this.menuThickness = this.createWrapCollapsible(wrapper, "Thickness")
    this.menuThickness.id = `${ this.id }-thickness`
    return this.menuThickness
  }

  protected createMenuFontSize(): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-font-size-list`
    wrapper.classList.add("ms-menu-row", "font-size-list")

    this.fontSizeList.forEach((size) =>
    {
      const btn = document.createElement("button")
      btn.id = `${ this.id }-font-size-${ size.label }-btn`
      btn.classList.add("ms-menu-button", "square")
      btn.textContent = size.label
      if (this.editor.configuration.fontStyle.size === size.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        if (size.value === "auto") {
          this.editor.configuration.fontStyle.size = "auto"
        }
        else {
          const fontSize = (size.value as number)
          this.editor.configuration.fontStyle.size = fontSize
          const textSymbols = this.symbolsSelected.filter(s => s.type === SymbolType.Text || (s.type === SymbolType.Group && s.extractText().length))
          this.editor.updateTextFontStyle(textSymbols.map(s => s.id), { fontSize: fontSize * this.rowHeight })
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      })
      wrapper.appendChild(btn)
    })
    this.menuFontSize = this.createWrapCollapsible(wrapper, "Font size")
    this.menuFontSize.id = `${ this.id }-font-size`
    return this.menuFontSize
  }

  protected createMenuFontWeight(): HTMLDivElement
  {
    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-font-weight-list`
    wrapper.classList.add("ms-menu-row", "font-weight-list")

    this.fontWeightList.forEach((weight) =>
    {
      const btn = document.createElement("button")
      btn.id = `${ this.id }-font-weight-${ weight.label }-btn`
      btn.classList.add("ms-menu-button", "center")
      btn.textContent = weight.label
      if (this.editor.configuration.fontStyle.weight === weight.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        wrapper.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        this.editor.configuration.fontStyle.weight = weight.value as "auto" | "normal" | "bold"
        if (this.editor.configuration.fontStyle.weight !== "auto") {
          const textSymbols = this.symbolsSelected.filter(s => s.type === SymbolType.Text || (s.type === SymbolType.Group && s.extractText().length))
          this.editor.updateTextFontStyle(textSymbols.map(s => s.id), { fontWeight: this.editor.configuration.fontStyle.weight })
          this.editor.selector.resetSelectedGroup(this.symbolsSelected)
        }
      })
      wrapper.appendChild(btn)
    })
    this.menuFontWeight = this.createWrapCollapsible(wrapper, "Font weight")
    this.menuFontWeight.id = `${ this.id }-font-weight`
    return this.menuFontWeight
  }

  protected createMenuOpacity(): HTMLDivElement
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqOpacity = symbolsStyles.length && symbolsStyles.every(st => st.opacity === symbolsStyles[0]?.opacity)
    const currentOpacity = (hasUniqOpacity && symbolsStyles[0]?.opacity ? symbolsStyles[0]?.opacity : (this.editor.penStyle.opacity || 1)) * 100 as number

    const wrapper = document.createElement("div")
    wrapper.id = `${ this.id }-opacity-input-wrapper`
    const input = document.createElement("input")
    input.id = `${ this.id }-opacity-input`
    input.setAttribute("name", `opacity`)
    input.setAttribute("type", "range")
    input.setAttribute("step", "1")
    input.setAttribute("min", "1")
    input.setAttribute("max", "100")
    wrapper.appendChild(input)

    const output = document.createElement("output")
    output.setAttribute("for", `opacity`)
    output.innerHTML = currentOpacity ? `${ currentOpacity }` : "-"
    wrapper.appendChild(output)

    if (currentOpacity) {
      input.setAttribute("value", currentOpacity.toString())
    }
    input.addEventListener("input", (evt) =>
    {
      const value = (evt.target as HTMLInputElement).value as unknown as number
      output.innerHTML = `${ value }%`
      this.editor.penStyle = { opacity: value / 100 }
      if (this.symbolsSelected.length) {
        this.editor.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { opacity: value / 100 })
      }
    })
    this.menuStrokeOpacity = this.createWrapCollapsible(wrapper, "Opacity")
    this.menuStrokeOpacity.id = `${ this.id }-opacity`
    return this.menuStrokeOpacity
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.style.enable) {
      this.triggerBtn = document.createElement("button")
      this.triggerBtn.id = this.id
      this.triggerBtn.classList.add("ms-menu-button", "square")
      this.triggerBtn.innerHTML = styleIcon

      const subMenuContent = document.createElement("div")
      subMenuContent.classList.add("ms-menu-colmun")
      subMenuContent.appendChild(this.createMenuStroke())
      subMenuContent.appendChild(this.createMenuColorFill())
      subMenuContent.appendChild(this.createMenuThickness())
      subMenuContent.appendChild(this.createMenuFontSize())
      subMenuContent.appendChild(this.createMenuFontWeight())
      subMenuContent.appendChild(this.createMenuOpacity())

      const params: TSubMenuParam = {
        trigger: this.triggerBtn,
        subMenu: subMenuContent,
        position: "bottom-left",
      }
      this.subMenu = new IIMenuSub(params)

      this.wrapper = document.createElement("div")
      this.wrapper.classList.add("ms-menu", "ms-menu-top-right")
      this.wrapper.appendChild(this.subMenu.element)
      layer.appendChild(this.wrapper)
      this.update()
    }
  }

  update(): void
  {
    if (this.subMenu) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.isMobile ? this.subMenu.wrap() : this.subMenu.unwrap()
    }

    if (this.editor.tool === EditorTool.Write) {
      this.show()
      if (this.menuColorStroke) {
        this.menuColorStroke.style.display = "block"
      }
      if (this.menuColorFill) {
        this.menuColorFill.style.display = this.writeShape ? "block" : "none"
      }
      if (this.menuThickness) {
        this.menuThickness.style.display = "block"
      }
      if (this.menuFontSize) {
        this.menuFontSize.style.display = "block"
      }
      if (this.menuFontWeight) {
        this.menuFontWeight.style.display = "block"
      }
      if (this.menuStrokeOpacity) {
        this.menuStrokeOpacity.style.display = "block"
      }
    }
    else if (this.editor.tool === EditorTool.Select) {
      this.show()
      if (this.menuColorStroke) {
        this.menuColorStroke.style.display = "block"
      }
      if (this.menuColorFill) {
        const shapeSelected = this.model.symbolsSelected.length && this.model.symbolsSelected.some(s => s.type === SymbolType.Shape)
        this.menuColorFill.style.display = shapeSelected ? "block" : "none"
      }
      if (this.menuThickness) {
        this.menuThickness.style.display = "block"
      }
      if (this.menuFontSize) {
        this.menuFontSize.style.display = "block"
      }
      if (this.menuFontWeight) {
        this.menuFontWeight.style.display = "block"
      }
      if (this.menuStrokeOpacity) {
        this.menuStrokeOpacity.style.display = "block"
      }
    }
    else {
      this.hide()
    }
  }

  show(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "visible"
    }
  }

  hide(): void
  {
    if (this.wrapper) {
      this.wrapper.style.visibility = "hidden"
    }
  }

  destroy(): void
  {
    if (this.wrapper) {
      while (this.wrapper.lastChild) {
        this.wrapper.removeChild(this.wrapper.lastChild)
      }
      this.wrapper.remove()
      this.wrapper = undefined
      this.subMenu = undefined
      this.triggerBtn = undefined
      this.menuColorStroke = undefined
      this.menuColorFill = undefined
      this.menuThickness = undefined
      this.menuFontSize = undefined
      this.menuFontWeight = undefined
      this.menuStrokeOpacity = undefined
    }
  }
}
