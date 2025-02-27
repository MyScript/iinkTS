"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var getBrowserCanvasMaxSize_exports = {};
__export(getBrowserCanvasMaxSize_exports, {
  clampToBrowserMaxCanvasSize: () => clampToBrowserMaxCanvasSize
});
module.exports = __toCommonJS(getBrowserCanvasMaxSize_exports);
var import_canvas_size = __toESM(require("canvas-size"));
let maxSizePromise = null;
function getBrowserCanvasMaxSize() {
  if (!maxSizePromise) {
    maxSizePromise = calculateBrowserCanvasMaxSize();
  }
  return maxSizePromise;
}
async function calculateBrowserCanvasMaxSize() {
  const maxWidth = await import_canvas_size.default.maxWidth({ usePromise: true });
  const maxHeight = await import_canvas_size.default.maxHeight({ usePromise: true });
  const maxArea = await import_canvas_size.default.maxArea({ usePromise: true });
  return {
    maxWidth: maxWidth.width,
    maxHeight: maxHeight.height,
    maxArea: maxArea.width * maxArea.height
  };
}
const MAX_SAFE_CANVAS_DIMENSION = 8192;
const MAX_SAFE_CANVAS_AREA = 4096 * 4096;
async function clampToBrowserMaxCanvasSize(width, height) {
  if (width <= MAX_SAFE_CANVAS_DIMENSION && height <= MAX_SAFE_CANVAS_DIMENSION && width * height <= MAX_SAFE_CANVAS_AREA) {
    return [width, height];
  }
  const { maxWidth, maxHeight, maxArea } = await getBrowserCanvasMaxSize();
  const aspectRatio = width / height;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  if (width * height > maxArea) {
    const ratio = Math.sqrt(maxArea / (width * height));
    width *= ratio;
    height *= ratio;
  }
  return [width, height];
}
//# sourceMappingURL=getBrowserCanvasMaxSize.js.map
