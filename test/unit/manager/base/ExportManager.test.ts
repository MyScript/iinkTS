import { buildIIStroke } from "../../helpers"
import { DefaultInteractiveInkCanvasConfiguration, InteractiveInkCanvas, TInteractiveInkCanvasOptions } from "@/iink"

describe("ExportManager.ts", () => {
  const CanvasOptions: TInteractiveInkCanvasOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultInteractiveInkCanvasConfiguration)),
  }
  CanvasOptions.configuration!.server!.version = "3.0.0"

  const buildCanvas = (): InteractiveInkCanvas => {
    const canvas = new InteractiveInkCanvas(document.createElement("div"), CanvasOptions)
    canvas.renderer.getElementById = jest.fn((id) => {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path")
      p.id = id
      return p
    })
    return canvas
  }

  /** Captures the anchor `download()` hands to the browser */
  const spyOnDownloadAnchor = (): HTMLAnchorElement => {
    const link = document.createElement("a")
    link.click = jest.fn()
    jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
    return link
  }

  /**
   * jsdom never loads an <img>, so fire `load` on assignment instead. The element stays a real
   * HTMLImageElement, which the canvas mock requires to accept it in `drawImage`.
   */
  const stubImageLoading = (): void => {
    jest
      .spyOn(window.HTMLImageElement.prototype, "src", "set")
      .mockImplementation(function (this: HTMLImageElement) {
        setTimeout(() => this.dispatchEvent(new Event("load")), 0)
      })
  }

  /** Hands out a distinct object URL per call so revocations can be told apart */
  const stubObjectUrls = (): void => {
    let counter = 0
    global.URL.createObjectURL = jest.fn(() => `blob:url-${++counter}`)
    global.URL.revokeObjectURL = jest.fn()
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("exportAs", () => {
    test("should return the cloned model symbols for json", async () => {
      const canvas = buildCanvas()
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)

      const symbols = await canvas.exportAs("json")

      expect(symbols).toHaveLength(1)
      expect(symbols[0].id).toEqual(stroke.id)
      expect(symbols[0]).not.toBe(stroke)
    })

    test("should return a serialized svg string for svg", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())

      const svg = await canvas.exportAs("svg")

      expect(typeof svg).toBe("string")
      expect(svg).toContain("<svg")
    })

    test("should only export the selection when scope is selection", async () => {
      const canvas = buildCanvas()
      const selected = buildIIStroke()
      const other = buildIIStroke()
      canvas.model.addSymbol(selected)
      canvas.model.addSymbol(other)
      canvas.model.selectSymbol(selected.id)

      const symbols = await canvas.exportAs("json", { scope: "selection" })

      expect(symbols.map((s) => s.id)).toEqual([selected.id])
    })

    test("should let an explicit symbols list win over scope", async () => {
      const canvas = buildCanvas()
      const selected = buildIIStroke()
      const explicit = buildIIStroke()
      canvas.model.addSymbol(selected)
      canvas.model.addSymbol(explicit)
      canvas.model.selectSymbol(selected.id)

      const symbols = await canvas.exportAs("json", { scope: "selection", symbols: [explicit] })

      expect(symbols.map((s) => s.id)).toEqual([explicit.id])
    })

    test("should resolve with a non-empty png Blob", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      stubObjectUrls()
      stubImageLoading()

      const blob = await canvas.exportAs("png")

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBeGreaterThan(0)
      expect(blob.type).toBe("image/png")
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url-1")
    })

    test("should not accept pdf — printing produces no in-memory value", async () => {
      const canvas = buildCanvas()

      // @ts-expect-error "pdf" is deliberately outside TExportFormat: it only exists on download().
      // If this line ever compiles, the format union has leaked and the guarantee is gone.
      const rejected = () => canvas.exportAs("pdf")

      expect(rejected).toBeDefined()
    })

    test("should resolve with an empty png Blob rather than hang on empty content", async () => {
      const canvas = buildCanvas()

      const blob = await canvas.exportAs("png")

      expect(blob).toBeInstanceOf(Blob)
      expect(blob.size).toBe(0)
    })
  })

  describe("download", () => {
    test("should trigger a download for svg", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      const link = spyOnDownloadAnchor()

      await canvas.download("svg")

      expect(link.download).toContain("iink-ts-")
      expect(link.download).toMatch(/\.svg$/)
      expect(link.click).toHaveBeenCalledTimes(1)
    })

    test("should trigger a download for json containing every symbol", async () => {
      const canvas = buildCanvas()
      const stroke1 = buildIIStroke()
      const stroke2 = buildIIStroke()
      canvas.model.addSymbol(stroke1)
      canvas.model.addSymbol(stroke2)
      const link = spyOnDownloadAnchor()

      await canvas.download("json")

      expect(link.href).toContain("data:application/json;charset=utf-8,")
      expect(link.href).toContain(stroke1.id)
      expect(link.href).toContain(stroke2.id)
      expect(link.download).toMatch(/\.json$/)
    })

    test("should trigger a download for json restricted to the selection", async () => {
      const canvas = buildCanvas()
      const selected = buildIIStroke()
      const other = buildIIStroke()
      canvas.model.addSymbol(selected)
      canvas.model.addSymbol(other)
      canvas.model.selectSymbol(selected.id)
      const link = spyOnDownloadAnchor()

      await canvas.download("json", { scope: "selection" })

      expect(link.href).toContain(selected.id)
      expect(link.href).not.toContain(other.id)
    })

    test("should use the given filename and append the extension", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      const link = spyOnDownloadAnchor()

      await canvas.download("json", { filename: "my-notes" })

      expect(link.download).toBe("my-notes.json")
    })

    test("should not duplicate an extension the filename already carries", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      const link = spyOnDownloadAnchor()

      await canvas.download("json", { filename: "my-notes.json" })

      expect(link.download).toBe("my-notes.json")
    })

    test("should build a locale-independent file name free of / and :", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      // The previous implementation went through toLocaleDateString, which produced
      // "iink-ts-26/08/2026 14:30:15.svg" under fr-FR — slashes and colons in a file name.
      jest.spyOn(navigator, "language", "get").mockReturnValue("fr-FR")
      const link = spyOnDownloadAnchor()

      await canvas.download("svg")

      expect(link.download).not.toContain("/")
      expect(link.download).not.toContain(":")
      expect(link.download).toMatch(/^iink-ts-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.svg$/)
    })
  })

  describe("download(\"pdf\")", () => {
    test("should open the export dialog when no PDF setting is given", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      canvas.pdfExport.openExportDialog = jest.fn()

      canvas.download("pdf")

      expect(canvas.pdfExport.openExportDialog).toHaveBeenCalledTimes(1)
    })

    test("should resolve once the dialog is confirmed", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      canvas.pdfExport.print = jest.fn()
      canvas.pdfExport.openExportDialog = jest.fn((onConfirm) =>
        onConfirm({ format: "A4", orientation: "portrait", mode: "single", scale: 100 })
      )

      await canvas.download("pdf")

      expect(canvas.pdfExport.print).toHaveBeenCalledTimes(1)
    })

    test("should resolve when the dialog is cancelled instead of hanging", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      canvas.pdfExport.print = jest.fn()
      canvas.pdfExport.openExportDialog = jest.fn((_onConfirm, onCancel) => onCancel?.())

      await canvas.download("pdf")

      expect(canvas.pdfExport.print).not.toHaveBeenCalled()
    })

    test("should skip the dialog and fill in the defaults when a PDF setting is given", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      canvas.pdfExport.openExportDialog = jest.fn()
      canvas.pdfExport.print = jest.fn()

      await canvas.download("pdf", { mode: "multi" })

      expect(canvas.pdfExport.openExportDialog).not.toHaveBeenCalled()
      const [, , options] = (canvas.pdfExport.print as jest.Mock).mock.calls[0]
      expect(options).toEqual({ format: "A4", orientation: "portrait", mode: "multi", scale: 100 })
    })

    test("should still open the dialog when only scope and filename are given", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      canvas.pdfExport.openExportDialog = jest.fn()
      canvas.pdfExport.print = jest.fn()

      canvas.download("pdf", { scope: "all", filename: "sheet" })

      expect(canvas.pdfExport.openExportDialog).toHaveBeenCalledTimes(1)
      expect(canvas.pdfExport.print).not.toHaveBeenCalled()
    })

    test("should only bound the selection when scope is selection", async () => {
      const canvas = buildCanvas()
      const selected = buildIIStroke()
      canvas.model.addSymbol(selected)
      canvas.model.addSymbol(buildIIStroke())
      canvas.model.selectSymbol(selected.id)
      const boundsSpy = jest.spyOn(canvas, "getSymbolsBounds")
      canvas.pdfExport.openExportDialog = jest.fn()

      canvas.download("pdf", { scope: "selection" })

      expect(boundsSpy).toHaveBeenCalledWith(canvas.model.symbolsSelected)
    })
  })

  describe("destroy", () => {
    test("should revoke the object URLs still pending", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIStroke())
      stubObjectUrls()
      stubImageLoading()

      await canvas.download("png")
      // url-1 backs the SVG source and is revoked during rasterization; url-2 backs the PNG
      // handed to the browser and only destroy() can release it.
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:url-2")

      canvas.exportManager.destroy()

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:url-2")
    })
  })
})
