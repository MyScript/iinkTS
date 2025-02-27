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
var PointingShape_exports = {};
__export(PointingShape_exports, {
  PointingShape: () => PointingShape
});
module.exports = __toCommonJS(PointingShape_exports);
var import_editor = require("@tldraw/editor");
var import_shapes = require("../../../utils/shapes/shapes");
class PointingShape extends import_editor.StateNode {
  static id = "pointing_shape";
  hitShape = {};
  hitShapeForPointerUp = {};
  isDoubleClick = false;
  didCtrlOnEnter = false;
  didSelectOnEnter = false;
  onEnter(info) {
    const selectedShapeIds = this.editor.getSelectedShapeIds();
    const selectionBounds = this.editor.getSelectionRotatedPageBounds();
    const focusedGroupId = this.editor.getFocusedGroupId();
    const {
      inputs: { currentPagePoint }
    } = this.editor;
    const { shiftKey, altKey, accelKey } = info;
    this.hitShape = info.shape;
    this.isDoubleClick = false;
    this.didCtrlOnEnter = accelKey;
    const outermostSelectingShape = this.editor.getOutermostSelectableShape(info.shape);
    const selectedAncestor = this.editor.findShapeAncestor(
      outermostSelectingShape,
      (parent) => selectedShapeIds.includes(parent.id)
    );
    if (this.didCtrlOnEnter || // If the shape has an onClick handler
    this.editor.getShapeUtil(info.shape).onClick || // ...or if the shape is the focused layer (e.g. group)
    outermostSelectingShape.id === focusedGroupId || // ...or if the shape is within the selection
    selectedShapeIds.includes(outermostSelectingShape.id) || // ...or if an ancestor of the shape is selected
    selectedAncestor || // ...or if the current point is NOT within the selection bounds
    selectedShapeIds.length > 1 && selectionBounds?.containsPoint(currentPagePoint)) {
      this.didSelectOnEnter = false;
      this.hitShapeForPointerUp = outermostSelectingShape;
      return;
    }
    this.didSelectOnEnter = true;
    if (shiftKey && !altKey) {
      this.editor.cancelDoubleClick();
      if (!selectedShapeIds.includes(outermostSelectingShape.id)) {
        this.editor.markHistoryStoppingPoint("shift selecting shape");
        this.editor.setSelectedShapes([...selectedShapeIds, outermostSelectingShape.id]);
      }
    } else {
      this.editor.markHistoryStoppingPoint("selecting shape");
      this.editor.setSelectedShapes([outermostSelectingShape.id]);
    }
  }
  onPointerUp(info) {
    const selectedShapeIds = this.editor.getSelectedShapeIds();
    const focusedGroupId = this.editor.getFocusedGroupId();
    const zoomLevel = this.editor.getZoomLevel();
    const {
      inputs: { currentPagePoint }
    } = this.editor;
    const additiveSelectionKey = info.shiftKey || info.accelKey;
    const hitShape = this.editor.getShapeAtPoint(currentPagePoint, {
      margin: this.editor.options.hitTestMargin / zoomLevel,
      hitInside: true,
      renderingOnly: true
    }) ?? this.hitShape;
    const selectingShape = hitShape ? this.editor.getOutermostSelectableShape(hitShape) : this.hitShapeForPointerUp;
    if (selectingShape) {
      const util = this.editor.getShapeUtil(selectingShape);
      if (util.onClick) {
        const change = util.onClick?.(selectingShape);
        if (change) {
          this.editor.markHistoryStoppingPoint("shape on click");
          this.editor.updateShapes([change]);
          this.parent.transition("idle", info);
          return;
        }
      }
      if (selectingShape.id === focusedGroupId) {
        if (selectedShapeIds.length > 0) {
          this.editor.markHistoryStoppingPoint("clearing shape ids");
          this.editor.setSelectedShapes([]);
        } else {
          this.editor.popFocusedGroupId();
        }
        this.parent.transition("idle", info);
        return;
      }
    }
    if (!this.didSelectOnEnter) {
      const outermostSelectableShape = this.editor.getOutermostSelectableShape(
        hitShape,
        // if a group is selected, we want to stop before reaching that group
        // so we can drill down into the group
        (parent) => !selectedShapeIds.includes(parent.id)
      );
      if (selectedShapeIds.includes(outermostSelectableShape.id)) {
        if (additiveSelectionKey) {
          this.editor.markHistoryStoppingPoint("deselecting on pointer up");
          this.editor.deselect(selectingShape);
        } else {
          if (selectedShapeIds.includes(selectingShape.id)) {
            if (selectedShapeIds.length === 1) {
              const geometry = this.editor.getShapeUtil(selectingShape).getGeometry(selectingShape);
              const textLabels = (0, import_shapes.getTextLabels)(geometry);
              const textLabel = textLabels.length === 1 ? textLabels[0] : void 0;
              if (textLabel) {
                const pointInShapeSpace = this.editor.getPointInShapeSpace(
                  selectingShape,
                  currentPagePoint
                );
                if (textLabel.bounds.containsPoint(pointInShapeSpace, 0) && textLabel.hitTestPoint(pointInShapeSpace)) {
                  this.editor.run(() => {
                    this.editor.markHistoryStoppingPoint("editing on pointer up");
                    this.editor.select(selectingShape.id);
                    const util = this.editor.getShapeUtil(selectingShape);
                    if (this.editor.getIsReadonly()) {
                      if (!util.canEditInReadOnly(selectingShape)) {
                        return;
                      }
                    }
                    this.editor.setEditingShape(selectingShape.id);
                    this.editor.setCurrentTool("select.editing_shape");
                    if (this.isDoubleClick) {
                      this.editor.emit("select-all-text", { shapeId: selectingShape.id });
                    }
                  });
                  return;
                }
              }
            }
            this.editor.markHistoryStoppingPoint("selecting on pointer up");
            this.editor.select(selectingShape.id);
          } else {
            this.editor.markHistoryStoppingPoint("selecting on pointer up");
            this.editor.select(selectingShape);
          }
        }
      } else if (additiveSelectionKey) {
        const ancestors = this.editor.getShapeAncestors(outermostSelectableShape);
        this.editor.markHistoryStoppingPoint("shift deselecting on pointer up");
        this.editor.setSelectedShapes([
          ...this.editor.getSelectedShapeIds().filter((id) => !ancestors.find((a) => a.id === id)),
          outermostSelectableShape.id
        ]);
      } else {
        this.editor.markHistoryStoppingPoint("selecting on pointer up");
        this.editor.setSelectedShapes([outermostSelectableShape.id]);
      }
    }
    this.parent.transition("idle", info);
  }
  onDoubleClick() {
    this.isDoubleClick = true;
  }
  onPointerMove(info) {
    if (this.editor.inputs.isDragging) {
      if (this.didCtrlOnEnter) {
        this.parent.transition("brushing", info);
      } else {
        this.startTranslating(info);
      }
    }
  }
  onLongPress(info) {
    this.startTranslating(info);
  }
  startTranslating(info) {
    if (this.editor.getIsReadonly()) return;
    this.editor.focus();
    this.parent.transition("translating", info);
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
  cancel() {
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=PointingShape.js.map
