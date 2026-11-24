import type { TJIIXExport } from "@/client"
import type { TLLMExport } from "@/export"
import type { TSymbol } from "@/symbol"

import type { TPDFExportDialogOptions } from "./PDFExportManager"
/**
 * Maps every export format to the type {@link TInteractiveInkCanvas.exportAs} resolves with.
 *
 * The union of export formats is intentionally **closed**: adding a format means adding an entry
 * here, so the format union, the result type and the exhaustiveness checks stay in sync.
 *
 * @group Manager
 */
export type TExportResultMap = {
  /** Local model symbols, cloned */
  json: TSymbol[]
  /** Serialized SVG of the rendered symbols */
  svg: string
  /** PNG rasterization of the rendered symbols */
  png: Blob
  /** Plain text extracted from the JIIX index, in reading order */
  text: string
  /** Markdown derived from the JIIX export */
  markdown: string
  /** Mermaid flowchart derived from the JIIX export */
  mermaid: string
  /** PlantUML diagram derived from the JIIX export */
  plantuml: string
  /** Prompt-ready content blocks derived from the JIIX export */
  llm: TLLMExport
  /** Raw JIIX export returned by the server */
  jiix: TJIIXExport
}

/**
 * Formats {@link TInteractiveInkCanvas.exportAs} can return a value for.
 *
 * `pdf` is deliberately absent: printing produces no in-memory value, so it only exists on
 * {@link TInteractiveInkCanvas.download} (see {@link TDownloadFormat}).
 *
 * @group Manager
 */
export type TExportFormat = keyof TExportResultMap

/**
 * Formats {@link TInteractiveInkCanvas.download} accepts — every {@link TExportFormat} plus `pdf`.
 * @group Manager
 */
export type TDownloadFormat = TExportFormat | "pdf"

/**
 * Which symbols an export covers.
 *
 * @remarks
 * When both `scope` and `symbols` are provided, `symbols` wins and `scope` is ignored — no error
 * is thrown, the explicit list is always the more specific intent.
 *
 * @group Manager
 */
export type TExportOptions = {
  /** `"all"` (default) exports the whole model, `"selection"` only the selected symbols */
  scope?: "all" | "selection"
  /** Explicit symbol list to export; takes precedence over `scope` */
  symbols?: TSymbol[]
}

/**
 * Options accepted by {@link TInteractiveInkCanvas.download}.
 * @group Manager
 */
export type TDownloadOptions = TExportOptions & {
  /** File name without extension; defaults to a timestamped `iink-ts-<ISO>` name */
  filename?: string
}

/**
 * Options accepted by `download("pdf", options)`.
 *
 * @remarks
 * Passing any PDF setting skips the export dialog and prints immediately, filling in
 * {@link PDFExportManager.DEFAULT_OPTIONS} for anything omitted.
 *
 * @group Manager
 */
export type TPDFDownloadOptions = TDownloadOptions & Partial<TPDFExportDialogOptions>

/**
 * File extension used by {@link TInteractiveInkCanvas.download} for each format.
 * @group Manager
 */
export const EXPORT_EXTENSIONS: Record<TDownloadFormat, string> = {
  json: "json",
  svg: "svg",
  png: "png",
  text: "txt",
  markdown: "md",
  mermaid: "mmd",
  plantuml: "puml",
  llm: "json",
  jiix: "jiix",
  pdf: "pdf",
}

/**
 * MIME type used when building the downloadable payload for each format.
 * @group Manager
 */
export const EXPORT_MIME_TYPES: Record<TDownloadFormat, string> = {
  json: "application/json",
  svg: "image/svg+xml",
  png: "image/png",
  text: "text/plain",
  markdown: "text/markdown",
  mermaid: "text/plain",
  plantuml: "text/plain",
  llm: "application/json",
  jiix: "application/vnd.myscript.jiix",
  pdf: "application/pdf",
}
