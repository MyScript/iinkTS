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
var preload_font_exports = {};
__export(preload_font_exports, {
  preloadFont: () => preloadFont
});
module.exports = __toCommonJS(preload_font_exports);
async function preloadFont(id, font) {
  const {
    url,
    style = "normal",
    weight = "500",
    display,
    featureSettings,
    stretch,
    unicodeRange,
    variant,
    format
  } = font;
  const descriptors = {
    style,
    weight,
    display,
    featureSettings,
    stretch,
    unicodeRange,
    // @ts-expect-error why is this here
    variant
  };
  const fontInstance = new FontFace(id, `url(${url})`, descriptors);
  await fontInstance.load();
  document.fonts.add(fontInstance);
  fontInstance.$$_url = url;
  fontInstance.$$_fontface = `
@font-face {
	font-family: ${fontInstance.family};
	font-stretch: ${fontInstance.stretch};
	font-weight: ${fontInstance.weight};
	font-style: ${fontInstance.style};
	src: url("${url}") format("${format}")
}`;
  return fontInstance;
}
//# sourceMappingURL=preload-font.js.map
