import { StateNode, react } from "@tldraw/editor";
import { Brushing } from "./childStates/Brushing.mjs";
import { Crop } from "./childStates/Crop/Crop.mjs";
import { Cropping } from "./childStates/Crop/children/Cropping.mjs";
import { PointingCropHandle } from "./childStates/Crop/children/PointingCropHandle.mjs";
import { DraggingHandle } from "./childStates/DraggingHandle.mjs";
import { EditingShape } from "./childStates/EditingShape.mjs";
import { Idle } from "./childStates/Idle.mjs";
import { PointingArrowLabel } from "./childStates/PointingArrowLabel.mjs";
import { PointingCanvas } from "./childStates/PointingCanvas.mjs";
import { PointingHandle } from "./childStates/PointingHandle.mjs";
import { PointingResizeHandle } from "./childStates/PointingResizeHandle.mjs";
import { PointingRotateHandle } from "./childStates/PointingRotateHandle.mjs";
import { PointingSelection } from "./childStates/PointingSelection.mjs";
import { PointingShape } from "./childStates/PointingShape.mjs";
import { Resizing } from "./childStates/Resizing.mjs";
import { Rotating } from "./childStates/Rotating.mjs";
import { ScribbleBrushing } from "./childStates/ScribbleBrushing.mjs";
import { Translating } from "./childStates/Translating.mjs";
class SelectTool extends StateNode {
  static id = "select";
  static initial = "idle";
  static isLockable = false;
  reactor = void 0;
  static children() {
    return [
      Crop,
      Cropping,
      Idle,
      PointingCanvas,
      PointingShape,
      Translating,
      Brushing,
      ScribbleBrushing,
      PointingCropHandle,
      PointingSelection,
      PointingResizeHandle,
      EditingShape,
      Resizing,
      Rotating,
      PointingRotateHandle,
      PointingArrowLabel,
      PointingHandle,
      DraggingHandle
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
    this.reactor = react("clean duplicate props", () => {
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
export {
  SelectTool
};
//# sourceMappingURL=SelectTool.mjs.map
