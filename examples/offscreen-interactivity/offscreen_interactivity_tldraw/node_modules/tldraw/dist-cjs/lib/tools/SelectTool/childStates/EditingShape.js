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
var EditingShape_exports = {};
__export(EditingShape_exports, {
  EditingShape: () => EditingShape
});
module.exports = __toCommonJS(EditingShape_exports);
var import_editor = require("@tldraw/editor");
var import_shapes = require("../../../utils/shapes/shapes");
var import_updateHoveredShapeId = require("../../selection-logic/updateHoveredShapeId");
class EditingShape extends import_editor.StateNode {
  static id = "editing_shape";
  hitShapeForPointerUp = null;
  info = {};
  onEnter(info) {
    const editingShape = this.editor.getEditingShape();
    if (!editingShape) throw Error("Entered editing state without an editing shape");
    this.hitShapeForPointerUp = null;
    this.info = info;
    if (info.isCreatingTextWhileToolLocked) {
      this.parent.setCurrentToolIdMask("text");
    }
    (0, import_updateHoveredShapeId.updateHoveredShapeId)(this.editor);
    this.editor.select(editingShape);
  }
  onExit() {
    const { editingShapeId } = this.editor.getCurrentPageState();
    if (!editingShapeId) return;
    this.editor.setEditingShape(null);
    import_updateHoveredShapeId.updateHoveredShapeId.cancel();
    const shape = this.editor.getShape(editingShapeId);
    const util = this.editor.getShapeUtil(shape);
    util.onEditEnd?.(shape);
    if (this.info.isCreatingTextWhileToolLocked) {
      this.parent.setCurrentToolIdMask(void 0);
      this.editor.setCurrentTool("text", {});
    }
  }
  onPointerMove(info) {
    if (this.hitShapeForPointerUp && this.editor.inputs.isDragging) {
      if (this.editor.getIsReadonly()) return;
      if (this.hitShapeForPointerUp.isLocked) return;
      this.editor.select(this.hitShapeForPointerUp);
      this.parent.transition("translating", info);
      this.hitShapeForPointerUp = null;
      return;
    }
    switch (info.target) {
      case "shape":
      case "canvas": {
        (0, import_updateHoveredShapeId.updateHoveredShapeId)(this.editor);
        return;
      }
    }
  }
  onPointerDown(info) {
    this.hitShapeForPointerUp = null;
    switch (info.target) {
      case "shape": {
        const { shape: selectingShape } = info;
        const editingShape = this.editor.getEditingShape();
        if (!editingShape) {
          throw Error("Expected an editing shape!");
        }
        const geometry = this.editor.getShapeUtil(selectingShape).getGeometry(selectingShape);
        const textLabels = (0, import_shapes.getTextLabels)(geometry);
        const textLabel = textLabels.length === 1 ? textLabels[0] : void 0;
        const isEmptyTextShape = this.editor.isShapeOfType(editingShape, "text") && editingShape.props.text.trim() === "";
        if (textLabel && !isEmptyTextShape) {
          const pointInShapeSpace = this.editor.getPointInShapeSpace(
            selectingShape,
            this.editor.inputs.currentPagePoint
          );
          if (textLabel.bounds.containsPoint(pointInShapeSpace, 0) && textLabel.hitTestPoint(pointInShapeSpace)) {
            if (selectingShape.id === editingShape.id) {
              return;
            } else {
              this.hitShapeForPointerUp = selectingShape;
              this.editor.markHistoryStoppingPoint("editing on pointer up");
              this.editor.select(selectingShape.id);
              return;
            }
          }
        } else {
          if (selectingShape.id === editingShape.id) {
            if (this.editor.isShapeOfType(selectingShape, "frame")) {
              this.editor.setEditingShape(null);
              this.parent.transition("idle", info);
            }
          } else {
            this.parent.transition("pointing_shape", info);
            return;
          }
          return;
        }
        break;
      }
    }
    this.parent.transition("idle", info);
    this.editor.root.handleEvent(info);
  }
  onPointerUp(info) {
    const hitShape = this.hitShapeForPointerUp;
    if (!hitShape) return;
    this.hitShapeForPointerUp = null;
    const util = this.editor.getShapeUtil(hitShape);
    if (hitShape.isLocked) return;
    if (this.editor.getIsReadonly()) {
      if (!util.canEditInReadOnly(hitShape)) {
        this.parent.transition("pointing_shape", info);
        return;
      }
    }
    this.editor.select(hitShape.id);
    this.editor.setEditingShape(hitShape.id);
    (0, import_updateHoveredShapeId.updateHoveredShapeId)(this.editor);
  }
  onComplete(info) {
    this.parent.transition("idle", info);
  }
  onCancel(info) {
    this.parent.transition("idle", info);
  }
}
//# sourceMappingURL=EditingShape.js.map
