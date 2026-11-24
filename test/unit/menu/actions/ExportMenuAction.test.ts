import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ExportMenuAction } from "@/iink"

describe("ExportMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  const buildAction = (canvas: ReturnType<typeof createCanvasMock>, itemsConfig?: Record<string, boolean>) => {
    const action = new ExportMenuAction(asCanvas(canvas), "ms-menu-action", itemsConfig)
    const element = action.getElement()
    document.body.appendChild(element)
    return element
  }

  test("clicking PDF calls canvas.download with the pdf format", () => {
    const canvas = createCanvasMock()
    const element = buildAction(canvas)

    const button = element.querySelector("#ms-menu-action-export-pdf") as HTMLButtonElement
    expect(button).toBeTruthy()
    expect(button.textContent).toBe("PDF")

    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.download).toHaveBeenCalledWith("pdf")
  })

  test.each([
    ["json", "#ms-menu-action-export-json"],
    ["svg", "#ms-menu-action-export-svg"],
    ["png", "#ms-menu-action-export-png"],
    ["text", "#ms-menu-action-export-text"],
    ["markdown", "#ms-menu-action-export-markdown"],
    ["mermaid", "#ms-menu-action-export-mermaid"],
    ["plantuml", "#ms-menu-action-export-plantuml"],
    ["llm", "#ms-menu-action-export-llm"],
    ["jiix", "#ms-menu-action-export-jiix"],
  ])("clicking %s downloads that format", (format, selector) => {
    const canvas = createCanvasMock()
    const element = buildAction(canvas)

    const button = element.querySelector(selector) as HTMLButtonElement
    expect(button).toBeTruthy()
    button.dispatchEvent(new Event("pointerup", { bubbles: true }))

    expect(canvas.download).toHaveBeenCalledWith(format)
  })

  test("builds the ten entries with the default recognition configuration", () => {
    const canvas = createCanvasMock()
    const element = buildAction(canvas)

    expect(element.querySelectorAll("button.ms-menu-item[id^='ms-menu-action-export-']")).toHaveLength(10)
  })

  test("does not build the PDF button when disabled via config", () => {
    const canvas = createCanvasMock()
    const element = buildAction(canvas, { pdf: false })

    expect(element.querySelector("#ms-menu-action-export-pdf")).toBeNull()
  })

  test("hides mermaid and plantuml when shape recognition is off", () => {
    const canvas = createCanvasMock()
    canvas.configuration.recognition["raw-content"].recognition!.types = ["text", "math"]
    const element = buildAction(canvas)

    expect(element.querySelector("#ms-menu-action-export-mermaid")).toBeNull()
    expect(element.querySelector("#ms-menu-action-export-plantuml")).toBeNull()
    expect(element.querySelector("#ms-menu-action-export-markdown")).toBeTruthy()
  })

  test("hides markdown when text recognition is off", () => {
    const canvas = createCanvasMock()
    canvas.configuration.recognition["raw-content"].recognition!.types = ["shape"]
    const element = buildAction(canvas)

    expect(element.querySelector("#ms-menu-action-export-markdown")).toBeNull()
    expect(element.querySelector("#ms-menu-action-export-mermaid")).toBeTruthy()
  })
})
