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
var TldrawShapeIndicators_exports = {};
__export(TldrawShapeIndicators_exports, {
  TldrawShapeIndicators: () => TldrawShapeIndicators
});
module.exports = __toCommonJS(TldrawShapeIndicators_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
function TldrawShapeIndicators() {
  const editor = (0, import_editor.useEditor)();
  const isInSelectState = (0, import_editor.useValue)(
    "is in a valid select state",
    () => {
      return editor.isInAny(
        "select.idle",
        "select.brushing",
        "select.scribble_brushing",
        "select.editing_shape",
        "select.pointing_shape",
        "select.pointing_selection",
        "select.pointing_handle"
      );
    },
    [editor]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.DefaultShapeIndicators, { hideAll: !isInSelectState });
}
//# sourceMappingURL=TldrawShapeIndicators.js.map
