import type { TInkCanvas, TInteractiveInkCanvas } from "@/canvas"
import type { TBox } from "@/core"
import { convertPixelToMillimeter } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import { Modal } from "@/ui"
/**
 * @group Manager
 */
export type TPDFPageFormat = "A4" | "Letter" | "Legal"

/**
 * @group Manager
 */
export type TPDFOrientation = "portrait" | "landscape"

/**
 * @group Manager
 */
export type TPDFPageSizeMm = {
  width: number
  height: number
}

/**
 * @group Manager
 */
export type TPDFPageOptions = {
  format: TPDFPageFormat
  orientation: TPDFOrientation
  scale: number
}

/**
 * @group Manager
 */
export type TPDFPageCount = {
  columns: number
  rows: number
  total: number
}

/**
 * @group Manager
 */
export type TPDFPageMode = "single" | "multi"

/**
 * @group Manager
 */
export type TPDFExportDialogOptions = {
  format: TPDFPageFormat
  orientation: TPDFOrientation
  mode: TPDFPageMode
  scale: number
}

const DIALOG_FIELD_IDS = {
  format: "ii-pdf-export-format",
  orientation: "ii-pdf-export-orientation",
  mode: "ii-pdf-export-mode",
  scale: "ii-pdf-export-scale",
} as const

const PAGE_SIZES_MM: Record<TPDFPageFormat, TPDFPageSizeMm> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
}

const PRINT_CONTAINER_CLASS = "ii-pdf-print-container"

const PRINT_STYLESHEET = `
  .${PRINT_CONTAINER_CLASS} {
    display: none;
  }
  @media print {
    body > *:not(.${PRINT_CONTAINER_CLASS}) {
      display: none !important;
    }
    .${PRINT_CONTAINER_CLASS} {
      display: block !important;
    }
  }
`

/**
 * @group Manager
 */
export class PDFExportManager {
  static readonly DEFAULT_OPTIONS: TPDFExportDialogOptions = {
    format: "A4",
    orientation: "portrait",
    mode: "single",
    scale: 100,
  }

  #logger = LoggerManager.getLogger(LoggerCategory.MODEL)
  canvas: TInteractiveInkCanvas | TInkCanvas
  #printContainer?: HTMLDivElement
  #pageStyle?: HTMLStyleElement

  constructor(canvas: TInteractiveInkCanvas | TInkCanvas) {
    this.#logger.info("constructor")
    this.canvas = canvas
  }

