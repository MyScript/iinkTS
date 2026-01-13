"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var selectOnCanvasPointerUp_exports = {};
__export(selectOnCanvasPointerUp_exports, {
  selectOnCanvasPointerUp: () => selectOnCanvasPointerUp
});
module.exports = __toCommonJS(selectOnCanvasPointerUp_exports);
var import_editor = require("@tldraw/editor");
function selectOnCanvasPointerUp(editor, info) {
  const selectedShapeIds = editor.getSelectedShapeIds();
  const { currentPagePoint } = editor.inputs;
  const { shiftKey, altKey, accelKey } = info;
  const additiveSelectionKey = shiftKey || accelKey;
  const hitShape = editor.getShapeAtPoint(currentPagePoint, {
    hitInside: false,
    margin: editor.options.hitTestMargin / editor.getZoomLevel(),
    hitLabels: true,
    renderingOnly: true,
    filter: (shape) => !shape.isLocked
  });
  if (hitShape) {
    const outermostSelectableShape = editor.getOutermostSelectableShape(hitShape);
    if (additiveSelectionKey && !altKey) {
      editor.cancelDoubleClick();
      if (selectedShapeIds.includes(outermostSelectableShape.id)) {
        editor.markHistoryStoppingPoint("deselecting shape");
        editor.deselect(outermostSelectableShape);
      } else {
        editor.markHistoryStoppingPoint("shift selecting shape");
        editor.setSelectedShapes([...selectedShapeIds, outermostSelectableShape.id]);
      }
    } else {
      let shapeToSelect = void 0;
      if (outermostSelectableShape === hitShape) {
        shapeToSelect = hitShape;
      } else {
        if (outermostSelectableShape.id === editor.getFocusedGroupId() || selectedShapeIds.includes(outermostSelectableShape.id)) {
          shapeToSelect = hitShape;
        } else {
          shapeToSelect = outermostSelectableShape;
        }
      }
      if (shapeToSelect && !selectedShapeIds.includes(shapeToSelect.id)) {
        editor.markHistoryStoppingPoint("selecting shape");
        editor.select(shapeToSelect.id);
      }
    }
  } else {
    if (additiveSelectionKey) {
      return;
    } else {
      if (selectedShapeIds.length > 0) {
        editor.markHistoryStoppingPoint("selecting none");
        editor.selectNone();
      }
      const focusedGroupId = editor.getFocusedGroupId();
      if ((0, import_editor.isShapeId)(focusedGroupId)) {
        const groupShape = editor.getShape(focusedGroupId);
        if (!editor.isPointInShape(groupShape, currentPagePoint, { margin: 0, hitInside: true })) {
          editor.setFocusedGroup(null);
        }
      }
    }
  }
}
//# sourceMappingURL=selectOnCanvasPointerUp.js.map
