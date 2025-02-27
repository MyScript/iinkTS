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
var PointingArrowLabel_exports = {};
__export(PointingArrowLabel_exports, {
  PointingArrowLabel: () => PointingArrowLabel
});
module.exports = __toCommonJS(PointingArrowLabel_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("../../../shapes/arrow/shared");
class PointingArrowLabel extends import_editor.StateNode {
  static id = "pointing_arrow_label";
  shapeId = "";
  markId = "";
  wasAlreadySelected = false;
  didDrag = false;
  didCtrlOnEnter = false;
  info = {};
  updateCursor() {
    this.editor.setCursor({ type: "grabbing", rotation: 0 });
  }
  onEnter(info) {
    const { shape } = info;
    this.parent.setCurrentToolIdMask(info.onInteractionEnd);
    this.info = info;
    this.shapeId = shape.id;
    this.didDrag = false;
    this.didCtrlOnEnter = info.accelKey;
    this.wasAlreadySelected = this.editor.getOnlySelectedShapeId() === shape.id;
    this.updateCursor();
    const geometry = this.editor.getShapeGeometry(shape);
    const labelGeometry = geometry.children[1];
    if (!labelGeometry) {
      throw Error(`Expected to find an arrow label geometry for shape: ${shape.id}`);
    }
    const { currentPagePoint } = this.editor.inputs;
    const pointInShapeSpace = this.editor.getPointInShapeSpace(shape, currentPagePoint);
    this._labelDragOffset = import_editor.Vec.Sub(labelGeometry.center, pointInShapeSpace);
    this.markId = this.editor.markHistoryStoppingPoint("label-drag start");
    this.editor.setSelectedShapes([this.shapeId]);
  }
  onExit() {
    this.parent.setCurrentToolIdMask(void 0);
    this.editor.setCursor({ type: "default", rotation: 0 });
  }
  _labelDragOffset = new import_editor.Vec(0, 0);
  onPointerMove() {
    const { isDragging } = this.editor.inputs;
    if (!isDragging) return;
    if (this.didCtrlOnEnter) {
      this.parent.transition("brushing", this.info);
      return;
    }
    const shape = this.editor.getShape(this.shapeId);
    if (!shape) return;
    const info = (0, import_shared.getArrowInfo)(this.editor, shape);
    const groupGeometry = this.editor.getShapeGeometry(shape);
    const bodyGeometry = groupGeometry.children[0];
    const pointInShapeSpace = this.editor.getPointInShapeSpace(
      shape,
      this.editor.inputs.currentPagePoint
    );
    const nearestPoint = bodyGeometry.nearestPoint(
      import_editor.Vec.Add(pointInShapeSpace, this._labelDragOffset)
    );
    let nextLabelPosition;
    if (info.isStraight) {
      const lineLength = import_editor.Vec.Dist(info.start.point, info.end.point);
      const segmentLength = import_editor.Vec.Dist(info.end.point, nearestPoint);
      nextLabelPosition = 1 - segmentLength / lineLength;
    } else {
      const { _center, measure, angleEnd, angleStart } = groupGeometry.children[0];
      nextLabelPosition = (0, import_editor.getPointInArcT)(measure, angleStart, angleEnd, _center.angle(nearestPoint));
    }
    if (isNaN(nextLabelPosition)) {
      nextLabelPosition = 0.5;
    }
    this.didDrag = true;
    this.editor.updateShape({
      id: shape.id,
      type: shape.type,
      props: { labelPosition: nextLabelPosition }
    });
  }
  onPointerUp() {
    const shape = this.editor.getShape(this.shapeId);
    if (!shape) return;
    if (this.didDrag || !this.wasAlreadySelected) {
      this.complete();
    } else if (!this.editor.getIsReadonly()) {
      this.editor.setEditingShape(shape.id);
      this.editor.setCurrentTool("select.editing_shape");
    }
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.cancel();
  }
  onInterrupt() {
    this.cancel();
  }
  complete() {
    if (this.info.onInteractionEnd) {
      this.editor.setCurrentTool(this.info.onInteractionEnd, {});
    } else {
      this.parent.transition("idle");
    }
  }
  cancel() {
    this.editor.bailToMark(this.markId);
    if (this.info.onInteractionEnd) {
      this.editor.setCurrentTool(this.info.onInteractionEnd, {});
    } else {
      this.parent.transition("idle");
    }
  }
}
//# sourceMappingURL=PointingArrowLabel.js.map
