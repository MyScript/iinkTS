---
name: rendering-system
description: >
  Guide to the rendering architecture (SVG vs Canvas, drawing strokes/symbols, custom styling).
  Use when modifying rendering logic, debugging visual issues, or implementing custom renderers.
---

# Rendering System Architecture

## Overview

The rendering system draws digital ink and recognized content to screen. Two renderer implementations:

| Renderer | Technology | Performance | Use Case |
|----------|-----------|-------------|----------|
| `SVGRenderer` | SVG DOM | Better quality | Default for most editors |
| `CanvasRenderer` | Canvas 2D | Better performance | High stroke count scenarios |

**Base abstraction**: `BaseRenderer` ([src/renderer/BaseRenderer.ts](src/renderer/BaseRenderer.ts))

## Renderer Selection

Configured via editor options:

```typescript
const options = {
  configuration: {
    rendering: {
      type: 'svg',  // or 'canvas'
    },
  },
}
```

**Default**: SVG for all editors.

## SVG Renderer Architecture

### Component Structure — registry dispatch, not per-type fields

Per-type SVG rendering is NOT hardcoded on `SVGRenderer` as private fields — it's dispatched through the same plugin registry used for symbol behavior everywhere else:

```typescript
import { symbolRegistry } from "@/symbol-utils/SymbolRegistry"

class SVGRenderer extends BaseRenderer {
  #layerCapture: SVGSVGElement   // Stroke capture layer
  #layerModel: SVGGElement       // Recognized symbols layer

  #buildElement(symbol: TSymbol): SVGGraphicsElement | undefined {
    const util = symbolRegistry.getUtil(symbol.type)
    return util?.getSVGElement?.(symbol)
  }
}
```

**Per-type rendering** lives in each type's `*Util` class (`src/symbol-utils/{type}/{Type}Util.ts`): `StrokeUtil`, `TextUtil`, `MathUtil`, `ShapeUtil`, `EdgeUtil`, `DecoratorUtil` — each implements `getSVGElement(symbol)`. See the `symbol-system` skill for the full `*Ops`/`*Util` layering. Adding a new renderable type means adding a `getSVGElement()` to its `*Util`, not touching `SVGRenderer`.

**Other renderer pieces**:
- `SVGRendererConst` ([src/renderer/svg/utils/SVGRendererConst.ts](src/renderer/svg/utils/SVGRendererConst.ts)) — SVG constants/attr presets
- `SVGBuilder` — real implementation in [src/symbol-utils/SVGBuilder.ts](src/symbol-utils/SVGBuilder.ts); `src/renderer/svg/utils/SVGBuilder.ts` is a re-export shim
- `SVGStroker` ([src/renderer/svg/SVGStroker.ts](src/renderer/svg/SVGStroker.ts)) — stroke path generation
- `SVGSSRenderer` ([src/renderer/svg/SVGSSRenderer.ts](src/renderer/svg/SVGSSRenderer.ts)) — server-side rendering support

**Implementation**: [src/renderer/svg/SVGRenderer.ts](src/renderer/svg/SVGRenderer.ts)

### Rendering Flow

1. **Capture Phase**: User draws → strokes added to `#layerCapture`
2. **Recognition Phase**: Backend responds → symbols rendered to `#layerModel`
3. **Clear Capture**: Recognized strokes removed from capture layer
4. **Update Model**: Symbols updated in model layer

### SVG Element Structure

```xml
<svg id="editor-svg" class="ms-editor">
  <!-- Capture layer (temporary strokes) -->
  <svg id="capture-layer">
    <path id="stroke-1" d="M 0 0 L 10 10 ..." />
    <path id="stroke-2" d="M 20 20 L 30 30 ..." />
  </svg>
  
  <!-- Model layer (recognized symbols) -->
  <g id="model-layer">
    <g id="group-1" class="symbol-group">
      <text id="text-1" x="0" y="20">Hello</text>
      <circle id="shape-1" cx="50" cy="50" r="20" />
    </g>
    
    <!-- Decorators (selection, resize handles) -->
    <g id="decorator-layer">
      <rect class="selection-box" />
      <circle class="resize-handle" />
    </g>
  </g>
</svg>
```

