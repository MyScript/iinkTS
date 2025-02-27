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
var ScribbleBrushing_exports = {};
__export(ScribbleBrushing_exports, {
  ScribbleBrushing: () => ScribbleBrushing
});
module.exports = __toCommonJS(ScribbleBrushing_exports);
var import_editor = require("@tldraw/editor");
class ScribbleBrushing extends import_editor.StateNode {
  static id = "scribble_brushing";
  hits = /* @__PURE__ */ new Set();
  size = 0;
  scribbleId = "id";
  initialSelectedShapeIds = /* @__PURE__ */ new Set();
  newlySelectedShapeIds = /* @__PURE__ */ new Set();
  onEnter() {
    this.initialSelectedShapeIds = new Set(
      this.editor.inputs.shiftKey ? this.editor.getSelectedShapeIds() : []
    );
    this.newlySelectedShapeIds = /* @__PURE__ */ new Set();
    this.size = 0;
    this.hits.clear();
    const scribbleItem = this.editor.scribbles.addScribble({
      color: "selection-stroke",
      opacity: 0.32,
      size: 12
    });
    this.scribbleId = scribbleItem.id;
    this.updateScribbleSelection(true);
    this.editor.updateInstanceState({ brush: null });
  }
  onExit() {
    this.editor.scribbles.stop(this.scribbleId);
  }
  onPointerMove() {
    this.updateScribbleSelection(true);
  }
  onPointerUp() {
    this.complete();
  }
  onKeyDown() {
    this.updateScribbleSelection(false);
  }
  onKeyUp() {
    if (!this.editor.inputs.altKey) {
      this.parent.transition("brushing");
    } else {
      this.updateScribbleSelection(false);
    }
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.complete();
  }
  pushPointToScribble() {
    const { x, y } = this.editor.inputs.currentPagePoint;
    this.editor.scribbles.addPoint(this.scribbleId, x, y);
  }
  updateScribbleSelection(addPoint) {
    const { editor } = this;
    const currentPageShapes = this.editor.getCurrentPageRenderingShapesSorted();
    const {
      inputs: { shiftKey, originPagePoint, previousPagePoint, currentPagePoint }
    } = this.editor;
    const { newlySelectedShapeIds, initialSelectedShapeIds } = this;
    if (addPoint) {
      this.pushPointToScribble();
    }
    const shapes = currentPageShapes;
    let shape, geometry, A, B;
    const minDist = 0;
    for (let i = 0, n = shapes.length; i < n; i++) {
      shape = shapes[i];
      if (editor.isShapeOfType(shape, "group") || newlySelectedShapeIds.has(shape.id) || editor.isShapeOrAncestorLocked(shape)) {
        continue;
      }
      geometry = editor.getShapeGeometry(shape);
      if (editor.isShapeOfType(shape, "frame") && geometry.bounds.containsPoint(editor.getPointInShapeSpace(shape, originPagePoint))) {
        continue;
      }
      const pageTransform = editor.getShapePageTransform(shape);
      if (!geometry || !pageTransform) continue;
      const pt = pageTransform.clone().invert();
      A = pt.applyToPoint(previousPagePoint);
      B = pt.applyToPoint(currentPagePoint);
      const { bounds } = geometry;
      if (bounds.minX - minDist > Math.max(A.x, B.x) || bounds.minY - minDist > Math.max(A.y, B.y) || bounds.maxX + minDist < Math.min(A.x, B.x) || bounds.maxY + minDist < Math.min(A.y, B.y)) {
        continue;
      }
      if (geometry.hitTestLineSegment(A, B, minDist)) {
        const outermostShape = this.editor.getOutermostSelectableShape(shape);
        const pageMask = this.editor.getShapeMask(outermostShape.id);
        if (pageMask) {
          const intersection = (0, import_editor.intersectLineSegmentPolygon)(
            previousPagePoint,
            currentPagePoint,
            pageMask
          );
          if (intersection !== null) {
            const isInMask = (0, import_editor.pointInPolygon)(currentPagePoint, pageMask);
            if (!isInMask) continue;
          }
        }
        newlySelectedShapeIds.add(outermostShape.id);
      }
    }
    const current = editor.getSelectedShapeIds();
    const next = new Set(
      shiftKey ? [...newlySelectedShapeIds, ...initialSelectedShapeIds] : [...newlySelectedShapeIds]
    );
    if (current.length !== next.size || current.some((id) => !next.has(id))) {
      this.editor.setSelectedShapes(Array.from(next));
    }
  }
  complete() {
    this.updateScribbleSelection(true);
    this.parent.transition("idle");
  }
  cancel() {
    this.editor.setSelectedShapes([...this.initialSelectedShapeIds]);
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=ScribbleBrushing.js.map
