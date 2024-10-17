import { TStyle } from "../style"
import { PartialDeep } from "../utils"
import { TPoint } from "./Point"
import { Box, TBoundingBox } from "./Box"
import { SymbolType } from "./Symbol"
import { OIDecorator } from "./OIDecorator"
import { OISymbolBase } from "./OISymbolBase"
import { OIStroke } from "./OIStroke"
import { OIText } from "./OIText"
import { TOISymbol } from "."

/**
 * @group Primitive
 */
export class OISymbolGroup extends OISymbolBase<SymbolType.Group>
{
  readonly isClosed = false

  children: TOISymbol[]
  decorators: OIDecorator[]

  constructor(
    children: TOISymbol[],
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Group, style)
    this.children = children
    this.decorators = []
  }

  get snapPoints(): TPoint[]
  {
    return this.bounds.snapPoints
  }

  get vertices(): TPoint[]
  {
    return this.children.flatMap(s => s.vertices)
  }

  get bounds(): Box
  {
    return Box.createFromBoxes(this.children.map(c => c.bounds))
  }

  updateChildrenStyle(): void
  {
    this.children.forEach(child => {
      child.style = Object.assign({}, child.style, this.style)
      if (child.type === SymbolType.Text) {
        child.chars.forEach(c =>
        {
          if (child.style.color) {
            c.color = child.style.color
          }
        })
      }
      else if (child.type === SymbolType.Group) {
        child.updateChildrenStyle()
      }
    })
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.children.some(s => s.overlaps(box))
  }

  containsSymbol(strokeId: string): boolean
  {
    return OISymbolGroup.containsSymbol(this, strokeId)
  }

  containsOnlyStroke(): boolean
  {
    return OISymbolGroup.containsOnlyStroke(this)
  }

  extractText(): OIText[]
  {
    return OISymbolGroup.extractText(this)
  }

  extractStrokes(): OIStroke[]
  {
    return OISymbolGroup.extractStrokes(this)
  }

  removeChilds(symbolIds: string[]): OISymbolGroup
  {
    return OISymbolGroup.removeChilds(this, symbolIds)
  }

  static containsOnlyStroke(group: OISymbolGroup): boolean
  {
    return group.children.every(s =>
    {
      if (s.type === SymbolType.Group) {
        return OISymbolGroup.containsOnlyStroke(s as OISymbolGroup)
      }
      if (s.type === SymbolType.Stroke) {
        return true
      }
      return false
    })
  }

  static extractText(group: OISymbolGroup): OIText[]
  {
    const texts: OIText[] = []
    group.children.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Text:
          texts.push(s)
          break;
        case SymbolType.Group:
          texts.push(...OISymbolGroup.extractText(s))
          break;
      }
    })
    return texts
  }

  static extractStrokes(group: OISymbolGroup): OIStroke[]
  {
    const strokes: OIStroke[] = []
    group.children.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Stroke:
          strokes.push(s)
          break;
        case SymbolType.StrokeText:
          strokes.push(...s.strokes)
          break;
        case SymbolType.Group:
          strokes.push(...OISymbolGroup.extractStrokes(s))
          break;
      }
    })
    return strokes
  }

  static containsSymbol(group: OISymbolGroup, symbolId: string): boolean
  {
    return group.children.some(symbol =>
    {
      if (symbol.id === symbolId) return true
      if (symbol.type === SymbolType.Group) {
        return OISymbolGroup.containsSymbol(symbol as OISymbolGroup, symbolId)
      }
      else if (symbol.type === SymbolType.StrokeText) {
        return symbol.containsStroke(symbolId)
      }
      return false
    })
  }

  static removeChilds(group: OISymbolGroup, symbolIds: string[]): OISymbolGroup
  {
    group.children = group.children.filter(s => !symbolIds.includes(s.id))
    const symbolsToRemove = group.children.slice()
    symbolsToRemove.forEach(s =>
    {
      if (s.type === SymbolType.Group) {
        if (!s.removeChilds(symbolIds).children.length) {
          group.children = group.children.filter(s1 => s1.id !== s.id)
        }
      }
      else if (s.type === SymbolType.StrokeText) {
        s.removeStrokes(symbolIds)
        if (!s.strokes.length) {
          group.removeChilds([s.id])
        }
      }
    })
    return group
  }

  clone(): OISymbolGroup
  {
    const clone = new OISymbolGroup(this.children.map(s => s.clone()), structuredClone({ ...this.style }))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    return clone
  }

  toJSON(): PartialDeep<OISymbolGroup>
  {
    return {
      id: this.id,
      type: this.type,
      children: JSON.parse(JSON.stringify(this.children)),
      decorators: this.decorators.length ? JSON.parse(JSON.stringify(this.decorators)) : undefined
    }
  }
}
