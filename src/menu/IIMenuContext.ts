import type { TInteractiveInkCanvas } from "@/canvas"
import type { TJIIXMathElement } from "@/client"
import { DOMFactory } from "@/dom"
import type { TStroke, TSymbol, TText } from "@/symbol"
import { isStroke, isText } from "@/symbol"
import { TextUtil } from "@/symbol-utils"

import type {
  TContextDecoratorConfig,
  TContextExportConfig,
  TContextMathConfig,
  TContextReorderConfig,
} from "./context"
import {
  ConvertContextMenu,
  DecoratorContextMenu,
  DuplicateContextMenu,
  EditContextMenu,
  ExportContextMenu,
  MathContextMenu,
  RemoveContextMenu,
  ReorderContextMenu,
  SelectAllContextMenu,
} from "./context"
import { IIAbstractMenu, type TMenuLayoutConfig, type TMenuZone } from "./IIAbstractMenu"

/**
 * @group Menu
 * @remarks Configuration to enable/disable each context menu individually.
 * Sub-menus accept `boolean` to show/hide entirely, or an object to configure individual items.
 */
export type TMenuContextConfig = {
  /** Enable/disable Edit menu */
  edit?: boolean
  /** Enable/disable Decorator menu. Pass an object to configure individual decorator types. */
  decorator?: TContextDecoratorConfig
  /** Enable/disable Reorder menu. Pass an object to configure individual reorder actions. */
  reorder?: TContextReorderConfig
  /** Enable/disable Export menu. Pass an object to configure individual export formats. */
  export?: TContextExportConfig
  /** Enable/disable Convert menu */
  convert?: boolean
  /** Enable/disable Math menu. Pass an object to configure individual math operations. */
  math?: TContextMathConfig
  /** Enable/disable Group menu */
  group?: boolean
  /** Enable/disable Duplicate menu */
  duplicate?: boolean
  /** Enable/disable Remove menu */
  remove?: boolean
  /** Enable/disable Select All menu */
  selectAll?: boolean
}

/** @group Menu */
export const DefaultMenuContextConfig: Required<TMenuContextConfig> = {
  edit: true,
  decorator: true,
  reorder: true,
  export: true,
  convert: true,
  math: true,
  group: true,
  duplicate: true,
  remove: true,
  selectAll: true,
}

/**
 * @group Menu
 */
export class IIMenuContext extends IIAbstractMenu<Required<TMenuContextConfig> & TMenuLayoutConfig> {
  readonly defaultZone: TMenuZone = "dropdown"
  /** Hides the menu when the rendering layer scrolls, as the element it points at moves */
  protected scrollHandler?: () => void

