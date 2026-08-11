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
var TldrawHandles_exports = {};
__export(TldrawHandles_exports, {
  TldrawHandles: () => TldrawHandles
});
module.exports = __toCommonJS(TldrawHandles_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
function TldrawHandles({ children }) {
  const editor = (0, import_editor.useEditor)();
  const shouldDisplayHandles = (0, import_editor.useValue)(
    "shouldDisplayHandles",
    () => {
      if (editor.isInAny("select.idle", "select.pointing_handle", "select.pointing_shape")) {
        return true;
      }
      if (editor.isInAny("select.editing_shape")) {
        const onlySelectedShape = editor.getOnlySelectedShape();
        return onlySelectedShape && editor.isShapeOfType(onlySelectedShape, "note");
      }
      return false;
    },
    [editor]
  );
  if (!shouldDisplayHandles) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "tl-user-handles tl-overlays__item", "aria-hidden": "true", children });
}
//# sourceMappingURL=TldrawHandles.js.map
