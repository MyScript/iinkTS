/**
 * @group Renderer
 */
export const SVGRendererConst = {
  /** Class a selected symbol's element carries; its outline is drawn by the stylesheet */
  selectedClassName: "ms-selected",
  /** Class of the wider copy drawn under a selected shape or edge; the stylesheet colours it */
  selectionHaloClassName: "ms-selection-halo",
  /** Class a symbol's element carries while the eraser passes over it; the stylesheet fades it */
  deletingClassName: "ms-deleting",
  crossMarker: "cross-marker",
  noSelection:
    "pointer-events: none; -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;",
}

/**
 * Common SVG path attribute presets for guide rendering
 * @group Renderer
 */
export const GUIDE_PATH_ATTRS = {
  "stroke-width": "1",
  stroke: "grey",
  fill: "none",
} as const

/**
 * Common SVG path attribute presets for sub-guide rendering
 * @group Renderer
 */
export const SUB_GUIDE_PATH_ATTRS = {
  "stroke-width": "0.25",
  stroke: "grey",
  fill: "none",
} as const
