import {
  computed,
  Vec,
  WeakCache
} from "@tldraw/editor";
import { getArrowBindings } from "../shared.mjs";
const snapLinesStore = new WeakCache();
function getElbowArrowSnapLines(editor) {
  return snapLinesStore.get(editor, (editor2) => {
    const currentSelectedArrowShape = computed("current selected arrow shape", () => {
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
    return computed("elbow arrow snap lines", () => {
      const result = /* @__PURE__ */ new Map();
      const currentPageShapeIds = editor2.getCurrentPageShapeIds();
      const viewportBounds = editor2.getViewportPageBounds();
      for (const id of unselectedArrowShapeIds.get()) {
        if (!currentPageShapeIds.has(id)) continue;
        const shape = editor2.getShape(id);
        if (shape?.type !== "arrow") continue;
        const shapeBounds = editor2.getShapePageBounds(id);
        if (!shapeBounds || !viewportBounds.includes(shapeBounds)) continue;
        const bindings = getArrowBindings(editor2, shape);
        const pageTransform = editor2.getShapePageTransform(id);
        if (!pageTransform) continue;
        const geometry = editor2.getShapeGeometry(id);
        const pageVertices = pageTransform.applyToPoints(geometry.vertices);
        for (let i = 1; i < pageVertices.length; i++) {
          const prev = pageVertices[i - 1];
          const curr = pageVertices[i];
          let angle = Vec.Angle(prev, curr);
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
  const perpDir = Vec.FromAngle(lineAngle).per();
  return Vec.Dpr(pointOnLine, perpDir);
}
function perpDistanceToLine(A, B) {
  return perpDistanceToLineAngle(A, Vec.Angle(A, B));
}
export {
  getElbowArrowSnapLines,
  perpDistanceToLine,
  perpDistanceToLineAngle
};
//# sourceMappingURL=elbowArrowSnapLines.mjs.map
