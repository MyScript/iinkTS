class CustomMenuStyle extends iink.OIMenuStyle {

  sizes = [
    { label: "S", value: 2 },
    { label: "M", value: 4 },
    { label: "L", value: 6 },
    { label: "XL", value: 10 },
  ]

  colors = [
    "#000000", "#ff0000", "#0000ff", "#00af00"
  ]

  createMenuThickness()
  {
    const menuThickness = document.createElement("div")
     menuThickness.id = "custom-menu-thickness"
     menuThickness.classList.add("ms-menu-item", "list")

    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqWidth = symbolsStyles.length && symbolsStyles.every(st => st.width === symbolsStyles[0]?.width)
    const width = hasUniqWidth ? symbolsStyles[0]?.width : (this.editor.penStyle.width || 4)

    this.sizes.forEach((size, i) =>
    {
      const btn = document.createElement("button")
      btn.id = "color-" + i
      btn.classList.add("ms-menu-button")
      btn.textContent = size.label
      if (width === size.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        this.setPenStyle({ width: size.value })
        menuThickness?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        if (this.symbolsSelected.length) {
          this.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { width: size.value })
        }
      })
      menuThickness.appendChild(btn)
    })
    return menuThickness
  }

  createMenuStroke()
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : (this.editor.penStyle.color || "rgb(0, 0, 0)")
    const menuColorStrokeDef = {
      type: "colors",
      label: "Colors",
      id: `${ this.id }-color`,
      fill: false,
      values: this.colors,
      initValue: color,
      callback: (color) => {
        this.setPenStyle({ color })
        this.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { color })
      },
    }
    return this.createColorList(menuColorStrokeDef)
  }

  render(layer)
  {
    this.wrapper = document.createElement("div")
    this.wrapper.classList.add("ms-menu", "custom-menu-style")
    this.wrapper.appendChild(this.createMenuStroke())
    this.wrapper.appendChild(this.createMenuThickness())

    layer.appendChild(this.wrapper)
    this.show()
  }
}

class CustomMenuTool extends iink.OIMenuTool {

  sizes = [
    { label: "S", value: 2 },
    { label: "M", value: 4 },
    { label: "L", value: 6 },
    { label: "XL", value: 10 },
  ]

  colors = [
    "#000000", "#ff0000", "#0000ff", "#00af00"
  ]

  createMenuThickness()
  {
    this.menuThickness = document.createElement("ul")
    this.menuThickness.id = "ms-menu-thickness"
    this.menuThickness.classList.add("menu-list", "horizontal")

    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqWidth = symbolsStyles.length && symbolsStyles.every(st => st.width === symbolsStyles[0]?.width)
    const width = hasUniqWidth ? symbolsStyles[0]?.width : (this.editor.penStyle.width || 4)

    this.sizes.forEach((size, i) =>
    {
      const btn = document.createElement("button")
      btn.id = "color-" + i
      btn.classList.add("ms-menu-button")
      btn.textContent = size.label
      if (width === size.value) {
        btn.classList.add("active")
      }
      btn.addEventListener("pointerup", (e) =>
      {
        e.preventDefault()
        e.stopPropagation()
        this.setPenStyle({ width: size.value })
        this.menuThickness?.querySelectorAll("*").forEach(e => e.classList.remove("active"))
        btn.classList.add("active")
        if (this.symbolsSelected.length) {
          this.updateSymbolsStyle(this.symbolsSelected.map(s => s.id), { width: size.value })
        }
      })
      this.menuThickness.appendChild(btn)
    })

    this.menuThickness.style.setProperty("margin-top", "12px")
    return this.menuThickness
  }

  createMenuStroke()
  {
    const symbolsStyles = this.symbolsSelected.map(s => s.style)
    const hasUniqColor = symbolsStyles.length && symbolsStyles.every(st => st.color === symbolsStyles[0]?.color)
    const color = hasUniqColor && symbolsStyles[0]?.color ? symbolsStyles[0]?.color : (this.editor.penStyle.color || "rgb(0, 0, 0)")
    this.menuColorStroke = this.createColorList("color", color)
    this.menuColorStroke.style.setProperty("margin-top", "12px")
    return this.menuColorStroke
  }

  render(layer)
  {
    this.wrapper = document.createElement("div")
    this.wrapper.classList.add("ms-menu", "custom-menu-tool")

    this.wrapper.appendChild(this.createMenuWrite())
    this.wrapper.appendChild(this.createMenuErase())

    layer.appendChild(this.wrapper)
    this.update()
    this.show()
  }
}

class CustomMenuAction extends iink.OIMenuAction {

  render(layer)
  {
    this.wrapper = document.createElement("div")
    this.wrapper.classList.add("ms-menu", "custom-menu-action")
    this.wrapper.appendChild(this.createMenuClear())
    this.wrapper.appendChild(this.createMenuUndo())
    this.wrapper.appendChild(this.createMenuRedo())
    this.wrapper.appendChild(this.createMenuConvert())

    layer.appendChild(this.wrapper)
    this.show()
  }
}
