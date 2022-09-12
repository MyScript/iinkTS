import { UndoRedoContext } from '../../../src/undo-redo/UndoRedoContext'
import { Model } from '../../../src/model/Model'

describe('UndoRedoContext.ts', () =>
{
  test('should instanciate UndoRedoContext', () =>
  {
    const context = new UndoRedoContext(new Model())
    expect(context).toBeDefined()
  })

  test('should be initialize', () =>
  {
    const model = new Model()
    const context = new UndoRedoContext(model)

    expect(context.stackIndex).toStrictEqual(0)

    expect(context.stack).toHaveLength(1)
    expect(context.stack[context.stackIndex]).toEqual(model)
    expect(context.stack[context.stackIndex]).not.toBe(model)

    expect(context.canUndo).toStrictEqual(false)
    expect(context.canUndo).toStrictEqual(false)
  })
})
