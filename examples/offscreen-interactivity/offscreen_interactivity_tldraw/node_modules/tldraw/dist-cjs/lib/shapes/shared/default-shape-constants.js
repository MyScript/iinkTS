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
var default_shape_constants_exports = {};
__export(default_shape_constants_exports, {
  ARROW_LABEL_FONT_SIZES: () => ARROW_LABEL_FONT_SIZES,
  ARROW_LABEL_PADDING: () => ARROW_LABEL_PADDING,
  FONT_FAMILIES: () => FONT_FAMILIES,
  FONT_SIZES: () => FONT_SIZES,
  LABEL_FONT_SIZES: () => LABEL_FONT_SIZES,
  LABEL_PADDING: () => LABEL_PADDING,
  LABEL_TO_ARROW_PADDING: () => LABEL_TO_ARROW_PADDING,
  STROKE_SIZES: () => STROKE_SIZES,
  TEXT_PROPS: () => TEXT_PROPS
});
module.exports = __toCommonJS(default_shape_constants_exports);
const TEXT_PROPS = {
  lineHeight: 1.35,
  fontWeight: "normal",
  fontVariant: "normal",
  fontStyle: "normal",
  padding: "0px"
};
const STROKE_SIZES = {
  s: 2,
  m: 3.5,
  l: 5,
  xl: 10
};
const FONT_SIZES = {
  s: 18,
  m: 24,
  l: 36,
  xl: 44
};
const LABEL_FONT_SIZES = {
  s: 18,
  m: 22,
  l: 26,
  xl: 32
};
const ARROW_LABEL_FONT_SIZES = {
  s: 18,
  m: 20,
  l: 24,
  xl: 28
};
const FONT_FAMILIES = {
  draw: "var(--tl-font-draw)",
  sans: "var(--tl-font-sans)",
  serif: "var(--tl-font-serif)",
  mono: "var(--tl-font-mono)"
};
const LABEL_TO_ARROW_PADDING = 20;
const ARROW_LABEL_PADDING = 4.25;
const LABEL_PADDING = 16;
//# sourceMappingURL=default-shape-constants.js.map
