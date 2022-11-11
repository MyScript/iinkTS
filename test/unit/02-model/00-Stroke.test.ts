import { TStroke } from '../../../src/@types/model/Stroke'
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

})
