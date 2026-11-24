import type { TPartialDeep } from "@/core"
import { createUUID, MatrixTransform, mergeSymbolTransform, OBBOps, type TBox, type TOBB, type TPoint } from "@/core"
import { mergeSymbolStyle, type TStyle } from "@/style"
import { computeChildrenOverlaps, SymbolType, type TMath, type TMathElement } from "@/symbol"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import { TypesetUtil } from "./TypesetUtil"

/**
 * @group SymbolUtils
 */
export class MathUtil extends TypesetUtil<TMath> {
  readonly type = SymbolType.Math

  create(partial: TPartialDeep<TMath>): TMath {
    return MathUtil.createFromPartial(partial)
  }

  /**
   * One text element per element when any of them is a super- or subscript, laid out by hand;
   * otherwise one text element with a tspan each, the way text does it.
   *
   * The hand-laid branch exists because a tspan cannot be lifted off the baseline on its own here —
   * the positions are computed from each element's own font size.
   */
  protected buildContent(math: TMath): SVGElement[] {
    const attributesOf = (element: TMathElement): Record<string, string> => ({
      id: element.id,
      fill: element.color,
      "font-size": `${element.fontSize}px`,
      "font-weight": element.fontWeight.toString(),
      "font-family": element.fontFamily,
    })

    const hasScript = math.elements.some((e) => e.position === "superscript" || e.position === "subscript")
    if (!hasScript) {
      const mathElement = SVGBuilder.createText(math.point, "")
      math.elements.forEach((e) => mathElement.appendChild(SVGBuilder.createTSpan(e.label, attributesOf(e))))
      return [mathElement]
    }

    let currentX = math.point.x
    const baselineY = math.point.y
    return math.elements.map((e, index) => {
      let x = currentX
      let y = baselineY

      if (e.position === "superscript") {
        y = baselineY - e.fontSize * 1.5
        x = currentX - e.label.length * e.fontSize * 0.3
      } else if (e.position === "subscript") {
        y = baselineY + e.fontSize * 1.2
        x = currentX - e.label.length * e.fontSize * 0.3
      } else if (index > 0) {
        const previous = math.elements[index - 1]
        if (previous.position === "normal") {
          currentX += previous.label.length * previous.fontSize * 0.6
          x = currentX
        }
      }

      const textElement = SVGBuilder.createText({ x, y }, e.label)
      Object.entries(attributesOf(e)).forEach(([key, value]) => textElement.setAttribute(key, value))

      if (e.position === "normal") {
        currentX = x + e.label.length * e.fontSize * 0.6
      }
      return textElement
    })
  }

  static createMath(elements: TMathElement[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TMath {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
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
      transform: MatrixTransform.identity(),
    }
  }

  static createFromPartial(partial: TPartialDeep<TMath>): TMath {
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
    const math = MathUtil.createMath(elements, partial.point as TPoint, boundsBox, partial.style)

    if (partial.id) {
      math.id = partial.id
    }
    math.transform = mergeSymbolTransform(partial.transform)
    if (partial.decorators) {
      math.decorators = partial.decorators
        .filter((d) => d?.kind && d?.style)
        .map((d) => DecoratorUtil.createDecorator(d!.kind!, d!.style!))
    }
    return math
  }

  static getChildrenOverlaps(math: TMath, points: TPoint[]): TMathElement[] {
    return computeChildrenOverlaps(math.elements, points)
  }

  static updateChildrenStyle(math: TMath): void {
    math.elements.forEach((e) => {
      if (math.style.color) {
        e.color = math.style.color
      }
    })
    math.modificationDate = Date.now()
  }

  static updateChildrenFont(
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
  }

  /** Whether every element of the math block is bold. An empty block is not. */
  static isBold(math: TMath): boolean {
    return math.elements.length > 0 && math.elements.every((e) => e.fontWeight === "bold")
  }

  static getLabel(math: TMath): string {
    return math.elements.map((e) => e.label).join("")
  }

  static toJSON(math: TMath): TPartialDeep<TMath> {
    return {
      id: math.id,
      type: math.type,
      point: math.point,
      elements: math.elements,
      decorators: math.decorators,
      bounds: OBBOps.toBox(math.bounds),
      style: math.style,
    }
  }
}
