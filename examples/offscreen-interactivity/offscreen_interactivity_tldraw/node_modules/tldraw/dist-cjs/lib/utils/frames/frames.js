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
var frames_exports = {};
__export(frames_exports, {
  DEFAULT_FRAME_PADDING: () => DEFAULT_FRAME_PADDING,
  fitFrameToContent: () => fitFrameToContent,
  getFrameChildrenBounds: () => getFrameChildrenBounds,
  removeFrame: () => removeFrame
});
module.exports = __toCommonJS(frames_exports);
var import_editor = require("@tldraw/editor");
function removeFrame(editor, ids) {
  const frames = (0, import_editor.compact)(
    ids.map((id) => editor.getShape(id)).filter((f) => f && editor.isShapeOfType(f, "frame"))
  );
  if (!frames.length) return;
  const allChildren = [];
  editor.run(() => {
    frames.map((frame) => {
      const children = editor.getSortedChildIdsForParent(frame.id);
      if (children.length) {
        (0, import_editor.kickoutOccludedShapes)(editor, children, {
          filter: (s) => !frames.find((f) => f.id === s.id)
        });
        allChildren.push(...children);
      }
    });
    editor.setSelectedShapes(allChildren);
    editor.deleteShapes(ids);
  });
}
const DEFAULT_FRAME_PADDING = 50;
function getFrameChildrenBounds(children, editor, opts = { padding: DEFAULT_FRAME_PADDING }) {
  const bounds = import_editor.Box.FromPoints(
    children.flatMap((shape) => {
      if (!shape) return [];
      const geometry = editor.getShapeGeometry(shape.id);
      const transform = editor.getShapeLocalTransform(shape);
      return transform?.applyToPoints(geometry.vertices) ?? [];
    })
  );
  const padding = opts.padding ?? DEFAULT_FRAME_PADDING;
  const w = bounds.w + 2 * padding;
  const h = bounds.h + 2 * padding;
  const dx = padding - bounds.minX;
  const dy = padding - bounds.minY;
  return { w, h, dx, dy };
}
function fitFrameToContent(editor, id, opts = {}) {
  const frame = editor.getShape(id);
  if (!frame) return;
  const childIds = editor.getSortedChildIdsForParent(frame.id);
  const children = (0, import_editor.compact)(childIds.map((id2) => editor.getShape(id2)));
  if (!children.length) return;
  const { w, h, dx, dy } = getFrameChildrenBounds(children, editor, opts);
  if (dx === 0 && dy === 0 && frame.props.w === w && frame.props.h === h) return;
  const diff = new import_editor.Vec(dx, dy).rot(frame.rotation);
  editor.run(() => {
    const changes = childIds.map((child) => {
      const shape = editor.getShape(child);
      return {
        id: shape.id,
        type: shape.type,
        x: shape.x + dx,
        y: shape.y + dy
      };
    });
    changes.push({
      id: frame.id,
      type: frame.type,
      x: frame.x - diff.x,
      y: frame.y - diff.y,
      props: {
        w,
        h
      }
    });
    editor.updateShapes(changes);
  });
}
//# sourceMappingURL=frames.js.map
