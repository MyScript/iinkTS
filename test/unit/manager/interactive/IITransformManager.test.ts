import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IITransformManager, IITranslateManager, IIResizeManager, IIRotationManager } from "@/iink"

describe("IITransformManager.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const manager = new IITransformManager(asCanvas(canvas))
    expect(manager).toBeDefined()
  })

  test("should have translate sub-manager", () => {
    const canvas = createCanvasMock()
    const manager = new IITransformManager(asCanvas(canvas))
    expect(manager.translate).toBeInstanceOf(IITranslateManager)
  })

  test("should have resize sub-manager", () => {
    const canvas = createCanvasMock()
    const manager = new IITransformManager(asCanvas(canvas))
    expect(manager.resize).toBeInstanceOf(IIResizeManager)
  })

  test("should have rotation sub-manager", () => {
    const canvas = createCanvasMock()
    const manager = new IITransformManager(asCanvas(canvas))
    expect(manager.rotation).toBeInstanceOf(IIRotationManager)
  })
})
