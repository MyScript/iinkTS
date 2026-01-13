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
var SelectTool_exports = {};
__export(SelectTool_exports, {
  SelectTool: () => SelectTool
});
module.exports = __toCommonJS(SelectTool_exports);
var import_editor = require("@tldraw/editor");
var import_Brushing = require("./childStates/Brushing");
var import_Crop = require("./childStates/Crop/Crop");
var import_Cropping = require("./childStates/Crop/children/Cropping");
var import_PointingCropHandle = require("./childStates/Crop/children/PointingCropHandle");
var import_DraggingHandle = require("./childStates/DraggingHandle");
var import_EditingShape = require("./childStates/EditingShape");
var import_Idle = require("./childStates/Idle");
var import_PointingArrowLabel = require("./childStates/PointingArrowLabel");
var import_PointingCanvas = require("./childStates/PointingCanvas");
var import_PointingHandle = require("./childStates/PointingHandle");
var import_PointingResizeHandle = require("./childStates/PointingResizeHandle");
var import_PointingRotateHandle = require("./childStates/PointingRotateHandle");
var import_PointingSelection = require("./childStates/PointingSelection");
var import_PointingShape = require("./childStates/PointingShape");
var import_Resizing = require("./childStates/Resizing");
var import_Rotating = require("./childStates/Rotating");
var import_ScribbleBrushing = require("./childStates/ScribbleBrushing");
var import_Translating = require("./childStates/Translating");
class SelectTool extends import_editor.StateNode {
  static id = "select";
  static initial = "idle";
  static isLockable = false;
  reactor = void 0;
  static children() {
    return [
      import_Crop.Crop,
      import_Cropping.Cropping,
      import_Idle.Idle,
      import_PointingCanvas.PointingCanvas,
      import_PointingShape.PointingShape,
      import_Translating.Translating,
      import_Brushing.Brushing,
      import_ScribbleBrushing.ScribbleBrushing,
      import_PointingCropHandle.PointingCropHandle,
      import_PointingSelection.PointingSelection,
      import_PointingResizeHandle.PointingResizeHandle,
      import_EditingShape.EditingShape,
      import_Resizing.Resizing,
      import_Rotating.Rotating,
      import_PointingRotateHandle.PointingRotateHandle,
      import_PointingArrowLabel.PointingArrowLabel,
      import_PointingHandle.PointingHandle,
      import_DraggingHandle.DraggingHandle
    ];
  }
  // We want to clean up the duplicate props when the selection changes
  cleanUpDuplicateProps() {
    const selectedShapeIds = this.editor.getSelectedShapeIds();
    const instance = this.editor.getInstanceState();
    if (!instance.duplicateProps) return;
    const duplicatedShapes = new Set(instance.duplicateProps.shapeIds);
    if (selectedShapeIds.length === duplicatedShapes.size && selectedShapeIds.every((shapeId) => duplicatedShapes.has(shapeId))) {
      return;
    }
    this.editor.updateInstanceState({
      duplicateProps: null
    });
  }
  onEnter() {
    this.reactor = (0, import_editor.react)("clean duplicate props", () => {
      try {
        this.cleanUpDuplicateProps();
      } catch (e) {
        if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        } else {
          console.error(e);
        }
      }
    });
  }
  onExit() {
    this.reactor?.();
    if (this.editor.getCurrentPageState().editingShapeId) {
      this.editor.setEditingShape(null);
    }
  }
}
//# sourceMappingURL=SelectTool.js.map