### Symbol-Specific Renderers

#### Stroke Rendering

**`StrokeUtil.getSVGElement()`** ([src/symbol-utils/stroke/StrokeUtil.ts](src/symbol-utils/stroke/StrokeUtil.ts)) — illustrative shape, see the real file for exact attrs:

```typescript
getSVGElement(stroke: TStroke): SVGPathElement {
  const path = document.createElementNS(SVG_NS, 'path')
  
  // Convert points to SVG path data
  const d = this.#buildPathData(stroke.points)
  path.setAttribute('d', d)
  
  // Apply style
  path.setAttribute('stroke', stroke.style.color)
  path.setAttribute('stroke-width', stroke.style.width)
  path.setAttribute('fill', 'none')
  
  return path
}

#buildPathData(points: TPoint[]): string {
  if (points.length === 0) return ''
  
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`
  }
  
  return d
}
```

**Pressure support**: Variable stroke width via path interpolation.

#### Shape Rendering

**`ShapeUtil.getSVGElement()`** ([src/symbol-utils/shape/ShapeUtil.ts](src/symbol-utils/shape/ShapeUtil.ts)) — illustrative shape:

```typescript
getSVGElement(shape: TShape): SVGElement {
  switch (shape.kind) {
    case 'circle':
      return this.#drawCircle(shape)
    case 'ellipse':
      return this.#drawEllipse(shape)
    case 'polygon':
      return this.#drawPolygon(shape)
    // ... other shapes
  }
}

#drawCircle(shape: TShapeCircle): SVGCircleElement {
  const circle = document.createElementNS(SVG_NS, 'circle')
  circle.setAttribute('cx', shape.center.x)
  circle.setAttribute('cy', shape.center.y)
  circle.setAttribute('r', shape.radius)
  
  this.#applyStyle(circle, shape.style)
  
  return circle
}
```

**Supported shapes**: Circle, Ellipse, Polygon.

#### Text Rendering

**`TextUtil.getSVGElement()`** ([src/symbol-utils/text/TextUtil.ts](src/symbol-utils/text/TextUtil.ts)) — illustrative shape:

```typescript
getSVGElement(text: TText): SVGTextElement {
  const textElement = document.createElementNS(SVG_NS, 'text')
  
  // Position
  textElement.setAttribute('x', text.baseline.x)
  textElement.setAttribute('y', text.baseline.y)
  
  // Content
  textElement.textContent = text.label
  
  // Style (font, size, color)
  textElement.setAttribute('font-family', text.style.fontFamily)
  textElement.setAttribute('font-size', text.style.fontSize)
  textElement.setAttribute('fill', text.style.color)
  
  return textElement
}
```

**Math rendering**: Uses MathML or LaTeX → SVG conversion (server-side).

#### Edge Rendering

**Lines, arcs, polylines** rendered as SVG paths with specific `d` attributes, via `EdgeUtil.getSVGElement()`.

### Decorator Rendering

**`DecoratorUtil.getSVGElement()`** ([src/symbol-utils/decorator/DecoratorUtil.ts](src/symbol-utils/decorator/DecoratorUtil.ts)) renders UI overlays:

- **Selection box**: Rectangle around selected symbols
- **Resize handles**: Circles at corners/edges
- **Rotation handle**: Circle above selection
- **Guides**: Smart guides for alignment

```typescript
drawSelectionBox(bounds: Box): SVGRectElement {
  const rect = document.createElementNS(SVG_NS, 'rect')
  rect.setAttribute('x', bounds.x)
  rect.setAttribute('y', bounds.y)
  rect.setAttribute('width', bounds.width)
  rect.setAttribute('height', bounds.height)
  rect.classList.add('selection-box')
  return rect
}
```

**Styling**: Applied via CSS classes (`.selection-box`, `.resize-handle`).

## Canvas Renderer Architecture

### Component Structure

```typescript
class CanvasRenderer extends BaseRenderer {
  #canvas: HTMLCanvasElement
  #context: CanvasRenderingContext2D
  
