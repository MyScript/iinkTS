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
var menu_hooks_exports = {};
__export(menu_hooks_exports, {
  showMenuPaste: () => showMenuPaste,
  useAllowGroup: () => useAllowGroup,
  useAllowUngroup: () => useAllowUngroup,
  useAnySelectedShapesCount: () => useAnySelectedShapesCount,
  useCanRedo: () => useCanRedo,
  useCanUndo: () => useCanUndo,
  useHasLinkShapeSelected: () => useHasLinkShapeSelected,
  useIsInSelectState: () => useIsInSelectState,
  useOnlyFlippableShape: () => useOnlyFlippableShape,
  useShowAutoSizeToggle: () => useShowAutoSizeToggle,
  useThreeStackableItems: () => useThreeStackableItems,
  useUnlockedSelectedShapesCount: () => useUnlockedSelectedShapesCount
});
module.exports = __toCommonJS(menu_hooks_exports);
var import_editor = require("@tldraw/editor");
var import_shared = require("../../shapes/arrow/shared");
function shapesWithUnboundArrows(editor) {
  const selectedShapeIds = editor.getSelectedShapeIds();
  const selectedShapes = selectedShapeIds.map((id) => {
    return editor.getShape(id);
  });
  return selectedShapes.filter((shape) => {
    if (!shape) return false;
    if (editor.isShapeOfType(shape, "arrow")) {
      const bindings = (0, import_shared.getArrowBindings)(editor, shape);
      if (bindings.start || bindings.end) return false;
    }
    return true;
  });
}
const useThreeStackableItems = () => {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)("threeStackableItems", () => shapesWithUnboundArrows(editor).length > 2, [editor]);
};
const useIsInSelectState = () => {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)("isInSelectState", () => editor.isIn("select"), [editor]);
};
const useAllowGroup = () => {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "allow group",
    () => {
      const selectedShapes = editor.getSelectedShapes();
      if (selectedShapes.length < 2) return false;
      for (const shape of selectedShapes) {
        if (editor.isShapeOfType(shape, "arrow")) {
          const bindings = (0, import_shared.getArrowBindings)(editor, shape);
          if (bindings.start) {
            if (!selectedShapes.some((s) => s.id === bindings.start.toId)) {
              return false;
            }
          }
          if (bindings.end) {
            if (!selectedShapes.some((s) => s.id === bindings.end.toId)) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [editor]
  );
};
const useAllowUngroup = () => {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "allowUngroup",
    () => editor.getSelectedShapeIds().some((id) => editor.getShape(id)?.type === "group"),
    [editor]
  );
};
const showMenuPaste = typeof window !== "undefined" && "navigator" in window && Boolean(navigator.clipboard) && Boolean(navigator.clipboard.read);
function useAnySelectedShapesCount(min, max) {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "selectedShapes",
    () => {
      const len = editor.getSelectedShapes().length;
      if (min === void 0) {
        if (max === void 0) {
          return len;
        } else {
          return len <= max;
        }
      } else {
        if (max === void 0) {
          return len >= min;
        } else {
          return len >= min && len <= max;
        }
      }
    },
    [editor, min, max]
  );
}
function useUnlockedSelectedShapesCount(min, max) {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "selectedShapes",
    () => {
      const len = editor.getSelectedShapes().filter((s) => !editor.isShapeOrAncestorLocked(s)).length;
      if (min === void 0) {
        if (max === void 0) {
          return len;
        } else {
          return len <= max;
        }
      } else {
        if (max === void 0) {
          return len >= min;
        } else {
          return len >= min && len <= max;
        }
      }
    },
    [editor]
  );
}
function useShowAutoSizeToggle() {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "showAutoSizeToggle",
    () => {
      const selectedShapes = editor.getSelectedShapes();
      return selectedShapes.length === 1 && editor.isShapeOfType(selectedShapes[0], "text") && selectedShapes[0].props.autoSize === false;
    },
    [editor]
  );
}
function useHasLinkShapeSelected() {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "hasLinkShapeSelected",
    () => {
      const onlySelectedShape = editor.getOnlySelectedShape();
      return !!(onlySelectedShape && onlySelectedShape.type !== "embed" && "url" in onlySelectedShape.props && !onlySelectedShape.isLocked);
    },
    [editor]
  );
}
function useOnlyFlippableShape() {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)(
    "onlyFlippableShape",
    () => {
      const shape = editor.getOnlySelectedShape();
      return shape && (editor.isShapeOfType(shape, "group") || editor.isShapeOfType(shape, "image") || editor.isShapeOfType(shape, "arrow") || editor.isShapeOfType(shape, "line") || editor.isShapeOfType(shape, "draw"));
    },
    [editor]
  );
}
function useCanRedo() {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)("useCanRedo", () => editor.getCanRedo(), [editor]);
}
function useCanUndo() {
  const editor = (0, import_editor.useEditor)();
  return (0, import_editor.useValue)("useCanUndo", () => editor.getCanUndo(), [editor]);
}
//# sourceMappingURL=menu-hooks.js.map
