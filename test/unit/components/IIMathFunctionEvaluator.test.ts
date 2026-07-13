import { createCanvasMock, asEditor } from "../__mocks__/createCanvasMock"
import { type IIJiixQueryManager, IIMathFunctionEvaluator } from "@/iink"

describe("IIMathFunctionEvaluator.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    editor = createCanvasMock({
      jiix: {
        getBlockLabel: jest.fn().mockImplementation((id: string) => {
          if (id === "block-1") return "f(x) = x + 1"
          if (id === "block-2") return "g(x) = 2x"
          return "Unknown"
        }),
      } as unknown as IIJiixQueryManager,
    })

    // Mock math.getEvaluables method
    editor.math.getEvaluables = jest.fn().mockResolvedValue([{ inputName: "x", outputName: "f(x)" }])

    // Mock math.evaluateFunction method
    editor.math.evaluateFunction = jest.fn().mockResolvedValue({
      f: [
        [1, 2],
        [2, 4],
        [3, 6],
      ],
    })
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should instantiate with editor and jiixBlockIds", () => {
    const jiixBlockIds = ["block-1", "block-2"]

    const evaluator = new IIMathFunctionEvaluator(asEditor(editor), jiixBlockIds)
    expect(evaluator).toBeDefined()
  })

  test("should deduplicate jiixBlockIds in constructor", () => {
    const jiixBlockIds = ["block-1", "block-1", "block-2"]

    const evaluator = new IIMathFunctionEvaluator(asEditor(editor), jiixBlockIds)
    expect(evaluator).toBeDefined()
  })

  describe("show()", () => {
    test("should fetch evaluables for all blocks", async () => {
      const jiixBlockIds = ["block-1", "block-2"]

      const evaluator = new IIMathFunctionEvaluator(asEditor(editor), jiixBlockIds)

      // Mock modal to prevent actual DOM operations
      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      expect(editor.math.getEvaluables).toHaveBeenCalledWith("block-1")
      expect(editor.math.getEvaluables).toHaveBeenCalledWith("block-2")

      showSpy.mockRestore()
    })

    test("should skip empty block ids", async () => {
      const jiixBlockIds = ["", "block-2"]

      const evaluator = new IIMathFunctionEvaluator(asEditor(editor), jiixBlockIds)

      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      // Only block-2 should be called
      expect(editor.math.getEvaluables).toHaveBeenCalledWith("block-2")
      expect(editor.math.getEvaluables).toHaveBeenCalledTimes(1)

      showSpy.mockRestore()
    })

    test("should assign unique colors to functions", async () => {
      const jiixBlockIds = ["block-1", "block-2", "block-3"]

      const evaluator = new IIMathFunctionEvaluator(asEditor(editor), jiixBlockIds)

      const showSpy = jest.spyOn(evaluator as any, "createModalContent")
      showSpy.mockReturnValue(document.createElement("div"))

      await evaluator.show()

      const functions = (evaluator as any).functionsToEvaluate
      expect(functions.length).toBe(3)
      expect(functions[0].color).toBeDefined()
      expect(functions[1].color).toBeDefined()
      expect(functions[2].color).toBeDefined()

      showSpy.mockRestore()
    })
  })
})
