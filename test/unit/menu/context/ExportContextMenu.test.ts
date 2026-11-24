import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { buildIIStroke } from "../../helpers"
import { ExportContextMenu } from "@/iink"

describe("ExportContextMenu.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildMenu = (canvas: ReturnType<typeof createCanvasMock>, itemsConfig?: Record<string, boolean>) => {
    const action = new ExportContextMenu(asCanvas(canvas), "ms-menu-context", itemsConfig)
    const element = action.getElement()
    document.body.appendChild(element)
    return element
  }

  test("clicking PDF downloads the whole content when nothing is selected", () => {
    const canvas = createCanvasMock()
    const element = buildMenu(canvas)

    const button = element.querySelector("#ms-menu-context-export-pdf") as HTMLButtonElement
    expect(button).toBeTruthy()

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.download).toHaveBeenCalledWith("pdf", { scope: "all" })
  })

  test("clicking PDF downloads only the selection when symbols are selected", () => {
    const canvas = createCanvasMock()
    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)
    const element = buildMenu(canvas)

    const button = element.querySelector("#ms-menu-context-export-pdf") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.download).toHaveBeenCalledWith("pdf", { scope: "selection" })
  })

  test("resolves the scope at click time, not at menu build time", () => {
    const canvas = createCanvasMock()
    const element = buildMenu(canvas)

    const stroke = buildIIStroke()
    canvas.model.addSymbol(stroke)
    canvas.model.selectSymbol(stroke.id)

    const button = element.querySelector("#ms-menu-context-export-json") as HTMLButtonElement
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.download).toHaveBeenCalledWith("json", { scope: "selection" })
  })

  test("does not build the PDF button when disabled via config", () => {
    const canvas = createCanvasMock()
    const element = buildMenu(canvas, { pdf: false })

    expect(element.querySelector("#ms-menu-context-export-pdf")).toBeNull()
  })

  test("hides mermaid and plantuml when shape recognition is off", () => {
    const canvas = createCanvasMock()
    canvas.configuration.recognition["raw-content"].recognition!.types = ["text", "math"]
    const element = buildMenu(canvas)

    expect(element.querySelector("#ms-menu-context-export-mermaid")).toBeNull()
    expect(element.querySelector("#ms-menu-context-export-plantuml")).toBeNull()
  })
})
