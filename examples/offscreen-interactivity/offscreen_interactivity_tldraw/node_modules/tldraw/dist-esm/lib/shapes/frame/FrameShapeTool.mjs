import { BaseBoxShapeTool } from "@tldraw/editor";
class FrameShapeTool extends BaseBoxShapeTool {
  static id = "frame";
  static initial = "idle";
  shapeType = "frame";
  onCreate(shape) {
    if (!shape) return;
    const bounds = this.editor.getShapePageBounds(shape);
    const shapesToAddToFrame = [];
    const ancestorIds = this.editor.getShapeAncestors(shape).map((shape2) => shape2.id);
    this.editor.getSortedChildIdsForParent(shape.parentId).map((siblingShapeId) => {
      const siblingShape = this.editor.getShape(siblingShapeId);
      if (!siblingShape) return;
      if (siblingShape.id === shape.id) return;
      if (siblingShape.isLocked) return;
      const pageShapeBounds = this.editor.getShapePageBounds(siblingShape);
      if (!pageShapeBounds) return;
      if (bounds.contains(pageShapeBounds)) {
        if (canEnclose(siblingShape, ancestorIds, shape)) {
          shapesToAddToFrame.push(siblingShape.id);
        }
      }
    });
    this.editor.reparentShapes(shapesToAddToFrame, shape.id);
    if (this.editor.getInstanceState().isToolLocked) {
      this.editor.setCurrentTool("frame");
    } else {
      this.editor.setCurrentTool("select.idle");
    }
  }
}
function canEnclose(shape, ancestorIds, frame) {
  if (ancestorIds.includes(shape.id)) {
    return false;
  }
  if (shape.parentId === frame.parentId) {
    return true;
  }
  return false;
}
export {
  FrameShapeTool
};
//# sourceMappingURL=FrameShapeTool.mjs.map
