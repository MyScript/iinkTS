import { createCanvasMock, asEditor } from "../__mocks__/createCanvasMock"
import { MathContextMenu } from "@/iink"

describe("MathContextMenu.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>
  let mathMenu: MathContextMenu

  beforeEach(() => {
    editor = createCanvasMock()
    mathMenu = new MathContextMenu(asEditor(editor))
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
      const customMenu = new MathContextMenu(asEditor(editor), "custom-prefix")
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

  describe("editor math methods", () => {
    test("should have math.getVariables method available", () => {
      expect(editor.math.getVariables).toBeDefined()
      expect(typeof editor.math.getVariables).toBe("function")
    })

    test("should have math.setListVariableValue method available", () => {
      expect(editor.math.setListVariableValue).toBeDefined()
      expect(typeof editor.math.setListVariableValue).toBe("function")
    })

    test("should have math.computeNumericalResult method available", () => {
      expect(editor.math.computeNumericalResult).toBeDefined()
      expect(typeof editor.math.computeNumericalResult).toBe("function")
    })

    test("should have math.getEvaluables method available", () => {
      expect(editor.math.getEvaluables).toBeDefined()
      expect(typeof editor.math.getEvaluables).toBe("function")
    })

    test("should have math.evaluateFunction method available", () => {
      expect(editor.math.evaluateFunction).toBeDefined()
      expect(typeof editor.math.evaluateFunction).toBe("function")
    })

    test("math.getVariables returns a promise", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([])
      const result = await editor.math.getVariables("test-id")
      expect(result).toEqual([])
      expect(editor.math.getVariables).toHaveBeenCalledWith("test-id")
    })

    test("getEvaluables returns evaluable functions", async () => {
      const evaluables = [
        { inputName: "x", outputName: "f" },
        { inputName: "t", outputName: "g" },
      ]
      editor.math.getEvaluables = jest.fn().mockResolvedValue(evaluables)
      const result = await editor.math.getEvaluables("test-id")
      expect(result).toEqual(evaluables)
      expect(editor.math.getEvaluables).toHaveBeenCalledWith("test-id")
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
      const customMenu = new MathContextMenu(asEditor(editor), "test")
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
