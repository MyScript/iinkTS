import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TDecorator } from "@/symbol/decorator/Decorator"
import { DecoratorOps } from "@/symbol/decorator/Decorator"
import type { TBox } from "@/symbol/primitives/Box"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps, type TOBB } from "@/symbol/primitives/OBB"
import type { TPoint, TSegment } from "@/symbol/primitives/Point"
import type { TBaseSymbol } from "@/symbol/Symbol"
import { SymbolType } from "@/symbol/Symbol"
import type { TRotation, TTypesetChild } from "@/symbol/typeset/Typeset"
import { computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/symbol/typeset/Typeset"
import type { TPartialDeep } from "@/utils"
import {
  computeRotatedPoint,
  convertDegreeToRadian,
  createUUID,
  findIntersectionBetween2Segment,
  isPointInsidePolygon,
} from "@/utils"

/**
 * @group Symbol
 * @remarks Individual math element (number, operator, variable, etc.)
 */
export type TMathElement = TTypesetChild & {
  fontFamily: string
  position?: "superscript" | "subscript" | "normal"
}

/**
 * @group Symbol
 * @remarks Represents a converted mathematical expression with native rendering
 */
export type TMath = TBaseSymbol & {
  type: SymbolType.Math
  style: TStyle
  point: TPoint
  elements: TMathElement[]
  decorators: TDecorator[]
  bounds: TOBB
  rotation?: TRotation
  vertices: TPoint[]
  snapPoints: TPoint[]
  edges: TSegment[]
}

/**
 * @group Symbol
 * @summary Check if symbol is math
 * @param symbol - Symbol to check
 * @returns True if symbol is math
 */
export function isMath(symbol: TBaseSymbol): symbol is TMath {
  return symbol.type === SymbolType.Math
}

/**
 * @group Symbol
 */
export const MathOps = {
  create(elements: TMathElement[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TMath {
    const mergedStyle = Object.assign({}, DefaultStyle, style) as TStyle
    if (mergedStyle.opacity) {
      mergedStyle.opacity = +mergedStyle.opacity
    }
    mergedStyle.width = +mergedStyle.width
    const now = Date.now()
    const vertices = computeTypesetVertices(boundsBox)
    const snapPoints = computeTypesetSnapPoints(boundsBox, point)
    const edges = computeClosedEdges(vertices)
    return {
      type: SymbolType.Math,
      id: `${SymbolType.Math}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      point,
      elements,
      decorators: [],
      bounds: OBBOps.fromBox(boundsBox),
      rotation: undefined,
      vertices,
      snapPoints,
      edges,
    }
  },

  createFromPartial(partial: TPartialDeep<TMath>): TMath {
    if (!partial.elements?.length) {
      throw new Error(`TMath requires elements`)
    }
    if (!partial.point) {
      throw new Error(`TMath requires point`)
    }
    if (!partial.bounds) {
      throw new Error(`TMath requires bounds`)
    }

    const elements: TMathElement[] = partial.elements.map((e) => ({
      id: e!.id!,
      label: e!.label!,
      fontSize: e!.fontSize!,
      fontWeight: e!.fontWeight! as "normal" | "bold",
      fontFamily: e!.fontFamily!,
      color: e!.color!,
      bounds: {
        x: e!.bounds!.x!,
        y: e!.bounds!.y!,
        width: e!.bounds!.width!,
        height: e!.bounds!.height!,
      },
    }))

    const rawBounds = partial.bounds as unknown
    const boundsBox: TBox =
      rawBounds && typeof rawBounds === "object" && "center" in rawBounds
        ? OBBOps.toBox(rawBounds as TOBB)
        : (rawBounds as TBox)
    const math = MathOps.create(elements, partial.point as TPoint, boundsBox, partial.style)

    if (partial.id) {
      math.id = partial.id
    }
    if (partial.rotation) {
      math.rotation = partial.rotation as TRotation
    }
    if (partial.decorators) {
      math.decorators = partial.decorators
        .filter((d) => d?.kind && d?.style)
        .map((d) => DecoratorOps.create(d!.kind!, d!.style!))
    }
    MathOps.updateDerivedFields(math)
    return math
  },

  updateDerivedFields(math: TMath): void {
    const boundsBox = OBBOps.toBox(math.bounds)
    math.vertices = computeTypesetVertices(boundsBox, math.rotation)
    math.snapPoints = computeTypesetSnapPoints(boundsBox, math.point, math.rotation)
    math.edges = computeClosedEdges(math.vertices)
  },

  overlaps(math: TMath, box: TBox): boolean {
    return (
      math.vertices.some((p) => BoxOps.containsPoint(box, p)) ||
      math.edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
    )
  },

  getChildrenOverlaps(math: TMath, points: TPoint[]): TMathElement[] {
    return math.elements.filter((e) => {
      let corners: TPoint[]
      if (math.rotation) {
        const rad = convertDegreeToRadian(-math.rotation.degree)
        corners = BoxOps.getCorners(e.bounds).map((p) => computeRotatedPoint(p, math.rotation!.center, rad))
      } else {
        corners = BoxOps.getCorners(e.bounds)
      }
      return points.some((p) => isPointInsidePolygon(p, corners))
    })
  },

  updateChildrenStyle(math: TMath): void {
    math.elements.forEach((e) => {
      if (math.style.color) {
        e.color = math.style.color
      }
    })
    math.modificationDate = Date.now()
  },

  updateChildrenFont(
    math: TMath,
    {
      fontSize,
      fontWeight,
      fontFamily,
    }: {
      fontSize?: number
      fontWeight?: "normal" | "bold"
      fontFamily?: string
    }
  ): void {
    math.elements.forEach((e) => {
      if (fontSize) {
        e.fontSize = fontSize
      }
      if (fontWeight) {
        e.fontWeight = fontWeight
      }
      if (fontFamily) {
        e.fontFamily = fontFamily
      }
    })
    math.modificationDate = Date.now()
  },

  getLabel(math: TMath): string {
    return math.elements.map((e) => e.label).join("")
  },

  toJSON(math: TMath): TPartialDeep<TMath> {
    return {
      id: math.id,
      type: math.type,
      point: math.point,
      elements: math.elements,
      decorators: math.decorators,
      bounds: OBBOps.toBox(math.bounds),
      rotation: math.rotation,
      style: math.style,
    }
  },
}
