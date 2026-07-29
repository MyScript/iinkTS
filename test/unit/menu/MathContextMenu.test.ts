import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { MathContextMenu } from "@/iink"

function clickButton(button: HTMLButtonElement) {
  button.dispatchEvent(new LeftClickEventMock("pointerup", { pointerType: "pen", clientX: 0, clientY: 0, pressure: 1 }))
}

describe("MathContextMenu.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>
  let mathMenu: MathContextMenu

  beforeEach(() => {
    canvas = createCanvasMock()
    mathMenu = new MathContextMenu(asCanvas(canvas))
    document.body.innerHTML = ""
  })

  afterEach(() => {
    jest.clearAllMocks()
    document.body.innerHTML = ""
  })

  describe("constructor", () => {
    test("should create MathContextMenu with default prefix", () => {
      expect(mathMenu).toBeDefined()
      expect(mathMenu.id).toBe("ms-menu-context-math")
      expect(mathMenu.idEditVariables).toBe("ms-menu-context-math-variables")
      expect(mathMenu.idNumericalComputation).toBe("ms-menu-context-math-numerical-computation")
      expect(mathMenu.idEvaluate).toBe("ms-menu-context-math-evaluate")
    })

    test("should create with custom id prefix", () => {
      const customMenu = new MathContextMenu(asCanvas(canvas), "custom-prefix")
      expect(customMenu.id).toBe("custom-prefix-math")
      expect(customMenu.idEditVariables).toBe("custom-prefix-math-variables")
      expect(customMenu.idNumericalComputation).toBe("custom-prefix-math-numerical-computation")
      expect(customMenu.idEvaluate).toBe("custom-prefix-math-evaluate")
    })

    test("should have unique IDs for all actions", () => {
      const ids = [mathMenu.id, mathMenu.idEditVariables, mathMenu.idNumericalComputation, mathMenu.idEvaluate]
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe("getElement()", () => {
    test("should return HTMLElement", () => {
      const element = mathMenu.getElement()
      expect(element).toBeDefined()
      expect(element).toBeInstanceOf(HTMLElement)
    })

    test("should have submenu structure", () => {
      const element = mathMenu.getElement()
      expect(element.classList.contains("sub-menu")).toBe(true)
    })

    test("should have trigger button", () => {
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const trigger = element.querySelector("button")
      expect(trigger).toBeTruthy()
    })

    test("should have menu label", () => {
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const trigger = element.querySelector("button")
      expect(trigger?.textContent).toContain("Math")
    })
  })

  describe("setMenuVisibility()", () => {
    beforeEach(() => {
      const element = mathMenu.getElement()
      document.body.appendChild(element)
    })

    test("should show menu when at least one action is available", () => {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: false,
        canEvaluate: false,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should hide menu when show parameter is false", () => {
      mathMenu.setMenuVisibility(false, {
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).toBe("none")
    })

    test("should show menu when all actions are available", () => {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: true,
        canEvaluate: true,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu with partial availability", () => {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: true,
        canCompute: false,
        canEvaluate: true,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu when only compute is available", () => {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: false,
        canCompute: true,
        canEvaluate: false,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })

    test("should show menu when only evaluate is available", () => {
      mathMenu.setMenuVisibility(true, {
        canEditVariables: false,
        canCompute: false,
        canEvaluate: true,
      })

      const menuElement = mathMenu.getElement()
      expect(menuElement.style.display).not.toBe("none")
    })
  })

  describe("canvas math methods", () => {
    test("should have math.getVariables method available", () => {
      expect(canvas.math.getVariables).toBeDefined()
      expect(typeof canvas.math.getVariables).toBe("function")
    })

    test("should have math.setListVariableValue method available", () => {
      expect(canvas.math.setListVariableValue).toBeDefined()
      expect(typeof canvas.math.setListVariableValue).toBe("function")
    })

    test("should have math.computeNumericalResult method available", () => {
      expect(canvas.math.computeNumericalResult).toBeDefined()
      expect(typeof canvas.math.computeNumericalResult).toBe("function")
    })

    test("should have math.getEvaluables method available", () => {
      expect(canvas.math.getEvaluables).toBeDefined()
      expect(typeof canvas.math.getEvaluables).toBe("function")
    })

    test("should have math.evaluateFunction method available", () => {
      expect(canvas.math.evaluateFunction).toBeDefined()
      expect(typeof canvas.math.evaluateFunction).toBe("function")
    })

    test("math.getVariables returns a promise", async () => {
      canvas.math.getVariables = jest.fn().mockResolvedValue([])
      const result = await canvas.math.getVariables("test-id")
      expect(result).toEqual([])
      expect(canvas.math.getVariables).toHaveBeenCalledWith("test-id")
    })

    test("getEvaluables returns evaluable functions", async () => {
      const evaluables = [
        { inputName: "x", outputName: "f" },
        { inputName: "t", outputName: "g" },
      ]
      canvas.math.getEvaluables = jest.fn().mockResolvedValue(evaluables)
      const result = await canvas.math.getEvaluables("test-id")
      expect(result).toEqual(evaluables)
      expect(canvas.math.getEvaluables).toHaveBeenCalledWith("test-id")
    })
  })

  describe("select/delete result strokes actions - multi-block aggregation", () => {
    test("select result strokes selects the union of stored solver outputs from all selected Math blocks", async () => {
      canvas.jiix.getBlocksForSymbols = jest.fn().mockReturnValue([
        { id: "block-1", type: "Math", expressions: [] },
        { id: "block-2", type: "Math", expressions: [] },
      ])
      canvas.math.getStoredSolverOutputs = jest
        .fn()
        .mockImplementation((id: string) => (id === "block-1" ? ["s1a", "s1b"] : ["s2a"]))
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const button = element.querySelector(`#${mathMenu.idSelectResultStrokes}`) as HTMLButtonElement
      clickButton(button)
      await Promise.resolve()

      expect(canvas.select).toHaveBeenCalledWith(["s1a", "s1b", "s2a"])
    })

    test("delete result strokes clears solver outputs on every selected Math block", async () => {
      canvas.jiix.getBlocksForSymbols = jest.fn().mockReturnValue([
        { id: "block-1", type: "Math", expressions: [] },
        { id: "block-2", type: "Math", expressions: [] },
      ])
      canvas.math.clearSolverOutputs = jest.fn().mockResolvedValue(undefined)
      const element = mathMenu.getElement()
      document.body.appendChild(element)

      const button = element.querySelector(`#${mathMenu.idDeleteResultStrokes}`) as HTMLButtonElement
      clickButton(button)
      await Promise.resolve()
      await Promise.resolve()

      expect(canvas.math.clearSolverOutputs).toHaveBeenCalledWith("block-1")
      expect(canvas.math.clearSolverOutputs).toHaveBeenCalledWith("block-2")
      expect(canvas.math.clearSolverOutputs).toHaveBeenCalledTimes(2)
    })
  })

  describe("menu properties", () => {
    test("should have correct menu id structure", () => {
      expect(mathMenu.id).toContain("math")
      expect(mathMenu.idEditVariables).toContain("variables")
      expect(mathMenu.idNumericalComputation).toContain("numerical-computation")
      expect(mathMenu.idEvaluate).toContain("evaluate")
    })

    test("should use default prefix when not specified", () => {
      expect(mathMenu.id).toContain("ms-menu-context")
    })

    test("should not use default prefix with custom prefix", () => {
      const customMenu = new MathContextMenu(asCanvas(canvas), "test")
      expect(customMenu.id).toBe("test-math")
      expect(customMenu.id).not.toContain("ms-menu-context")
    })

    test("all IDs should be strings", () => {
      expect(typeof mathMenu.id).toBe("string")
      expect(typeof mathMenu.idEditVariables).toBe("string")
      expect(typeof mathMenu.idNumericalComputation).toBe("string")
      expect(typeof mathMenu.idEvaluate).toBe("string")
    })
  })
})
