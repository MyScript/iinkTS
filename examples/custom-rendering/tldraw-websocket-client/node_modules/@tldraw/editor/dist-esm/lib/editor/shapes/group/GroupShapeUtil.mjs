import { jsx } from "react/jsx-runtime";
import { groupShapeMigrations, groupShapeProps } from "@tldraw/tlschema";
import { SVGContainer } from "../../../components/SVGContainer.mjs";
import { Group2d } from "../../../primitives/geometry/Group2d.mjs";
import { Rectangle2d } from "../../../primitives/geometry/Rectangle2d.mjs";
import { ShapeUtil } from "../ShapeUtil.mjs";
import { DashedOutlineBox } from "./DashedOutlineBox.mjs";
class GroupShapeUtil extends ShapeUtil {
  static type = "group";
  static props = groupShapeProps;
  static migrations = groupShapeMigrations;
  hideSelectionBoundsFg() {
    return true;
  }
  canBind() {
    return false;
  }
  canResize() {
    return true;
  }
  canResizeChildren() {
    return true;
  }
  getDefaultProps() {
    return {};
  }
  getGeometry(shape) {
    const children = this.editor.getSortedChildIdsForParent(shape.id);
    if (children.length === 0) {
      return new Rectangle2d({ width: 1, height: 1, isFilled: false });
    }
    return new Group2d({
      children: children.map((childId) => {
        const shape2 = this.editor.getShape(childId);
        return this.editor.getShapeGeometry(childId).transform(this.editor.getShapeLocalTransform(shape2), { isLabel: false });
      })
    });
  }
  component(shape) {
    const isErasing = this.editor.getErasingShapeIds().includes(shape.id);
    const { hintingShapeIds } = this.editor.getCurrentPageState();
    const isHintingOtherGroup = hintingShapeIds.length > 0 && hintingShapeIds.some(
      (id) => id !== shape.id && this.editor.isShapeOfType(this.editor.getShape(id), "group")
    );
    const isFocused = this.editor.getCurrentPageState().focusedGroupId !== shape.id;
    if (!isErasing && // always show the outline while we're erasing the group
    // show the outline while the group is focused unless something outside of the group is being hinted
    // this happens dropping shapes from a group onto some outside group
    (isFocused || isHintingOtherGroup)) {
      return null;
    }
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    return /* @__PURE__ */ jsx(SVGContainer, { children: /* @__PURE__ */ jsx(DashedOutlineBox, { className: "tl-group", bounds }) });
  }
  indicator(shape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    return /* @__PURE__ */ jsx(DashedOutlineBox, { className: "", bounds });
  }
  onChildrenChange(group) {
    const children = this.editor.getSortedChildIdsForParent(group.id);
    if (children.length === 0) {
      if (this.editor.getCurrentPageState().focusedGroupId === group.id) {
        this.editor.popFocusedGroupId();
      }
      this.editor.deleteShapes([group.id]);
      return;
    } else if (children.length === 1) {
      if (this.editor.getCurrentPageState().focusedGroupId === group.id) {
        this.editor.popFocusedGroupId();
      }
      this.editor.reparentShapes(children, group.parentId);
      this.editor.deleteShapes([group.id]);
      return;
    }
  }
}
export {
  GroupShapeUtil
};
//# sourceMappingURL=GroupShapeUtil.mjs.map
