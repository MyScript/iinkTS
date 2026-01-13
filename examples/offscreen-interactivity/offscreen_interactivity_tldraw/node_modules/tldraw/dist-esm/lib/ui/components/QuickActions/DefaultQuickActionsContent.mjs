import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import {
  useCanRedo,
  useCanUndo,
  useIsInSelectState,
  useUnlockedSelectedShapesCount
} from "../../hooks/menu-hooks.mjs";
import { useReadonly } from "../../hooks/useReadonly.mjs";
import { TldrawUiMenuActionItem } from "../primitives/menus/TldrawUiMenuActionItem.mjs";
function DefaultQuickActionsContent() {
  const editor = useEditor();
  const isReadonlyMode = useReadonly();
  const isInAcceptableReadonlyState = useValue(
    "should display quick actions",
    () => editor.isInAny("select", "hand", "zoom"),
    [editor]
  );
  if (isReadonlyMode && !isInAcceptableReadonlyState) return;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(UndoRedoGroup, {}),
    /* @__PURE__ */ jsx(DeleteDuplicateGroup, {})
  ] });
}
function DeleteDuplicateGroup() {
  const oneSelected = useUnlockedSelectedShapesCount(1);
  const isInSelectState = useIsInSelectState();
  const selectDependentActionsEnabled = oneSelected && isInSelectState;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "delete", disabled: !selectDependentActionsEnabled }),
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "duplicate", disabled: !selectDependentActionsEnabled })
  ] });
}
function UndoRedoGroup() {
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "undo", disabled: !canUndo }),
    /* @__PURE__ */ jsx(TldrawUiMenuActionItem, { actionId: "redo", disabled: !canRedo })
  ] });
}
export {
  DefaultQuickActionsContent
};
//# sourceMappingURL=DefaultQuickActionsContent.mjs.map
