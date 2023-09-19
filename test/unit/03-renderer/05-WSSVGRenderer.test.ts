import { delay } from "../utils/helpers"
import
{
  TUpdatePatchAppendChild,
  TUpdatePatchInsertBefore,
  TUpdatePatchRemoveAttribut,
  TUpdatePatchRemoveChild,
  TUpdatePatchRemoveElement,
  TUpdatePatchReplaceAll,
  TUpdatePatchReplaceELement,
  TUpdatePatchSetAttribut,
  TStroke
} from "../../../src/@types"
import { DefaultRenderingConfiguration, DefaultPenStyle, Model, WSSVGRenderer } from "../../../src/iink"

describe("WSSVGRenderer.ts", () =>
{
  const stroke: TStroke = {
    type: 'pen',
    pointerType: 'pen',
    pointerId: 0,
    id: 'test',
    style: DefaultPenStyle,
    pointers: [
      { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
      { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
      { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
    ],
    length: 4
  }

  test("should instanciate", () =>
  {
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    expect(renderer).toBeDefined()
    expect(renderer.config).toStrictEqual(DefaultRenderingConfiguration)
    expect(renderer.stroker).toBeDefined()
  })

  test("should initialise context", () =>
  {
    const domElement = document.createElement("div") as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.init(domElement)

    expect(renderer.context.parent).toBe(domElement)
  })

  test("should updatesLayer when type = REPLACE_ALL on layer CAPTURE", () =>
  {
    const domElement = document.createElement("div") as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: "REPLACE_ALL",
      svg: '<svg data-layer="CAPTURE" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790"></svg>'
    }
    renderer.updatesLayer("CAPTURE", [update])

    expect(domElement.children).toHaveLength(1)
    const layerCapture = domElement.querySelector('svg[data-layer="CAPTURE"')
    expect(layerCapture).toBeDefined()
  })

  test('should updatesLayer when type = REPLACE_ALL on layer MODEL', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      "type": "REPLACE_ALL",
      svg: '<svg data-layer="MODEL" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790"></svg>'
    }
    renderer.updatesLayer('MODEL', [update])

    expect(domElement.children).toHaveLength(1)
    const layerCapture = domElement.querySelector('svg[data-layer="MODEL"')
    expect(layerCapture).toBeDefined()
    const pendingGroup = layerCapture?.querySelector('#pendingStrokes')
    expect(pendingGroup).toBeDefined()
  })

  test('should updatesLayer when type = REPLACE_ELEMENT', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790">
              <line id="CAPTURE-ps0" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateReplaceElement: TUpdatePatchReplaceELement = {
      type: 'REPLACE_ELEMENT',
      id: "CAPTURE-ps0",
      svg: '<rect id="CAPTURE-ps0" id="test" width="100" height="100" />'
    }
    renderer.updatesLayer('CAPTURE', [updateReplaceElement])

    const parendNode = domElement.querySelector('svg[data-layer="CAPTURE"]')
    expect(parendNode?.children).toHaveLength(1)

    const elementReplaced = domElement.querySelector(`#${ updateReplaceElement.id }`)
    expect(parendNode?.children.item(0)).toBe(elementReplaced)
  })

  test('should updatesLayer when type = REMOVE_ELEMENT on layer CAPTURE', async () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790">
              <g id="CAPTURE-dg7f8d807ab560">
                <line x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])
    let elementToRemove = domElement.querySelector('#CAPTURE-dg7f8d807ab560')
    expect(elementToRemove).toBeDefined()

    const updateRemove: TUpdatePatchRemoveElement = {
      type: 'REMOVE_ELEMENT',
      id: 'CAPTURE-dg7f8d807ab560'
    }
    renderer.updatesLayer('MODEL', [updateRemove])
    elementToRemove = domElement.querySelector('#CAPTURE-dg7f8d807ab560')
    expect(elementToRemove?.classList).toContain('removed-stroke')

    await delay(100)
    elementToRemove = domElement.querySelector('#CAPTURE-dg7f8d807ab560')
    expect(elementToRemove).toBeNull()
  })

  test('should updatesLayer when type = REMOVE_ELEMENT on layer MODEL', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="MODEL" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790">
              <g id="MODEL-dg7f8d807ab560">
                <line x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('MODEL', [update])
    let elementToRemove = domElement.querySelector('#MODEL-dg7f8d807ab560')
    expect(elementToRemove).toBeDefined()

    const updateRemove: TUpdatePatchRemoveElement = {
      type: 'REMOVE_ELEMENT',
      id: 'MODEL-dg7f8d807ab560'
    }
    renderer.updatesLayer('MODEL', [updateRemove])
    elementToRemove = domElement.querySelector('#MODEL-dg7f8d807ab560')
    expect(elementToRemove).toBeNull()
  })

  test('should updatesLayer when type = APPEND_CHILD with parentId', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="MODEL" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790">
              <g id="MODEL-dg7f8d807ab560">
              </g>
            </svg>`
    }
    renderer.updatesLayer('MODEL', [update])

    const updateAppendChild: TUpdatePatchAppendChild = {
      type: "APPEND_CHILD",
      parentId: "MODEL-dg7f8d807ab560",
      svg: '<line id="test" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>'
    }
    renderer.updatesLayer('MODEL', [updateAppendChild])

    const parendNode = domElement.querySelector('#MODEL-dg7f8d807ab560')
    expect(parendNode?.children).toHaveLength(1)
    const elementInserted = domElement.querySelector(`#test`)
    expect(parendNode?.children.item(0)).toBe(elementInserted)
  })

  test('should updatesLayer when type = APPEND_CHILD without parentId', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="833px" height="790px" viewBox="0 0 833 790">
              <g id="MODEL-dg7f8d807ab560">
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateAppendChild: TUpdatePatchAppendChild = {
      type: "APPEND_CHILD",
      svg: '<line id="test" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>'
    }
    renderer.updatesLayer('CAPTURE', [updateAppendChild])

    const parendNode = domElement.querySelector('svg')
    expect(parendNode?.children).toHaveLength(2)
    const elementInserted = domElement.querySelector(`#test`)
    expect(parendNode?.children.item(1)).toBe(elementInserted)
  })

  test('should updatesLayer when type = REMOVE_CHILD', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="MODEL" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="MODEL-dg7f6394110df0">
                <line x1="10" y1="35" x2="193.73" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
                <line x1="10" y1="50" x2="193.73" y2="50" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
                <line x1="10" y1="65" x2="193.73" y2="65" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('MODEL', [update])

    const updateRmoveChild: TUpdatePatchRemoveChild = {
      type: 'REMOVE_CHILD',
      parentId: 'MODEL-dg7f6394110df0',
      index: 2
    }
    renderer.updatesLayer('MODEL', [updateRmoveChild])

    const parendNode = domElement.querySelector(`#${ updateRmoveChild.parentId }`)
    expect(parendNode?.children).toHaveLength(2)
  })

  test('should updatesLayer when type = INSERT_BEFORE', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="CAPTURE-dg7f6394110df0">
                <line id="CAPTURE-pc9a1234856ze6" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateInsertBefore: TUpdatePatchInsertBefore = {
      type: 'INSERT_BEFORE',
      refId: 'CAPTURE-pc9a1234856ze6',
      svg: '<rect id="test" width="100" height="100" />'
    }
    renderer.updatesLayer('CAPTURE', [updateInsertBefore])

    const parendNode = domElement.querySelector('#CAPTURE-dg7f6394110df0')
    expect(parendNode?.children).toHaveLength(2)

    const elementInserted = domElement.querySelector(`#test`)
    expect(parendNode?.children?.item(0)).toBe(elementInserted)
  })

  test('should updatesLayer when type = SET_ATTRIBUTE with id', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="CAPTURE-dg7f6394110df0">
                <line id="CAPTURE-pc9a1234856ze6" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateSetAttribut: TUpdatePatchSetAttribut = {
      type: 'SET_ATTRIBUTE',
      id: 'CAPTURE-pc9a1234856ze6',
      name: 'data-test',
      value: 'value-test'
    }
    renderer.updatesLayer('CAPTURE', [updateSetAttribut])

    const element = domElement.querySelector(`#${ updateSetAttribut.id }`)
    expect(element?.getAttribute(updateSetAttribut.name)).toBe(updateSetAttribut.value)
  })

  test('should updatesLayer when type = SET_ATTRIBUTE without id', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="CAPTURE-dg7f6394110df0">
                <line id="CAPTURE-pc9a1234856ze6" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateSetAttribut: TUpdatePatchSetAttribut = {
      type: 'SET_ATTRIBUTE',
      name: 'data-test',
      value: 'value-test'
    }
    renderer.updatesLayer('CAPTURE', [updateSetAttribut])

    const element = domElement.querySelector('svg')
    expect(element?.getAttribute(updateSetAttribut.name)).toBe(updateSetAttribut.value)
  })

  test('should updatesLayer when type = REMOVE_ATTRIBUTE with id', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="CAPTURE-dg7f6394110df0">
                <line id="CAPTURE-pc9a1234856ze6" data-test="value-test" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateRemoveAttribut: TUpdatePatchRemoveAttribut = {
      type: 'REMOVE_ATTRIBUTE',
      id: 'CAPTURE-pc9a1234856ze6',
      name: 'data-test',
    }
    renderer.updatesLayer('CAPTURE', [updateRemoveAttribut])

    const element = domElement.querySelector(updateRemoveAttribut.id as string)
    expect(element?.getAttribute(updateRemoveAttribut.name)).toBeUndefined()
  })

  test('should updatesLayer when type = REMOVE_ATTRIBUTE without id', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const update: TUpdatePatchReplaceAll = {
      type: 'REPLACE_ALL',
      svg: `<svg data-layer="CAPTURE" data-test="value-test" x="0px" y="0px" width="770px" height="814px" viewBox="0 0 770 814">
              <g id="CAPTURE-dg7f6394110df0">
                <line id="CAPTURE-pc9a1234856ze6" x1="10" y1="35" x2="210.4" y2="35" stroke="rgba(220, 220, 220, 1)" stroke-width="0.1"></line>
              </g>
            </svg>`
    }
    renderer.updatesLayer('CAPTURE', [update])

    const updateRemoveAttribut: TUpdatePatchRemoveAttribut = {
      type: 'REMOVE_ATTRIBUTE',
      name: 'data-test',
    }
    renderer.updatesLayer('CAPTURE', [updateRemoveAttribut])

    const element = domElement.querySelector('svg')
    expect(element?.getAttribute(updateRemoveAttribut.name)).toBeNull()
  })

  test('should drawPendingStroke', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgModelElement.setAttribute('data-layer', 'MODEL')
    const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g')
    pendingStrokesGroup.id = 'pendingStrokes'
    svgModelElement.appendChild(pendingStrokesGroup)
    domElement.appendChild(svgModelElement)

    renderer.drawPendingStroke(stroke)

    expect(renderer.stroker.drawStroke).toBeCalledTimes(1)
    expect(renderer.stroker.drawStroke).toBeCalledWith(pendingStrokesGroup, stroke, [{ name: "style", value: "fill:undefined;stroke:transparent;" }])
  })

  test('should drawPendingStroke when pointerType = eraser', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.stroker.drawStroke = jest.fn()
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgModelElement.setAttribute('data-layer', 'MODEL')
    const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g')
    pendingStrokesGroup.id = 'pendingStrokes'
    svgModelElement.appendChild(pendingStrokesGroup)
    domElement.appendChild(svgModelElement)

    const eraseStroke: TStroke = {
      type: 'pen',
      pointerType: 'eraser',
      pointerId: 0,
      id: 'test',
      style: DefaultPenStyle,
      pointers: [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ],
      length: 4
    }
    renderer.drawPendingStroke(eraseStroke)

    expect(renderer.stroker.drawStroke).toBeCalledTimes(1)
    expect(renderer.stroker.drawStroke).toBeCalledWith(pendingStrokesGroup, eraseStroke, [{ name: "style", value: "fill:grey;stroke:transparent;shadowBlur:5;opacity:0.2;" }])
  })

  test('should delete erasing strokes', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgModelElement.setAttribute('data-layer', 'MODEL')
    const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g')
    pendingStrokesGroup.id = 'pendingStrokes'
    svgModelElement.appendChild(pendingStrokesGroup)
    domElement.appendChild(svgModelElement)

    const eraseStroke: TStroke = {
      type: 'pen',
      pointerType: 'eraser',
      pointerId: 0,
      id: 'test',
      style: DefaultPenStyle,
      pointers: [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ],
      length: 4
    }
    renderer.drawPendingStroke(eraseStroke)
    expect(domElement.querySelectorAll("[type=eraser]").length).toStrictEqual(1)
    renderer.clearPendingStroke()
    expect(domElement.querySelectorAll("[type=eraser]").length).toStrictEqual(0)
  })

  test('should clearPendingStroke', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgModelElement.setAttribute('data-layer', 'MODEL')
    const pendingStrokesGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g')
    pendingStrokesGroup.id = 'pendingStrokes'
    svgModelElement.appendChild(pendingStrokesGroup)
    domElement.appendChild(svgModelElement)

    const svgCaptureElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgCaptureElement.setAttribute('data-layer', 'CAPTURE')
    domElement.appendChild(svgCaptureElement)

    renderer.drawPendingStroke(stroke)
    expect(pendingStrokesGroup.children).toHaveLength(1)

    renderer.clearPendingStroke()

    expect(pendingStrokesGroup.children).toHaveLength(0)
  })

  test('should resize', () =>
  {
    const width = 100, height = 50
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    const model = new Model(width, height)
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgModelElement.setAttribute('data-layer', 'MODEL')
    svgModelElement.setAttribute('viewBox', `0 0 ${ width }, ${ height }`)
    svgModelElement.setAttribute('width', `${ width }px`)
    svgModelElement.setAttribute('height', `${ height }px`)
    domElement.appendChild(svgModelElement)

    const svgCaptureElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    svgCaptureElement.setAttribute('data-layer', 'CAPTURE')
    svgCaptureElement.setAttribute('viewBox', `0 0 ${ width }, ${ height }`)
    svgCaptureElement.setAttribute('width', `${ width }px`)
    svgCaptureElement.setAttribute('height', `${ height }px`)
    domElement.appendChild(svgCaptureElement)

    model.width += 42
    model.height += 50
    renderer.resize(model)

    expect(svgCaptureElement.getAttribute('width')).toBe(`${ model.width }px`)
    expect(svgCaptureElement.getAttribute('height')).toBe(`${ model.height }px`)
  })

  test('should destroy', () =>
  {
    const domElement = document.createElement('div') as HTMLElement
    const renderer = new WSSVGRenderer(DefaultRenderingConfiguration)
    renderer.init(domElement)

    const svgModelElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    domElement.appendChild(svgModelElement)

    const svgCaptureElement: SVGElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg') as SVGElement
    domElement.appendChild(svgCaptureElement)

    renderer.destroy()

    expect(domElement.children).toHaveLength(0)
  })
})
