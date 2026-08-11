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
var GroupShapeUtil_exports = {};
__export(GroupShapeUtil_exports, {
  GroupShapeUtil: () => GroupShapeUtil
});
module.exports = __toCommonJS(GroupShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_tlschema = require("@tldraw/tlschema");
var import_SVGContainer = require("../../../components/SVGContainer");
var import_Group2d = require("../../../primitives/geometry/Group2d");
var import_Rectangle2d = require("../../../primitives/geometry/Rectangle2d");
var import_ShapeUtil = require("../ShapeUtil");
var import_DashedOutlineBox = require("./DashedOutlineBox");
class GroupShapeUtil extends import_ShapeUtil.ShapeUtil {
  static type = "group";
  static props = import_tlschema.groupShapeProps;
  static migrations = import_tlschema.groupShapeMigrations;
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
      return new import_Rectangle2d.Rectangle2d({ width: 1, height: 1, isFilled: false });
    }
    return new import_Group2d.Group2d({
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_SVGContainer.SVGContainer, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DashedOutlineBox.DashedOutlineBox, { className: "tl-group", bounds }) });
  }
  indicator(shape) {
    const bounds = this.editor.getShapeGeometry(shape).bounds;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_DashedOutlineBox.DashedOutlineBox, { className: "", bounds });
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
//# sourceMappingURL=GroupShapeUtil.js.map
