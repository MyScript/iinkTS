"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var SvgTextLabel_exports = {};
__export(SvgTextLabel_exports, {
  SvgTextLabel: () => SvgTextLabel
});
module.exports = __toCommonJS(SvgTextLabel_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_createTextJsxFromSpans = require("./createTextJsxFromSpans");
var import_default_shape_constants = require("./default-shape-constants");
var import_legacyProps = require("./legacyProps");
var import_useDefaultColorTheme = require("./useDefaultColorTheme");
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
  const editor = (0, import_editor.useEditor)();
  const theme = (0, import_useDefaultColorTheme.useDefaultColorTheme)();
  const opts = {
    fontSize,
    fontFamily: import_editor.DefaultFontFamilies[font],
    textAlign: align,
    verticalTextAlign: verticalAlign,
    width: Math.ceil(bounds.width),
    height: Math.ceil(bounds.height),
    padding,
    lineHeight: import_default_shape_constants.TEXT_PROPS.lineHeight,
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
  const offsetX = (0, import_legacyProps.getLegacyOffsetX)(align, padding, spans, bounds.width);
  if (offsetX) {
    opts.offsetX = offsetX;
  }
  opts.offsetX += bounds.x;
  opts.offsetY += bounds.y;
  const mainSpans = (0, import_createTextJsxFromSpans.createTextJsxFromSpans)(editor, spans, opts);
  let outlineSpans = null;
  if (showTextOutline && stroke) {
    opts.fill = theme.background;
    opts.stroke = theme.background;
    opts.strokeWidth = 3;
    outlineSpans = (0, import_createTextJsxFromSpans.createTextJsxFromSpans)(editor, spans, opts);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    outlineSpans,
    mainSpans
  ] });
}
//# sourceMappingURL=SvgTextLabel.js.map
