import { StateNode } from "@tldraw/editor";
class Idle extends StateNode {
  static id = "idle";
  shapeId = "";
  onEnter(info) {
    this.shapeId = info.shapeId;
    this.editor.setCursor({ type: "cross", rotation: 0 });
  }
  onPointerDown() {
    this.parent.transition("pointing", { shapeId: this.shapeId });
  }
  onCancel() {
    this.editor.setCurrentTool("select");
  }
}
export {
  Idle
};
//# sourceMappingURL=Idle.mjs.map
