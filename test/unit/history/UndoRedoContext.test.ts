import { getInitialUndoRedoContext } from "../../../src/iink"

describe("UndoRedoContext.ts", () =>
{

  test("should be initialize", () =>
  {
    const context = getInitialUndoRedoContext()
    expect(context.stackIndex).toStrictEqual(0)
    expect(context.possibleUndoCount).toStrictEqual(0)
    expect(context.canUndo).toStrictEqual(false)
    expect(context.canUndo).toStrictEqual(false)
    expect(context.empty).toStrictEqual(true)
  })
})
