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
var TLCursor_exports = {};
__export(TLCursor_exports, {
  TL_CURSOR_TYPES: () => TL_CURSOR_TYPES,
  cursorTypeValidator: () => cursorTypeValidator,
  cursorValidator: () => cursorValidator
});
module.exports = __toCommonJS(TLCursor_exports);
var import_validate = require("@tldraw/validate");
const TL_CURSOR_TYPES = /* @__PURE__ */ new Set([
  "none",
  "default",
  "pointer",
  "cross",
  "grab",
  "rotate",
  "grabbing",
  "resize-edge",
  "resize-corner",
  "text",
  "move",
  "ew-resize",
  "ns-resize",
  "nesw-resize",
  "nwse-resize",
  "nesw-rotate",
  "nwse-rotate",
  "swne-rotate",
  "senw-rotate",
  "zoom-in",
  "zoom-out"
]);
const cursorTypeValidator = import_validate.T.setEnum(TL_CURSOR_TYPES);
const cursorValidator = import_validate.T.object({
  type: cursorTypeValidator,
  rotation: import_validate.T.number
});
//# sourceMappingURL=TLCursor.js.map
