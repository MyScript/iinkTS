import type { TInteractiveInkCanvas } from "@/canvas"
import type { TBox } from "@/core"
import type { Logger } from "@/logger"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { IIModel } from "@/model"
import { SVGBuilder } from "@/renderer"
import type { TSymbol } from "@/symbol"
import { cloneSymbol } from "@/symbol"

import type { TPDFExportDialogOptions } from "./PDFExportManager"
import { PDFExportManager } from "./PDFExportManager"
import type { TDownloadFormat, TExportFormat, TExportOptions, TExportResultMap, TPDFDownloadOptions } from "./TExport"
import { EXPORT_EXTENSIONS, EXPORT_MIME_TYPES } from "./TExport"
/**
 * One exporter per format, each resolving with the type {@link TExportResultMap} declares for it.
 *
 * The map is total over {@link TExportFormat}, which is what makes the generic dispatch in
 * {@link ExportManager.exportAs} type-safe without a cast.
 *
 * @group Manager
 */
export type TExporterMap = {
  [F in TExportFormat]: (options?: TExportOptions) => Promise<TExportResultMap[F]>
}

/** Keys of {@link TPDFExportDialogOptions}, used to detect a direct-print `download("pdf", …)` call */
const PDF_DIALOG_KEYS = ["format", "orientation", "mode", "scale"] as const

/**
 * Shared implementation behind the two-function export API — `exportAs` for content, `download`
 * for files. Handles the formats that need nothing but the local model and the renderer (`json`,
 * `svg`, `png`) plus the `pdf` print flow, and leaves the recognition-derived formats to
 * subclasses through {@link ExportManager.exporters}.
 *
 * @remarks
 * The canvas is typed as {@link TInteractiveInkCanvas} because every format needs symbol-level
 * access (`model.symbols`, `getSymbolsBounds`) that `InkCanvas` does not expose. Wiring another
 * variant later means widening this type, not reworking callers.
 *
 * @group Manager
 */
export abstract class ExportManager {
  /**
   * Delay before an object URL handed to the browser is revoked. Revoking synchronously after the
   * anchor click cancels the download in some browsers, so the URL outlives the click by a beat.
   */
  static readonly OBJECT_URL_REVOKE_DELAY_MS = 1000

  protected logger: Logger
  canvas: TInteractiveInkCanvas
  pdfExport: PDFExportManager

  #pendingObjectUrls = new Set<string>()
  #revokeTimers = new Set<ReturnType<typeof setTimeout>>()

  constructor(canvas: TInteractiveInkCanvas, pdfExport: PDFExportManager) {
    this.logger = LoggerManager.getLogger(LoggerCategory.MANAGER)
    this.logger.info("constructor")
    this.canvas = canvas
    this.pdfExport = pdfExport
  }

  /**
   * Exporter for every format. Subclasses spread {@link ExportManager.localExporters} and add the
   * formats they can produce.
   */
  protected abstract get exporters(): TExporterMap

  protected get model(): IIModel {
    return this.canvas.model
  }

  /** Exporters that need only the local model and the renderer */
  protected get localExporters(): Pick<TExporterMap, "json" | "png" | "svg"> {
    return {
      json: (options) => Promise.resolve(this.exportJson(options)),
      svg: (options) => Promise.resolve(this.exportSvg(options)),
      png: (options) => this.exportPng(options),
    }
  }

  /**
   * Export the content in the given format.
   * @param format - Format to export to; the resolved type follows from it
   * @param options - Which symbols to export
   * @returns Promise resolving with the exported content
   *
   * @example
   * ```typescript
   * const symbols = await canvas.exportAs("json")
   * const svg = await canvas.exportAs("svg", { scope: "selection" })
   * ```
   */
  async exportAs<F extends TExportFormat>(format: F, options?: TExportOptions): Promise<TExportResultMap[F]> {
    this.logger.info("exportAs", { format, options })
    return this.exporters[format](options)
  }

