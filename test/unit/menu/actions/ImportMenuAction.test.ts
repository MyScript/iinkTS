import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { ImportMenuAction } from "@/iink"

const setInputFiles = (input: HTMLInputElement, files: File[]): void => {
  Object.defineProperty(input, "files", { value: files, configurable: true })
}

describe("ImportMenuAction.ts", () => {
  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should build a submenu with a JSON file input", () => {
    const canvas = createCanvasMock()
    const item = new ImportMenuAction(asCanvas(canvas))

    const wrapper = item.getElement()

    expect(wrapper.querySelector("#ms-menu-action-import-trigger")).toBeTruthy()
    const input = wrapper.querySelector("#ms-menu-action-import-file-input") as HTMLInputElement
    expect(input.accept).toEqual(".json")
    expect(input.multiple).toBe(false)
  })

  test("should parse the uploaded JSON file and call canvas.createSymbols()", async () => {
    // jsdom's FileReader/File.text() aren't reliable in this test environment; stub
    // FileReader to resolve with a known text value instead of actually reading `file`.
    const symbols = [{ id: "sym-1", type: "stroke" }]
    const fileText = JSON.stringify(symbols)
    const OriginalFileReader = global.FileReader
    class StubFileReader {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsText(): void {
        this.result = fileText
        this.onload?.()
      }
    }
    // @ts-expect-error assigning a minimal stub, not the full FileReader interface
    global.FileReader = StubFileReader

    try {
      const canvas = createCanvasMock()
      const item = new ImportMenuAction(asCanvas(canvas))
      const wrapper = item.getElement()
      document.body.appendChild(wrapper)
      const input = wrapper.querySelector("#ms-menu-action-import-file-input") as HTMLInputElement
      const button = wrapper
        .querySelector("#ms-menu-action-import-file-input")
        ?.parentElement?.querySelector("button") as HTMLButtonElement
      const file = new File([fileText], "import.json", { type: "application/json" })
      setInputFiles(input, [file])
      input.dispatchEvent(new Event("change"))

      button.dispatchEvent(new Event("pointerup", { bubbles: true, cancelable: true }))
      // flush the chain of microtasks across readFileAsText -> JSON.parse -> createSymbols
      for (let i = 0; i < 5; i++) {
        await Promise.resolve()
      }

      expect(canvas.createSymbols).toHaveBeenCalledWith(symbols)
    } finally {
      global.FileReader = OriginalFileReader
    }
  })
})
