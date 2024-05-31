import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { PartialDeep } from "../utils"
import { TPoint } from "./Point"
import { TBoundingBox } from "./Box"
import { SymbolType } from "./Symbol"
import { OIDecorator } from "./OIDecorator"
import { TOISymbol, OISymbol } from "./OISymbol"
import { OIStroke } from "./OIStroke"

/**
 * @group Primitive
 */
export class OISymbolGroup extends OISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)
  symbols: TOISymbol[]
  decorators: OIDecorator[]

  constructor(style: TStyle, symbols: TOISymbol[])
  {
    super(SymbolType.Group, style)
    this.#logger.info("constructor", { style })
    this.symbols = symbols
    this.decorators = []
  }

  override get style(): TStyle
  {
    return this._style
  }

  override set style(style: TStyle)
  {
    super.style = style
    this.symbols.forEach(s =>
    {
      s.style = Object.assign(s.style, style)
    })
  }

  get snapPoints(): TPoint[]
  {
    return this.boundingBox.snapPoints
  }

  get vertices(): TPoint[]
  {
    return this.symbols.flatMap(s => s.vertices)
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.symbols.some(s => s.overlaps(box))
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.symbols.some(s => s.isCloseToPoint(point))
  }

  containsSymbol(strokeId: string): boolean
  {
    return OISymbolGroup.containsSymbol(this, strokeId)
  }

  containsOnlyStroke(): boolean
  {
    return OISymbolGroup.containsOnlyStroke(this)
  }

  extractSymbols(): TOISymbol[]
  {
    return OISymbolGroup.extractSymbols(this)
  }

  extractStrokes(): OIStroke[]
  {
    return OISymbolGroup.extractStrokes(this)
  }

  removeChilds(symbolIds: string[]): OISymbolGroup | undefined
  {
    return OISymbolGroup.removeChilds(this, symbolIds)
  }

  static containsOnlyStroke(group: OISymbolGroup): boolean
  {
    return group.symbols.every(s =>
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

  static extractSymbols(group: OISymbolGroup): TOISymbol[]
  {
    return group.symbols.flatMap(s =>
    {
      if (s.type === SymbolType.Group) {
        return OISymbolGroup.extractSymbols(s as OISymbolGroup).concat(s)
      }
      return s
    })
  }

  static extractStrokes(group: OISymbolGroup): OIStroke[]
  {
    return group.symbols.flatMap(s =>
    {
      if (s.type === SymbolType.Stroke) {
        return s as OIStroke
      }
      if (s.type === SymbolType.Group) {
        return OISymbolGroup.extractStrokes(s as OISymbolGroup)
      }
      return
    }).filter(s => !!s) as OIStroke[]
  }

  static containsSymbol(group: OISymbolGroup, symbolId: string): boolean
  {
    return group.symbols.some(symbol =>
    {
      if (symbol.type === SymbolType.Group) {
        return OISymbolGroup.containsSymbol(symbol as OISymbolGroup, symbolId)
      }
      return symbol.id === symbolId
    })
  }

  static removeChilds(group: OISymbolGroup, symbolIds: string[]): OISymbolGroup | undefined
  {
    group.symbols = group.symbols.filter(s => !symbolIds.includes(s.id))
    if (!group.symbols.length) return
    const symbolsToRemove = group.symbols.slice()
    symbolsToRemove.forEach(s => {
      if (s.type === SymbolType.Group) {
        const g = s as  OISymbolGroup
        if (!OISymbolGroup.removeChilds(g, symbolIds)) {
          group.symbols = group.symbols.filter(s1 => s1.id !== g.id)
        }
      }
    })
    return group.symbols.length ?  group : undefined
  }

  clone(): OISymbolGroup
  {
    const clone = new OISymbolGroup(this.style, this.symbols.map(s => s.clone()))
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
      symbols: JSON.parse(JSON.stringify(this.symbols)),
      decorators: this.decorators.length ? JSON.parse(JSON.stringify(this.decorators)) : undefined
    }
  }
}
