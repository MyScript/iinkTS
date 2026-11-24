import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { PDFExportManager } from "@/iink"

describe("PDFExportManager.ts", () => {
  test("should create and hold a reference to its canvas", () => {
    const canvas = createCanvasMock()
    const manager = new PDFExportManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.canvas).toBe(canvas)
  })

  describe("print container", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
    })

    test("should append a container holding the given SVG content to the document body", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const container = manager.buildPrintContainer("<svg><rect /></svg>")

      expect(container.className).toBe("ii-pdf-print-container")
      expect(container.innerHTML).toBe("<svg><rect></rect></svg>")
      expect(document.body.contains(container)).toBe(true)
    })

    test("should inject a single print-only stylesheet hiding everything but the print container", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildPrintContainer("<svg></svg>")
      manager.buildPrintContainer("<svg></svg>")

      const styles = document.head.querySelectorAll("style[data-ii-pdf-print]")
      expect(styles).toHaveLength(1)
      expect(styles[0].textContent).toContain("@media print")
      expect(styles[0].textContent).toContain(".ii-pdf-print-container")
    })

    test("should remove the print container from the document", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const container = manager.buildPrintContainer("<svg></svg>")

      manager.removePrintContainer()

      expect(document.body.contains(container)).toBe(false)
    })
  })

  describe("page dimensions and page count", () => {
    const manager = new PDFExportManager(asCanvas(createCanvasMock()))

    test("should return A4 portrait dimensions in millimeters", () => {
      expect(manager.getPageDimensionsMm("A4", "portrait")).toEqual({ width: 210, height: 297 })
    })

    test("should swap width/height for landscape orientation", () => {
      expect(manager.getPageDimensionsMm("A4", "landscape")).toEqual({ width: 297, height: 210 })
    })

    test("should return Letter portrait dimensions in millimeters", () => {
      expect(manager.getPageDimensionsMm("Letter", "portrait")).toEqual({ width: 215.9, height: 279.4 })
    })

    test("should compute a single page when content fits within one page at 100% scale", () => {
      const box = { x: 0, y: 0, width: 700, height: 1000 } // ~185x264mm at 96dpi
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 100 })
      expect(result).toEqual({ columns: 1, rows: 1, total: 1 })
    })

    test("should compute multiple pages when content exceeds one page at given scale", () => {
      const box = { x: 0, y: 0, width: 1600, height: 1000 } // ~423x264mm at 96dpi, wider than 2 A4 portrait pages
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 100 })
      expect(result).toEqual({ columns: 3, rows: 1, total: 3 })
    })

    test("should scale content before computing page count", () => {
      const box = { x: 0, y: 0, width: 700, height: 1000 }
      const result = manager.computePageCount(box, { format: "A4", orientation: "portrait", scale: 200 })
      expect(result).toEqual({ columns: 2, rows: 2, total: 4 })
    })
  })

  describe("single-page fit-to-scale mode", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-page]").forEach((el) => el.remove())
    })

    test("should shrink content that exceeds the page to fit within it", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 2000, height: 1000 } // ~529x265mm, wider than A4 portrait
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(scale).toBeCloseTo(210 / (2000 * (25.4 / 96)), 3)
    })

    test("should grow content smaller than the page to fill it", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 } // ~106x159mm, smaller than A4 portrait
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(scale).toBeCloseTo(297 / (600 * (25.4 / 96)), 3)
    })

    test("should remove the page-size stylesheet when removePrintContainer is called", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildSinglePagePrintContainer("<svg><rect /></svg>", { x: 0, y: 0, width: 400, height: 600 }, "A4", "portrait")
      expect(document.head.querySelector("style[data-ii-pdf-page]")).not.toBeNull()

      manager.removePrintContainer()

      expect(document.head.querySelector("style[data-ii-pdf-page]")).toBeNull()
    })

    test("should set @page size matching the requested format/orientation", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildSinglePagePrintContainer("<svg><rect /></svg>", { x: 0, y: 0, width: 400, height: 600 }, "A4", "landscape")

      const style = document.head.querySelector("style[data-ii-pdf-page]")
      expect(style?.textContent).toContain("@page")
      expect(style?.textContent).toContain("297mm 210mm")
    })

    test("should scale the SVG element to the fitted physical size", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 }
      const container = manager.buildSinglePagePrintContainer("<svg><rect /></svg>", box, "A4", "portrait")

      const svg = container.querySelector("svg") as SVGElement
      const scale = manager.computeFitToPageScale(box, "A4", "portrait")
      const expectedWidthMm = 400 * (25.4 / 96) * scale
      expect(parseFloat(svg.style.width)).toBeCloseTo(expectedWidthMm, 2)
    })

    test("should apply the requested scale on top of the fit-to-page size", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 }
      const container = manager.buildSinglePagePrintContainer("<svg><rect /></svg>", box, "A4", "portrait", 50)

      const svg = container.querySelector("svg") as SVGElement
      const fitted = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(parseFloat(svg.style.width)).toBeCloseTo(400 * (25.4 / 96) * fitted * 0.5, 2)
      expect(parseFloat(svg.style.height)).toBeCloseTo(600 * (25.4 / 96) * fitted * 0.5, 2)
    })

    test("should leave the fitted size untouched at 100%", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 400, height: 600 }
      const container = manager.buildSinglePagePrintContainer("<svg><rect /></svg>", box, "A4", "portrait", 100)

      const svg = container.querySelector("svg") as SVGElement
      const fitted = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(parseFloat(svg.style.width)).toBeCloseTo(400 * (25.4 / 96) * fitted, 2)
    })
  })

  describe("multi-page tiled mode", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-page]").forEach((el) => el.remove())
    })

    test("should create one page element per tile in the grid", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 1600, height: 1000 } // -> 3 columns x 1 row on A4 portrait @100%
      const container = manager.buildMultiPagePrintContainer("<svg><rect /></svg>", box, {
        format: "A4",
        orientation: "portrait",
        scale: 100,
      })

      expect(container.querySelectorAll(".ii-pdf-page")).toHaveLength(3)
    })

    test("should offset each tile's content by column/row page size so it lines up across pages", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 1600, height: 1000 }
      const container = manager.buildMultiPagePrintContainer("<svg><rect /></svg>", box, {
        format: "A4",
        orientation: "portrait",
        scale: 100,
      })

      const contents = container.querySelectorAll<HTMLDivElement>(".ii-pdf-page-content")
      expect(contents[0].style.left).toBe("0mm")
      expect(contents[0].style.top).toBe("0mm")
      expect(contents[1].style.left).toBe("-210mm")
      expect(contents[2].style.left).toBe("-420mm")
    })

    test("should mark every page but the last with a page break", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 1600, height: 1000 }
      const container = manager.buildMultiPagePrintContainer("<svg><rect /></svg>", box, {
        format: "A4",
        orientation: "portrait",
        scale: 100,
      })

      const pages = container.querySelectorAll<HTMLDivElement>(".ii-pdf-page")
      expect(pages[0].style.pageBreakAfter).toBe("always")
      expect(pages[1].style.pageBreakAfter).toBe("always")
      expect(pages[2].style.pageBreakAfter).toBe("")
    })

    test("should scale the SVG in each tile to the requested scale", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      const box = { x: 0, y: 0, width: 1600, height: 1000 }
      const container = manager.buildMultiPagePrintContainer("<svg><rect /></svg>", box, {
        format: "A4",
        orientation: "portrait",
        scale: 50,
      })

      const svg = container.querySelector(".ii-pdf-page-content svg") as SVGElement
      const expectedWidthMm = 1600 * (25.4 / 96) * 0.5
      expect(parseFloat(svg.style.width)).toBeCloseTo(expectedWidthMm, 2)
    })
  })

  describe("export settings dialog", () => {
    let mountedRoots: HTMLElement[] = []

    afterEach(() => {
      document.querySelectorAll(".ms-modal, .ms-modal-backdrop").forEach((el) => el.remove())
      mountedRoots.forEach((el) => el.remove())
      mountedRoots = []
    })

    function createMountedCanvasMock() {
      const canvas = createCanvasMock()
      document.body.appendChild(canvas.layers.root)
      mountedRoots.push(canvas.layers.root)
      return canvas
    }

    function clickButtonWithText(text: string): void {
      const button = Array.from(document.querySelectorAll("button")).find((b) => b.textContent === text)
      button?.click()
    }

    test("should default to A4 portrait single-page 100% scale", () => {
      const manager = new PDFExportManager(asCanvas(createMountedCanvasMock()))
      const onConfirm = jest.fn()

      manager.openExportDialog(onConfirm)
      clickButtonWithText("Export")

      expect(onConfirm).toHaveBeenCalledWith({ format: "A4", orientation: "portrait", mode: "single", scale: 100 })
    })

    test("should call onConfirm with the values selected by the user", () => {
      const manager = new PDFExportManager(asCanvas(createMountedCanvasMock()))
      const onConfirm = jest.fn()

      manager.openExportDialog(onConfirm)
      ;(document.getElementById("ii-pdf-export-format") as HTMLSelectElement).value = "Letter"
      ;(document.getElementById("ii-pdf-export-orientation") as HTMLSelectElement).value = "landscape"
      ;(document.getElementById("ii-pdf-export-mode") as HTMLSelectElement).value = "multi"
      ;(document.getElementById("ii-pdf-export-scale") as HTMLInputElement).value = "150"
      clickButtonWithText("Export")

      expect(onConfirm).toHaveBeenCalledWith({ format: "Letter", orientation: "landscape", mode: "multi", scale: 150 })
    })

    test("should not call onConfirm and should remove the modal when Cancel is clicked", () => {
      const manager = new PDFExportManager(asCanvas(createMountedCanvasMock()))
      const onConfirm = jest.fn()

      manager.openExportDialog(onConfirm)
      clickButtonWithText("Cancel")

      expect(onConfirm).not.toHaveBeenCalled()
      expect(document.querySelector(".ms-modal")).toBeNull()
    })
  })

  describe("print", () => {
    afterEach(() => {
      document.querySelectorAll(".ii-pdf-print-container").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-print]").forEach((el) => el.remove())
      document.querySelectorAll("style[data-ii-pdf-page]").forEach((el) => el.remove())
      jest.restoreAllMocks()
    })

    test("exposes default options matching the dialog defaults", () => {
      expect(PDFExportManager.DEFAULT_OPTIONS).toEqual({
        format: "A4",
        orientation: "portrait",
        mode: "single",
        scale: 100,
      })
    })

    test("should build a single-page container and call window.print for mode single", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildMultiPagePrintContainer = jest.fn()
      manager.buildSinglePagePrintContainer = jest.fn()
      window.print = jest.fn()

      manager.print("<svg></svg>", { x: 0, y: 0, width: 100, height: 100 }, PDFExportManager.DEFAULT_OPTIONS)

      expect(manager.buildSinglePagePrintContainer).toHaveBeenCalledTimes(1)
      expect(manager.buildMultiPagePrintContainer).not.toHaveBeenCalled()
      expect(window.print).toHaveBeenCalledTimes(1)
    })

    test("should forward the requested scale to the single-page container", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildSinglePagePrintContainer = jest.fn()
      window.print = jest.fn()
      const box = { x: 0, y: 0, width: 100, height: 100 }

      manager.print("<svg></svg>", box, { ...PDFExportManager.DEFAULT_OPTIONS, scale: 50 })

      expect(manager.buildSinglePagePrintContainer).toHaveBeenCalledWith("<svg></svg>", box, "A4", "portrait", 50)
    })

    test("should honour the scale end to end in single-page mode", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      window.print = jest.fn()
      const box = { x: 0, y: 0, width: 400, height: 600 }

      manager.print("<svg><rect /></svg>", box, { ...PDFExportManager.DEFAULT_OPTIONS, scale: 50 })

      const svg = document.querySelector(".ii-pdf-print-container svg") as SVGElement
      const fitted = manager.computeFitToPageScale(box, "A4", "portrait")
      expect(parseFloat(svg.style.width)).toBeCloseTo(400 * (25.4 / 96) * fitted * 0.5, 2)
    })

    test("should build a multi-page container and call window.print for mode multi", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      manager.buildMultiPagePrintContainer = jest.fn()
      manager.buildSinglePagePrintContainer = jest.fn()
      window.print = jest.fn()

      manager.print("<svg></svg>", { x: 0, y: 0, width: 100, height: 100 }, { ...PDFExportManager.DEFAULT_OPTIONS, mode: "multi" })

      expect(manager.buildMultiPagePrintContainer).toHaveBeenCalledTimes(1)
      expect(manager.buildSinglePagePrintContainer).not.toHaveBeenCalled()
      expect(window.print).toHaveBeenCalledTimes(1)
    })

    test("should remove the print container once the browser fires afterprint", () => {
      const manager = new PDFExportManager(asCanvas(createCanvasMock()))
      window.print = jest.fn()

      manager.print("<svg></svg>", { x: 0, y: 0, width: 100, height: 100 }, PDFExportManager.DEFAULT_OPTIONS)
      expect(document.querySelector(".ii-pdf-print-container")).not.toBeNull()

      window.dispatchEvent(new Event("afterprint"))

      expect(document.querySelector(".ii-pdf-print-container")).toBeNull()
    })
  })
})
