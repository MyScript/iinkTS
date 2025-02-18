import style from "./menu.css"
import { LoggerCategory, LoggerManager } from "../logger"
import { InteractiveInkEditor } from "../editor"
import { IIMenuAction } from "./IIMenuAction"
import { IIMenuTool } from "./IIMenuTool"
import { IIMenuContext } from "./IIMenuContext"
import { IIMenuStyle } from "./IIMenuStyle"

/**
 * @group Manager
 */
export class IIMenuManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  editor: InteractiveInkEditor
  layer?: HTMLElement
  action: IIMenuAction
  tool: IIMenuTool
  context: IIMenuContext
  style: IIMenuStyle

  constructor(editor: InteractiveInkEditor, custom?: { style?: IIMenuStyle, tool?: IIMenuTool, action?: IIMenuAction, context?: IIMenuContext })
  {
    this.#logger.info("constructor")
    this.editor = editor

    if (custom?.style) {
      const CustomMenuStyle = custom.style as unknown as typeof IIMenuStyle
      this.style = new CustomMenuStyle(this.editor)
    }
    else {
      this.style = new IIMenuStyle(this.editor)
    }
    if (custom?.tool) {
      const CustomMenuTool = custom.tool as unknown as typeof IIMenuTool
      this.tool = new CustomMenuTool(this.editor)
    }
    else {
      this.tool = new IIMenuTool(this.editor)
    }
    if (custom?.action) {
      const CustomMenuAction = custom.action as unknown as typeof IIMenuAction
      this.action = new CustomMenuAction(this.editor)
    }
    else {
      this.action = new IIMenuAction(this.editor)
    }
    if (custom?.context) {
      const CustomMenuAction = custom.context as unknown as typeof IIMenuContext
      this.context = new CustomMenuAction(this.editor)
    }
    else {
      this.context = new IIMenuContext(this.editor)
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
