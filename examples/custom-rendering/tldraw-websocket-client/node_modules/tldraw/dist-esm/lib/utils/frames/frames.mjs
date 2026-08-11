import {
  Box,
  Vec,
  compact,
  kickoutOccludedShapes
} from "@tldraw/editor";
function removeFrame(editor, ids) {
  const frames = compact(
    ids.map((id) => editor.getShape(id)).filter((f) => f && editor.isShapeOfType(f, "frame"))
  );
  if (!frames.length) return;
  const allChildren = [];
  editor.run(() => {
    frames.map((frame) => {
      const children = editor.getSortedChildIdsForParent(frame.id);
      if (children.length) {
        kickoutOccludedShapes(editor, children, {
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
  const bounds = Box.FromPoints(
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
  const children = compact(childIds.map((id2) => editor.getShape(id2)));
  if (!children.length) return;
  const { w, h, dx, dy } = getFrameChildrenBounds(children, editor, opts);
  if (dx === 0 && dy === 0 && frame.props.w === w && frame.props.h === h) return;
  const diff = new Vec(dx, dy).rot(frame.rotation);
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
export {
  DEFAULT_FRAME_PADDING,
  fitFrameToContent,
  getFrameChildrenBounds,
  removeFrame
};
//# sourceMappingURL=frames.mjs.map
