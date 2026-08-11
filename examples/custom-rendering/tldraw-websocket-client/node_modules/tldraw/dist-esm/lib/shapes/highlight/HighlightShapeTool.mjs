import { StateNode } from "@tldraw/editor";
import { Drawing } from "../draw/toolStates/Drawing.mjs";
import { Idle } from "../draw/toolStates/Idle.mjs";
class HighlightShapeTool extends StateNode {
  static id = "highlight";
  static initial = "idle";
  static useCoalescedEvents = true;
  static children() {
    return [Idle, Drawing];
  }
  static isLockable = false;
  shapeType = "highlight";
  onExit() {
    const drawingState = this.children["drawing"];
    drawingState.initialShape = void 0;
  }
}
export {
  HighlightShapeTool
};
//# sourceMappingURL=HighlightShapeTool.mjs.map
