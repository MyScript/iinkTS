import style from "./menu.css"
import { LoggerCategory, LoggerManager } from "../logger"
import { EditorOffscreen } from "../editor"
import { OIMenuAction } from "./OIMenuAction"
import { OIMenuTool } from "./OIMenuTool"
import { OIMenuContext } from "./OIMenuContext"
import { OIMenuStyle } from "./OIMenuStyle"

/**
 * @group Manager
 */
export class OIMenuManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: EditorOffscreen
  layer?: HTMLElement
  action: OIMenuAction
  tool: OIMenuTool
  context: OIMenuContext
  style: OIMenuStyle

  constructor(editor: EditorOffscreen, custom?: { style?: OIMenuStyle, tool?: OIMenuTool, action?: OIMenuAction, context?: OIMenuContext })
  {
    this.#logger.info("constructor")
    this.editor = editor

    if (custom?.style) {
      const CustomMenuStyle = custom.style as unknown as typeof OIMenuStyle
      this.style = new CustomMenuStyle(this.editor)
    }
    else {
      this.style = new OIMenuStyle(this.editor)
    }
    if (custom?.tool) {
      const CustomMenuTool = custom.tool as unknown as typeof OIMenuTool
      this.tool = new CustomMenuTool(this.editor)
    }
    else {
      this.tool = new OIMenuTool(this.editor)
    }
    if (custom?.action) {
      const CustomMenuAction = custom.action as unknown as typeof OIMenuAction
      this.action = new CustomMenuAction(this.editor)
    }
    else {
      this.action = new OIMenuAction(this.editor)
    }
    if (custom?.context) {
      const CustomMenuAction = custom.context as unknown as typeof OIMenuContext
      this.context = new CustomMenuAction(this.editor)
    }
    else {
      this.context = new OIMenuContext(this.editor)
    }
  }

  render(layer: HTMLElement): void
  {
    if (this.editor.configuration.menu.enable) {
      this.layer = layer

      const styleElement = document.createElement("style")
      styleElement.appendChild(document.createTextNode(style as string))
      this.layer.prepend(styleElement)

      if (this.editor.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.editor.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.editor.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.editor.configuration.menu.context.enable) {
        this.context.render(this.layer)
      }
    }
  }

  update(): void
  {
    this.action.update()
    this.tool.update()
    this.style.update()
  }

  show(): void
  {
    this.action.show()
    this.tool.show()
    this.style.show()
  }

  hide(): void
  {
    this.action.hide()
    this.tool.hide()
    this.style.hide()
  }

  destroy(): void
  {
    this.action.destroy()
    this.tool.destroy()
    this.style.destroy()
  }
}