  #ensurePrintStylesheet(): void {
    if (document.head.querySelector("style[data-ii-pdf-print]")) {
      return
    }
    const style = document.createElement("style")
    style.setAttribute("data-ii-pdf-print", "")
    style.textContent = PRINT_STYLESHEET
    document.head.appendChild(style)
  }

  buildPrintContainer(svgContent: string): HTMLDivElement {
    this.removePrintContainer()
    this.#ensurePrintStylesheet()

    const container = document.createElement("div")
    container.className = PRINT_CONTAINER_CLASS
    container.innerHTML = svgContent
    document.body.appendChild(container)

    this.#printContainer = container
    return container
  }

  removePrintContainer(): void {
    this.#printContainer?.remove()
    this.#printContainer = undefined
    this.#pageStyle?.remove()
    this.#pageStyle = undefined
  }

  #setPageSizeStyle(page: TPDFPageSizeMm): void {
    if (!this.#pageStyle) {
      this.#pageStyle = document.createElement("style")
      this.#pageStyle.setAttribute("data-ii-pdf-page", "")
      document.head.appendChild(this.#pageStyle)
    }
    this.#pageStyle.textContent = `@page { size: ${page.width}mm ${page.height}mm; margin: 0; }`
  }

  getPageDimensionsMm(format: TPDFPageFormat, orientation: TPDFOrientation): TPDFPageSizeMm {
    const size = PAGE_SIZES_MM[format]
    return orientation === "landscape" ? { width: size.height, height: size.width } : { ...size }
  }

  computePageCount(box: TBox, options: TPDFPageOptions): TPDFPageCount {
    const page = this.getPageDimensionsMm(options.format, options.orientation)
    const scaleFactor = options.scale / 100
    const contentWidthMm = convertPixelToMillimeter(box.width) * scaleFactor
    const contentHeightMm = convertPixelToMillimeter(box.height) * scaleFactor

    const columns = Math.max(1, Math.ceil(contentWidthMm / page.width))
    const rows = Math.max(1, Math.ceil(contentHeightMm / page.height))

    return { columns, rows, total: columns * rows }
  }

  computeFitToPageScale(box: TBox, format: TPDFPageFormat, orientation: TPDFOrientation): number {
    const page = this.getPageDimensionsMm(format, orientation)
    const contentWidthMm = convertPixelToMillimeter(box.width)
    const contentHeightMm = convertPixelToMillimeter(box.height)

    return Math.min(page.width / contentWidthMm, page.height / contentHeightMm)
  }

  /**
   * Lay the content out on a single page, scaled to fit it.
   * @param scalePercent - Percentage of the fit-to-page size to use; 100 (the default) fills the
   *                       page, 50 draws the content at half that size
   */
  buildSinglePagePrintContainer(
    svgContent: string,
    box: TBox,
    format: TPDFPageFormat,
    orientation: TPDFOrientation,
    scalePercent: number = PDFExportManager.DEFAULT_OPTIONS.scale
  ): HTMLDivElement {
    const container = this.buildPrintContainer(svgContent)
    const page = this.getPageDimensionsMm(format, orientation)
    this.#setPageSizeStyle(page)

    const scale = this.computeFitToPageScale(box, format, orientation) * (scalePercent / 100)
    const svg = container.querySelector("svg")
    if (svg) {
      const widthMm = +(convertPixelToMillimeter(box.width) * scale).toFixed(3)
      const heightMm = +(convertPixelToMillimeter(box.height) * scale).toFixed(3)
      svg.style.width = `${widthMm}mm`
      svg.style.height = `${heightMm}mm`
    }

    return container
  }

  buildMultiPagePrintContainer(svgContent: string, box: TBox, options: TPDFPageOptions): HTMLDivElement {
    this.removePrintContainer()
    this.#ensurePrintStylesheet()

    const page = this.getPageDimensionsMm(options.format, options.orientation)
    this.#setPageSizeStyle(page)

    const { columns, rows } = this.computePageCount(box, options)
    const scaleFactor = options.scale / 100
    const contentWidthMm = +(convertPixelToMillimeter(box.width) * scaleFactor).toFixed(3)
    const contentHeightMm = +(convertPixelToMillimeter(box.height) * scaleFactor).toFixed(3)

    const container = document.createElement("div")
    container.className = PRINT_CONTAINER_CLASS

    const total = columns * rows
    let index = 0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const pageEl = document.createElement("div")
        pageEl.className = "ii-pdf-page"
        pageEl.style.width = `${page.width}mm`
        pageEl.style.height = `${page.height}mm`
        pageEl.style.overflow = "hidden"
        pageEl.style.position = "relative"
        index++
        if (index < total) {
          pageEl.style.pageBreakAfter = "always"
          pageEl.style.breakAfter = "page"
        }

        const content = document.createElement("div")
        content.className = "ii-pdf-page-content"
        content.style.position = "absolute"
        content.style.left = `${-col * page.width}mm`
        content.style.top = `${-row * page.height}mm`
        content.innerHTML = svgContent

        const svg = content.querySelector("svg")
        if (svg) {
          svg.style.width = `${contentWidthMm}mm`
          svg.style.height = `${contentHeightMm}mm`
        }

        pageEl.appendChild(content)
        container.appendChild(pageEl)
      }
    }

    document.body.appendChild(container)
    this.#printContainer = container
    return container
  }

  print(svgContent: string, box: TBox, options: TPDFExportDialogOptions): void {
    if (options.mode === "single") {
      this.buildSinglePagePrintContainer(svgContent, box, options.format, options.orientation, options.scale)
    } else {
      this.buildMultiPagePrintContainer(svgContent, box, options)
    }

    window.addEventListener("afterprint", () => this.removePrintContainer(), { once: true })
    window.print()
  }

  /**
   * Open the PDF settings dialog.
   * @param onConfirm - Called with the chosen settings when the user validates
   * @param onCancel - Called when the user dismisses the dialog, so callers awaiting the dialog
   *                   can settle instead of hanging forever
   */
  openExportDialog(onConfirm: (options: TPDFExportDialogOptions) => void, onCancel?: () => void): void {
    const defaults = PDFExportManager.DEFAULT_OPTIONS
    const modal = new Modal({
      title: "Export as PDF",
      container: this.canvas.layers.root,
      fields: [
        {
          id: DIALOG_FIELD_IDS.format,
          label: "Page format",
          type: "select",
          defaultValue: defaults.format,
          options: [
            { value: "A4", label: "A4" },
            { value: "Letter", label: "Letter" },
            { value: "Legal", label: "Legal" },
          ],
        },
        {
          id: DIALOG_FIELD_IDS.orientation,
          label: "Orientation",
          type: "select",
          defaultValue: defaults.orientation,
          options: [
            { value: "portrait", label: "Portrait" },
            { value: "landscape", label: "Landscape" },
          ],
        },
        {
          id: DIALOG_FIELD_IDS.mode,
          label: "Page mode",
          type: "select",
          defaultValue: defaults.mode,
          options: [
            { value: "single", label: "Single page (fit to page)" },
            { value: "multi", label: "Multi-page (tiled)" },
          ],
        },
        {
          id: DIALOG_FIELD_IDS.scale,
          label: "Scale (%)",
          type: "number",
          defaultValue: defaults.scale,
        },
      ],
      buttons: [
        {
          label: "Cancel",
          variant: "secondary",
          onClick: () => {
            modal.destroy()
            onCancel?.()
          },
        },
        {
          label: "Export",
          variant: "primary",
          onClick: () => {
            const options = this.#readDialogOptions()
            modal.destroy()
            onConfirm(options)
          },
        },
      ],
    })
    modal.open()
  }

  #readDialogOptions(): TPDFExportDialogOptions {
    const format = (document.getElementById(DIALOG_FIELD_IDS.format) as HTMLSelectElement).value as TPDFPageFormat
    const orientation = (document.getElementById(DIALOG_FIELD_IDS.orientation) as HTMLSelectElement)
      .value as TPDFOrientation
    const mode = (document.getElementById(DIALOG_FIELD_IDS.mode) as HTMLSelectElement).value as TPDFPageMode
    const scale = Number((document.getElementById(DIALOG_FIELD_IDS.scale) as HTMLInputElement).value)

    return { format, orientation, mode, scale }
  }
}
