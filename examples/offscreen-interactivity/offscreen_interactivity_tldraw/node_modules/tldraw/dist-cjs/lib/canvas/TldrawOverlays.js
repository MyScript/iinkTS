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
var TldrawOverlays_exports = {};
__export(TldrawOverlays_exports, {
  TldrawArrowHints: () => TldrawArrowHints,
  TldrawOverlays: () => TldrawOverlays
});
module.exports = __toCommonJS(TldrawOverlays_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_arrowTargetState = require("../shapes/arrow/arrowTargetState");
function TldrawOverlays() {
  const editor = (0, import_editor.useEditor)();
  const shouldShowArrowHints = (0, import_editor.useValue)(
    "should show arrow hints",
    () => {
      if (editor.isInAny("arrow.idle", "arrow.pointing")) return true;
      if (editor.isIn("select.pointing_handle")) {
        const node = editor.getStateDescendant("select.pointing_handle");
        if (node.info.shape.type === "arrow" && (node.info.handle.id === "start" || node.info.handle.id === "end")) {
          return true;
        }
      }
      if (editor.isIn("select.dragging_handle")) {
        const node = editor.getStateDescendant("select.dragging_handle");
        if (node.info.shape.type === "arrow" && (node.info.handle.id === "start" || node.info.handle.id === "end")) {
          return true;
        }
      }
      return false;
    },
    [editor]
  );
  if (!shouldShowArrowHints) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TldrawArrowHints, {});
}
function TldrawArrowHints() {
  const editor = (0, import_editor.useEditor)();
  const { ShapeIndicator } = (0, import_editor.useEditorComponents)();
  const targetInfo = (0, import_editor.useValue)("arrow target info", () => (0, import_arrowTargetState.getArrowTargetState)(editor), [editor]);
  if (!targetInfo) return null;
  const { handlesInPageSpace, snap, anchorInPageSpace, arrowKind, isExact, isPrecise } = targetInfo;
  const showEdgeHints = !isExact && arrowKind === "elbow";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    ShapeIndicator && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeIndicator, { shapeId: targetInfo.target.id }),
    showEdgeHints && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { className: "tl-overlays__item", "aria-hidden": "true", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "circle",
        {
          cx: anchorInPageSpace.x,
          cy: anchorInPageSpace.y,
          className: `tl-arrow-hint-snap tl-arrow-hint-snap__${isPrecise ? snap ?? "none" : "none"}`
        }
      ),
      Object.entries(handlesInPageSpace).map(([side, handle]) => {
        if (!handle.isEnabled) return null;
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "circle",
          {
            cx: handle.point.x,
            cy: handle.point.y,
            className: "tl-arrow-hint-handle"
          },
          side
        );
      })
    ] })
  ] });
}
//# sourceMappingURL=TldrawOverlays.js.map
