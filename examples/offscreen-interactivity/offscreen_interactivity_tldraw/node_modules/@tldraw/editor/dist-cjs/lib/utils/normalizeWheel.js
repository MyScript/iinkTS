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
var normalizeWheel_exports = {};
__export(normalizeWheel_exports, {
  normalizeWheel: () => normalizeWheel
});
module.exports = __toCommonJS(normalizeWheel_exports);
const MAX_ZOOM_STEP = 10;
const IS_DARWIN = /Mac|iPod|iPhone|iPad/.test(
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  typeof window === "undefined" ? "node" : window.navigator.platform
);
function normalizeWheel(event) {
  let { deltaY, deltaX } = event;
  let deltaZ = 0;
  if (event.ctrlKey || event.altKey || event.metaKey) {
    deltaZ = (Math.abs(deltaY) > MAX_ZOOM_STEP ? MAX_ZOOM_STEP * Math.sign(deltaY) : deltaY) / 100;
  } else {
    if (event.shiftKey && !IS_DARWIN) {
      deltaX = deltaY;
      deltaY = 0;
    }
  }
  return { x: -deltaX, y: -deltaY, z: -deltaZ };
}
//# sourceMappingURL=normalizeWheel.js.map
