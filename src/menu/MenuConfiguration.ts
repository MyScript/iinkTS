import type { TMenuLayoutConfig } from "./IIAbstractMenu"
import type { TMenuActionConfig } from "./IIMenuAction"
import type { TMenuContextConfig } from "./IIMenuContext"
import type { TMenuStyleConfig, TMenuStyleLayoutConfig } from "./IIMenuStyle"
import type { TMenuToolConfig } from "./IIMenuTool"
import {
  DEFAULT_FONT_SIZE_LIST,
  DEFAULT_FONT_WEIGHT_LIST,
  DEFAULT_MENU_COLORS,
  DEFAULT_THICKNESS_LIST,
} from "./MenuConstants"

/**
 * @group Menu
 */
export type TMenuConfiguration = {
  enable: boolean
  style: TMenuStyleConfig & TMenuStyleLayoutConfig & { enable: boolean }
  tool: TMenuToolConfig & TMenuLayoutConfig & { enable: boolean }
  action: TMenuActionConfig & TMenuLayoutConfig & { enable: boolean }
  context: TMenuContextConfig & {
    enable: boolean
  }
}

/**
 * @group Menu
 * @source
 */
export const DefaultMenuConfiguration: TMenuConfiguration = {
  enable: true,
  style: {
    enable: true,
    strokeColor: true,
    fillColor: true,
    thickness: true,
    fontSize: true,
    fontWeight: true,
    opacity: true,
    colors: DEFAULT_MENU_COLORS,
    thicknessList: DEFAULT_THICKNESS_LIST,
    fontSizeList: DEFAULT_FONT_SIZE_LIST,
    fontWeightList: DEFAULT_FONT_WEIGHT_LIST,
  },
  tool: {
    enable: true,
    write: true,
    move: true,
    select: true,
    erase: true,
    shape: true,
    edge: true,
  },
  action: {
    enable: true,
    clear: true,
    language: true,
    undoRedo: true,
    zoom: true,
    convert: true,
    gesture: true,
    guide: true,
    snap: true,
    math: true,
    overlay: true,
    selection: true,
    export: true,
    import: true,
    minimap: true,
  },
  context: {
    enable: true,
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
  },
}
