import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TJIIXMathElement } from "@/model"
import type { TStroke, TSymbol, TText } from "@/symbol"
import { isStroke, isText } from "@/symbol"
import { TextOps } from "@/symbol/text/Text"

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

function extractSubConfig<T>(config: boolean | T): T | undefined {
  return typeof config === "object" && config !== null ? config : undefined
}
/**
 * @group Menu
 */
export class IIMenuContext {
  #logger = LoggerManager.getLogger(LoggerCategory.MENU)
  canvas: TInteractiveInkCanvas
  id: string
  wrapper?: HTMLElement
  config: Required<TMenuContextConfig>

  // Context menu instances
  private contextMenus: Map<
    string,
    | EditContextMenu
    | DecoratorContextMenu
    | ReorderContextMenu
    | ExportContextMenu
    | ConvertContextMenu
    | MathContextMenu
    | DuplicateContextMenu
    | RemoveContextMenu
    | SelectAllContextMenu
  > = new Map()

  #scrollHandler?: () => void

  position: {
    x: number
    y: number
  }

  constructor(canvas: TInteractiveInkCanvas, id = "ms-menu-context", config?: TMenuContextConfig) {
    this.id = id
    this.#logger.info("constructor")
    this.canvas = canvas
    this.config = {
      ...DefaultMenuContextConfig,
      ...config,
    }
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
    const mathMenuInstance = this.contextMenus.get("math") as MathContextMenu | undefined
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
      const editMenuInstance = this.contextMenus.get("edit") as EditContextMenu | undefined
      if (editMenuInstance) {
        const textSymbol = this.canvas.model.symbolsSelected.find((s) => isText(s))
        if (editMenuInstance.editInput && this.canvas.model.symbolsSelected.length === 1 && textSymbol) {
          editMenuInstance.editInput.value = TextOps.getLabel(textSymbol as TText)
          editMenuInstance.getElement().style.removeProperty("display")
        } else {
          editMenuInstance.getElement().style.setProperty("display", "none")
        }
      }

      // Show convert button only if there are strokes AND not only math selected
      if (this.canvas.extractStrokesFromSymbols(this.symbolsSelected).length) {
        this.contextMenus.get("convert")?.getElement().style.removeProperty("display")
      } else {
        this.contextMenus.get("convert")?.getElement().style.setProperty("display", "none")
      }

      this.contextMenus.get("reorder")?.getElement().style.removeProperty("display")
      this.contextMenus.get("duplicate")?.getElement().style.removeProperty("display")
      this.contextMenus.get("remove")?.getElement().style.removeProperty("display")
      this.contextMenus.get("export")?.getElement().style.removeProperty("display")
    } else {
      this.contextMenus.get("edit")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("convert")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("reorder")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("duplicate")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("remove")?.getElement().style.setProperty("display", "none")
      this.contextMenus.get("export")?.getElement().style.setProperty("display", "none")
    }

    // Update menu instances
    this.contextMenus.get("edit")?.update()
    this.contextMenus.get("decorator")?.update()
    this.contextMenus.get("duplicate")?.update()
    this.updateMathMenu()
  }

  render(layer: HTMLElement): void {
    this.#logger.info("Rendering context menu with config", this.config)

    this.wrapper = DOMFactory.div({
      id: `${this.id}-wrapper`,
      className: ["ms-menu", "ms-menu-context"],
    })

    if (this.config.edit) {
      const editMenuInstance = new EditContextMenu(this.canvas, this.id)
      this.contextMenus.set("edit", editMenuInstance)
      this.wrapper.appendChild(editMenuInstance.getElement())
    }

    if (this.config.decorator) {
      const decoratorMenuInstance = new DecoratorContextMenu(
        this.canvas,
        this.id,
        extractSubConfig(this.config.decorator)
      )
      this.contextMenus.set("decorator", decoratorMenuInstance)
      this.wrapper.appendChild(decoratorMenuInstance.getElement())
    }

    if (this.config.reorder) {
      const reorderMenuInstance = new ReorderContextMenu(this.canvas, this.id, extractSubConfig(this.config.reorder))
      this.contextMenus.set("reorder", reorderMenuInstance)
      this.wrapper.appendChild(reorderMenuInstance.getElement())
    }

    if (this.config.export) {
      const exportMenuInstance = new ExportContextMenu(this.canvas, this.id, extractSubConfig(this.config.export))
      this.contextMenus.set("export", exportMenuInstance)
      this.wrapper.appendChild(exportMenuInstance.getElement())
    }

    if (this.config.convert) {
      const convertMenuInstance = new ConvertContextMenu(this.canvas, this.id)
      this.contextMenus.set("convert", convertMenuInstance)
      this.wrapper.appendChild(convertMenuInstance.getElement())
    }

    if (this.config.math) {
      const mathMenuInstance = new MathContextMenu(this.canvas, this.id, extractSubConfig(this.config.math))
      this.contextMenus.set("math", mathMenuInstance)
      this.wrapper.appendChild(mathMenuInstance.getElement())
    }

    if (this.config.duplicate) {
      const duplicateMenuInstance = new DuplicateContextMenu(this.canvas, this.id)
      this.contextMenus.set("duplicate", duplicateMenuInstance)
      this.wrapper.appendChild(duplicateMenuInstance.getElement())
    }

    if (this.config.remove) {
      const removeMenuInstance = new RemoveContextMenu(this.canvas, this.id)
      this.contextMenus.set("remove", removeMenuInstance)
      this.wrapper.appendChild(removeMenuInstance.getElement())
    }

    if (this.config.selectAll) {
      const selectAllMenuInstance = new SelectAllContextMenu(this.canvas, this.id)
      this.contextMenus.set("selectAll", selectAllMenuInstance)
      this.wrapper.appendChild(selectAllMenuInstance.getElement())
    }

    this.wrapper.style.setProperty("display", "none")
    layer.appendChild(this.wrapper)

    // Hide context menu when scrolling as the referenced element moves
    this.#scrollHandler = () => this.hide()
    this.canvas.layers.rendering.addEventListener("scroll", this.#scrollHandler)
  }

  show(): void {
    this.wrapper?.style.setProperty("display", "block")
    this.update()
  }

  hide(): void {
    this.wrapper?.style.setProperty("display", "none")
  }

  destroy(): void {
    if (this.#scrollHandler) {
      this.canvas.layers.rendering.removeEventListener("scroll", this.#scrollHandler)
      this.#scrollHandler = undefined
    }
    while (this.wrapper?.lastChild) {
      this.wrapper.removeChild(this.wrapper.lastChild)
    }
    this.wrapper?.remove()
  }
}
