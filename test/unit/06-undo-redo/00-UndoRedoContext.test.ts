import { undoredo, model } from "../../../src/iink"

const { UndoRedoContext } = undoredo
const { Model } = model

describe("UndoRedoContext.ts", () =>
{
  const width = 100, height = 100
  test("should instanciate UndoRedoContext", () =>
  {
    const context = new UndoRedoContext(new Model(width, height))
    expect(context).toBeDefined()
  })

  test("should be initialize", () =>
  {
    const model = new Model(width, height)
    const context = new UndoRedoContext(model)

    expect(context.stackIndex).toStrictEqual(0)

    expect(context.stack).toHaveLength(1)
    expect(context.stack[context.stackIndex]).toEqual(model)
    expect(context.stack[context.stackIndex]).not.toBe(model)

    expect(context.canUndo).toStrictEqual(false)
    expect(context.canUndo).toStrictEqual(false)
  })
})
