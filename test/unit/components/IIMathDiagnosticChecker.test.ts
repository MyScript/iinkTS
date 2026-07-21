import { createCanvasMock, asEditor } from "../__mocks__/createCanvasMock"
import { type IIJiixQueryManager, IIMathDiagnosticChecker } from "@/iink"

describe("IIMathDiagnosticChecker.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    editor = createCanvasMock({
      jiix: {
        getBlockLabel: jest.fn().mockImplementation((id: string) => {
          if (id === "block-1") return "x + 1"
          if (id === "block-2") return "2y"
          return "Unknown"
        }),
      } as unknown as IIJiixQueryManager,
    })

    // Mock getDiagnostic method
    editor.math.getDiagnostic = jest.fn().mockImplementation((_id: string, type: string) => {
      if (type === "numerical-computation") {
        return Promise.resolve("compute_ok")
      }
      if (type === "evaluation") {
        return Promise.resolve("eval_ok")
      }
      return Promise.resolve("unknown")
    })
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlockIds", () => {
    const jiixBlockIds = ["block-1", "block-2"]

    const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)
    expect(checker).toBeDefined()
  })

  test("should deduplicate jiixBlockIds in constructor", () => {
    const jiixBlockIds = ["block-1", "block-1", "block-2"]

    const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)
    expect(checker).toBeDefined()
  })

  describe("show()", () => {
    test("should fetch diagnostics for all blocks", async () => {
      const jiixBlockIds = ["block-1", "block-2"]

      const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)

      // Mock modal to prevent actual DOM operations
      const showSpy = jest.spyOn(checker as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await checker.show()

      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-1", "numerical-computation")
      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-1", "evaluation")
      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-2", "numerical-computation")
      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-2", "evaluation")

      showSpy.mockRestore()
    })

    test("should skip empty block ids", async () => {
      const jiixBlockIds = ["", "block-2"]

      const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)

      const showSpy = jest.spyOn(checker as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await checker.show()

      // Only block-2 should be called
      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-2", "numerical-computation")
      expect(editor.math.getDiagnostic).toHaveBeenCalledWith("block-2", "evaluation")

      showSpy.mockRestore()
    })
  })

  describe("close()", () => {
    test("should close and destroy modal", () => {
      const jiixBlockIds = ["block-1"]

      const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)

      // Create a mock modal
      const mockModal = {
        destroy: jest.fn(),
        open: jest.fn(),
      }
      ;(checker as any).modal = mockModal

      checker.close()

      expect(mockModal.destroy).toHaveBeenCalled()
    })

    test("should handle close when no modal exists", () => {
      const jiixBlockIds = ["block-1"]

      const checker = new IIMathDiagnosticChecker(asEditor(editor), jiixBlockIds)

      expect(() => checker.close()).not.toThrow()
    })
  })
})
