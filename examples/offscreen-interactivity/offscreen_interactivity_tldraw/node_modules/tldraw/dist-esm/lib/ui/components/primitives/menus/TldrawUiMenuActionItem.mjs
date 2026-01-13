import { jsx } from "react/jsx-runtime";
import { useActions } from "../../../context/actions.mjs";
import { TldrawUiMenuItem } from "./TldrawUiMenuItem.mjs";
function TldrawUiMenuActionItem({ actionId = "", ...rest }) {
  const actions = useActions();
  const action = actions[actionId];
  if (!action) return null;
  return /* @__PURE__ */ jsx(TldrawUiMenuItem, { ...action, ...rest });
}
export {
  TldrawUiMenuActionItem
};
//# sourceMappingURL=TldrawUiMenuActionItem.mjs.map
