import { jsx } from "react/jsx-runtime";
import { useEditor, useValue } from "@tldraw/editor";
import { useActions } from "../../context/actions.mjs";
import { TldrawUiMenuItem } from "../primitives/menus/TldrawUiMenuItem.mjs";
function StopFollowing() {
  const editor = useEditor();
  const actions = useActions();
  const followingUser = useValue(
    "is following user",
    () => !!editor.getInstanceState().followingUserId,
    [editor]
  );
  if (!followingUser) return null;
  return /* @__PURE__ */ jsx(TldrawUiMenuItem, { ...actions["stop-following"] });
}
export {
  StopFollowing
};
//# sourceMappingURL=StopFollowing.mjs.map