  /**
   * Export the content and hand the resulting file to the browser.
   * @param format - Format to download; `pdf` opens the print flow instead of saving a file
   * @param options - Which symbols to export, plus the file name. The PDF settings
   *                  (`format`/`orientation`/`mode`/`scale`) are ignored by every other format.
   *
   * @example
   * ```typescript
   * await canvas.download("svg")
   * await canvas.download("markdown", { filename: "meeting-notes" })
   * await canvas.download("pdf", { orientation: "landscape" })
   * ```
   */
  async download(format: TDownloadFormat, options: TPDFDownloadOptions = {}): Promise<void> {
    this.logger.info("download", { format, options })
    if (format === "pdf") {
      return this.#printAsPDF(options)
    }
    const url = await this.#buildDownloadUrl(format, options)
    this.triggerDownload(this.getExportName(EXPORT_EXTENSIONS[format], options.filename), url)
    this.#scheduleRevoke(url)
  }

  /**
   * Resolve which symbols an export covers. An explicit `symbols` list always wins over `scope`.
   */
  protected resolveSymbols(options?: TExportOptions): TSymbol[] {
    if (options?.symbols) {
      return options.symbols
    }
    return options?.scope === "selection" ? this.model.symbolsSelected : this.model.symbols
  }

  /**
   * Build the download file name. The timestamp is a truncated ISO 8601 instant so the name is
   * locale-independent and free of `/` and `:`, which browsers mangle in file names.
   */
  protected getExportName(extension: string, filename?: string): string {
    const suffix = `.${extension}`
    if (filename) {
      return filename.endsWith(suffix) ? filename : `${filename}${suffix}`
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/\.\d+Z$/, "")
      .replace(/:/g, "-")
    return `iink-ts-${timestamp}${suffix}`
  }

