import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TContextReorderItemsConfig = {
  front?: boolean
  forward?: boolean
  backward?: boolean
  back?: boolean
}
/** @group Menu */
export type TContextReorderConfig = boolean | TContextReorderItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Reorder - Réordonne les symboles sélectionnés
 */
export class ReorderContextMenu extends SubMenuItem {
  constructor(editor: TInteractiveInkEditor, idPrefix = "ms-menu-context", itemsConfig?: TContextReorderItemsConfig) {
    const enabled = (key: keyof TContextReorderItemsConfig) => itemsConfig?.[key] !== false

    const config: TMenuSubMenu = {
      id: `${idPrefix}-reorder`,
      type: "submenu",
      label: "Reorder",
      position: "right",
      items: [],
    }

    if (enabled("front")) {
      config.items.push({
        id: `${idPrefix}-reorder-first`,
        type: "button",
        label: "Bring to front",
        action: () => {
          editor.changeOrderSymbols(editor.model.symbolsSelected, "last")
          editor.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("forward")) {
      config.items.push({
        id: `${idPrefix}-reorder-forward`,
        type: "button",
        label: "Bring forward",
        action: () => {
          editor.changeOrderSymbols(editor.model.symbolsSelected, "forward")
          editor.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("backward")) {
      config.items.push({
        id: `${idPrefix}-reorder-backward`,
        type: "button",
        label: "Send backward",
        action: () => {
          editor.changeOrderSymbols(editor.model.symbolsSelected, "backward")
          editor.selector.redrawSelectedGroup()
        },
      })
    }

    if (enabled("back")) {
      config.items.push({
        id: `${idPrefix}-reorder-last`,
        type: "button",
        label: "Send to back",
        action: () => {
          editor.changeOrderSymbols(editor.model.symbolsSelected.slice().reverse(), "first")
          editor.selector.redrawSelectedGroup()
        },
      })
    }

    super(config, editor)
  }
}
