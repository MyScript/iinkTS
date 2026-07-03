import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TJIIXMathElement } from "@/model"
import { SVGBuilder, SVGRendererConst } from "@/renderer"
import type { TBox, TPoint, TStroke } from "@/symbol"
import { isStroke } from "@/symbol"
import { BoxOps } from "@/symbol/primitives/Box"
import { OBBOps } from "@/symbol/primitives/OBB"
import { convertBoundingBoxMillimeterToPixel } from "@/utils"

import { ColorPaletteManager } from "../base"
import { IIAbstractManager } from "./IIAbstractManager"

/**
 * Visual overlay configuration
 * @group Manager
 */
export type TOverlayConfig = {
  showBlockOverlays: boolean
  badgeSize: number
  borderWidth: number
  panelPadding: number
  labelMaxChars: number
  labelFontSize: number
}

/**
 * One row displayed in the variable-value encart (name, current value, source-type label).
 * `swatchColor` matches the highlight drawn on the variable's occurrence(s) in the block ink;
 * `typeColor` colors the source-type label text (API/Global/Predefined/Undefined).
 * @group Manager
 */
export type TVariableEncartItem = {
  name: string
  value: string
  typeLabel: string
  typeColor: string
  swatchColor: string
}

/**
 * Default overlay configuration
 * @group Manager
 */
export const DefaultOverlayConfig: TOverlayConfig = {
  showBlockOverlays: false,
  badgeSize: 20,
  borderWidth: 2,
  panelPadding: 8,
  labelMaxChars: 10,
  labelFontSize: 12,
}

/**
 * Unified overlay manager for all symbol types.
 *
 * Responsibilities:
 * - Math blocks: ∑ badge, border, hover zone, highlights, dimming
 * - Text blocks: recognized text badge, border
 *
 * Owned by InteractiveInkEditor as `editor.overlays`.
 *
 * @group Manager
 */
export class IIOverlayManager extends IIAbstractManager {
  protected managerName = "IIOverlayManager"

  private static readonly BADGE_STYLES = {
    MATH: "∑",
    TEXT: "T",
    EDGE: "→",
    NODE: "◇",
    BACKGROUND: "#ffffff",
    BORDER: "#cccccc",
    FONT_SIZE: 14,
    OFFSET: 4,
  }

  private static readonly LABEL_STYLES = {
    PADDING_H: 4,
    PADDING_V: 2,
    GAP: 4,
    // user-select only — pointer-events must stay enabled so hover/click work
    NO_SELECT:
      "-webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;",
  }

  private static readonly VARIABLE_ENCART_ID = "variable-encart"

  private static readonly ENCART_STYLES = {
    PADDING: 6,
    LINE_HEIGHT: 16,
    FONT_SIZE: 11,
    SWATCH_SIZE: 8,
    SWATCH_GAP: 6,
    BACKGROUND: "#ffffff",
    BORDER: "#999999",
  }

  // Overlay config
  #config: TOverlayConfig
  #colorManager: ColorPaletteManager

