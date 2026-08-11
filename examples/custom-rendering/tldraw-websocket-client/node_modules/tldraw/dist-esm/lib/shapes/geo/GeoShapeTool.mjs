import { StateNode } from "@tldraw/editor";
import { Idle } from "./toolStates/Idle.mjs";
import { Pointing } from "./toolStates/Pointing.mjs";
class GeoShapeTool extends StateNode {
  static id = "geo";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
  shapeType = "geo";
}
export {
  GeoShapeTool
};
//# sourceMappingURL=GeoShapeTool.mjs.map
