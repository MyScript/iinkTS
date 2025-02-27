import { StateNode } from "@tldraw/editor";
import { Cropping } from "./children/Cropping.mjs";
import { Idle } from "./children/Idle.mjs";
import { PointingCrop } from "./children/PointingCrop.mjs";
import { PointingCropHandle } from "./children/PointingCropHandle.mjs";
import { TranslatingCrop } from "./children/TranslatingCrop.mjs";
class Crop extends StateNode {
  static id = "crop";
  static initial = "idle";
  static children() {
    return [Idle, TranslatingCrop, PointingCrop, PointingCropHandle, Cropping];
  }
  markId = "";
  onEnter() {
    this.didExit = false;
    this.markId = this.editor.markHistoryStoppingPoint("crop");
  }
  didExit = false;
  onExit() {
    if (!this.didExit) {
      this.didExit = true;
      this.editor.squashToMark(this.markId);
    }
  }
  onCancel() {
    if (!this.didExit) {
      this.didExit = true;
      this.editor.bailToMark(this.markId);
    }
  }
}
export {
  Crop
};
//# sourceMappingURL=Crop.mjs.map
