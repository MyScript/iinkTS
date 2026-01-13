import { StateNode } from "@tldraw/editor";
class Idle extends StateNode {
  static id = "idle";
  onPointerDown(info) {
    this.parent.transition("pointing", info);
  }
  onCancel() {
    this.editor.setCurrentTool("select");
  }
}
export {
  Idle
};
//# sourceMappingURL=Idle.mjs.map
