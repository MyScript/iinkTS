import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIMathManager } from "@/manager/interactive/IIMathManager"
import { JIIXElementType } from "@/model"
import type { TJIIXMathElement } from "@/model"

function buildMathBlock(id: string, label: string): TJIIXMathElement {
  return { id, type: JIIXElementType.Math, label }
}

describe("IIMathManager.ts", () => {
  describe("tryAutoCompute", () => {
    test("refreshes the jiix export before reading model.mathBlocks", async () => {
      const canvas = createCanvasMock()
      canvas.model.exports = {
        "application/vnd.myscript.jiix": {
          type: "Text",
          id: "root",
          version: "3",
          elements: [buildMathBlock("dependent-1", "x^{2}=")],
        },
      }
      canvas.client.getAvailableActions = jest.fn().mockResolvedValue([])

      const manager = new IIMathManager(asCanvas(canvas))
      await manager.tryAutoCompute()

      expect(canvas.export).toHaveBeenCalledWith(["application/vnd.myscript.jiix"])
      expect(canvas.client.getAvailableActions).toHaveBeenCalledWith("dependent-1")
    })
  })
})
