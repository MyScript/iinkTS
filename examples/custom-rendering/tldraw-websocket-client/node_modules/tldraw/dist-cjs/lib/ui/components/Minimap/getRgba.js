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
var getRgba_exports = {};
__export(getRgba_exports, {
  getRgba: () => getRgba
});
module.exports = __toCommonJS(getRgba_exports);
const memo = {};
function getRgba(colorString) {
  if (memo[colorString]) {
    return memo[colorString];
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.fillStyle = colorString;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
  const result = new Float32Array([r / 255, g / 255, b / 255, a / 255]);
  memo[colorString] = result;
  return result;
}
//# sourceMappingURL=getRgba.js.map
