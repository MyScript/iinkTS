import { StateNode } from "@tldraw/editor";
import { Idle } from "./toolStates/Idle.mjs";
import { Pointing } from "./toolStates/Pointing.mjs";
class LineShapeTool extends StateNode {
  static id = "line";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
  shapeType = "line";
}
export {
  LineShapeTool
};
//# sourceMappingURL=LineShapeTool.mjs.map
