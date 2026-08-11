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
var Erasing_exports = {};
__export(Erasing_exports, {
  Erasing: () => Erasing
});
module.exports = __toCommonJS(Erasing_exports);
var import_editor = require("@tldraw/editor");
class Erasing extends import_editor.StateNode {
  static id = "erasing";
  info = {};
  scribbleId = "id";
  markId = "";
  excludedShapeIds = /* @__PURE__ */ new Set();
  onEnter(info) {
    this.markId = this.editor.markHistoryStoppingPoint("erase scribble begin");
    this.info = info;
    const { originPagePoint } = this.editor.inputs;
    this.excludedShapeIds = new Set(
      this.editor.getCurrentPageShapes().filter((shape) => {
        if (this.editor.isShapeOrAncestorLocked(shape)) return true;
        if (this.editor.isShapeOfType(shape, "group") || this.editor.isShapeOfType(shape, "frame")) {
          const pointInShapeShape = this.editor.getPointInShapeSpace(shape, originPagePoint);
          const geometry = this.editor.getShapeGeometry(shape);
          return geometry.bounds.containsPoint(pointInShapeShape);
        }
        return false;
      }).map((shape) => shape.id)
    );
    const scribble = this.editor.scribbles.addScribble({
      color: "muted-1",
      size: 12
    });
    this.scribbleId = scribble.id;
    this.update();
  }
  pushPointToScribble() {
    const { x, y } = this.editor.inputs.currentPagePoint;
    this.editor.scribbles.addPoint(this.scribbleId, x, y);
  }
  onExit() {
    this.editor.setErasingShapes([]);
    this.editor.scribbles.stop(this.scribbleId);
  }
  onPointerMove() {
    this.update();
  }
  onPointerUp() {
    this.complete();
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.complete();
  }
  update() {
    const { editor, excludedShapeIds } = this;
    const erasingShapeIds = editor.getErasingShapeIds();
    const zoomLevel = editor.getZoomLevel();
    const currentPageShapes = editor.getCurrentPageRenderingShapesSorted();
    const {
      inputs: { currentPagePoint, previousPagePoint }
    } = editor;
    this.pushPointToScribble();
    const erasing = new Set(erasingShapeIds);
    const minDist = this.editor.options.hitTestMargin / zoomLevel;
    for (const shape of currentPageShapes) {
      if (editor.isShapeOfType(shape, "group")) continue;
      const pageMask = editor.getShapeMask(shape.id);
      if (pageMask && !(0, import_editor.pointInPolygon)(currentPagePoint, pageMask)) {
        continue;
      }
      const geometry = editor.getShapeGeometry(shape);
      const pageTransform = editor.getShapePageTransform(shape);
      if (!geometry || !pageTransform) continue;
      const pt = pageTransform.clone().invert();
      const A = pt.applyToPoint(previousPagePoint);
      const B = pt.applyToPoint(currentPagePoint);
      const { bounds } = geometry;
      if (bounds.minX - minDist > Math.max(A.x, B.x) || bounds.minY - minDist > Math.max(A.y, B.y) || bounds.maxX + minDist < Math.min(A.x, B.x) || bounds.maxY + minDist < Math.min(A.y, B.y)) {
        continue;
      }
      if (geometry.hitTestLineSegment(A, B, minDist)) {
        erasing.add(editor.getOutermostSelectableShape(shape).id);
      }
    }
    this.editor.setErasingShapes([...erasing].filter((id) => !excludedShapeIds.has(id)));
  }
  complete() {
    const { editor } = this;
    editor.deleteShapes(editor.getCurrentPageState().erasingShapeIds);
    this.parent.transition("idle");
  }
  cancel() {
    const { editor } = this;
    editor.bailToMark(this.markId);
    this.parent.transition("idle", this.info);
  }
}
//# sourceMappingURL=Erasing.js.map
