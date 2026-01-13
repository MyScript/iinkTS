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
var legacyProps_exports = {};
__export(legacyProps_exports, {
  getLegacyOffsetX: () => getLegacyOffsetX,
  isLegacyAlign: () => isLegacyAlign
});
module.exports = __toCommonJS(legacyProps_exports);
var import_editor = require("@tldraw/editor");
function getLegacyOffsetX(align, padding, spans, totalWidth) {
  if ((align === "start-legacy" || align === "end-legacy") && spans.length !== 0) {
    const spansBounds = import_editor.Box.From(spans[0].box);
    for (const { box } of spans) {
      spansBounds.union(box);
    }
    if (align === "start-legacy") {
      return (totalWidth - 2 * padding - spansBounds.width) / 2;
    } else if (align === "end-legacy") {
      return -(totalWidth - 2 * padding - spansBounds.width) / 2;
    }
  }
}
function isLegacyAlign(align) {
  return align === "start-legacy" || align === "middle-legacy" || align === "end-legacy";
}
//# sourceMappingURL=legacyProps.js.map
