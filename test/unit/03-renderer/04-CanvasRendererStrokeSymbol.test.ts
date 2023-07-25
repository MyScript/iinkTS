import { drawStroke } from '../../../src/renderer/canvas/CanvasRendererStrokeSymbol'
import { CanvasQuadraticStroker } from '../../../src/renderer/canvas/CanvasQuadraticStroker'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { TStroke } from '../../../src/@types/model/Stroke'

describe('CanvasRendererStrokeSymbol.ts', () =>
{
  const canvas: HTMLCanvasElement = document.createElement('canvas')
  const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D

  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()
  const stroker = new CanvasQuadraticStroker()
  stroker.drawStroke = jest.fn()


  test('should drawStroke', () =>
  {
    //@ts-ignore
    const stroke: TStroke = {
      id: "test-id",
      type: 'pen',
      pointerType: 'pen',
      pointerId: 0,
      '-myscript-pen-fill-color': DefaultPenStyle['-myscript-pen-fill-color'],
      '-myscript-pen-fill-style': DefaultPenStyle['-myscript-pen-fill-color'],
      '-myscript-pen-width': DefaultPenStyle['-myscript-pen-width'],
      color: DefaultPenStyle.color,
      width: DefaultPenStyle.width,
      "pointers": [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ]
    }
    drawStroke(canvasContext, stroke, stroker)
    expect(stroker.drawStroke).toBeCalledTimes(1)
    expect(stroker.drawStroke).toBeCalledWith(canvasContext, stroke)
  })

  test('should not drawStroke if eraser', () =>
  {
    //@ts-ignore
    const stroke: TStroke = {
      id: "test-id",
      type: 'pen',
      pointerType: 'eraser',
      pointerId: 0,
      '-myscript-pen-fill-color': DefaultPenStyle['-myscript-pen-fill-color'],
      '-myscript-pen-fill-style': DefaultPenStyle['-myscript-pen-fill-color'],
      '-myscript-pen-width': DefaultPenStyle['-myscript-pen-width'],
      color: DefaultPenStyle.color,
      width: DefaultPenStyle.width,
      "pointers": [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ]
    }
    drawStroke(canvasContext, stroke, stroker)
    expect(stroker.drawStroke).toBeCalledTimes(0)
  })


})
