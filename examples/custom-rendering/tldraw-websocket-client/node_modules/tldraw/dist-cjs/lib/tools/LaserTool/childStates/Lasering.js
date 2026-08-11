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
var Lasering_exports = {};
__export(Lasering_exports, {
  Lasering: () => Lasering
});
module.exports = __toCommonJS(Lasering_exports);
var import_editor = require("@tldraw/editor");
class Lasering extends import_editor.StateNode {
  static id = "lasering";
  scribbleId = "id";
  onEnter() {
    const scribble = this.editor.scribbles.addScribble({
      color: "laser",
      opacity: 0.7,
      size: 4,
      delay: this.editor.options.laserDelayMs,
      shrink: 0.05,
      taper: true
    });
    this.scribbleId = scribble.id;
    this.pushPointToScribble();
  }
  onExit() {
    this.editor.scribbles.stop(this.scribbleId);
  }
  onPointerMove() {
    this.pushPointToScribble();
  }
  onPointerUp() {
    this.complete();
  }
  pushPointToScribble() {
    const { x, y } = this.editor.inputs.currentPagePoint;
    this.editor.scribbles.addPoint(this.scribbleId, x, y);
  }
  onCancel() {
    this.cancel();
  }
  onComplete() {
    this.complete();
  }
  complete() {
    this.parent.transition("idle");
  }
  cancel() {
    this.parent.transition("idle");
  }
}
//# sourceMappingURL=Lasering.js.map
