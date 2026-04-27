import { StateNode } from "@tldraw/editor";
import { Erasing } from "./childStates/Erasing.mjs";
import { Idle } from "./childStates/Idle.mjs";
import { Pointing } from "./childStates/Pointing.mjs";
class EraserTool extends StateNode {
  static id = "eraser";
  static initial = "idle";
  static isLockable = false;
  static children() {
    return [Idle, Pointing, Erasing];
  }
  onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }
}
export {
  EraserTool
};
//# sourceMappingURL=EraserTool.mjs.map