  protected triggerDownload(fileName: string, urlData: string): void {
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", urlData)
    downloadAnchorNode.setAttribute("download", fileName)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  protected buildSvgStringFromSymbols(symbols: TSymbol[], box: TBox): string {
    const svgNode = SVGBuilder.createLayer(box)
    symbols.forEach((s) => {
      const el = this.canvas.renderer.getElementById(s.id)?.cloneNode(true)
      if (el) {
        svgNode.appendChild(el)
      }
    })

    return new XMLSerializer().serializeToString(svgNode)
  }

  protected buildBlobFromSymbols(symbols: TSymbol[], box: TBox): Blob {
    const svgString = this.buildSvgStringFromSymbols(symbols, box)

    return new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    })
  }

  protected exportJson(options?: TExportOptions): TSymbol[] {
    return this.resolveSymbols(options).map((s) => cloneSymbol(s))
  }

  protected exportSvg(options?: TExportOptions): string {
    const symbols = this.resolveSymbols(options)
    return this.buildSvgStringFromSymbols(symbols, this.canvas.getSymbolsBounds(symbols))
  }

  /**
   * Rasterize the rendered symbols to PNG.
   *
   * @remarks
   * The rasterization goes through `image.onload`, so it is genuinely asynchronous — the returned
   * promise settles only once the bitmap exists. Empty content short-circuits: a zero-sized image
   * never fires `load`, which would leave the promise pending forever.
   */
  protected exportPng(options?: TExportOptions): Promise<Blob> {
    const symbols = this.resolveSymbols(options)
    if (!symbols.length) {
      return Promise.resolve(new Blob([], { type: EXPORT_MIME_TYPES.png }))
    }

    const box = this.canvas.getSymbolsBounds(symbols)
    const url = this.#createObjectUrl(this.buildBlobFromSymbols(symbols, box))

    return new Promise<Blob>((resolve, reject) => {
      const image = new Image(box.width, box.height)
      image.onload = () => {
        this.#revokeObjectUrl(url)
        try {
          resolve(this.#rasterize(image))
        } catch (error) {
          reject(error)
        }
      }
      image.onerror = () => {
        this.#revokeObjectUrl(url)
        reject(new Error("Failed to rasterize the SVG content to PNG"))
      }
      image.src = url
    })
  }

  #rasterize(image: HTMLImageElement): Blob {
    const canvasEl = document.createElement("canvas")
    canvasEl.width = image.width
    canvasEl.height = image.height

    const ctx = canvasEl.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to acquire a 2d context to rasterize the content to PNG")
    }
    ctx.drawImage(image, 0, 0)

    return this.#dataUrlToBlob(canvasEl.toDataURL(EXPORT_MIME_TYPES.png))
  }

  /**
   * Convert a `data:` URL to a Blob. `canvas.toBlob` would be the natural fit but it is
   * callback-based and unavailable in some environments, while `toDataURL` is synchronous.
   */
  #dataUrlToBlob(dataUrl: string): Blob {
    const [header, payload] = dataUrl.split(",")
    const mimeType = header.match(/data:([^;]+)/)?.[1] ?? EXPORT_MIME_TYPES.png
    if (!header.includes(";base64")) {
      return new Blob([decodeURIComponent(payload ?? "")], { type: mimeType })
    }
    const binary = atob(payload ?? "")
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  async #buildDownloadUrl(format: TExportFormat, options?: TExportOptions): Promise<string> {
    const value: TExportResultMap[TExportFormat] = await this.exportAs(format, options)
    if (value instanceof Blob) {
      return this.#createObjectUrl(value)
    }
    const text = typeof value === "string" ? value : JSON.stringify(value)
    return `data:${EXPORT_MIME_TYPES[format]};charset=utf-8,${encodeURIComponent(text)}`
  }

  /**
   * Print the content through {@link PDFExportManager}. Without any PDF setting the settings
   * dialog opens and the promise settles when the dialog closes — confirmation *or* cancellation —
   * so callers never wait on a dialog the user dismissed.
   */
  #printAsPDF(options: TPDFDownloadOptions): Promise<void> {
    const symbols = this.resolveSymbols(options)
    const box = this.canvas.getSymbolsBounds(symbols)
    const svgString = this.buildSvgStringFromSymbols(symbols, box)
    const dialogOptions = this.#pickPDFDialogOptions(options)

    if (dialogOptions) {
      this.pdfExport.print(svgString, box, { ...PDFExportManager.DEFAULT_OPTIONS, ...dialogOptions })
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      this.pdfExport.openExportDialog(
        (chosen) => {
          this.pdfExport.print(svgString, box, chosen)
          resolve()
        },
        () => resolve()
      )
    })
  }

  #pickPDFDialogOptions(options: TPDFDownloadOptions): Partial<TPDFExportDialogOptions> | undefined {
    const picked: Partial<TPDFExportDialogOptions> = {}
    if (options.format !== undefined) {
      picked.format = options.format
    }
    if (options.orientation !== undefined) {
      picked.orientation = options.orientation
    }
    if (options.mode !== undefined) {
      picked.mode = options.mode
    }
    if (options.scale !== undefined) {
      picked.scale = options.scale
    }
    return PDF_DIALOG_KEYS.some((key) => options[key] !== undefined) ? picked : undefined
  }

  #createObjectUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob)
    this.#pendingObjectUrls.add(url)
    return url
  }

  /** Revoke an object URL once the browser has had a chance to start the download */
  #scheduleRevoke(url: string): void {
    if (!this.#pendingObjectUrls.has(url)) {
      return
    }
    const timer = setTimeout(() => {
      this.#revokeTimers.delete(timer)
      this.#revokeObjectUrl(url)
    }, ExportManager.OBJECT_URL_REVOKE_DELAY_MS)
    this.#revokeTimers.add(timer)
  }

  #revokeObjectUrl(url: string): void {
    if (!this.#pendingObjectUrls.delete(url)) {
      return
    }
    URL.revokeObjectURL(url)
  }

  /** Release every object URL still held and cancel the pending revocations */
  destroy(): void {
    this.logger.info("destroy")
    this.#revokeTimers.forEach((timer) => clearTimeout(timer))
    this.#revokeTimers.clear()
    this.#pendingObjectUrls.forEach((url) => URL.revokeObjectURL(url))
    this.#pendingObjectUrls.clear()
  }
}
