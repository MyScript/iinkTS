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
var PointingHandle_exports = {};
__export(PointingHandle_exports, {
  PointingHandle: () => PointingHandle
});
module.exports = __toCommonJS(PointingHandle_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("../../../shapes/arrow/shared");
var import_noteHelpers = require("../../../shapes/note/noteHelpers");
var import_selectHelpers = require("../selectHelpers");
class PointingHandle extends import_editor.StateNode {
  static id = "pointing_handle";
  didCtrlOnEnter = false;
  info = {};
  onEnter(info) {
    this.info = info;
    this.didCtrlOnEnter = info.accelKey;
    const { shape } = info;
    if (this.editor.isShapeOfType(shape, "arrow")) {
      const initialBinding = (0, import_shared.getArrowBindings)(this.editor, shape)[info.handle.id];
      if (initialBinding) {
        this.editor.setHintingShapes([initialBinding.toId]);
      }
    }
    this.editor.setCursor({ type: "grabbing", rotation: 0 });
  }
  onExit() {
    this.editor.setHintingShapes([]);
    this.editor.setCursor({ type: "default", rotation: 0 });
  }
  onPointerUp() {
    const { shape, handle } = this.info;
    if (this.editor.isShapeOfType(shape, "note")) {
      const { editor } = this;
      const nextNote = getNoteForPit(editor, shape, handle, false);
      if (nextNote) {
        (0, import_selectHelpers.startEditingShapeWithLabel)(
          editor,
          nextNote,
          true
          /* selectAll */
        );
        return;
      }
    }
    this.parent.transition("idle", this.info);
  }
  onPointerMove(info) {
    const { editor } = this;
    if (editor.inputs.isDragging) {
      if (this.didCtrlOnEnter) {
        this.parent.transition("brushing", info);
      } else {
        this.startDraggingHandle();
      }
    }
  }
  onLongPress() {
    this.startDraggingHandle();
  }
  startDraggingHandle() {
    const { editor } = this;
    if (editor.getIsReadonly()) return;
    const { shape, handle } = this.info;
    if (editor.isShapeOfType(shape, "note")) {
      const nextNote = getNoteForPit(editor, shape, handle, true);
      if (nextNote) {
        const centeredOnPointer = editor.getPointInParentSpace(nextNote, editor.inputs.originPagePoint).sub(import_editor.Vec.Rot(import_noteHelpers.NOTE_CENTER_OFFSET.clone().mul(shape.props.scale), nextNote.rotation));
        editor.updateShape({ ...nextNote, x: centeredOnPointer.x, y: centeredOnPointer.y });
        editor.setHoveredShape(nextNote.id).select(nextNote.id).setCurrentTool("select.translating", {
          ...this.info,
          target: "shape",
          shape: editor.getShape(nextNote),
          onInteractionEnd: "note",
          isCreating: true,
          onCreate: () => {
            (0, import_selectHelpers.startEditingShapeWithLabel)(
              editor,
              nextNote,
              true
              /* selectAll */
            );
          }
        });
        return;
      }
    }
    this.parent.transition("dragging_handle", this.info);
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
function getNoteForPit(editor, shape, handle, forceNew) {
  const pageTransform = editor.getShapePageTransform(shape.id);
  const pagePoint = pageTransform.point();
  const pageRotation = pageTransform.rotation();
  const pits = (0, import_noteHelpers.getNoteAdjacentPositions)(
    editor,
    pagePoint,
    pageRotation,
    shape.props.growY,
    0,
    shape.props.scale
  );
  const pit = pits[handle.index];
  if (pit) {
    return (0, import_noteHelpers.getNoteShapeForAdjacentPosition)(editor, shape, pit, pageRotation, forceNew);
  }
}
//# sourceMappingURL=PointingHandle.js.map
