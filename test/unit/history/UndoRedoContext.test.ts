import { getInitialHistoryContext } from "../../../src/iink"

describe("HistoryContext.ts", () =>
{

  test("should be initialize", () =>
  {
    const context = getInitialHistoryContext()
    expect(context.stackIndex).toStrictEqual(0)
    expect(context.possibleUndoCount).toStrictEqual(0)
    expect(context.canUndo).toStrictEqual(false)
    expect(context.canUndo).toStrictEqual(false)
    expect(context.empty).toStrictEqual(true)
  })
})
