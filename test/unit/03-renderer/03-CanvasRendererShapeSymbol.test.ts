import { TLineSymbol, TShapeSymbol } from '../../../src/@types/renderer/Symbol'
import { drawLine, drawShapeSymbol } from '../../../src/renderer/canvas/CanvasRendererShapeSymbol'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'

describe('CanvasRendererShapeSymbol.ts', () =>
{
  const canvas: HTMLCanvasElement = document.createElement('canvas')
  const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D

  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()
  const p1 = { x: 1, y: 2 }
  const p2 = { x: 3, y: 4 }


  test('should drawLine', () =>
  {
    drawLine(canvasContext, p1, p2)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

    expect(canvasContext.lineTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
  })

  test('should drawShapeSymbol with type line', () =>
  {
    const lineSymbol: TLineSymbol = {
      elementType: 'line',
      type: 'pen',
      "-myscript-pen-fill-color": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-fill-style": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-width": DefaultPenStyle['-myscript-pen-width'],
      color: DefaultPenStyle.color,
      width: DefaultPenStyle.width,
      data: { p1, p2 }
    }
    drawShapeSymbol(canvasContext, lineSymbol)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

    expect(canvasContext.lineTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
  })

  test('should drawShapeSymbol with type shape', () =>
  {
    const lineSymbol: TLineSymbol = {
      elementType: 'line',
      type: 'pen',
      "-myscript-pen-fill-color": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-fill-style": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-width": DefaultPenStyle['-myscript-pen-width'],
      color: DefaultPenStyle.color,
      width: DefaultPenStyle.width,
      data: { p1, p2 }
    }
    const shapeSymbol: TShapeSymbol = {
      elementType: 'shape',
      type: 'pen',
      "-myscript-pen-fill-color": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-fill-style": DefaultPenStyle['-myscript-pen-fill-color'],
      "-myscript-pen-width": DefaultPenStyle['-myscript-pen-width'],
      color: DefaultPenStyle.color,
      width: DefaultPenStyle.width,
      selectedCandidateIndex: 0,
      candidates: [lineSymbol]
    }
    drawShapeSymbol(canvasContext, shapeSymbol)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

    expect(canvasContext.lineTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
  })
})
