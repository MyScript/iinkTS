import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { type IIJiixQueryManager, IIMathCapabilitiesTable } from "@/iink"

describe("IIMathCapabilitiesTable.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    canvas = createCanvasMock({
      jiix: {
        getBlockLabel: jest.fn().mockImplementation((id: string) => {
          if (id === "block-1") return "f(x) = x + 1"
          if (id === "block-2") return "2 + 3"
          if (id === "block-3") return "x = 5"
          if (id === "block-4") return "f(x)"
          return "Unknown"
        }),
      } as unknown as IIJiixQueryManager,
    })

    // Mock methods for capabilities checking
    canvas.math.getAvailableActions = jest.fn().mockResolvedValue(["numerical-computation", "evaluation"])
    canvas.math.getVariables = jest.fn().mockResolvedValue([{ name: "x", value: 1, sourceType: "UNDEFINED" }])
    canvas.math.getEvaluables = jest.fn().mockResolvedValue([{ inputName: "x", outputName: "f(x)" }])
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  test("should instantiate with canvas", () => {
    const table = new IIMathCapabilitiesTable(asCanvas(canvas))
    expect(table).toBeDefined()
  })

  describe("fetchSymbolCapabilities()", () => {
    test("should fetch all capabilities for a symbol", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = "block-1"

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      expect(capabilities).toBeDefined()
      expect(capabilities.jiixBlockId).toBe(jiixBlockId)
      expect(capabilities.canCheckDiagnostic).toBe(true)
      expect(capabilities.canEditVariables).toBe(true)
      expect(capabilities.canCompute).toBe(true)
      expect(capabilities.canEvaluate).toBe(true)

      expect(canvas.math.getAvailableActions).toHaveBeenCalledWith("block-1")
      expect(canvas.math.getVariables).toHaveBeenCalledWith("block-1")
      expect(canvas.math.getEvaluables).toHaveBeenCalledWith("block-1")
    })

    test("should handle symbol without id", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = ""

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      expect(capabilities.canCheckDiagnostic).toBe(false)
      expect(capabilities.canEditVariables).toBe(false)
      expect(capabilities.canCompute).toBe(false)
      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should handle errors gracefully", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = "block-1"

      // Mock methods to throw errors
      canvas.math.getAvailableActions = jest.fn().mockRejectedValue(new Error("API error"))
      canvas.math.getVariables = jest.fn().mockRejectedValue(new Error("API error"))
      canvas.math.getEvaluables = jest.fn().mockRejectedValue(new Error("API error"))

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      // All capabilities should be false when errors occur
      expect(capabilities.canCheckDiagnostic).toBe(false)
      expect(capabilities.canEditVariables).toBe(false)
      expect(capabilities.canCompute).toBe(false)
      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should detect when no variables available", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = "block-2"

      canvas.math.getVariables = jest.fn().mockResolvedValue([])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      expect(capabilities.canEditVariables).toBe(false)
    })

    test("should detect when no evaluables available", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = "block-3"

      canvas.math.getEvaluables = jest.fn().mockResolvedValue([])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      expect(capabilities.canEvaluate).toBe(false)
    })

    test("should detect when numerical-computation not available", async () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const jiixBlockId = "block-4"

      canvas.math.getAvailableActions = jest.fn().mockResolvedValue(["evaluation"])

      const capabilities = await (table as any).fetchSymbolCapabilities(jiixBlockId)

      expect(capabilities.canCompute).toBe(false)
    })
  })

  describe("createTable()", () => {
    test("should create table with capabilities data", () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const capabilities = [
        {
          jiixBlockId: "block-1",
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true,
        },
      ]

      const tableElement = (table as any).createTable(capabilities)

      expect(tableElement).toBeDefined()
    })

    test("should create table with multiple capabilities", () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const capabilities = [
        {
          jiixBlockId: "block-1",
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true,
        },
        {
          jiixBlockId: "block-2",
          canCheckDiagnostic: true,
          canEditVariables: false,
          canCompute: true,
          canEvaluate: false,
        },
      ]

      const tableElement = (table as any).createTable(capabilities)

      expect(tableElement).toBeDefined()
    })

    test("should store capabilities for later use", () => {
      const table = new IIMathCapabilitiesTable(asCanvas(canvas))
      const capabilities = [
        {
          jiixBlockId: "block-1",
          canCheckDiagnostic: true,
          canEditVariables: true,
          canCompute: true,
          canEvaluate: true,
        },
      ]

      ;(table as any).createTable(capabilities)

      expect((table as any).capabilities).toEqual(capabilities)
    })
  })
})
