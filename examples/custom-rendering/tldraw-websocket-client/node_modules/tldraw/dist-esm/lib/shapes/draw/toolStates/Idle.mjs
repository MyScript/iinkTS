import { StateNode } from "@tldraw/editor";
class Idle extends StateNode {
  static id = "idle";
  onPointerDown(info) {
    this.parent.transition("drawing", info);
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