  position: {
    x: number
    y: number
  }

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-context", config?: TMenuContextConfig & TMenuLayoutConfig) {
    super(canvas, id, { ...DefaultMenuContextConfig, ...config })
    this.position = { x: 0, y: 0 }
  }

  get symbolsSelected(): TSymbol[] {
    return this.canvas.model.symbolsSelected
  }

  get haveSymbolsSelected(): boolean {
    return this.symbolsSelected.length > 0
  }

  get symbolsDecorable(): (TStroke | TText)[] {
    return this.symbolsSelected.filter((s) => {
      return isStroke(s) || isText(s)
    }) as (TStroke | TText)[]
  }

  get showDecorator(): boolean {
    return this.symbolsDecorable.length > 0
  }

  get mathBlocksSelected(): TJIIXMathElement[] {
    return this.canvas.jiix.getBlocksForSymbols(this.canvas.model.symbolsSelected).filter((s) => s.type === "Math")
  }

  /**
   * True when the current selection is made up of one or more fully-selected Math blocks,
   * and nothing else (no other fully-selected block type, no stroke left outside any block).
   */
  get isOnlyMathBlocksSelected(): boolean {
    const symbolsSelected = this.canvas.model.symbolsSelected
    if (symbolsSelected.length === 0) {
      return false
    }
    const blocksSelected = this.canvas.jiix.getBlocksForSymbols(symbolsSelected)
    if (blocksSelected.length === 0 || blocksSelected.some((block) => block.type !== "Math")) {
      return false
    }
    const coveredStrokeIds = new Set(blocksSelected.flatMap((block) => this.canvas.jiix.getStrokeIdsForBlock(block.id)))
    return symbolsSelected.every((symbol) => coveredStrokeIds.has(symbol.id))
  }

  protected async updateMathMenu(): Promise<void> {
    const mathMenuInstance = this.items.get("math") as MathContextMenu | undefined
    if (!mathMenuInstance) {
      return
    }

    const mathBlocks = this.mathBlocksSelected
    if (!this.isOnlyMathBlocksSelected || mathBlocks.some((block) => !block.id)) {
      mathMenuInstance.setMenuVisibility(false, {
        canEditVariables: false,
        canCompute: false,
        canEvaluate: false,
      })
      return
    }

    const capabilities = await Promise.all(mathBlocks.map((block) => this.canvas.math.getBlockCapabilities(block.id)))
    mathMenuInstance.setMenuVisibility(true, {
      canEditVariables: capabilities.every((c) => c.canEditVariables),
      canCompute: capabilities.every((c) => c.canCompute),
      canEvaluate: capabilities.every((c) => c.canEvaluate),
      hasDrawSolverOutputs: capabilities.every((c) => c.hasDrawSolverOutputs),
    })
  }

  update(): void {
    // Position is now in client coordinates (relative to viewport), no need to adjust for scroll
    this.wrapper?.style.setProperty("left", `${this.position.x}px`)
    this.wrapper?.style.setProperty("top", `${this.position.y}px`)

    // Adjust position if menu overflows rendering layer boundaries
    if (this.wrapper) {
      const menuRect = this.wrapper.getBoundingClientRect()
      const renderingRect = this.canvas.layers.rendering.getBoundingClientRect()
      const parent = this.wrapper.parentElement
      if (!parent) {
        return
      }
      const parentRect = parent.getBoundingClientRect()

      const margin = 10
      let adjustedX = this.position.x
      let adjustedY = this.position.y

      // Convert rendering layer bounds to parent-relative coordinates
      const renderingLeft = renderingRect.left - parentRect.left
      const renderingTop = renderingRect.top - parentRect.top
      const renderingRight = renderingLeft + renderingRect.width
      const renderingBottom = renderingTop + renderingRect.height

      // Check if menu overflows bottom of rendering layer
      if (menuRect.bottom > renderingRect.bottom) {
        adjustedY = renderingBottom - menuRect.height - margin
      }

      // Check if menu overflows right of rendering layer
      if (menuRect.right > renderingRect.right) {
        adjustedX = renderingRight - menuRect.width - margin
      }

      // Check if menu overflows left of rendering layer
      if (menuRect.left < renderingRect.left) {
        adjustedX = renderingLeft + margin
      }

      // Check if menu overflows top of rendering layer
      if (menuRect.top < renderingRect.top) {
        adjustedY = renderingTop + margin
      }

      // Apply adjusted positions if needed
      if (adjustedX !== this.position.x) {
        this.wrapper.style.setProperty("left", `${adjustedX}px`)
      }
      if (adjustedY !== this.position.y) {
        this.wrapper.style.setProperty("top", `${adjustedY}px`)
      }
    }

    if (this.haveSymbolsSelected) {
      // Update edit menu
      const editMenuInstance = this.items.get("edit") as EditContextMenu | undefined
      if (editMenuInstance) {
        const textSymbol = this.canvas.model.symbolsSelected.find((s) => isText(s))
        if (editMenuInstance.editInput && this.canvas.model.symbolsSelected.length === 1 && textSymbol) {
          editMenuInstance.editInput.value = TextUtil.getLabel(textSymbol as TText)
          editMenuInstance.getElement().style.removeProperty("display")
        } else {
          editMenuInstance.getElement().style.setProperty("display", "none")
        }
      }

      // Show convert button only if there are strokes AND not only math selected
      if (this.canvas.extractStrokesFromSymbols(this.symbolsSelected).length) {
        this.items.get("convert")?.getElement().style.removeProperty("display")
      } else {
        this.items.get("convert")?.getElement().style.setProperty("display", "none")
      }

      this.items.get("reorder")?.getElement().style.removeProperty("display")
      this.items.get("duplicate")?.getElement().style.removeProperty("display")
      this.items.get("remove")?.getElement().style.removeProperty("display")
      this.items.get("export")?.getElement().style.removeProperty("display")
    } else {
      this.items.get("edit")?.getElement().style.setProperty("display", "none")
      this.items.get("convert")?.getElement().style.setProperty("display", "none")
      this.items.get("reorder")?.getElement().style.setProperty("display", "none")
      this.items.get("duplicate")?.getElement().style.setProperty("display", "none")
      this.items.get("remove")?.getElement().style.setProperty("display", "none")
      this.items.get("export")?.getElement().style.setProperty("display", "none")
    }

    // Update menu instances
    this.items.get("edit")?.update()
    this.items.get("decorator")?.update()
    this.items.get("duplicate")?.update()
    this.updateMathMenu()
  }

  render(layer: HTMLElement): void {
    this.logger.info("Rendering context menu with config", this.config)
    const wrapper = DOMFactory.div({ id: `${this.id}-wrapper`, className: ["ms-menu", "ms-menu-context"] })
    this.wrapper = wrapper
    this.renderDropdownItems()

    wrapper.style.setProperty("display", "none")
    layer.appendChild(wrapper)

    // Hide context menu when scrolling as the referenced element moves
    this.scrollHandler = () => this.hide()
    this.canvas.layers.rendering.addEventListener("scroll", this.scrollHandler)
  }

  protected createZone(zone: TMenuZone, wrapper: HTMLElement): HTMLElement {
    if (zone === "dropdown") {
      return wrapper
    }
    // A row of quick actions above the list
    const bar = DOMFactory.div({ className: ["ms-menu-row", "ms-menu-context-bar"] })
    wrapper.prepend(bar)
    return bar
  }

  protected renderDropdownItems(): void {
    const { config, canvas, id } = this
    if (config.edit) {
      this.addItem("edit", new EditContextMenu(canvas, id))
    }
    if (config.decorator) {
      this.addItem("decorator", new DecoratorContextMenu(canvas, id, this.subConfig(config.decorator)))
    }
    if (config.reorder) {
      this.addItem("reorder", new ReorderContextMenu(canvas, id, this.subConfig(config.reorder)))
    }
    if (config.export) {
      this.addItem("export", new ExportContextMenu(canvas, id, this.subConfig(config.export)))
    }
    if (config.convert) {
      this.addItem("convert", new ConvertContextMenu(canvas, id))
    }
    if (config.math) {
      this.addItem("math", new MathContextMenu(canvas, id, this.subConfig(config.math)))
    }
    if (config.duplicate) {
      this.addItem("duplicate", new DuplicateContextMenu(canvas, id))
    }
    if (config.remove) {
      this.addItem("remove", new RemoveContextMenu(canvas, id))
    }
    if (config.selectAll) {
      this.addItem("selectAll", new SelectAllContextMenu(canvas, id))
    }
  }

  show(): void {
    this.wrapper?.style.setProperty("display", "block")
    this.update()
  }

  hide(): void {
    this.wrapper?.style.setProperty("display", "none")
  }

  destroy(): void {
    if (this.scrollHandler) {
      this.canvas.layers.rendering.removeEventListener("scroll", this.scrollHandler)
      this.scrollHandler = undefined
    }
    super.destroy()
  }
}
