import type { TPartialDeep } from "@/core"
import {
  createUUID,
  isValidPoint,
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  type TBox,
  type TOBB,
  type TPoint,
} from "@/core"
import { mergeSymbolStyle, type TStyle } from "@/style"
import type { TSymbolChar } from "@/symbol"
import { computeChildrenOverlaps, SymbolType, type TText } from "@/symbol"

import { DecoratorUtil } from "../decorator/DecoratorUtil"
import { SVGBuilder } from "../SVGBuilder"
import { TypesetUtil } from "./TypesetUtil"

/**
 * @group SymbolUtils
 */
export class TextUtil extends TypesetUtil<TText> {
  readonly type = SymbolType.Text

  create(partial: TPartialDeep<TText>): TText {
    return TextUtil.createFromPartial(partial)
  }

  /** One text element on the baseline, one tspan per character. */
  protected buildContent(text: TText): SVGElement[] {
    const textElement = SVGBuilder.createText(text.point, "")
    text.chars.forEach((c) => {
      textElement.appendChild(
        SVGBuilder.createTSpan(c.label, {
          id: c.id,
          fill: c.color,
          "font-size": `${c.fontSize}px`,
          "font-weight": c.fontWeight.toString(),
        })
      )
    })
    return [textElement]
  }

  static createText(chars: TSymbolChar[], point: TPoint, boundsBox: TBox, style?: TPartialDeep<TStyle>): TText {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    return {
      type: SymbolType.Text,
      id: `${SymbolType.Text}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      point,
      chars,
      decorators: [],
      bounds: OBBOps.fromBox(boundsBox),
      transform: MatrixTransform.identity(),
    }
  }

  static createFromPartial(partial: TPartialDeep<TText>): TText {
    if (!isValidPoint(partial?.point)) {
      throw new Error(`Unable to create TText, point are invalid`)
    }
    if (!partial.chars?.length) {
      throw new Error(`Unable to create TText, no chars`)
    }
    if (!partial.bounds) {
      throw new Error(`Unable to create TText, no boundingBox`)
    }
    const rawBounds = partial.bounds as unknown
    const boundsBox: TBox =
      rawBounds && typeof rawBounds === "object" && "center" in rawBounds
        ? OBBOps.toBox(rawBounds as TOBB)
        : (rawBounds as TBox)
    const text = TextUtil.createText(partial.chars as TSymbolChar[], partial.point as TPoint, boundsBox, partial.style)
    if (partial.id) {
      text.id = partial.id
    }
    text.transform = mergeSymbolTransform(partial.transform)
    if (partial.decorators?.length) {
      partial.decorators.forEach((d) => {
        if (d?.kind) {
          text.decorators.push(DecoratorUtil.createDecorator(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    return text
  }

  static getChildrenOverlaps(text: TText, points: TPoint[]): TSymbolChar[] {
    return computeChildrenOverlaps(text.chars, points)
  }

  static updateChildrenStyle(text: TText): void {
    text.chars.forEach((c) => {
      if (text.style.color) {
        c.color = text.style.color
      }
    })
    text.modificationDate = Date.now()
  }

  static updateChildrenFont(
    text: TText,
    {
      fontSize,
      fontWeight,
    }: {
      fontSize?: number
      fontWeight?: "normal" | "bold"
    }
  ): void {
    text.chars.forEach((c) => {
      if (fontSize) {
        c.fontSize = fontSize
      }
      if (fontWeight) {
        c.fontWeight = fontWeight
      }
    })
    text.modificationDate = Date.now()
  }

  /** Whether every char of the text is bold. An empty text is not. */
  static isBold(text: TText): boolean {
    return text.chars.length > 0 && text.chars.every((c) => c.fontWeight === "bold")
  }

  static getLabel(text: TText): string {
    return text.chars.map((c) => c.label).join("")
  }

  static toJSON(text: TText): TPartialDeep<TText> {
    return {
      id: text.id,
      type: text.type,
      point: text.point,
      chars: text.chars,
      style: text.style,
      bounds: OBBOps.toBox(text.bounds),
      decorators: text.decorators.length ? text.decorators : undefined,
    }
  }
}