  constructor(editor: TInteractiveInkEditor, config: Partial<TOverlayConfig> = {}) {
    super(editor, LoggerCategory.SVGDEBUG)
    this.#config = {
      ...DefaultOverlayConfig,
      ...config,
    }
    this.#colorManager = ColorPaletteManager.getInstance()
  }

  updateConfig(config: Partial<TOverlayConfig>): void {
    this.logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
    this.refresh()
  }

  getConfig(): TOverlayConfig {
    return { ...this.#config }
  }

  protected drawBadge(box: TBox, id: string, content: string): void {
    const badgeId = `badge-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    this.renderer.removeSymbol(badgeId)

    const size = this.#config.badgeSize
    const offset = IIOverlayManager.BADGE_STYLES.OFFSET
    const badgeX = box.x - offset - size
    const badgeY = box.y - offset - size

    const badgeGroup = SVGBuilder.createGroup({
      id: badgeId,
      "data-overlay": "badge",
      "data-block-id": id,
    })

    const circle = SVGBuilder.createCircle(
      {
        x: badgeX + size / 2,
        y: badgeY + size / 2,
      },
      size / 2,
      {
        fill: IIOverlayManager.BADGE_STYLES.BACKGROUND,
        stroke: IIOverlayManager.BADGE_STYLES.BORDER,
        "stroke-width": "1",
        style: SVGRendererConst.noSelection,
      }
    )
    badgeGroup.appendChild(circle)

    const text = SVGBuilder.createText(
      {
        x: badgeX + size / 2,
        y: badgeY + size / 2 + 5,
      },
      content,
      {
        fill: "#000000",
        "font-size": IIOverlayManager.BADGE_STYLES.FONT_SIZE.toString(),
        "font-weight": "bold",
        "text-anchor": "middle",
        style: SVGRendererConst.noSelection,
      }
    )
    badgeGroup.appendChild(text)
    this.renderer.layer.appendChild(badgeGroup)
  }

  protected drawBorder(box: TBox, id: string, color: string = "#cccccc", dashArray?: string): void {
    const borderId = `border-${id}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    this.renderer.removeSymbol(borderId)

    const attrs: Record<string, string> = {
      id: borderId,
      fill: "transparent",
      stroke: color,
      "stroke-width": this.#config.borderWidth.toString(),
      "data-overlay": "border",
      "data-block-id": id,
      style: SVGRendererConst.noSelection,
    }
    if (dashArray) {
      attrs["stroke-dasharray"] = dashArray
    }

    const rect = SVGBuilder.createRect(box, attrs)
    this.renderer.layer.appendChild(rect)
  }

  protected drawLabel(box: TBox, id: string, fullLabel: string): void {
    if (!fullLabel) {
      return
    }

    const labelId = `label-${this.sanitizeId(id)}`
    this.renderer.removeSymbol(labelId)

    const { badgeSize: size, labelMaxChars: maxChars, labelFontSize: FONT_SIZE } = this.#config
    const CHAR_WIDTH = FONT_SIZE * 0.6
    const { PADDING_H, PADDING_V, GAP } = IIOverlayManager.LABEL_STYLES
    const offset = IIOverlayManager.BADGE_STYLES.OFFSET
    const chipHeight = FONT_SIZE + PADDING_V * 2

    const badgeX = box.x - offset - size
    const badgeY = box.y - offset - size
    const chipX = badgeX + size + GAP
    const chipY = badgeY + (size - chipHeight) / 2

    const isExpandable = fullLabel.length > maxChars
    const shortLabel = isExpandable ? fullLabel.substring(0, maxChars) + "…" : fullLabel

    const { NO_SELECT } = IIOverlayManager.LABEL_STYLES
    const cursorStyle = isExpandable ? "cursor: pointer; " : ""
    const group = SVGBuilder.createGroup({
      id: labelId,
      "data-overlay": "label",
      "data-block-id": id,
      style: `pointer-events: all; ${cursorStyle}${NO_SELECT}`,
    })

    const bgRect = SVGBuilder.createRect(
      {
        x: chipX,
        y: chipY,
        width: shortLabel.length * CHAR_WIDTH + PADDING_H * 2,
        height: chipHeight,
      },
      {
        fill: IIOverlayManager.BADGE_STYLES.BACKGROUND,
        stroke: IIOverlayManager.BADGE_STYLES.BORDER,
        "stroke-width": "1",
        rx: "3",
      }
    )
    group.appendChild(bgRect)

    const textEl = SVGBuilder.createText(
      {
        x: chipX + PADDING_H,
        y: chipY + FONT_SIZE + PADDING_V - 1,
      },
      shortLabel,
      {
        fill: "#333333",
        "font-size": FONT_SIZE.toString(),
        "font-family": "monospace",
        style: "pointer-events: none;",
      }
    )
    group.appendChild(textEl)

    // Prevent canvas grabber from starting a stroke on this element
    group.addEventListener("pointerdown", (e) => e.stopPropagation())

    if (isExpandable) {
      let expanded = false
      group.addEventListener("click", (e) => {
        e.stopPropagation()
        expanded = !expanded
        const current = expanded ? fullLabel : shortLabel
        textEl.textContent = current
        bgRect.setAttribute("width", (current.length * CHAR_WIDTH + PADDING_H * 2).toString())
      })
    }

    this.renderer.layer.appendChild(group)
  }

  protected createHoverZone(bounds: TBox, blockId: string): void {
    const id = `hover-zone-${blockId}`.replace(/[^a-zA-Z0-9_-]/g, "_")
    this.renderer.removeSymbol(id)

    const attrs: Record<string, string> = {
      id,
      fill: "transparent",
      stroke: "transparent",
      "data-overlay": "hover-zone",
      "data-block-id": blockId,
      style: "pointer-events: all;",
    }

    const hoverZone = SVGBuilder.createRect(bounds, attrs)

    hoverZone.addEventListener("pointerenter", () => {
      this.logger.debug("hover", `Pointer entered block ${blockId}`)
      this.editor.math.onSymbolHover(blockId)
    })

    hoverZone.addEventListener("pointerleave", () => {
      this.logger.debug("hover", `Pointer left block ${blockId}`)
      this.editor.math.onSymbolHover(null)
    })

    this.renderer.layer.appendChild(hoverZone)
  }

  private getMathBlockBounds(mathBlock: TJIIXMathElement): TBox | null {
    if (mathBlock["bounding-box"]) {
      return convertBoundingBoxMillimeterToPixel(mathBlock["bounding-box"])
    }
    const blockStrokes = this.editor.model.symbols.filter(
      (s) => isStroke(s) && (s as TStroke).jiixBlockId === mathBlock.id
    ) as TStroke[]
    if (!blockStrokes.length) {
      this.logger.warn("getMathBlockBounds", `Math block ${mathBlock.id} has no bounding box and no strokes`)
      return null
    }
    return BoxOps.createFromBoxes(blockStrokes.map((s) => OBBOps.toBox(s.bounds)))
  }

  refresh(): void {
    this.logger.info("refresh")
    if (!this.model) {
      this.logger.warn("refresh", "Model not available")
      return
    }
    this.clearAll()

    this.model.mathBlocks.forEach((mathBlock) => {
      const bounds = this.getMathBlockBounds(mathBlock)
      if (bounds) {
        this.createHoverZone(bounds, mathBlock.id)
      }
    })

    if (!this.#config.showBlockOverlays) {
      return
    }

    this.refreshMathOverlays()
    this.refreshTextOverlays()
    this.refreshEdgeNodeOverlays()
  }

  protected refreshMathOverlays(): void {
    this.model.mathBlocks.forEach((mathBlock) => {
      const bounds = this.getMathBlockBounds(mathBlock)
      if (bounds) {
        const blockId = mathBlock.id
        this.drawBadge(bounds, blockId, IIOverlayManager.BADGE_STYLES.MATH)
        this.drawBorder(bounds, blockId)
        if (mathBlock.label) {
          this.drawLabel(bounds, blockId, mathBlock.label)
        }
      }
    })
  }

  protected refreshTextOverlays(): void {
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiix) {
      return
    }
    this.model.textBlocks.forEach((textBlock) => {
      const box = convertBoundingBoxMillimeterToPixel(textBlock["bounding-box"])
      const blockId = `text-${textBlock.id}`
      this.drawBadge(box, blockId, IIOverlayManager.BADGE_STYLES.TEXT)
      this.drawBorder(box, blockId, "#2196F3")
      this.drawLabel(box, blockId, textBlock.label)
    })
  }

  protected refreshEdgeNodeOverlays(): void {
    const jiix = this.model.exports?.["application/vnd.myscript.jiix"]
    if (!jiix) {
      return
    }
    jiix.elements?.forEach((el, elIndex) => {
      if (!el["bounding-box"]) {
        return
      }
      const box = convertBoundingBoxMillimeterToPixel(el["bounding-box"])
      if (el.type === "Node") {
        const blockId = `node-${elIndex}`
        this.drawBadge(box, blockId, IIOverlayManager.BADGE_STYLES.NODE)
        this.drawBorder(box, blockId, "#9C27B0")
        this.drawLabel(box, blockId, el.kind)
      } else if (el.type === "Edge") {
        const blockId = `edge-${elIndex}`
        this.drawBadge(box, blockId, IIOverlayManager.BADGE_STYLES.EDGE)
        this.drawBorder(box, blockId, "#FF5722")
        this.drawLabel(box, blockId, el.kind)
      }
    })
  }

  clearAll(): void {
    this.logger.info("clearAll")
    this.renderer.clearElements({
      attrs: { "data-overlay": "badge" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "border" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "result-panel" },
    })
    this.renderer.clearElements({
      attrs: {
        "data-overlay": "result-connection",
      },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "hover-zone" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "arrow" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "label" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "variable-encart" },
    })
  }

  protected sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_-]/g, "_")
  }

  protected drawOverlayRect(id: string, bounds: TBox, idPrefix: string, attrs: Partial<Record<string, string>>): void {
    const elemId = this.sanitizeId(`${idPrefix}-${id}`)
    this.renderer.removeSymbol(elemId)

    const finalAttrs: Record<string, string> = {
      id: elemId,
      fill: "transparent",
      "data-overlay": attrs["data-overlay"] || idPrefix,
      "data-block-id": id,
      style: attrs.style || "pointer-events: none;",
      ...attrs,
    }

    const rect = SVGBuilder.createRect(bounds, finalAttrs)
    this.renderer.layer.appendChild(rect)
  }

  highlightPrimary(id: string, bounds: TBox, color?: string): void {
    this.drawOverlayRect(id, bounds, "highlight-source", {
      stroke: color || "var(--iink-success)",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight",
    })
  }

  highlightLinked(id: string, bounds: TBox): void {
    this.drawOverlayRect(id, bounds, "highlight-dependent", {
      stroke: "var(--iink-warning)",
      "stroke-width": "3",
      "stroke-dasharray": "5 3",
      "data-overlay": "highlight",
    })
  }

  highlightWithColor(box: TBox, symbolId: string, colorKey: string): void {
    const color = this.#colorManager.getColorForVariable(colorKey)
    this.drawOverlayRect(`${symbolId}-${colorKey}`, box, "highlight-colored", {
      stroke: color,
      "stroke-width": "2",
      "data-overlay": "highlight",
      "data-block-id": symbolId,
    })
  }

  addHoverGlow(id: string, bounds: TBox): void {
    this.drawOverlayRect(id, bounds, "glow", {
      stroke: "var(--iink-primary)",
      "stroke-width": "2",
      "data-overlay": "glow",
      style:
        "pointer-events: none; filter: drop-shadow(0 0 8px color-mix(in srgb, var(--iink-primary) 60%, transparent));",
    })
  }

  dimSymbol(id: string, bounds: TBox, opacity: number = 0.3): void {
    this.drawOverlayRect(id, bounds, "dim", {
      fill: "var(--iink-editor-bg)",
      opacity: (1 - opacity).toString(),
      "data-overlay": "dim",
    })
  }

  clearHighlights(): void {
    this.renderer.clearElements({
      attrs: { "data-overlay": "highlight" },
    })
    this.renderer.clearElements({
      attrs: { "data-overlay": "glow" },
    })
    this.hideVariableEncart()
  }

  /**
   * Small box, centered on `anchor`, listing non-BLOCK-sourced variables (API/Global/Predefined/Undefined)
   * used by the hovered or selected math block. Each row's swatch matches the color of that variable's
   * highlighted occurrence(s) in the block ink (see `highlightWithColor`).
   */
  showVariableEncart(options: { anchor: TPoint; items: TVariableEncartItem[] }): void {
    this.renderer.removeSymbol(IIOverlayManager.VARIABLE_ENCART_ID)

    const { anchor, items } = options
    if (items.length === 0) {
      return
    }

    const { PADDING, LINE_HEIGHT, FONT_SIZE, SWATCH_SIZE, SWATCH_GAP, BACKGROUND, BORDER } =
      IIOverlayManager.ENCART_STYLES
    const CHAR_WIDTH = FONT_SIZE * 0.6
    const lines = items.map((item) => `${item.name}: ${item.value} · ${item.typeLabel}`)
    const textWidth = Math.max(...lines.map((line) => line.length)) * CHAR_WIDTH
    const width = SWATCH_SIZE + SWATCH_GAP + textWidth + PADDING * 2
    const height = items.length * LINE_HEIGHT + PADDING * 2
    const position = { x: anchor.x, y: anchor.y - height }

    const group = SVGBuilder.createGroup({
      id: IIOverlayManager.VARIABLE_ENCART_ID,
      "data-overlay": "variable-encart",
      style: "pointer-events: none;",
    })

    const bgRect = SVGBuilder.createRect(
      { x: position.x, y: position.y, width, height },
      {
        fill: BACKGROUND,
        stroke: BORDER,
        "stroke-width": "1",
        rx: "4",
        style: SVGRendererConst.noSelection,
      }
    )
    group.appendChild(bgRect)

    items.forEach((item, i) => {
      const rowY = position.y + PADDING + i * LINE_HEIGHT

      const swatch = SVGBuilder.createRect(
        { x: position.x + PADDING, y: rowY + (LINE_HEIGHT - SWATCH_SIZE) / 2, width: SWATCH_SIZE, height: SWATCH_SIZE },
        { fill: item.swatchColor, rx: "2" }
      )
      group.appendChild(swatch)

      const textEl = SVGBuilder.createText(
        { x: position.x + PADDING + SWATCH_SIZE + SWATCH_GAP, y: rowY + FONT_SIZE },
        lines[i] ?? "",
        {
          fill: item.typeColor,
          "font-size": FONT_SIZE.toString(),
          "font-family": "monospace",
          style: SVGRendererConst.noSelection,
        }
      )
      group.appendChild(textEl)
    })

    this.renderer.layer.appendChild(group)
  }

  hideVariableEncart(): void {
    this.renderer.removeSymbol(IIOverlayManager.VARIABLE_ENCART_ID)
  }

  clearDimming(): void {
    this.renderer.clearElements({
      attrs: { "data-overlay": "dim" },
    })
  }

  apply(): void {
    this.refresh()
  }
}
