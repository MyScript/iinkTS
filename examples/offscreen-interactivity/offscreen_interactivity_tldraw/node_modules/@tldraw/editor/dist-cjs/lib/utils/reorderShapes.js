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
var reorderShapes_exports = {};
__export(reorderShapes_exports, {
  getReorderingShapesChanges: () => getReorderingShapesChanges
});
module.exports = __toCommonJS(reorderShapes_exports);
var import_utils = require("@tldraw/utils");
function getReorderingShapesChanges(editor, operation, ids, opts) {
  if (ids.length === 0) return [];
  const parents = /* @__PURE__ */ new Map();
  for (const shape of (0, import_utils.compact)(ids.map((id) => editor.getShape(id)))) {
    const { parentId } = shape;
    if (!parents.has(parentId)) {
      parents.set(parentId, {
        children: (0, import_utils.compact)(
          editor.getSortedChildIdsForParent(parentId).map((id) => editor.getShape(id))
        ),
        moving: /* @__PURE__ */ new Set()
      });
    }
    parents.get(parentId).moving.add(shape);
  }
  const changes = [];
  switch (operation) {
    case "toBack": {
      parents.forEach(({ moving, children }) => reorderToBack(moving, children, changes));
      break;
    }
    case "toFront": {
      parents.forEach(({ moving, children }) => reorderToFront(moving, children, changes));
      break;
    }
    case "forward": {
      parents.forEach(
        ({ moving, children }) => reorderForward(editor, moving, children, changes, opts)
      );
      break;
    }
    case "backward": {
      parents.forEach(
        ({ moving, children }) => reorderBackward(editor, moving, children, changes, opts)
      );
      break;
    }
  }
  return changes;
}
function reorderToBack(moving, children, changes) {
  const len = children.length;
  if (moving.size === len) return;
  let below;
  let above;
  for (let i = 0; i < len; i++) {
    const shape = children[i];
    if (moving.has(shape)) {
      below = shape.index;
      moving.delete(shape);
    } else {
      above = shape.index;
      break;
    }
  }
  if (moving.size === 0) {
    return;
  } else {
    const indices = (0, import_utils.getIndicesBetween)(below, above, moving.size);
    changes.push(
      ...Array.from(moving.values()).sort(import_utils.sortByIndex).map((shape, i) => ({ ...shape, index: indices[i] }))
    );
  }
}
function reorderToFront(moving, children, changes) {
  const len = children.length;
  if (moving.size === len) return;
  let below;
  let above;
  for (let i = len - 1; i > -1; i--) {
    const shape = children[i];
    if (moving.has(shape)) {
      above = shape.index;
      moving.delete(shape);
    } else {
      below = shape.index;
      break;
    }
  }
  if (moving.size === 0) {
    return;
  } else {
    const indices = (0, import_utils.getIndicesBetween)(below, above, moving.size);
    changes.push(
      ...Array.from(moving.values()).sort(import_utils.sortByIndex).map((shape, i) => ({ ...shape, index: indices[i] }))
    );
  }
}
function getOverlapChecker(editor, moving) {
  const movingBounds = (0, import_utils.compact)(
    Array.from(moving).map((shape) => {
      const bounds = editor.getShapePageBounds(shape);
      if (!bounds) return null;
      return { shape, bounds };
    })
  );
  const isOverlapping = (child) => {
    const bounds = editor.getShapePageBounds(child);
    if (!bounds) return false;
    return movingBounds.some((other) => {
      return other.bounds.includes(bounds);
    });
  };
  return isOverlapping;
}
function reorderForward(editor, moving, children, changes, opts) {
  const isOverlapping = getOverlapChecker(editor, moving);
  const len = children.length;
  if (moving.size === len) return;
  let state = { name: "skipping" };
  for (let i = 0; i < len; i++) {
    const isMoving = moving.has(children[i]);
    switch (state.name) {
      case "skipping": {
        if (!isMoving) continue;
        state = { name: "selecting", selectIndex: i };
        break;
      }
      case "selecting": {
        if (isMoving) continue;
        if (!opts?.considerAllShapes && !isOverlapping(children[i])) continue;
        const { selectIndex } = state;
        (0, import_utils.getIndicesBetween)(children[i].index, children[i + 1]?.index, i - selectIndex).forEach(
          (index, k) => {
            const child = children[selectIndex + k];
            if (!moving.has(child)) return;
            changes.push({ ...child, index });
          }
        );
        state = { name: "skipping" };
        break;
      }
    }
  }
}
function reorderBackward(editor, moving, children, changes, opts) {
  const isOverlapping = getOverlapChecker(editor, moving);
  const len = children.length;
  if (moving.size === len) return;
  let state = { name: "skipping" };
  for (let i = len - 1; i > -1; i--) {
    const isMoving = moving.has(children[i]);
    switch (state.name) {
      case "skipping": {
        if (!isMoving) continue;
        state = { name: "selecting", selectIndex: i };
        break;
      }
      case "selecting": {
        if (isMoving) continue;
        if (!opts?.considerAllShapes && !isOverlapping(children[i])) continue;
        (0, import_utils.getIndicesBetween)(children[i - 1]?.index, children[i].index, state.selectIndex - i).forEach(
          (index, k) => {
            const child = children[i + k + 1];
            if (!moving.has(child)) return;
            changes.push({ ...child, index });
          }
        );
        state = { name: "skipping" };
        break;
      }
    }
  }
}
//# sourceMappingURL=reorderShapes.js.map
