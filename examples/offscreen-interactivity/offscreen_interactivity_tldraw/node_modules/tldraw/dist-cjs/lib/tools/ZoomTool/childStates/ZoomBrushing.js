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
var ZoomBrushing_exports = {};
__export(ZoomBrushing_exports, {
  ZoomBrushing: () => ZoomBrushing
});
module.exports = __toCommonJS(ZoomBrushing_exports);
var import_editor = require("@tldraw/editor");
class ZoomBrushing extends import_editor.StateNode {
  static id = "zoom_brushing";
  info = {};
  zoomBrush = new import_editor.Box();
  onEnter(info) {
    this.info = info;
    this.update();
  }
  onExit() {
    this.editor.updateInstanceState({ zoomBrush: null });
  }
  onPointerMove() {
    this.update();
  }
  onPointerUp() {
    this.complete();
  }
  onCancel() {
    this.cancel();
  }
  update() {
    const {
      inputs: { originPagePoint, currentPagePoint }
    } = this.editor;
    this.zoomBrush.setTo(import_editor.Box.FromPoints([originPagePoint, currentPagePoint]));
    this.editor.updateInstanceState({ zoomBrush: this.zoomBrush.toJson() });
  }
  cancel() {
    this.parent.transition("idle", this.info);
  }
  complete() {
    const { zoomBrush } = this;
    const threshold = 8 / this.editor.getZoomLevel();
    if (zoomBrush.width < threshold && zoomBrush.height < threshold) {
      const point = this.editor.inputs.currentScreenPoint;
      if (this.editor.inputs.altKey) {
        this.editor.zoomOut(point, { animation: { duration: 220 } });
      } else {
        this.editor.zoomIn(point, { animation: { duration: 220 } });
      }
    } else {
      const targetZoom = this.editor.inputs.altKey ? this.editor.getZoomLevel() / 2 : void 0;
      this.editor.zoomToBounds(zoomBrush, { targetZoom, animation: { duration: 220 } });
    }
    this.parent.transition("idle", this.info);
  }
}
//# sourceMappingURL=ZoomBrushing.js.map
