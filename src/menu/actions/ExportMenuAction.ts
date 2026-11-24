import type { TInteractiveInkCanvas } from "@/canvas"
import type { TRecognitionType } from "@/client"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TExportActionItemsConfig = {
  json?: boolean
  svg?: boolean
  png?: boolean
  text?: boolean
  markdown?: boolean
  mermaid?: boolean
  plantuml?: boolean
  llm?: boolean
  jiix?: boolean
  pdf?: boolean
}
/** @group Menu */
export type TExportActionConfig = boolean | TExportActionItemsConfig

/**
 * @group Menu
 * @remarks Menu action Export - Export en différents formats
 */
export class ExportMenuAction extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-action", itemsConfig?: TExportActionItemsConfig) {
    const enabled = (key: keyof TExportActionItemsConfig) => itemsConfig?.[key] !== false
    // Markdown/Mermaid/PlantUML are derived from the recognition result, so they are only
    // reachable when the matching recognition type is actually enabled on the session.
    const recognizes = (type: TRecognitionType) =>
      canvas.configuration.recognition["raw-content"].recognition?.types.includes(type) ?? false

    const config: TMenuSubMenu = {
      type: "submenu",
      id: `${idPrefix}-export`,
      label: "Export",
      menuTitle: "Export",
      position: "right-top",
      items: [],
    }

    if (enabled("json")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-json`,
        label: "JSON",
        action: (e) => e.download("json"),
      })
    }
    if (enabled("svg")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-svg`,
        label: "SVG",
        action: (e) => e.download("svg"),
      })
    }
    if (enabled("png")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-png`,
        label: "PNG",
        action: (e) => e.download("png"),
      })
    }
    if (enabled("text")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-text`,
        label: "Text",
        action: (e) => e.download("text"),
      })
    }
    if (enabled("markdown") && recognizes("text")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-markdown`,
        label: "Markdown",
        action: (e) => e.download("markdown"),
      })
    }
    if (enabled("mermaid") && recognizes("shape")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-mermaid`,
        label: "Mermaid",
        action: (e) => e.download("mermaid"),
      })
    }
    if (enabled("plantuml") && recognizes("shape")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-plantuml`,
        label: "PlantUML",
        action: (e) => e.download("plantuml"),
      })
    }
    if (enabled("llm")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-llm`,
        label: "LLM",
        action: (e) => e.download("llm"),
      })
    }
    if (enabled("jiix")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-jiix`,
        label: "JIIX",
        action: (e) => e.download("jiix"),
      })
    }
    if (enabled("pdf")) {
      config.items.push({
        type: "button",
        id: `${idPrefix}-export-pdf`,
        label: "PDF",
        action: (e) => e.download("pdf"),
      })
    }

    super(config, canvas)
  }
}
