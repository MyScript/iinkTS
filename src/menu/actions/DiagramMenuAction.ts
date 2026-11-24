import type { TInteractiveInkCanvas } from "@/canvas"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/**
 * @group Menu
 * @remarks Menu action Diagram - toggles whether moving/resizing/rotating a connected shape
 * reshapes its anchored edges (raw stroke or converted Line/PolyEdge/Arc) to follow it.
 */
export class DiagramMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action") {
    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-diagram`,
      label: "Diagram",
      menuTitle: "Diagram",
      position: "right-top",
      items: [
        {
          type: "checkbox",
          id: `${idPrefix}-diagram-follow-connected-edges`,
          label: "Follow connected edges",
          getValue: (canvas) => canvas.connector.connectorConfiguration.followConnectedEdges,
          setValue: (canvas, value) => {
            canvas.connector.connectorConfiguration.followConnectedEdges = value
          },
        },
      ],
    }
    super(config, canvas)
  }
}
