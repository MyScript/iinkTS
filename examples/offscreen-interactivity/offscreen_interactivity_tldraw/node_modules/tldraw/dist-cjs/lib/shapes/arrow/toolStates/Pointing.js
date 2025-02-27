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
var Pointing_exports = {};
__export(Pointing_exports, {
  Pointing: () => Pointing
});
module.exports = __toCommonJS(Pointing_exports);
var import_editor = require("@tldraw/editor");
class Pointing extends import_editor.StateNode {
  static id = "pointing";
  shape;
  markId = "";
  onEnter() {
    this.markId = "";
    this.didTimeout = false;
    const target = this.editor.getShapeAtPoint(this.editor.inputs.currentPagePoint, {
      filter: (targetShape) => {
        return !targetShape.isLocked && this.editor.canBindShapes({ fromShape: "arrow", toShape: targetShape, binding: "arrow" });
      },
      margin: 0,
      hitInside: true,
      renderingOnly: true
    });
    if (!target) {
      this.createArrowShape();
    } else {
      this.editor.setHintingShapes([target.id]);
    }
    this.startPreciseTimeout();
  }
  onExit() {
    this.shape = void 0;
    this.editor.setHintingShapes([]);
    this.clearPreciseTimeout();
  }
  onPointerMove() {
    if (this.editor.inputs.isDragging) {
      if (!this.shape) {
        this.createArrowShape();
      }
      if (!this.shape) throw Error(`expected shape`);
      this.updateArrowShapeEndHandle();
      this.editor.setCurrentTool("select.dragging_handle", {
        shape: this.shape,
        handle: { id: "end", type: "vertex", index: "a3", x: 0, y: 0 },
        isCreating: true,
        creatingMarkId: this.markId || void 0,
        onInteractionEnd: "arrow"
      });
    }
  }
  onPointerUp() {
    this.cancel();
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
    if (this.shape) {
      this.editor.bailToMark(this.markId);
    }
    this.editor.setHintingShapes([]);
    this.parent.transition("idle");
  }
  createArrowShape() {
    const { originPagePoint } = this.editor.inputs;
    const id = (0, import_editor.createShapeId)();
    this.markId = this.editor.markHistoryStoppingPoint(`creating_arrow:${id}`);
    const newPoint = (0, import_editor.maybeSnapToGrid)(originPagePoint, this.editor);
    this.editor.createShape({
      id,
      type: "arrow",
      x: newPoint.x,
      y: newPoint.y,
      props: {
        scale: this.editor.user.getIsDynamicResizeMode() ? 1 / this.editor.getZoomLevel() : 1
      }
    });
    const shape = this.editor.getShape(id);
    if (!shape) throw Error(`expected shape`);
    const handles = this.editor.getShapeHandles(shape);
    if (!handles) throw Error(`expected handles for arrow`);
    const util = this.editor.getShapeUtil("arrow");
    const initial = this.shape;
    const startHandle = handles.find((h) => h.id === "start");
    const change = util.onHandleDrag?.(shape, {
      handle: { ...startHandle, x: 0, y: 0 },
      isPrecise: true,
      initial
    });
    if (change) {
      this.editor.updateShapes([change]);
    }
    this.shape = this.editor.getShape(id);
    this.editor.select(id);
  }
  updateArrowShapeEndHandle() {
    const shape = this.shape;
    if (!shape) throw Error(`expected shape`);
    const handles = this.editor.getShapeHandles(shape);
    if (!handles) throw Error(`expected handles for arrow`);
    {
      const util = this.editor.getShapeUtil("arrow");
      const initial = this.shape;
      const startHandle = handles.find((h) => h.id === "start");
      const change = util.onHandleDrag?.(shape, {
        handle: { ...startHandle, x: 0, y: 0 },
        isPrecise: this.didTimeout,
        // sure about that?
        initial
      });
      if (change) {
        this.editor.updateShapes([change]);
      }
    }
    {
      const util = this.editor.getShapeUtil("arrow");
      const initial = this.shape;
      const point = this.editor.getPointInShapeSpace(shape, this.editor.inputs.currentPagePoint);
      const endHandle = handles.find((h) => h.id === "end");
      const change = util.onHandleDrag?.(this.editor.getShape(shape), {
        handle: { ...endHandle, x: point.x, y: point.y },
        isPrecise: false,
        // sure about that?
        initial
      });
      if (change) {
        this.editor.updateShapes([change]);
      }
    }
    this.shape = this.editor.getShape(shape.id);
  }
  preciseTimeout = -1;
  didTimeout = false;
  startPreciseTimeout() {
    this.preciseTimeout = this.editor.timers.setTimeout(() => {
      if (!this.getIsActive()) return;
      this.didTimeout = true;
    }, 320);
  }
  clearPreciseTimeout() {
    clearTimeout(this.preciseTimeout);
  }
}
//# sourceMappingURL=Pointing.js.map
