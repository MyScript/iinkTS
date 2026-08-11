import { StateNode } from "@tldraw/editor";
import { Idle } from "./toolStates/Idle.mjs";
import { Pointing } from "./toolStates/Pointing.mjs";
class NoteShapeTool extends StateNode {
  static id = "note";
  static initial = "idle";
  static children() {
    return [Idle, Pointing];
  }
  shapeType = "note";
}
export {
  NoteShapeTool
};
//# sourceMappingURL=NoteShapeTool.mjs.map
