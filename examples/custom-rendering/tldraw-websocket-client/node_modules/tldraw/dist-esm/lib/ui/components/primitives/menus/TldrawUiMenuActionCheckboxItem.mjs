import { jsx } from "react/jsx-runtime";
import { useActions } from "../../../context/actions.mjs";
import {
  TldrawUiMenuCheckboxItem
} from "./TldrawUiMenuCheckboxItem.mjs";
function TldrawUiMenuActionCheckboxItem({
  actionId = "",
  ...rest
}) {
  const actions = useActions();
  const action = actions[actionId];
  if (!action) return null;
  return /* @__PURE__ */ jsx(TldrawUiMenuCheckboxItem, { ...action, ...rest });
}
export {
  TldrawUiMenuActionCheckboxItem
};
//# sourceMappingURL=TldrawUiMenuActionCheckboxItem.mjs.map
