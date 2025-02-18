import { buildOIStroke } from "../helpers"
import
{
  THistoryConfiguration,
  getInitialHistoryContext,
  IIHistoryManager,
  IIModel,
  DefaultHistoryConfiguration,
  MatrixTransform,
} from "../../../src/iink"
import { EditorEventMock } from "../__mocks__/EditorEventMock"

describe("IIHistoryManager.ts", () =>
{
  const event = new EditorEventMock(document.createElement("div"))
  test("should instanciate IIHistoryManager", () =>
  {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    expect(manager).toBeDefined()
  })

  describe("init", () =>
  {
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    test("should initialize HistoryContext", () =>
    {
      const context = getInitialHistoryContext()
      expect(manager.context).toStrictEqual(context)
    })
    test("should init stack without actions", () =>
    {
      const model1 = new IIModel(27, 5)
      manager.init(model1)

      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)
      expect(manager.stack[manager.context.stackIndex].model).toEqual(model1)
      expect(manager.stack[manager.context.stackIndex].model).not.toBe(model1)
      expect(manager.stack[manager.context.stackIndex].changes).toEqual({})
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("push", () =>
  {
    const configuration: THistoryConfiguration = { maxStackSize: 5 }
    const manager = new IIHistoryManager(configuration, event)

    const model1 = new IIModel(27, 5)
    manager.init(model1)

    const stroke2 = buildOIStroke()
    const model2 = new IIModel(18, 89)
    model2.addSymbol(stroke2)

    const model3 = new IIModel(18, 89)

    test("should not push item to stack without actions and not emitChanged", () =>
    {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)

      manager.push(model1, {})

      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(true)
      expect(manager.stack).toHaveLength(1)
      expect(manager.event.emitChanged).toHaveBeenCalledTimes(0)
    })

    test("should add model to stack with action added and emitChanged", () =>
    {
      manager.push(model2, { added: [stroke2] })

      expect(manager.context.stackIndex).toStrictEqual(1)
      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.context.empty).toStrictEqual(false)
      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex].model).toEqual(model2)
      expect(manager.stack[manager.context.stackIndex].model).not.toBe(model2)
      expect(manager.stack[manager.context.stackIndex].changes).toEqual({ added: [stroke2] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should splice end of stack if stackIndex no last and emitChanged", () =>
    {
      const NB_STROKE = 5
      for (let i = 0; i < NB_STROKE; i++) {
        const stroke = buildOIStroke()
        model3.addSymbol(stroke)
        manager.push(model3, { added: [stroke] })
      }
      expect(manager.context.stackIndex).toStrictEqual(configuration.maxStackSize - 1)
      expect(manager.stack).toHaveLength(configuration.maxStackSize)

      manager.context.stackIndex = 0

      const stroke = buildOIStroke()
      model3.addSymbol(stroke)

      manager.push(model3, { added: [stroke] })

      expect(manager.context.stackIndex).toEqual(1)
      expect(manager.stack).toHaveLength(2)

      expect(manager.stack[manager.context.stackIndex].model).toEqual(model3)
      expect(manager.stack[manager.context.stackIndex].model).not.toBe(model3)
      expect(manager.stack[manager.context.stackIndex].changes).toEqual({ added: [stroke] })
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })

    test("should shift the first element of the stack when maxStackSize is exceeded and emitChanged", () =>
    {
      const NB_STROKE = 10
      for (let i = 0; i < NB_STROKE; i++) {
        const stroke = buildOIStroke()
        model3.addSymbol(stroke)
        manager.push(model3, { added: [stroke] })
      }

      manager.push(model3, {})
      expect(manager.context.stackIndex + 1).toStrictEqual(configuration.maxStackSize)

      expect(manager.stack).toHaveLength(configuration.maxStackSize)
      expect(manager.stack[manager.context.stackIndex].model).toEqual(model3)
      expect(manager.stack[manager.context.stackIndex].model).not.toBe(model3)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
      expect(manager.event.emitChanged).toHaveBeenNthCalledWith(1, manager.context)
    })
  })

  describe("undo", () =>
  {
    const model = new IIModel(27, 5)
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)
    manager.init(model)

    test("should define canUndo to false and canRedo to false", () =>
    {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(false)
    })

    test("should get the previous model", () =>
    {
      const model2 = new IIModel(27, 5)
      const stroke = buildOIStroke()
      model2.addSymbol(stroke)
      manager.push(model2, { added: [stroke] })
      const previousStackItem = manager.undo()
      expect(previousStackItem.model).toEqual(model)
      expect(previousStackItem.model).not.toBe(model)
    })

    test("should define canUndo to false and canRedo to true", () =>
    {
      expect(manager.context.stackIndex).toStrictEqual(0)
      expect(manager.context.canUndo).toStrictEqual(false)
      expect(manager.context.canRedo).toStrictEqual(true)
    })

    test("should invert added action", () =>
    {
      const model2 = new IIModel(27, 5)
      const stroke = buildOIStroke()
      manager.push(model2, { added: [stroke] })
      const previousStackItem = manager.undo()
      expect(previousStackItem.changes).toEqual({ erased: [stroke] })
    })

    test("should invert erased action", () =>
    {
      const model2 = new IIModel(27, 5)
      const stroke = buildOIStroke()
      manager.push(model2, { erased: [stroke] })
      const previousStackItem = manager.undo()
      expect(previousStackItem.changes).toEqual({ added: [stroke] })
    })

    test("should invert replaced action", () =>
    {
      const model2 = new IIModel(27, 5)
      const oldStroke = buildOIStroke()
      const newStroke = buildOIStroke()
      manager.push(model2, { replaced: { newSymbols: [newStroke], oldSymbols: [oldStroke] } })
      const previousStackItem = manager.undo()
      expect(previousStackItem.changes).toEqual({ replaced: { newSymbols: [oldStroke], oldSymbols: [newStroke] } })
    })

    test("should invert translate action", () =>
    {
      const model2 = new IIModel(27, 5)
      const stroke = buildOIStroke()
      manager.push(model2, { translate: [{ symbols: [stroke], tx: 42, ty: 24 }] })
      const previousStackItem = manager.undo()
      expect(previousStackItem.changes).toEqual({ translate: [{ symbols: [stroke], tx: -42, ty: -24 }] })
    })

    test("should invert matrix action", () =>
    {
      const model2 = new IIModel(27, 5)
      const stroke = buildOIStroke()
      const matrix = MatrixTransform.identity().rotate(Math.PI / 2).translate(2, 5)
      manager.push(model2, { matrix: { symbols: [stroke], matrix } })
      const previousStackItem = manager.undo()
      expect(previousStackItem.changes).toEqual({ matrix: { symbols: [stroke], matrix: matrix.invert() } })
    })
  })

  describe("redo", () =>
  {
    const model = new IIModel(27, 5)
    const manager = new IIHistoryManager(DefaultHistoryConfiguration, event)

    const stroke = buildOIStroke()
    model.addSymbol(stroke)
    manager.init(model)

    test("should get the next model", () =>
    {
      const stroke = buildOIStroke()
      model.addSymbol(stroke)

      manager.push(model, { added: [stroke] })
      manager.undo()
      const lastStackItem = manager.redo()
      expect(manager.context.stackIndex).toStrictEqual(1)

      expect(manager.stack).toHaveLength(2)
      expect(manager.stack[manager.context.stackIndex].model).toEqual(lastStackItem.model)
      expect(manager.stack[manager.context.stackIndex].model).toBe(lastStackItem.model)
      expect(manager.stack[manager.context.stackIndex].changes).toEqual(lastStackItem.changes)

      expect(manager.context.canUndo).toStrictEqual(true)
      expect(manager.context.canRedo).toStrictEqual(false)
    })
  })

})
