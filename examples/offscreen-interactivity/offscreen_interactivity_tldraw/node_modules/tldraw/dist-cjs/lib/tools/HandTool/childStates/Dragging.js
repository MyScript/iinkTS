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
var Dragging_exports = {};
__export(Dragging_exports, {
  Dragging: () => Dragging
});
module.exports = __toCommonJS(Dragging_exports);
var import_editor = require("@tldraw/editor");
class Dragging extends import_editor.StateNode {
  static id = "dragging";
  initialCamera = new import_editor.Vec();
  onEnter() {
    this.initialCamera = import_editor.Vec.From(this.editor.getCamera());
    this.update();
  }
  onPointerMove() {
    this.update();
  }
  onPointerUp() {
    this.complete();
  }
  onCancel() {
    this.parent.transition("idle");
  }
  onComplete() {
    this.complete();
  }
  update() {
    const { initialCamera, editor } = this;
    const { currentScreenPoint, originScreenPoint } = editor.inputs;
    const delta = import_editor.Vec.Sub(currentScreenPoint, originScreenPoint).div(editor.getZoomLevel());
    if (delta.len2() === 0) return;
    editor.setCamera(initialCamera.clone().add(delta));
  }
  complete() {
    const { editor } = this;
    const { pointerVelocity } = editor.inputs;
    const velocityAtPointerUp = Math.min(pointerVelocity.len(), 2);
    if (velocityAtPointerUp > 0.1) {
      this.editor.slideCamera({ speed: velocityAtPointerUp, direction: pointerVelocity });
    }
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=Dragging.js.map
