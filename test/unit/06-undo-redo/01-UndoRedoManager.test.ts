import { Model } from '../../../src/model/Model'
import { UndoRedoManager } from '../../../src/undo-redo/UndoRedoManager'
import { UndoRedoContext } from '../../../src/undo-redo/UndoRedoContext'
import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { IModel } from '../../../src/@types/model/Model'
import { TPoint } from '../../../src/@types/renderer/Point'
import { TUndoRedoConfiguration } from '../../../src/@types/configuration/UndoRedoConfiguration'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'


describe('UndoRedoManager.ts', () =>
{
  const width = 100, height = 100
  test('should instanciate UndoRedoManager', () =>
  {
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], new Model(width, height))
    expect(manager).toBeDefined()
  })

  test('should initialize UndoRedoContext', () =>
  {
    const model = new Model(width, height)
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], model)
    const context = new UndoRedoContext(model)
    expect(manager.context).toStrictEqual(context)
  })

  describe('addModelToStack', () =>
  {
    const configuration: TUndoRedoConfiguration = { maxStackSize: 5 }
    const model: IModel = new Model(27, 5)
    const manager = new UndoRedoManager(configuration, model)

    test('should add model to stack', () =>
    {
      const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)
      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.context.stack).toHaveLength(2)
      expect(manager.context.stack[manager.context.stackIndex]).toEqual(model)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(model)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
    })

    test('should splice end of stack if stackIndex no last', () =>
    {
      const NB_STROKE = 4
      for (let i = 0; i < NB_STROKE; i++) {
        const p1: TPoint = { t: i * 5, p: 1, x: i * 10, y: 10 }
        model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

        const p2: TPoint = { t: i * 10, p: 1, x: i * 10, y: 10 }
        model.endCurrentStroke(p2, DefaultPenStyle)

        manager.addModelToStack(model)
      }
      expect(manager.context.stackIndex).toStrictEqual(NB_STROKE)
      expect(manager.context.stack).toHaveLength(NB_STROKE + 1)

      manager.context.stackIndex = 0

      const p1: TPoint = { t: 27, p: 0.5, x: 1989, y: 2022 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 75, p: 1, x: 200, y: 10 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)

      expect(manager.context.stackIndex).toEqual(1)
      expect(manager.context.stack).toHaveLength(2)

      expect(manager.context.stack[manager.context.stackIndex]).toEqual(model)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(model)
    })

    test('should shift the first element of the stack when maxStackSize is exceeded', () =>
    {
      const NB_STROKE = 10
      for (let i = 0; i < NB_STROKE; i++) {
        const p1: TPoint = { t: i * 42, p: 0.5, x: i / 2, y: i * 20 }
        model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

        const p2: TPoint = { t: i * 10, p: 1, x: i * 10, y: 10 }
        model.endCurrentStroke(p2, DefaultPenStyle)

        manager.addModelToStack(model)
      }

      manager.addModelToStack(model)
      expect(manager.context.stackIndex + 1).toStrictEqual(configuration.maxStackSize)

      expect(manager.context.stack).toHaveLength(configuration.maxStackSize)
      expect(manager.context.stack[manager.context.stackIndex]).toEqual(model)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(model)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
    })
  })

  describe('undo', () =>
  {
    const model: IModel = new Model(27, 5)
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], model)
    test('should get the previous model', () =>
    {
      const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)
      const previousModel = manager.undo()
      expect(manager.context.stackIndex).toStrictEqual(0)

      expect(manager.context.stack).toHaveLength(2)
      expect(manager.context.stack[manager.context.stackIndex]).toEqual(previousModel)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(previousModel)

      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(true)
    })
  })

  describe('redo', () =>
  {
    const model: IModel = new Model(27, 5)
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], model)
    test('should get the next model', () =>
    {
      const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)
      manager.undo()
      const lastModel = manager.redo()
      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.context.stack).toHaveLength(2)
      expect(manager.context.stack[manager.context.stackIndex]).toEqual(lastModel)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(lastModel)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
    })
  })

  describe('updateModelInStack', () =>
  {
    const model: IModel = new Model(27, 5)
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], model)
    test('should last model in stack', () =>
    {
      const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)

      model.exports = { 'text/plain': '-' }
      manager.updateModelInStack(model)

      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.context.stack).toHaveLength(2)
      expect(manager.context.stack[manager.context.stackIndex]).toEqual(model)
      expect(manager.context.stack[manager.context.stackIndex]).not.toBe(model)
    })

    test('should previous model in stack', () =>
    {
      const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
      model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

      const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
      model.endCurrentStroke(p2, DefaultPenStyle)

      manager.addModelToStack(model)
      const firstModel = model.getClone()
      firstModel.exports = { 'text/plain': '-' }

      const p3: TPoint = { t: 100, p: 0.5, x: 1, y: 10 }
      model.initCurrentStroke(p3, 666, 'pen', DefaultPenStyle)

      const p4: TPoint = { t: 150, p: 0.5, x: 1, y: 10 }
      model.endCurrentStroke(p4, DefaultPenStyle)
      manager.addModelToStack(model)

      manager.updateModelInStack(firstModel)

      expect(manager.context.stack[2]).toEqual(firstModel)
      expect(manager.context.stack[2]).not.toBe(firstModel)
    })
  })

  test('should reset context', () =>
  {
    const model: IModel = new Model(27, 5)
    const manager = new UndoRedoManager(DefaultConfiguration['undo-redo'], model)

    const p1: TPoint = { t: 1, p: 0.5, x: 1, y: 1 }
    model.initCurrentStroke(p1, 666, 'pen', DefaultPenStyle)

    const p2: TPoint = { t: 15, p: 0.5, x: 10, y: 1 }
    model.endCurrentStroke(p2, DefaultPenStyle)

    manager.addModelToStack(model)
    const newModel = new Model(width, height)
    manager.reset(newModel)

    expect(manager.context.stackIndex).toStrictEqual(0)

    expect(manager.context.stack).toHaveLength(1)
    expect(manager.context.stack[manager.context.stackIndex]).toEqual(newModel)
    expect(manager.context.stack[manager.context.stackIndex]).not.toBe(newModel)

    expect(manager.context.canUndo).toStrictEqual(false)
    expect(manager.context.canRedo).toStrictEqual(false)
  })

})
