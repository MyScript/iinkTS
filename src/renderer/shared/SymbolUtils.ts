import { TSymbol, SymbolType, IIStroke, IIText, IISymbolGroup } from "../../symbol"

/**
 * @group Renderer
 * @summary Shared symbol utility functions for renderers
 *
 * Common helper functions for symbol type checking and classification
 * used by both Canvas and SVG renderers.
 */

/**
 * Check if symbol is a stroke
 */
export function isStroke(symbol: TSymbol): symbol is IIStroke
{
  return symbol.type === SymbolType.Stroke
}

/**
 * Check if symbol is text
 */
export function isText(symbol: TSymbol): symbol is IIText
{
  return symbol.type === SymbolType.Text
}

/**
 * Check if symbol is a group
 */
export function isGroup(symbol: TSymbol): symbol is IISymbolGroup
{
  return symbol.type === SymbolType.Group
}

/**
 * Check if symbol is a shape (circle, ellipse, polygon)
 */
export function isShape(symbol: TSymbol): boolean
{
  return symbol.type === SymbolType.Shape || symbol.type === SymbolType.Edge
}

/**
 * Check if symbol is a recognized result (text, arc, circle, etc.)
 */
export function isRecognized(symbol: TSymbol): boolean
{
  return symbol.type === SymbolType.Recognized
}

/**
 * Get symbol type label for debugging
 */
export function getSymbolTypeLabel(symbol: TSymbol): string
{
  return `${ symbol.type }${ symbol.id ? ` (${ symbol.id })` : "" }`
}
