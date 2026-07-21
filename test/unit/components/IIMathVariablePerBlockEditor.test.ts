import { createCanvasMock, asEditor } from "../__mocks__/createCanvasMock"
import { type IIJiixQueryManager, IIMathVariablePerBlockEditor, TMathVariable, TMathVariableDefinition } from "@/iink"

function makeVariable(overrides: Partial<TMathVariable> = {}): TMathVariable {
  return { name: "x", value: 5, sourceType: "API", ...overrides }
}

function makeDefinition(overrides: Partial<TMathVariableDefinition> = {}): TMathVariableDefinition {
  return { name: "x", value: 5, ...overrides }
}

describe("IIMathVariablePerBlockEditor.ts", () => {
  let editor: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    editor = createCanvasMock({
      jiix: {
        getBlockLabel: jest.fn().mockImplementation((id: string) => `label(${id})`),
      } as unknown as IIJiixQueryManager,
    })
    document.body.appendChild(editor.layers.root)

    editor.math.asVariableDefinition = jest.fn().mockResolvedValue(null)
    editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable()])
    editor.math.setListVariableValue = jest.fn().mockResolvedValue(undefined)
    editor.math.removeVariable = jest.fn().mockResolvedValue(undefined)
    editor.menu.context = { update: jest.fn() } as any
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  describe("constructor", () => {
    test("should instantiate with editor and blockIds", () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      expect(component).toBeDefined()
    })

    test("should deduplicate jiixBlockIds", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1", "block-1", "block-2"])
      await component.show()
      // getVariables called once per unique block
      expect(editor.math.getVariables).toHaveBeenCalledTimes(2)
    })
  })

  describe("show()", () => {
    test("should call getVariables and asVariableDefinition for each block", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      expect(editor.math.asVariableDefinition).toHaveBeenCalledWith("block-1")
      expect(editor.math.getVariables).toHaveBeenCalledWith("block-1")
    })

    test("should skip empty jiixBlockId", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["", "block-1"])
      await component.show()
      expect(editor.math.getVariables).toHaveBeenCalledTimes(1)
      expect(editor.math.getVariables).toHaveBeenCalledWith("block-1")
    })

    test("should return early when no variables found in any block", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).toBeNull()
    })

    test("should open modal when variables are found", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).not.toBeNull()
    })

    test("should set modal title with singular form for one block", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const allText = document.body.textContent ?? ""
      expect(allText).toContain("Edit Variable (1 symbol)")
    })

    test("should set modal title with plural form for multiple blocks", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1", "block-2"])
      await component.show()
      const allText = document.body.textContent ?? ""
      expect(allText).toContain("Edit Variables (2 symbols)")
    })

    test("should catch and log errors per block without aborting others", async () => {
      editor.math.getVariables = jest
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce([makeVariable({ name: "y" })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1", "block-2"])
      await component.show()
      // block-2 succeeded, modal should open
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).not.toBeNull()
    })

    test("should display block label in expression section", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const allText = document.body.textContent ?? ""
      expect(allText).toContain("label(block-1)")
    })

    test("should mark variable as isDefinition when it matches definition.name", async () => {
      editor.math.asVariableDefinition = jest.fn().mockResolvedValue(makeDefinition({ name: "x" }))
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x" })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      // definition variable should be disabled (isDefinition → disabled: true)
      const input = document.querySelector("input") as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    test("should render onDelete button for API-typed variable", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x", sourceType: "API" })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const buttons = Array.from(document.querySelectorAll("button")).filter((b) => b.title === "Delete variable")
      expect(buttons.length).toBe(1)
    })

    test("should not render onDelete button for BLOCK-typed variable", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x", sourceType: "BLOCK" })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      const buttons = Array.from(document.querySelectorAll("button")).filter((b) => b.title === "Delete variable")
      expect(buttons.length).toBe(0)
    })

    test("should render sourceLabel for BLOCK-typed variable with sourceId", async () => {
      editor.math.getVariables = jest
        .fn()
        .mockResolvedValue([makeVariable({ name: "x", sourceType: "BLOCK", sourceId: "src-block" })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      expect(editor.jiix.getBlockLabel).toHaveBeenCalledWith("src-block")
      const allText = document.body.textContent ?? ""
      expect(allText).toContain("label(src-block)")
    })
  })

  describe("close()", () => {
    test("should destroy modal and reset state", async () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()
      expect(document.querySelector(".ms-modal-backdrop")).not.toBeNull()
      component.close()
      expect(document.querySelector(".ms-modal-backdrop")).toBeNull()
    })

    test("should be safe to call before show()", () => {
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      expect(() => component.close()).not.toThrow()
    })
  })

  describe("applyChanges()", () => {
    test("should call setListVariableValue for blocks with changed variable values", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x", value: 1 })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()

      const input = document.querySelector("input[type='number']") as HTMLInputElement
      input.value = "99"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(editor.math.setListVariableValue).toHaveBeenCalledWith("block-1", { x: 99 })
    })

    test("should not call setListVariableValue when value is unchanged", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x", value: 42 })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()

      // input has value=42, do not change
      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(editor.math.setListVariableValue).not.toHaveBeenCalled()
    })

    test("should call menu.context.update() after applying", async () => {
      editor.math.getVariables = jest.fn().mockResolvedValue([makeVariable({ name: "x", value: 1 })])
      const component = new IIMathVariablePerBlockEditor(asEditor(editor), ["block-1"])
      await component.show()

      const input = document.querySelector("input[type='number']") as HTMLInputElement
      input.value = "77"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(editor.menu.context.update).toHaveBeenCalled()
    })
  })
})
