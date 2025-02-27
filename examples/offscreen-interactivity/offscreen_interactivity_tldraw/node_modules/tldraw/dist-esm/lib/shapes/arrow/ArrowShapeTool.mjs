import { StateNode } from "@tldraw/editor";
import { Idle } from "./toolStates/Idle.mjs";
import { Pointing } from "./toolStates/Pointing.mjs";
class ArrowShapeTool extends StateNode {
  static id = "arrow";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
  shapeType = "arrow";
}
export {
  ArrowShapeTool
};
//# sourceMappingURL=ArrowShapeTool.mjs.map
