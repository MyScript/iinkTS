import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { IIMathVariableCanvas, TMathVariableUsage } from "@/iink"

function makeUsage(overrides: Partial<TMathVariableUsage> = {}): TMathVariableUsage {
  return {
    name: "x",
    value: 42,
    sourceType: "API",
    id: "u1",
    targetBlockId: "block-1",
    targetLabel: "Expression 1",
    isDefinition: false,
    isEditable: true,
    ...overrides,
  }
}

describe("IIMathVariableCanvas.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    canvas = createCanvasMock()
    document.body.appendChild(canvas.layers.ui.root)

    canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([])
    canvas.math.setVariableValue = jest.fn().mockResolvedValue(undefined)
    canvas.math.removeVariable = jest.fn().mockResolvedValue(undefined)
    canvas.menu.context = { update: jest.fn() } as any
  })

  afterEach(() => {
    document.body.innerHTML = ""
  })

  describe("constructor", () => {
    test("should instantiate with canvas", () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      expect(component).toBeDefined()
    })
  })

  describe("show()", () => {
    test("should call getAllVariableUsages", async () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()
      expect(canvas.math.getAllVariableUsages).toHaveBeenCalledTimes(1)
    })

    test("should return early and not open modal on fetch error", async () => {
      canvas.math.getAllVariableUsages = jest.fn().mockRejectedValue(new Error("network error"))
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await expect(component.show()).resolves.toBeUndefined()
      // no modal backdrop in DOM
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).toBeNull()
    })

    test("should open modal when usages are fetched", async () => {
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([makeUsage()])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).not.toBeNull()
    })

    test("should open modal even with empty usages", async () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()
      const backdrop = document.querySelector(".ms-modal-backdrop")
      expect(backdrop).not.toBeNull()
    })

    test("should build usagesById map keyed by usage.id", async () => {
      const usage = makeUsage({ id: "uid-99", name: "k" })
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([usage])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()
      // usagesById is private — verify indirectly via applyChanges
      const input = document.querySelector("input[type='number']") as HTMLInputElement
      if (input) {
        input.value = "100"
      }
      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn?.click()
      await new Promise((r) => setTimeout(r, 20))
      expect(canvas.math.setVariableValue).toHaveBeenCalledWith("block-1", "k", 100)
    })
  })

  describe("close()", () => {
    test("should destroy modal and reset state", async () => {
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([makeUsage()])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      expect(document.querySelector(".ms-modal-backdrop")).not.toBeNull()
      component.close()
      expect(document.querySelector(".ms-modal-backdrop")).toBeNull()
    })

    test("should be safe to call before show()", () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      expect(() => component.close()).not.toThrow()
    })
  })

  describe("applyChanges()", () => {
    test("should call setVariableValue for changed editable usage", async () => {
      const usage = makeUsage({ id: "u1", name: "x", value: 1, isEditable: true, targetBlockId: "block-1" })
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([usage])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      const input = document.querySelector("input[type='number']") as HTMLInputElement
      input.value = "99"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.math.setVariableValue).toHaveBeenCalledWith("block-1", "x", 99)
    })

    test("should skip non-editable usages", async () => {
      const usage = makeUsage({ id: "u1", name: "x", value: 1, isEditable: false })
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([usage])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      const input = document.querySelector("input[type='number']") as HTMLInputElement
      input.value = "99"
      input.disabled = false // override for test

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.math.setVariableValue).not.toHaveBeenCalled()
    })

    test("should skip unchanged values", async () => {
      const usage = makeUsage({ id: "u1", name: "x", value: 42, isEditable: true })
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([usage])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      // input already has value=42; do not change it
      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.math.setVariableValue).not.toHaveBeenCalled()
    })

    test("should add new global variable via setVariableValue('', name, value)", async () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      // click "+ Add"
      const addBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "+ Add"
      ) as HTMLButtonElement
      addBtn.click()

      const inputs = document.querySelectorAll("input") as NodeListOf<HTMLInputElement>
      const nameInput = inputs[inputs.length - 2]
      const valueInput = inputs[inputs.length - 1]
      nameInput.value = "NewVar"
      valueInput.value = "7"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.math.setVariableValue).toHaveBeenCalledWith("", "NewVar", 7)
    })

    test("should skip new row with empty name", async () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      const addBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "+ Add"
      ) as HTMLButtonElement
      addBtn.click()

      // leave name empty, set value
      const inputs = document.querySelectorAll("input") as NodeListOf<HTMLInputElement>
      const valueInput = inputs[inputs.length - 1]
      valueInput.value = "7"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.math.setVariableValue).not.toHaveBeenCalled()
    })

    test("should call menu.context.update() after applying changes", async () => {
      const usage = makeUsage({ id: "u1", name: "x", value: 1, isEditable: true })
      canvas.math.getAllVariableUsages = jest.fn().mockResolvedValue([usage])
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      const input = document.querySelector("input[type='number']") as HTMLInputElement
      input.value = "55"

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      expect(canvas.menu.context.update).toHaveBeenCalled()
    })

    test("should remove new row when its delete button is clicked", async () => {
      const component = new IIMathVariableCanvas(asCanvas(canvas))
      await component.show()

      const addBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "+ Add"
      ) as HTMLButtonElement
      addBtn.click()

      const deleteBtns = Array.from(document.querySelectorAll("button")).filter((b) => b.title === "Remove row")
      expect(deleteBtns.length).toBe(1)
      deleteBtns[0].click()

      const applyBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent === "Apply"
      ) as HTMLButtonElement
      applyBtn.click()
      await new Promise((r) => setTimeout(r, 20))

      // new row was removed, nothing to apply
      expect(canvas.math.setVariableValue).not.toHaveBeenCalled()
    })
  })
})
