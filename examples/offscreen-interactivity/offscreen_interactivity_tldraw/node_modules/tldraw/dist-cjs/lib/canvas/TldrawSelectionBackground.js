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
var TldrawSelectionBackground_exports = {};
__export(TldrawSelectionBackground_exports, {
  TldrawSelectionBackground: () => TldrawSelectionBackground
});
module.exports = __toCommonJS(TldrawSelectionBackground_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
const TldrawSelectionBackground = ({ bounds, rotation }) => {
  const editor = (0, import_editor.useEditor)();
  const shouldDisplay = (0, import_editor.useValue)(
    "should display",
    () => editor.isInAny(
      "select.idle",
      "select.brushing",
      "select.scribble_brushing",
      "select.pointing_shape",
      "select.pointing_selection",
      "text.resizing"
    ),
    [editor]
  );
  if (!shouldDisplay) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.DefaultSelectionBackground, { bounds, rotation });
};
//# sourceMappingURL=TldrawSelectionBackground.js.map
