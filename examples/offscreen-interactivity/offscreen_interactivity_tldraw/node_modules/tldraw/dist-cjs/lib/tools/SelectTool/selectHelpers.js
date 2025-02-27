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
var selectHelpers_exports = {};
__export(selectHelpers_exports, {
  getOccludedChildren: () => getOccludedChildren,
  kickoutOccludedShapes: () => kickoutOccludedShapes,
  startEditingShapeWithLabel: () => startEditingShapeWithLabel
});
module.exports = __toCommonJS(selectHelpers_exports);
var import_editor = require("@tldraw/editor");
function kickoutOccludedShapes(editor, shapeIds) {
  const parentsToCheck = /* @__PURE__ */ new Set();
  for (const id of shapeIds) {
    const shape = editor.getShape(id);
    if (!shape) continue;
    if (editor.getShapeUtil(shape).onDragShapesOut) {
      parentsToCheck.add(shape);
    }
    const parent = editor.getShape(shape.parentId);
    if (!parent) continue;
    if (editor.getShapeUtil(parent).onDragShapesOut) {
      parentsToCheck.add(parent);
    }
  }
  const parentsWithKickedOutChildren = /* @__PURE__ */ new Map();
  for (const parent of parentsToCheck) {
    const occludedChildren = getOccludedChildren(editor, parent);
    if (occludedChildren.length) {
      parentsWithKickedOutChildren.set(parent, occludedChildren);
    }
  }
  for (const [parent, kickedOutChildrenIds] of parentsWithKickedOutChildren) {
    const shapeUtil = editor.getShapeUtil(parent);
    const kickedOutChildren = (0, import_editor.compact)(kickedOutChildrenIds.map((id) => editor.getShape(id)));
    shapeUtil.onDragShapesOut?.(parent, kickedOutChildren);
  }
}
function getOccludedChildren(editor, parent) {
  const childIds = editor.getSortedChildIdsForParent(parent.id);
  if (childIds.length === 0) return [];
  const parentPageBounds = editor.getShapePageBounds(parent);
  if (!parentPageBounds) return [];
  let parentGeometry;
  let parentPageTransform;
  let parentPageCorners;
  const results = [];
  for (const childId of childIds) {
    const shapePageBounds = editor.getShapePageBounds(childId);
    if (!shapePageBounds) {
      continue;
    }
    if (!parentPageBounds.includes(shapePageBounds)) {
      results.push(childId);
      continue;
    }
    parentGeometry ??= editor.getShapeGeometry(parent);
    parentPageTransform ??= editor.getShapePageTransform(parent);
    parentPageCorners ??= parentPageTransform.applyToPoints(parentGeometry.vertices);
    const parentCornersInShapeSpace = editor.getShapePageTransform(childId).clone().invert().applyToPoints(parentPageCorners);
    const { vertices, isClosed } = editor.getShapeGeometry(childId);
    if (vertices.some((v) => (0, import_editor.pointInPolygon)(v, parentCornersInShapeSpace))) {
      continue;
    }
    if (isClosed) {
      if ((0, import_editor.polygonsIntersect)(parentCornersInShapeSpace, vertices)) {
        continue;
      }
    } else if ((0, import_editor.polygonIntersectsPolyline)(parentCornersInShapeSpace, vertices)) {
      continue;
    }
    results.push(childId);
  }
  return results;
}
function startEditingShapeWithLabel(editor, shape, selectAll = false) {
  editor.select(shape);
  editor.setEditingShape(shape);
  editor.setCurrentTool("select.editing_shape", {
    target: "shape",
    shape
  });
  if (selectAll) {
    editor.emit("select-all-text", { shapeId: shape.id });
  }
}
//# sourceMappingURL=selectHelpers.js.map