  // Helper renderers
  #strokeRenderer: CanvasRendererStroke
  #shapeRenderer: CanvasRendererShape
  #textRenderer: CanvasRendererText
}
```

**Canvas Helper Classes** (all in [src/renderer/canvas/](src/renderer/canvas/)):
1. `CanvasRenderer` - Main canvas renderer
2. `CanvasRendererStroke` - Stroke rendering with pressure
3. `CanvasRendererShape` - Shape rendering (circles, polygons, etc.)
4. `CanvasRendererText` - Text rendering using Canvas text API

**Implementation**: [src/renderer/canvas/CanvasRenderer.ts](src/renderer/canvas/CanvasRenderer.ts)

### Rendering Flow

1. **Clear Canvas**: `context.clearRect(0, 0, width, height)`
2. **Draw Model**: Iterate all symbols, draw each
3. **Draw Capture**: Draw temporary strokes
4. **Draw Decorators**: Selection, handles

**Performance**: Uses `requestAnimationFrame` for smooth updates.

### Canvas Drawing

#### Stroke Drawing

```typescript
drawStroke(stroke: Stroke) {
  const ctx = this.#context
  const points = stroke.points
  
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y)
  }
  
  ctx.strokeStyle = stroke.style.color
  ctx.lineWidth = stroke.style.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}
```

**Pressure**: Varies line width along stroke path.

#### Shape Drawing

```typescript
drawCircle(circle: IICircle) {
  const ctx = this.#context
  
  ctx.beginPath()
  ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI)
  
  ctx.fillStyle = circle.style.fillColor
  ctx.fill()
  
  ctx.strokeStyle = circle.style.color
  ctx.lineWidth = circle.style.width
  ctx.stroke()
}
```

#### Text Drawing

```typescript
drawText(text: IIText) {
  const ctx = this.#context
  
  ctx.font = `${text.style.fontSize}px ${text.style.fontFamily}`
  ctx.fillStyle = text.style.color
  ctx.textBaseline = 'alphabetic'
  
  ctx.fillText(text.label, text.baseline.x, text.baseline.y)
}
```

**Limitation**: No native MathML support → rendered as plain text or images.

## Style System

### Pen Style

**TPenStyle** ([src/style/Types.ts](src/style/Types.ts)):

```typescript
type TPenStyle = {
  color: string                    // Hex color: '#000000'
  width: number                    // Stroke width in pixels
  '-myscript-pen-width'?: number   // MyScript-specific width
  '-myscript-pen-fill-style'?: 'none' | 'solid'
  '-myscript-pen-fill-color'?: string
}
```

**Usage**:
```typescript
const options = {
  penStyle: {
    color: '#2E7D32',
    width: 2,
  },
}
```

### Theme System

**TTheme** for UI element styling:

```typescript
type TTheme = {
  ink: {
    color: string
    width: number
  }
  guides: {
    enable: boolean
    color: string
    width: number
  }
  // ... more theme properties
}
```

**Application**: Injected as CSS variables.

### Style Helpers

**StyleHelper** ([src/style/StyleHelper.ts](src/style/StyleHelper.ts)):

- `rgbToHex(r, g, b)` - Color conversion
- `hexToRgb(hex)` - Reverse conversion
- `computeStyleFromCss(element)` - Extract computed styles

## Transform System

Symbols can be transformed (translate, rotate, resize) via **MatrixTransform**.

### Matrix Transform

**MatrixTransform** ([src/transform/MatrixTransform.ts](src/transform/MatrixTransform.ts)):

```typescript
class MatrixTransform {
  constructor(
    public a: number,  // Horizontal scaling
    public b: number,  // Vertical skewing
    public c: number,  // Horizontal skewing
    public d: number,  // Vertical scaling
    public tx: number, // Horizontal translation
    public ty: number  // Vertical translation
  ) {}
  
