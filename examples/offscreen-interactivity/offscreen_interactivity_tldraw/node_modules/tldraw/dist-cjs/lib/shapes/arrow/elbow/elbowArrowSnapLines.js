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
var elbowArrowSnapLines_exports = {};
__export(elbowArrowSnapLines_exports, {
  getElbowArrowSnapLines: () => getElbowArrowSnapLines,
  perpDistanceToLine: () => perpDistanceToLine,
  perpDistanceToLineAngle: () => perpDistanceToLineAngle
});
module.exports = __toCommonJS(elbowArrowSnapLines_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("../shared");
const snapLinesStore = new import_editor.WeakCache();
function getElbowArrowSnapLines(editor) {
  return snapLinesStore.get(editor, (editor2) => {
    const currentSelectedArrowShape = (0, import_editor.computed)("current selected arrow shape", () => {
      const shape = editor2.getOnlySelectedShape();
      if (!shape || !editor2.isShapeOfType(shape, "arrow")) return null;
      return shape.id;
    });
    const unselectedArrowShapeIds = editor2.store.query.ids("shape", () => {
      const activeArrowShapeId = currentSelectedArrowShape.get();
      if (!activeArrowShapeId) return { type: { eq: "arrow" } };
      return {
        type: { eq: "arrow" },
        id: { neq: activeArrowShapeId }
      };
    });
    return (0, import_editor.computed)("elbow arrow snap lines", () => {
      const result = /* @__PURE__ */ new Map();
      const currentPageShapeIds = editor2.getCurrentPageShapeIds();
      const viewportBounds = editor2.getViewportPageBounds();
      for (const id of unselectedArrowShapeIds.get()) {
        if (!currentPageShapeIds.has(id)) continue;
        const shape = editor2.getShape(id);
        if (shape?.type !== "arrow") continue;
        const shapeBounds = editor2.getShapePageBounds(id);
        if (!shapeBounds || !viewportBounds.includes(shapeBounds)) continue;
        const bindings = (0, import_shared.getArrowBindings)(editor2, shape);
        const pageTransform = editor2.getShapePageTransform(id);
        if (!pageTransform) continue;
        const geometry = editor2.getShapeGeometry(id);
        const pageVertices = pageTransform.applyToPoints(geometry.vertices);
        for (let i = 1; i < pageVertices.length; i++) {
          const prev = pageVertices[i - 1];
          const curr = pageVertices[i];
          let angle = import_editor.Vec.Angle(prev, curr);
          if (angle < 0) angle += Math.PI;
          let set = result.get(angle);
          if (!set) {
            set = /* @__PURE__ */ new Set();
            result.set(angle, set);
          }
          const perpDistance = perpDistanceToLineAngle(prev, angle);
          set.add({
            perpDistance,
            startBoundShapeId: bindings.start?.toId,
            endBoundShapeId: bindings.end?.toId
          });
        }
      }
      return result;
    });
  }).get();
}
function perpDistanceToLineAngle(pointOnLine, lineAngle) {
  const perpDir = import_editor.Vec.FromAngle(lineAngle).per();
  return import_editor.Vec.Dpr(pointOnLine, perpDir);
}
function perpDistanceToLine(A, B) {
  return perpDistanceToLineAngle(A, import_editor.Vec.Angle(A, B));
}
//# sourceMappingURL=elbowArrowSnapLines.js.map
