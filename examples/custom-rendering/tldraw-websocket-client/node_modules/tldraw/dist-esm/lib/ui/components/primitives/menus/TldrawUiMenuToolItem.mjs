import { jsx } from "react/jsx-runtime";
import { useTools } from "../../../hooks/useTools.mjs";
import { TldrawUiMenuItem } from "./TldrawUiMenuItem.mjs";
function TldrawUiMenuToolItem({ toolId = "", ...rest }) {
  const tools = useTools();
  const tool = tools[toolId];
  if (!tool) return null;
  return /* @__PURE__ */ jsx(TldrawUiMenuItem, { ...tool, ...rest });
}
export {
  TldrawUiMenuToolItem
};
//# sourceMappingURL=TldrawUiMenuToolItem.mjs.map
