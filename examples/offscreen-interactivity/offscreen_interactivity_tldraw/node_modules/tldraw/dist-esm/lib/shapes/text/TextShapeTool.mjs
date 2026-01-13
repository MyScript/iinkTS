import { StateNode } from "@tldraw/editor";
import { Idle } from "./toolStates/Idle.mjs";
import { Pointing } from "./toolStates/Pointing.mjs";
class TextShapeTool extends StateNode {
  static id = "text";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
  shapeType = "text";
}
export {
  TextShapeTool
};
//# sourceMappingURL=TextShapeTool.mjs.map
