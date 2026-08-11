import { jsx } from "react/jsx-runtime";
import { memo } from "react";
import { TldrawUiMenuContextProvider } from "../primitives/menus/TldrawUiMenuContext.mjs";
import { DefaultQuickActionsContent } from "./DefaultQuickActionsContent.mjs";
const DefaultQuickActions = memo(function DefaultQuickActions2({
  children
}) {
  const content = children ?? /* @__PURE__ */ jsx(DefaultQuickActionsContent, {});
  return /* @__PURE__ */ jsx(TldrawUiMenuContextProvider, { type: "small-icons", sourceId: "quick-actions", children: content });
});
export {
  DefaultQuickActions
};
//# sourceMappingURL=DefaultQuickActions.mjs.map
