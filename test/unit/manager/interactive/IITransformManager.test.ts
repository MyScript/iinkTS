import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import { IITransformManager, IITranslateManager, IIResizeManager, IIRotationManager } from "@/iink"

describe("IITransformManager.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager).toBeDefined()
  })

  test("should have translate sub-manager", () => {
    const editor = createCanvasMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.translate).toBeInstanceOf(IITranslateManager)
  })

  test("should have resize sub-manager", () => {
    const editor = createCanvasMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.resize).toBeInstanceOf(IIResizeManager)
  })

  test("should have rotation sub-manager", () => {
    const editor = createCanvasMock()
    const manager = new IITransformManager(asEditor(editor))
    expect(manager.rotation).toBeInstanceOf(IIRotationManager)
  })
})
