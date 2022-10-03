import { IModel } from '../../../src/@types/model/Model'
import { TPoint } from '../../../src/@types/renderer/Point'
import { TPenStyle } from '../../../src/@types/style/PenStyle'
import { Model } from '../../../src/model/Model'
import { Stroke } from '../../../src/model/Stroke'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'

describe('Model.ts', () =>
{

  test('should create', () =>
  {
    const model: IModel = new Model()
    expect(model).toBeDefined()
  })

  describe('addPoint', () =>
  {
    const model: IModel = new Model()
    test('should add point to x, y, t & t array', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      const point: TPoint = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      model.addPoint(stroke, point)
      expect(stroke.x[0]).toBe(point.x)
      expect(stroke.y[0]).toBe(point.y)
      expect(stroke.p[0]).toBe(point.p)
      expect(stroke.t[0]).toBe(point.t)
    })

    test('should not add point if x is too close', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      const point: TPoint = {
        t: 10,
        p: 10,
        x: 1,
        y: 10
      }
      model.addPoint(stroke, point)
      model.addPoint(stroke, point)
      expect(stroke.x).toHaveLength(1)
      expect(stroke.y).toHaveLength(1)
      expect(stroke.p).toHaveLength(1)
      expect(stroke.t).toHaveLength(1)
    })

    test('should not add point if y is too close', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      const point: TPoint = {
        t: 10,
        p: 10,
        x: 10,
        y: 1
      }
      model.addPoint(stroke, point)
      model.addPoint(stroke, point)
      expect(stroke.x).toHaveLength(1)
      expect(stroke.y).toHaveLength(1)
      expect(stroke.p).toHaveLength(1)
      expect(stroke.t).toHaveLength(1)
    })
  })

  describe('rawStrokes', () =>
  {
    test('should addStroke', () =>
    {
      const model: IModel = new Model()
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStroke(stroke)
      expect(model.rawStrokes).toHaveLength(1)
      expect(model.rawStrokes[0]).toStrictEqual(stroke)
    })

    test('should extractPendingStrokes', () =>
    {
      const model: IModel = new Model()
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStroke(stroke)
      expect(model.rawStrokes).toHaveLength(1)
      const extractStroke = model.extractPendingStrokes()
      expect(extractStroke).toHaveLength(1)
      expect(extractStroke[0]).toStrictEqual(stroke)
      expect(model.rawStrokes).toHaveLength(1)
    })
  })

  describe('strokeGroups', () =>
  {
    const model: IModel = new Model()
    test('should initialise strokeGroupe', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStrokeToGroup(stroke, DefaultPenStyle)
      expect(model.strokeGroups).toHaveLength(1)
      expect(model.strokeGroups[0].penStyle).toStrictEqual(DefaultPenStyle)
      expect(model.strokeGroups[0].strokes).toHaveLength(1)
      expect(model.strokeGroups[0].strokes[0]).toStrictEqual(stroke)
    })

    test('should add strokeGroupe to current', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      model.addStrokeToGroup(stroke, DefaultPenStyle)
      expect(model.strokeGroups).toHaveLength(1)
      expect(model.strokeGroups[0].penStyle).toStrictEqual(DefaultPenStyle)
      expect(model.strokeGroups[0].strokes).toHaveLength(2)
      expect(model.strokeGroups[0].strokes[1]).toStrictEqual(stroke)
    })

    test('should add to new strokeGroupe to current', () =>
    {
      const stroke = new Stroke(DefaultPenStyle, 1)
      const penStyle: TPenStyle = {
        ...DefaultPenStyle,
        color: 'red'
      }
      model.addStrokeToGroup(stroke, penStyle)
      expect(model.strokeGroups).toHaveLength(2)
      expect(model.strokeGroups[1].penStyle).toStrictEqual(penStyle)
      expect(model.strokeGroups[1].strokes).toHaveLength(1)
      expect(model.strokeGroups[1].strokes[0]).toStrictEqual(stroke)
    })

  })

  describe('currentStroke', () =>
  {
    const model: IModel = new Model()
    test('should initCurrentStroke', () =>
    {
      expect(model.currentStroke).toBeUndefined()
      const point: TPoint = {
        t: 1,
        p: 0.5,
        x: 1,
        y: 1
      }
      expect(model.creationTime).toStrictEqual(model.modificationDate)
      model.initCurrentStroke(point, 42, 'mouse', DefaultPenStyle)
      expect(model.creationTime).toBeLessThan(model.modificationDate)
      expect(model.currentStroke).toBeDefined()
      expect(model.currentStroke?.['-myscript-pen-fill-color']).toBe(DefaultPenStyle['-myscript-pen-fill-color'])
      expect(model.currentStroke?.['-myscript-pen-fill-style']).toBe(DefaultPenStyle['-myscript-pen-fill-style'])
      expect(model.currentStroke?.['-myscript-pen-width']).toBe(DefaultPenStyle['-myscript-pen-width'])
      expect(model.currentStroke?.color).toBe(DefaultPenStyle.color)
      expect(model.currentStroke?.width).toBe(DefaultPenStyle.width)
      expect(model.currentStroke?.x).toHaveLength(1)
      expect(model.currentStroke?.x[0]).toBe(point.x)
      expect(model.currentStroke?.y).toHaveLength(1)
      expect(model.currentStroke?.y[0]).toBe(point.y)
      expect(model.currentStroke?.t).toHaveLength(1)
      expect(model.currentStroke?.t[0]).toBe(point.t)
      expect(model.currentStroke?.p).toHaveLength(1)
      expect(model.currentStroke?.p[0]).toBe(point.p)
    })

    test('should appendToCurrentStroke', () =>
    {
      expect(model.currentStroke).toBeDefined()
      const point: TPoint = {
        t: 15,
        p: 15,
        x: 15,
        y: 15
      }
      model.appendToCurrentStroke(point)
      expect(model.currentStroke?.['-myscript-pen-fill-color']).toBe(DefaultPenStyle['-myscript-pen-fill-color'])
      expect(model.currentStroke?.['-myscript-pen-fill-style']).toBe(DefaultPenStyle['-myscript-pen-fill-style'])
      expect(model.currentStroke?.['-myscript-pen-width']).toBe(DefaultPenStyle['-myscript-pen-width'])
      expect(model.currentStroke?.color).toBe(DefaultPenStyle.color)
      expect(model.currentStroke?.width).toBe(DefaultPenStyle.width)
      expect(model.currentStroke?.x).toHaveLength(2)
      expect(model.currentStroke?.x[1]).toBe(point.x)
      expect(model.currentStroke?.y).toHaveLength(2)
      expect(model.currentStroke?.y[1]).toBe(point.y)
      expect(model.currentStroke?.t).toHaveLength(2)
      expect(model.currentStroke?.t[1]).toBe(point.t)
      expect(model.currentStroke?.p).toHaveLength(2)
      expect(model.currentStroke?.p[1]).toBe(0.56)
    })

    test('should endCurrentStroke', () =>
    {
      model.addPoint = jest.fn()
      model.addStroke = jest.fn()
      model.addStrokeToGroup = jest.fn()
      expect(model.currentStroke).toBeDefined()
      const currentStroke = { ...model.currentStroke }
      const point: TPoint = {
        t: 25,
        p: 25,
        x: 25,
        y: 25
      }
      model.endCurrentStroke(point, DefaultPenStyle)
      expect(model.currentStroke).toBeUndefined()
      expect(model.addPoint).toBeCalledTimes(1)
      expect(model.addPoint).toBeCalledWith(currentStroke, point)
      expect(model.addStroke).toBeCalledTimes(1)
      expect(model.addStroke).toBeCalledWith(currentStroke)
      expect(model.addStrokeToGroup).toBeCalledTimes(1)
      expect(model.addStrokeToGroup).toBeCalledWith(
        currentStroke,
        DefaultPenStyle
      )
    })
  })

  describe('position', () =>
  {
    const model: IModel = new Model()
    test('should initialize position', () =>
    {
      expect(model.positions.lastReceivedPosition).toBe(-1)
      expect(model.positions.lastRenderedPosition).toBe(-1)
      expect(model.positions.lastSentPosition).toBe(-1)
    })
    test('should updatePositionSent', () =>
    {
      model.updatePositionSent(5)
      expect(model.positions.lastSentPosition).toBe(5)
    })
    test('should updatePositionReceived', () =>
    {
      model.updatePositionReceived()
      expect(model.positions.lastReceivedPosition).toBe(model.positions.lastSentPosition)
    })
    test('should updatePositionRendered', () =>
    {
      model.updatePositionRendered(27)
      expect(model.positions.lastRenderedPosition).toBe(27)
    })
    test('should resetPositionRenderer', () =>
    {
      model.resetPositionRenderer()
      expect(model.positions.lastRenderedPosition).toBe(-1)
    })
    test('should resetPositions', () =>
    {
      model.resetPositions()
      expect(model.positions.lastReceivedPosition).toBe(-1)
      expect(model.positions.lastSentPosition).toBe(-1)
    })
  })

  describe('clone', () =>
  {
    const model: IModel = new Model(27, 5)
    const stroke = new Stroke(DefaultPenStyle, 1)
    model.addStroke(stroke)
    const point: TPoint = {
      t: 1,
      p: 0.5,
      x: 1,
      y: 1
    }
    model.initCurrentStroke(point, 666, 'pen', DefaultPenStyle)
    model.exports = { "text/plain": "M" }
    test('should getClone', () =>
    {
      const clone = model.getClone()
      expect(clone != model).toBeTruthy()
      expect(clone.currentStroke).toEqual(model.currentStroke)
      expect(clone.currentStroke).not.toBe(model.currentStroke)

      expect(clone.defaultSymbols).toEqual(model.defaultSymbols)
      expect(clone.defaultSymbols).not.toBe(model.defaultSymbols)

      expect(clone.exports).toEqual(model.exports)
      expect(clone.exports).not.toBe(model.exports)

      expect(clone.height).toEqual(model.height)

      expect(clone.idle).toEqual(model.idle)

      expect(clone.positions).toEqual(model.positions)
      expect(clone.positions).not.toBe(model.positions)

      expect(clone.rawResults).toEqual(model.rawResults)
      expect(clone.rawResults).not.toBe(model.rawResults)

      expect(clone.rawStrokes).toEqual(model.rawStrokes)
      expect(clone.rawStrokes).not.toBe(model.rawStrokes)

      expect(clone.strokeGroups).toEqual(model.strokeGroups)
      expect(clone.strokeGroups).not.toBe(model.strokeGroups)

      expect(clone.width).toEqual(model.width)
    })
  })

  describe('clear', () =>
  {
    test('should clear model', () =>
    {
      const model: IModel = new Model()
      const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPoint = { t: 10, p: 10, x: 10, y: 10 }
      const p3: TPoint = { t: 10, p: 10, x: 10, y: 10 }

      model.initCurrentStroke(p1, 42, 'mouse', DefaultPenStyle)
      model.endCurrentStroke(p2, DefaultPenStyle)
      model.initCurrentStroke(p3, 51, 'mouse', DefaultPenStyle)
      expect(model.currentStroke).toBeDefined()
      expect(model.rawStrokes).toHaveLength(1)
      expect(model.strokeGroups).toHaveLength(1)

      model.clear()
      expect(model.currentStroke).toBeUndefined()
      expect(model.rawStrokes).toHaveLength(0)
      expect(model.strokeGroups).toHaveLength(0)
    })
  })

})
