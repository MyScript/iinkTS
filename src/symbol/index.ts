/**
 * @group Symbol
 * @summary Symbol types and geometries
 *
 * The symbol module provides:
 *
 * **Base Symbols** (`./base`)
 * - {@link Symbol} - Base symbol abstraction
 * - {@link Stroke} - Collection of pointers representing a stroke
 * - {@link CanvasSymbol} - Symbol for canvas rendering
 * - {@link Point} - 2D point representation
 * - {@link Box} - Bounding box representation
 *
 * **Interactive Symbols** (`./interactive`)
 * - {@link IISymbol} - Rich symbol with advanced features
 * - {@link IIStroke} - Stroke with decorators and style
 * - {@link IIText} - Text symbol with font styling
 * - {@link IISymbolGroup} - Group of symbols
 * - {@link IIDecorator} - Edge decorators (arrows, etc.)
 * - {@link IIEraser} - Eraser tool marker
 *
 * **Geometry** (`./geometry`)
 * - Shapes (Circle, Ellipse, Polygon)
 * - Edges (Line, Arc, PolyLine)
 * - Shape utilities
 *
 * **Recognized** (`./recognized`)
 * - Recognition results (Text, Arc, Circle, etc.)
 */

// Base symbols
export * from "./base"

// Interactive symbols
export * from "./interactive"

// Geometry
export * from "./geometry"

// Recognition results
export * from "./recognized"
