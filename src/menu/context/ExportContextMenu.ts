import type { TInteractiveInkCanvas } from "@/canvas"
import type { TRecognitionType } from "@/client"
import type { TDownloadFormat, TExportOptions } from "@/manager"

import type { TMenuSubMenu } from "../items/SubMenuItem"
import { SubMenuItem } from "../items/SubMenuItem"

/** @group Menu */
export type TContextExportItemsConfig = {
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
export type TContextExportConfig = boolean | TContextExportItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Export - Exporte les symboles sélectionnés
 */
export class ExportContextMenu extends SubMenuItem {
  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context", itemsConfig?: TContextExportItemsConfig) {
    const enabled = (key: keyof TContextExportItemsConfig) => itemsConfig?.[key] !== false
    // Markdown/Mermaid/PlantUML are derived from the recognition result, so they are only
    // reachable when the matching recognition type is actually enabled on the session.
    const recognizes = (type: TRecognitionType) =>
      canvas.configuration.recognition["raw-content"].recognition?.types.includes(type) ?? false
    // The context menu acts on the selection when there is one, on the whole content otherwise.
    const scope = (): TExportOptions => ({ scope: canvas.model.symbolsSelected.length > 0 ? "selection" : "all" })
    const download = (format: TDownloadFormat) => () => canvas.download(format, scope())

    const config: TMenuSubMenu = {
      id: `${idPrefix}-export`,
      type: "submenu",
      label: "Export",
      position: "right",
      items: [],
    }

    if (enabled("json")) {
      config.items.push({
        id: `${idPrefix}-export-json`,
        type: "button",
        label: "json",
        action: download("json"),
      })
    }
    if (enabled("svg")) {
      config.items.push({
        id: `${idPrefix}-export-svg`,
        type: "button",
        label: "svg",
        action: download("svg"),
      })
    }
    if (enabled("png")) {
      config.items.push({
        id: `${idPrefix}-export-png`,
        type: "button",
        label: "png",
        action: download("png"),
      })
    }
    if (enabled("text")) {
      config.items.push({
        id: `${idPrefix}-export-text`,
        type: "button",
        label: "text",
        action: download("text"),
      })
    }
    if (enabled("markdown") && recognizes("text")) {
      config.items.push({
        id: `${idPrefix}-export-markdown`,
        type: "button",
        label: "markdown",
        action: download("markdown"),
      })
    }
    if (enabled("mermaid") && recognizes("shape")) {
      config.items.push({
        id: `${idPrefix}-export-mermaid`,
        type: "button",
        label: "mermaid",
        action: download("mermaid"),
      })
    }
    if (enabled("plantuml") && recognizes("shape")) {
      config.items.push({
        id: `${idPrefix}-export-plantuml`,
        type: "button",
        label: "plantuml",
        action: download("plantuml"),
      })
    }
    if (enabled("llm")) {
      config.items.push({
        id: `${idPrefix}-export-llm`,
        type: "button",
        label: "llm",
        action: download("llm"),
      })
    }
    if (enabled("jiix")) {
      config.items.push({
        id: `${idPrefix}-export-jiix`,
        type: "button",
        label: "jiix",
        action: download("jiix"),
      })
    }
    if (enabled("pdf")) {
      config.items.push({
        id: `${idPrefix}-export-pdf`,
        type: "button",
        label: "pdf",
        action: download("pdf"),
      })
    }

    super(config, canvas)
  }
}
