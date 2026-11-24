import { jiixMathDuplicateStrokes, jiixText } from "../../__dataset__/exports.dataset"
import { buildIIMath, buildIIStroke, buildIIText } from "../../helpers"
import { DefaultInteractiveInkCanvasConfiguration, InteractiveInkCanvas, TInteractiveInkCanvasOptions, TSymbolChar, TText } from "@/iink"

describe("IIExportManager.ts", () => {
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

  const spyOnDownloadAnchor = (): HTMLAnchorElement => {
    const link = document.createElement("a")
    link.click = jest.fn()
    jest.spyOn(document, "createElement").mockImplementationOnce(() => link)
    return link
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("JIIX-derived formats", () => {
    test.each([
      ["jiix", jiixText],
      ["markdown", "h"],
      ["mermaid", "flowchart TD"],
      ["plantuml", "@startuml\n@enduml"],
      ["llm", { blocks: [{ type: "text", content: "h" }] }],
    ] as const)("should derive %s from the JIIX export", async (format, expected) => {
      const canvas = buildCanvas()
      canvas.client.export = jest.fn(() => Promise.resolve({ "application/vnd.myscript.jiix": jiixText }))

      await expect(canvas.exportAs(format)).resolves.toEqual(expected)
    })

    test.each(["jiix", "markdown", "mermaid", "plantuml", "llm"] as const)(
      "should reuse the cached JIIX export for %s without calling client.export again",
      async (format) => {
        const canvas = buildCanvas()
        canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixText })
        canvas.client.export = jest.fn()

        await canvas.exportAs(format)

        expect(canvas.client.export).not.toHaveBeenCalled()
      }
    )

    test.each([
      ["markdown", ""],
      ["mermaid", "flowchart TD"],
      ["plantuml", "@startuml\n@enduml"],
      ["llm", { blocks: [] }],
    ] as const)("should return empty content for %s when nothing is recognized", async (format, expected) => {
      const canvas = buildCanvas()
      canvas.client.export = jest.fn(() => Promise.resolve({}))

      await expect(canvas.exportAs(format)).resolves.toEqual(expected)
    })

    test("should return an empty JIIX container rather than throw when nothing is recognized", async () => {
      const canvas = buildCanvas()
      canvas.client.export = jest.fn(() => Promise.resolve({}))

      await expect(canvas.exportAs("jiix")).resolves.toEqual({ type: "Container", id: "", version: "" })
    })

    test("should go through a single JIIX access point per derived export", async () => {
      const canvas = buildCanvas()
      const exportSpy = jest.fn(() => Promise.resolve({ "application/vnd.myscript.jiix": jiixText }))
      canvas.client.export = exportSpy

      await canvas.exportAs("markdown")

      expect(exportSpy).toHaveBeenCalledTimes(1)
      expect(exportSpy).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
    })
  })

  describe("text", () => {
    test("should extract the math label", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIMath("a=b+c"))

      await expect(canvas.exportAs("text")).resolves.toBe("a=b+c")
    })

    test("should not duplicate the label of a math item written with several strokes", async () => {
      // "x" and "=" are each drawn with 2 strokes; JIIX maps every stroke of an item to that
      // item's single label, so a naive per-stroke join used to produce "xx==2" instead of "x=2"
      const canvas = buildCanvas()
      const addStrokeWithId = (id: string): void => {
        const s = buildIIStroke()
        s.id = id
        canvas.model.addSymbol(s)
      }
      addStrokeWithId("eq-1")
      addStrokeWithId("eq-2")
      addStrokeWithId("x-1")
      addStrokeWithId("x-2")
      addStrokeWithId("n-1")
      canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixMathDuplicateStrokes })

      const text = await canvas.exportAs("text")

      expect(text).toContain("x=2")
      expect(text).not.toContain("xx==2")
    })

    test("should order extracted text by reading position, not draw order", async () => {
      const canvas = buildCanvas()
      const charFor = (label: string): TSymbolChar => ({
        bounds: { height: 0, width: 0, x: 0, y: 0 },
        color: "black",
        fontSize: 12,
        fontWeight: "normal",
        id: `char-${label}`,
        label,
      })
      // "middle" is drawn first but sits below "above" on the page
      canvas.model.addSymbol(
        buildIIText({ chars: [charFor("middle")], boundingBox: { x: 0, y: 50, width: 40, height: 20 } })
      )
      canvas.model.addSymbol(
        buildIIText({ chars: [charFor("above")], boundingBox: { x: 0, y: 0, width: 40, height: 20 } })
      )

      const text = await canvas.exportAs("text")

      expect(text.indexOf("above")).toBeLessThan(text.indexOf("middle"))
    })

    test("should keep words recognized on the same line together", async () => {
      const canvas = buildCanvas()
      const charFor = (label: string): TSymbolChar => ({
        bounds: { height: 0, width: 0, x: 0, y: 0 },
        color: "black",
        fontSize: 52,
        fontWeight: "normal",
        id: `char-${label}`,
        label,
      })
      const line1 = { y: 501, width: 62 }
      const line2 = { y: 611, width: 49 }
      const wordAt = (label: string, x: number, line: typeof line1): TText =>
        buildIIText({ chars: [charFor(label)], boundingBox: { x, y: line.y, width: line.width, height: 62 } })

      canvas.model.addSymbol(wordAt("How", 0, line1))
      canvas.model.addSymbol(wordAt("are", 100, line1))
      canvas.model.addSymbol(wordAt("you", 200, line1))
      canvas.model.addSymbol(wordAt("?", 300, line1))
      canvas.model.addSymbol(wordAt("Fine", 0, line2))
      canvas.model.addSymbol(wordAt("and", 100, line2))
      canvas.model.addSymbol(wordAt("you", 200, line2))
      canvas.model.addSymbol(wordAt("?", 300, line2))

      const text = await canvas.exportAs("text")

      expect(text).toContain("How are you ?")
      expect(text).toContain("Fine and you ?")
    })

    test("should return an empty string when there is nothing to extract", async () => {
      const canvas = buildCanvas()

      await expect(canvas.exportAs("text")).resolves.toBe("")
    })

    test("should only extract the selection when scope is selection", async () => {
      const canvas = buildCanvas()
      const selected = buildIIMath("a=b")
      canvas.model.addSymbol(selected)
      canvas.model.addSymbol(buildIIMath("c=d"))
      canvas.model.selectSymbol(selected.id)

      await expect(canvas.exportAs("text", { scope: "selection" })).resolves.toBe("a=b")
    })
  })

  describe("download", () => {
    test.each([
      ["text", ".txt", "text/plain"],
      ["markdown", ".md", "text/markdown"],
      ["mermaid", ".mmd", "text/plain"],
      ["plantuml", ".puml", "text/plain"],
      ["llm", ".json", "application/json"],
      ["jiix", ".jiix", "application/vnd.myscript.jiix"],
    ] as const)("should download %s as %s", async (format, extension, mimeType) => {
      const canvas = buildCanvas()
      canvas.model.mergeExport({ "application/vnd.myscript.jiix": jiixText })
      const link = spyOnDownloadAnchor()

      await canvas.download(format)

      expect(link.download).toMatch(new RegExp(`\\${extension}$`))
      expect(link.href).toContain(`data:${mimeType};charset=utf-8,`)
      expect(link.click).toHaveBeenCalledTimes(1)
    })

    test("should download the extracted text content", async () => {
      const canvas = buildCanvas()
      canvas.model.addSymbol(buildIIMath("a=b+c"))
      const link = spyOnDownloadAnchor()

      await canvas.download("text")

      expect(link.href).toContain(encodeURIComponent("a=b+c"))
    })
  })
})
