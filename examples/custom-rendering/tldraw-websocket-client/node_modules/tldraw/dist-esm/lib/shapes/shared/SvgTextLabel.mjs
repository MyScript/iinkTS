import { Fragment, jsxs } from "react/jsx-runtime";
import {
  DefaultFontFamilies,
  useEditor
} from "@tldraw/editor";
import { createTextJsxFromSpans } from "./createTextJsxFromSpans.mjs";
import { TEXT_PROPS } from "./default-shape-constants.mjs";
import { getLegacyOffsetX } from "./legacyProps.mjs";
import { useDefaultColorTheme } from "./useDefaultColorTheme.mjs";
function SvgTextLabel({
  fontSize,
  font,
  align,
  verticalAlign,
  text,
  labelColor,
  bounds,
  padding = 16,
  stroke = true,
  showTextOutline = true
}) {
  const editor = useEditor();
  const theme = useDefaultColorTheme();
  const opts = {
    fontSize,
    fontFamily: DefaultFontFamilies[font],
    textAlign: align,
    verticalTextAlign: verticalAlign,
    width: Math.ceil(bounds.width),
    height: Math.ceil(bounds.height),
    padding,
    lineHeight: TEXT_PROPS.lineHeight,
    fontStyle: "normal",
    fontWeight: "normal",
    overflow: "wrap",
    offsetX: 0,
    offsetY: 0,
    fill: labelColor,
    stroke: void 0,
    strokeWidth: void 0
  };
  const spans = editor.textMeasure.measureTextSpans(text, opts);
  const offsetX = getLegacyOffsetX(align, padding, spans, bounds.width);
  if (offsetX) {
    opts.offsetX = offsetX;
  }
  opts.offsetX += bounds.x;
  opts.offsetY += bounds.y;
  const mainSpans = createTextJsxFromSpans(editor, spans, opts);
  let outlineSpans = null;
  if (showTextOutline && stroke) {
    opts.fill = theme.background;
    opts.stroke = theme.background;
    opts.strokeWidth = 3;
    outlineSpans = createTextJsxFromSpans(editor, spans, opts);
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    outlineSpans,
    mainSpans
  ] });
}
export {
  SvgTextLabel
};
//# sourceMappingURL=SvgTextLabel.mjs.map
