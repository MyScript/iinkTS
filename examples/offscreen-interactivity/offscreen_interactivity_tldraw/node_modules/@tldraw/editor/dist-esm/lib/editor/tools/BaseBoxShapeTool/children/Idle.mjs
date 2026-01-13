import { StateNode } from "../../StateNode.mjs";
class Idle extends StateNode {
  static id = "idle";
  onPointerDown(info) {
    this.parent.transition("pointing", info);
  }
  onEnter() {
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }
  onCancel() {
    this.editor.setCurrentTool("select");
  }
}
export {
  Idle
};
//# sourceMappingURL=Idle.mjs.map
