import { StateNode } from "@tldraw/editor";
import { Drawing } from "./toolStates/Drawing.mjs";
import { Idle } from "./toolStates/Idle.mjs";
class DrawShapeTool extends StateNode {
  static id = "draw";
  static initial = "idle";
  static isLockable = false;
  static useCoalescedEvents = true;
  static children() {
    return [Idle, Drawing];
  }
  shapeType = "draw";
  onExit() {
    const drawingState = this.children["drawing"];
    drawingState.initialShape = void 0;
  }
}
export {
  DrawShapeTool
};
//# sourceMappingURL=DrawShapeTool.mjs.map
