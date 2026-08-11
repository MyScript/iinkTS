import { StateNode } from "@tldraw/editor";
class Idle extends StateNode {
  static id = "idle";
  onEnter() {
    this.editor.setCursor({ type: "grab", rotation: 0 });
  }
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
