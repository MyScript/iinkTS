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
var TLFontStyle_exports = {};
__export(TLFontStyle_exports, {
  DefaultFontFamilies: () => DefaultFontFamilies,
  DefaultFontStyle: () => DefaultFontStyle
});
module.exports = __toCommonJS(TLFontStyle_exports);
var import_StyleProp = require("./StyleProp");
const DefaultFontStyle = import_StyleProp.StyleProp.defineEnum("tldraw:font", {
  defaultValue: "draw",
  values: ["draw", "sans", "serif", "mono"]
});
const DefaultFontFamilies = {
  draw: "'tldraw_draw', sans-serif",
  sans: "'tldraw_sans', sans-serif",
  serif: "'tldraw_serif', serif",
  mono: "'tldraw_mono', monospace"
};
//# sourceMappingURL=TLFontStyle.js.map
