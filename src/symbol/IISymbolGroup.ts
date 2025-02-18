import { TStyle } from "../style"
import { PartialDeep } from "../utils"
import { TPoint } from "./Point"
import { Box, TBox } from "./Box"
import { SymbolType } from "./Symbol"
import { IIDecorator } from "./IIDecorator"
import { IISymbolBase } from "./IISymbolBase"
import { IIStroke } from "./IIStroke"
import { IIText } from "./IIText"
import { TIISymbol } from "."

/**
 * @group Symbol
 */
export class IISymbolGroup extends IISymbolBase<SymbolType.Group>
{
  readonly isClosed = false

  children: TIISymbol[]
  decorators: IIDecorator[]

  constructor(
    children: TIISymbol[],
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
      switch (child.type) {
        case SymbolType.Group:
          child.updateChildrenStyle()
          break
        case SymbolType.Text:
          child.chars.forEach(c =>
          {
            if (child.style.color) {
              c.color = child.style.color
            }
          })
          break
        case SymbolType.Recognized:
          child.updateChildrenStyle()
          break
      }

    })
  }

  overlaps(box: TBox): boolean
  {
    return this.children.some(s => s.overlaps(box))
  }

  containsSymbol(strokeId: string): boolean
  {
    return IISymbolGroup.containsSymbol(this, strokeId)
  }

  containsOnlyStroke(): boolean
  {
    return IISymbolGroup.containsOnlyStroke(this)
  }

  extractText(): IIText[]
  {
    return IISymbolGroup.extractText(this)
  }

  extractStrokes(): IIStroke[]
  {
    return IISymbolGroup.extractStrokes(this)
  }

  removeChilds(symbolIds: string[]): IISymbolGroup
  {
    return IISymbolGroup.removeChilds(this, symbolIds)
  }

  static containsOnlyStroke(group: IISymbolGroup): boolean
  {
    return group.children.every(s =>
    {
      if (s.type === SymbolType.Group) {
        return IISymbolGroup.containsOnlyStroke(s as IISymbolGroup)
      }
      if (s.type === SymbolType.Stroke) {
        return true
      }
      return false
    })
  }

  static extractText(group: IISymbolGroup): IIText[]
  {
    const texts: IIText[] = []
    group.children.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Text:
          texts.push(s)
          break;
        case SymbolType.Group:
          texts.push(...IISymbolGroup.extractText(s))
          break;
      }
    })
    return texts
  }

  static extractStrokes(group: IISymbolGroup): IIStroke[]
  {
    const strokes: IIStroke[] = []
    group.children.forEach(s =>
    {
      switch (s.type) {
        case SymbolType.Stroke:
          strokes.push(s)
          break;
        case SymbolType.Recognized:
          strokes.push(...s.strokes)
          break;
        case SymbolType.Group:
          strokes.push(...IISymbolGroup.extractStrokes(s))
          break;
      }
    })
    return strokes
  }

  static containsSymbol(group: IISymbolGroup, symbolId: string): boolean
  {
    return group.children.some(symbol =>
    {
      if (symbol.id === symbolId) return true
      if (symbol.type === SymbolType.Group) {
        return IISymbolGroup.containsSymbol(symbol, symbolId)
      }
      else if (symbol.type === SymbolType.Recognized) {
        return symbol.containsStroke(symbolId)
      }
      return false
    })
  }

  static removeChilds(group: IISymbolGroup, symbolIds: string[]): IISymbolGroup
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
      else if (s.type === SymbolType.Recognized) {
        s.removeStrokes(symbolIds)
        if (!s.strokes.length) {
          group.removeChilds([s.id])
        }
      }
    })
    return group
  }

  clone(): IISymbolGroup
  {
    const clone = new IISymbolGroup(this.children.map(s => s.clone()), structuredClone({ ...this.style }))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    return clone
  }

  toJSON(): PartialDeep<IISymbolGroup>
  {
    return {
      id: this.id,
      type: this.type,
      children: JSON.parse(JSON.stringify(this.children)),
      decorators: this.decorators.length ? JSON.parse(JSON.stringify(this.decorators)) : undefined
    }
  }
}
