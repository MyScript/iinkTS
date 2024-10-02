import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIMenuAction, OIMenuTool, OIMenuStyle, OIMenuContext } from "../menu"
import { PartialDeep } from "../utils"

/**
 * @group Manager
 */
export class OIMenuManager
{
  #logger = LoggerManager.getLogger(LoggerClass.MENU)
  behaviors: OIBehaviors
  layer?: HTMLElement
  action: OIMenuAction
  tool: OIMenuTool
  context: OIMenuContext
  style: OIMenuStyle

  constructor(behaviors: OIBehaviors, custom?: PartialDeep<{ style?: OIMenuStyle, tool?: OIMenuTool, action?: OIMenuAction, context?: OIMenuContext }>)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors

    if (custom?.style) {
      const CustomMenuStyle = custom.style as unknown as typeof OIMenuStyle
      this.style = new CustomMenuStyle(this.behaviors)
    }
    else {
      this.style = new OIMenuStyle(this.behaviors)
    }
    if (custom?.tool) {
      const CustomMenuTool = custom.tool as unknown as typeof OIMenuTool
      this.tool = new CustomMenuTool(this.behaviors)
    }
    else {
      this.tool = new OIMenuTool(this.behaviors)
    }
    if (custom?.action) {
      const CustomMenuAction = custom.action as unknown as typeof OIMenuAction
      this.action = new CustomMenuAction(this.behaviors)
    }
    else {
      this.action = new OIMenuAction(this.behaviors)
    }
    if (custom?.context) {
      const CustomMenuAction = custom.context as unknown as typeof OIMenuContext
      this.context = new CustomMenuAction(this.behaviors)
    }
    else {
      this.context = new OIMenuContext(this.behaviors)
    }
  }

  render(layer: HTMLElement): void
  {
    if (this.behaviors.configuration.menu.enable) {
      this.layer = layer
      if (this.behaviors.configuration.menu.action.enable) {
        this.action.render(this.layer)
      }
      if (this.behaviors.configuration.menu.style.enable) {
        this.style.render(this.layer)
      }
      if (this.behaviors.configuration.menu.tool.enable) {
        this.tool.render(this.layer)
      }
      if (this.behaviors.configuration.menu.context.enable) {
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
