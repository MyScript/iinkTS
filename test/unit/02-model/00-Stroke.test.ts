import { TStroke } from '../../../src/@types/model/Stroke'
import { TPenStyle } from '../../../src/@types/style/PenStyle'
import { Stroke } from '../../../src/model/Stroke'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'

describe('Stroke.ts', () =>
{
  test('should create with default pointerType', () =>
  {
    const stroke: TStroke = new Stroke(DefaultPenStyle, 12)
    expect(stroke).toBeDefined()
    expect(stroke['-myscript-pen-fill-color']).toBe(DefaultPenStyle['-myscript-pen-fill-color'])
    expect(stroke['-myscript-pen-fill-style']).toBe(DefaultPenStyle['-myscript-pen-fill-style'])
    expect(stroke['-myscript-pen-width']).toBe(DefaultPenStyle['-myscript-pen-width'])
    expect(stroke.color).toBe(DefaultPenStyle.color)
    expect(stroke.width).toBe(DefaultPenStyle.width)
    expect(stroke.elementType).toBeUndefined()
    expect(stroke.p).toHaveLength(0)
    expect(stroke.pointerId).toBe(12)
    expect(stroke.pointerType).toBe('pen')
    expect(stroke.t).toHaveLength(0)
    expect(stroke.type).toBe('stroke')
    expect(stroke.x).toHaveLength(0)
    expect(stroke.y).toHaveLength(0)
  })

  test('should create with pointerType mouse', () =>
  {
    const stroke: TStroke = new Stroke(DefaultPenStyle, 12, 'mouse')
    expect(stroke.pointerType).toBe('mouse')
  })

  test('should create with custom PenStyle', () =>
  {
    const penStyle: TPenStyle = {
      "-myscript-pen-fill-color": 'red',
      "-myscript-pen-fill-style": "purple",
      "-myscript-pen-width": 12,
      color: 'green',
      width: 42
    }

    const stroke: TStroke = new Stroke(penStyle, 12)
    expect(stroke).toBeDefined()
    expect(stroke['-myscript-pen-fill-color']).toBe(penStyle['-myscript-pen-fill-color'])
    expect(stroke['-myscript-pen-fill-style']).toBe(penStyle['-myscript-pen-fill-style'])
    expect(stroke['-myscript-pen-width']).toBe(penStyle['-myscript-pen-width'])
    expect(stroke.color).toBe(penStyle.color)
    expect(stroke.width).toBe(penStyle.width)
  })
})
