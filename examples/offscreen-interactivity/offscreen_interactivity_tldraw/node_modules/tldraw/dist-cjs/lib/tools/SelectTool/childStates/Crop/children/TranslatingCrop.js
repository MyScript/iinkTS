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
var TranslatingCrop_exports = {};
__export(TranslatingCrop_exports, {
  TranslatingCrop: () => TranslatingCrop
});
module.exports = __toCommonJS(TranslatingCrop_exports);
var import_editor = require("@tldraw/editor");
var import_crop_helpers = require("./crop_helpers");
class TranslatingCrop extends import_editor.StateNode {
  static id = "translating_crop";
  info = {};
  markId = "";
  snapshot = {};
  onEnter(info) {
    this.info = info;
    this.snapshot = this.createSnapshot();
    this.markId = this.editor.markHistoryStoppingPoint("translating_crop");
    this.editor.setCursor({ type: "move", rotation: 0 });
    this.updateShapes();
  }
  onExit() {
    this.editor.setCursor({ type: "default", rotation: 0 });
  }
  onPointerMove() {
    this.updateShapes();
  }
  onPointerUp() {
    this.complete();
  }
  onComplete() {
    this.complete();
  }
  onCancel() {
    this.cancel();
  }
  onKeyDown(info) {
    switch (info.key) {
      case "Alt":
      case "Shift": {
        this.updateShapes();
        return;
      }
    }
  }
  onKeyUp(info) {
    switch (info.key) {
      case "Enter": {
        this.complete();
        return;
      }
      case "Alt":
      case "Shift": {
        this.updateShapes();
      }
    }
  }
  complete() {
    this.updateShapes();
    this.editor.setCurrentTool("select.crop.idle", this.info);
  }
  cancel() {
    this.editor.bailToMark(this.markId);
    this.editor.setCurrentTool("select.crop.idle", this.info);
  }
  createSnapshot() {
    const shape = this.editor.getOnlySelectedShape();
    return { shape };
  }
  updateShapes() {
    const shape = this.snapshot.shape;
    if (!shape) return;
    const { originPagePoint, currentPagePoint } = this.editor.inputs;
    const delta = currentPagePoint.clone().sub(originPagePoint);
    const partial = (0, import_crop_helpers.getTranslateCroppedImageChange)(this.editor, shape, delta);
    if (partial) {
      this.editor.updateShapes([partial]);
    }
  }
}
//# sourceMappingURL=TranslatingCrop.js.map
