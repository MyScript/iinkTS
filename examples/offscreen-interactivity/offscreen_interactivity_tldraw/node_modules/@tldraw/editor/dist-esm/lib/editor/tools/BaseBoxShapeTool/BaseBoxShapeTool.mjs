import { StateNode } from "../StateNode.mjs";
import { Idle } from "./children/Idle.mjs";
import { Pointing } from "./children/Pointing.mjs";
class BaseBoxShapeTool extends StateNode {
  static id = "box";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
}
export {
  BaseBoxShapeTool
};
//# sourceMappingURL=BaseBoxShapeTool.mjs.map
