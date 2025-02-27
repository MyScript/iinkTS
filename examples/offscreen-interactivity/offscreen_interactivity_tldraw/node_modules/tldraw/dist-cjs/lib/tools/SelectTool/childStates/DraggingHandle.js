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
var DraggingHandle_exports = {};
__export(DraggingHandle_exports, {
  DraggingHandle: () => DraggingHandle
});
module.exports = __toCommonJS(DraggingHandle_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("../../../shapes/arrow/shared");
var import_selectHelpers = require("../selectHelpers");
class DraggingHandle extends import_editor.StateNode {
  static id = "dragging_handle";
  shapeId = "";
  initialHandle = {};
  initialAdjacentHandle = null;
  initialPagePoint = {};
  markId = "";
  initialPageTransform;
  initialPageRotation;
  info = {};
  isPrecise = false;
  isPreciseId = null;
  pointingId = null;
  onEnter(info) {
    const { shape, isCreating, creatingMarkId, handle } = info;
    this.info = info;
    this.parent.setCurrentToolIdMask(info.onInteractionEnd);
    this.shapeId = shape.id;
    this.markId = "";
    if (isCreating) {
      if (creatingMarkId) {
        this.markId = creatingMarkId;
      } else {
        const markId = this.editor.getMarkIdMatching(
          `creating:${this.editor.getOnlySelectedShapeId()}`
        );
        if (markId) {
          this.markId = markId;
        }
      }
    } else {
      this.markId = this.editor.markHistoryStoppingPoint("dragging handle");
    }
    this.initialHandle = (0, import_editor.structuredClone)(handle);
    if (this.editor.isShapeOfType(shape, "line")) {
      if (this.initialHandle.type === "create") {
        this.editor.updateShape({
          ...shape,
          props: {
            points: {
              ...shape.props.points,
              [handle.index]: { id: handle.index, index: handle.index, x: handle.x, y: handle.y }
            }
          }
        });
        const handlesAfter = this.editor.getShapeHandles(shape);
        const handleAfter = handlesAfter.find((h) => h.index === handle.index);
        this.initialHandle = (0, import_editor.structuredClone)(handleAfter);
      }
    }
    this.initialPageTransform = this.editor.getShapePageTransform(shape);
    this.initialPageRotation = this.initialPageTransform.rotation();
    this.initialPagePoint = this.editor.inputs.originPagePoint.clone();
    this.editor.setCursor({ type: isCreating ? "cross" : "grabbing", rotation: 0 });
    const handles = this.editor.getShapeHandles(shape).sort(import_editor.sortByIndex);
    const index = handles.findIndex((h) => h.id === info.handle.id);
    this.initialAdjacentHandle = null;
    for (let i = index + 1; i < handles.length; i++) {
      const handle2 = handles[i];
      if (handle2.type === "vertex" && handle2.id !== "middle" && handle2.id !== info.handle.id) {
        this.initialAdjacentHandle = handle2;
        break;
      }
    }
    if (!this.initialAdjacentHandle) {
      for (let i = handles.length - 1; i >= 0; i--) {
        const handle2 = handles[i];
        if (handle2.type === "vertex" && handle2.id !== "middle" && handle2.id !== info.handle.id) {
          this.initialAdjacentHandle = handle2;
          break;
        }
      }
    }
    if (this.editor.isShapeOfType(shape, "arrow")) {
      const initialBinding = (0, import_shared.getArrowBindings)(this.editor, shape)[info.handle.id];
      this.isPrecise = false;
      if (initialBinding) {
        this.editor.setHintingShapes([initialBinding.toId]);
        this.isPrecise = initialBinding.props.isPrecise;
        if (this.isPrecise) {
          this.isPreciseId = initialBinding.toId;
        } else {
          this.resetExactTimeout();
        }
      } else {
        this.editor.setHintingShapes([]);
      }
    }
    this.update();
    this.editor.select(this.shapeId);
  }
  // Only relevant to arrows
  exactTimeout = -1;
  // Only relevant to arrows
  resetExactTimeout() {
    if (this.exactTimeout !== -1) {
      this.clearExactTimeout();
    }
    this.exactTimeout = this.editor.timers.setTimeout(() => {
      if (this.getIsActive() && !this.isPrecise) {
        this.isPrecise = true;
        this.isPreciseId = this.pointingId;
        this.update();
      }
      this.exactTimeout = -1;
    }, 750);
  }
  // Only relevant to arrows
  clearExactTimeout() {
    if (this.exactTimeout !== -1) {
      clearTimeout(this.exactTimeout);
      this.exactTimeout = -1;
    }
  }
  onPointerMove() {
    this.update();
  }
  onKeyDown() {
    this.update();
  }
  onKeyUp() {
    this.update();
  }
  onPointerUp() {
    this.complete();
  }
  onComplete() {
    this.update();
    this.complete();
  }
  onCancel() {
    this.cancel();
  }
  onExit() {
    this.parent.setCurrentToolIdMask(void 0);
    this.editor.setHintingShapes([]);
    this.editor.snaps.clearIndicators();
    this.editor.setCursor({ type: "default", rotation: 0 });
  }
  complete() {
    this.editor.snaps.clearIndicators();
    (0, import_selectHelpers.kickoutOccludedShapes)(this.editor, [this.shapeId]);
    const { onInteractionEnd } = this.info;
    if (this.editor.getInstanceState().isToolLocked && onInteractionEnd) {
      this.editor.setCurrentTool(onInteractionEnd, { shapeId: this.shapeId });
      return;
    }
    this.parent.transition("idle");
  }
  cancel() {
    this.editor.bailToMark(this.markId);
    this.editor.snaps.clearIndicators();
    const { onInteractionEnd } = this.info;
    if (onInteractionEnd) {
      this.editor.setCurrentTool(onInteractionEnd, { shapeId: this.shapeId });
      return;
    }
    this.parent.transition("idle");
  }
  update() {
    const { editor, shapeId, initialPagePoint } = this;
    const { initialHandle, initialPageRotation, initialAdjacentHandle } = this;
    const hintingShapeIds = this.editor.getHintingShapeIds();
    const isSnapMode = this.editor.user.getIsSnapMode();
    const {
      snaps,
      inputs: { currentPagePoint, shiftKey, ctrlKey, altKey, pointerVelocity }
    } = editor;
    const initial = this.info.shape;
    const shape = editor.getShape(shapeId);
    if (!shape) return;
    const util = editor.getShapeUtil(shape);
    let point = currentPagePoint.clone().sub(initialPagePoint).rot(-initialPageRotation).add(initialHandle);
    if (shiftKey && initialAdjacentHandle && initialHandle.id !== "middle") {
      const angle = import_editor.Vec.Angle(initialAdjacentHandle, point);
      const snappedAngle = (0, import_editor.snapAngle)(angle, 24);
      const angleDifference = snappedAngle - angle;
      point = import_editor.Vec.RotWith(point, initialAdjacentHandle, angleDifference);
    }
    editor.snaps.clearIndicators();
    let nextHandle = { ...initialHandle, x: point.x, y: point.y };
    if (initialHandle.canSnap && (isSnapMode ? !ctrlKey : ctrlKey)) {
      const pageTransform = editor.getShapePageTransform(shape.id);
      if (!pageTransform) throw Error("Expected a page transform");
      const snap = snaps.handles.snapHandle({ currentShapeId: shapeId, handle: nextHandle });
      if (snap) {
        snap.nudge.rot(-editor.getShapeParentTransform(shape).rotation());
        point.add(snap.nudge);
        nextHandle = { ...initialHandle, x: point.x, y: point.y };
      }
    }
    const changes = util.onHandleDrag?.(shape, {
      handle: nextHandle,
      isPrecise: this.isPrecise || altKey,
      initial
    });
    const next = { id: shape.id, type: shape.type, ...changes };
    if (initialHandle.type === "vertex" && this.editor.isShapeOfType(shape, "arrow")) {
      const bindingAfter = (0, import_shared.getArrowBindings)(editor, shape)[initialHandle.id];
      if (bindingAfter) {
        if (hintingShapeIds[0] !== bindingAfter.toId) {
          editor.setHintingShapes([bindingAfter.toId]);
          this.pointingId = bindingAfter.toId;
          this.isPrecise = pointerVelocity.len() < 0.5 || altKey;
          this.isPreciseId = this.isPrecise ? bindingAfter.toId : null;
          this.resetExactTimeout();
        }
      } else {
        if (hintingShapeIds.length > 0) {
          editor.setHintingShapes([]);
          this.pointingId = null;
          this.isPrecise = false;
          this.isPreciseId = null;
          this.resetExactTimeout();
        }
      }
    }
    if (changes) {
      editor.updateShapes([next]);
    }
  }
}
//# sourceMappingURL=DraggingHandle.js.map
