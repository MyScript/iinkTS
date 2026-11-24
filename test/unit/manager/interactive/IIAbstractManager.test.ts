import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIAbstractManager, LoggerCategory } from "@/iink"

class TestManager extends IIAbstractManager {
  protected managerName = "TestManager"
}

describe("IIAbstractManager.ts", () => {
  let canvas: ReturnType<typeof createCanvasMock>

  beforeEach(() => {
    canvas = createCanvasMock()
  })

  test("should not throw when onInit/onDestroy are not overridden", () => {
    const manager = new TestManager(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(() => manager.destroy()).not.toThrow()
  })

  test("should call the onInit hook during construction", () => {
    const calls: string[] = []
    class TestManagerWithInit extends IIAbstractManager {
      protected managerName = "TestManagerWithInit"
      protected onInit(): void {
        calls.push("init")
      }
    }

    new TestManagerWithInit(asCanvas(canvas), LoggerCategory.MANAGER)

    expect(calls).toEqual(["init"])
  })

  test("should call the onDestroy hook from destroy()", () => {
    const calls: string[] = []
    class TestManagerWithDestroy extends IIAbstractManager {
      protected managerName = "TestManagerWithDestroy"
      protected onDestroy(): void {
        calls.push("destroy")
      }
    }

    const manager = new TestManagerWithDestroy(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(calls).toEqual([])
    manager.destroy()
    expect(calls).toEqual(["destroy"])
  })

  test("should expose model as a convenience getter for canvas.model", () => {
    const manager = new TestManager(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(manager.model).toBe(canvas.model)
  })

  test("should expose renderer as a convenience getter for canvas.renderer", () => {
    const manager = new TestManager(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(manager.renderer).toBe(canvas.renderer)
  })

  test("should expose client as a convenience getter for canvas.client", () => {
    const manager = new TestManager(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(manager.client).toBe(canvas.client)
  })

  test("should expose configuration as a convenience getter for canvas.configuration", () => {
    const manager = new TestManager(asCanvas(canvas), LoggerCategory.MANAGER)
    expect(manager.configuration).toBe(canvas.configuration)
  })
})