  static translate(x: number, y: number): MatrixTransform
  static rotate(angle: number): MatrixTransform
  static scale(sx: number, sy: number): MatrixTransform
  
  applyToPoint(point: TPoint): TPoint
  multiply(other: MatrixTransform): MatrixTransform
}
```

**Usage**:
```typescript
// Rotate symbol 45 degrees
const rotation = MatrixTransform.rotate(Math.PI / 4)
const transformed = rotation.applyToPoint(symbol.center)

// Apply to SVG element
element.setAttribute('transform', rotation.toSVGString())
```

### Symbol Bounds

**Box** class ([src/model/Box.ts](src/model/Box.ts)) for bounding boxes:

```typescript
class Box {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}
  
  contains(point: TPoint): boolean
  overlaps(other: Box): boolean
  union(other: Box): Box
}
```

**Usage**: Selection, hit testing, clipping.

## Custom CSS Integration

iinkTS injects CSS at runtime via style element.

### Default Styles

**iink.css** ([src/iink.css](src/iink.css)):

```css
.ms-editor {
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
}

.ms-editor .capture-layer {
  pointer-events: none;
}

.selection-box {
  fill: none;
  stroke: #1976D2;
  stroke-width: 2;
  stroke-dasharray: 5 5;
}

.resize-handle {
  fill: #1976D2;
  stroke: #FFFFFF;
  cursor: nwse-resize;
}
```

### Override Styles

Via `override.cssClass` option:

```typescript
const options = {
  override: {
    cssClass: 'my-custom-editor',
  },
}
```

Add custom CSS:
```css
.my-custom-editor .selection-box {
  stroke: #FF5722;
}
```

## Performance Optimization

### SVG Optimization

1. **Group symbols**: Reduce DOM nodes via `<g>` grouping
2. **Debounce updates**: Batch DOM mutations
3. **Use transforms**: Prefer `transform` over changing `x`/`y`
4. **Remove hidden elements**: Cull off-screen symbols

### Canvas Optimization

1. **Dirty regions**: Only redraw changed areas
2. **Layer caching**: Cache static content to offscreen canvas
3. **Request animation frame**: Throttle redraws
4. **Path batching**: Combine multiple paths before stroke

## Debugging Rendering

### Inspect SVG

```javascript
const svg = document.querySelector('.ms-editor svg')
console.log(svg.outerHTML)  // Full SVG structure
```

### Canvas Screenshot

```javascript
const canvas = document.querySelector('.ms-editor canvas')
const dataURL = canvas.toDataURL('image/png')
console.log(dataURL)  // Data URL for download
```

### Renderer Events

```javascript
// Not exposed directly, debug via model changes
editor.event.addChangedListener((evt) => {
  console.log('Model updated, renderer should redraw')
})
```

## Common Issues

**Issue**: Strokes disappear after recognition  
**Cause**: Capture layer cleared before model rendered  
**Fix**: Ensure model update before clearing capture

**Issue**: Selection handles misaligned  
**Cause**: Transform not applied to decorators  
**Fix**: Apply same transform to decorator layer

**Issue**: Canvas blurry on high-DPI  
**Cause**: Canvas size doesn't match device pixel ratio  
**Fix**: Scale canvas by `window.devicePixelRatio`

## Best Practices

✅ **Do** use SVG for default scenarios  
✅ **Do** switch to Canvas for >1000 strokes  
✅ **Do** batch DOM updates in SVG  
✅ **Do** use transforms for animations  
✅ **Do** clean up unused elements

❌ **Don't** mix SVG and Canvas in same editor  
❌ **Don't** manipulate renderer internals directly  
❌ **Don't** style via inline attributes (use CSS)  
❌ **Don't** create new elements on every render  
❌ **Don't** forget to clear canvas before redraw
