import { jsx } from "react/jsx-runtime";
import { LoadingScreen } from "../../TldrawEditor.mjs";
import { useEditorComponents } from "../../hooks/useEditorComponents.mjs";
const DefaultLoadingScreen = () => {
  const { Spinner } = useEditorComponents();
  return /* @__PURE__ */ jsx(LoadingScreen, { children: Spinner ? /* @__PURE__ */ jsx(Spinner, {}) : null });
};
export {
  DefaultLoadingScreen
};
//# sourceMappingURL=DefaultLoadingScreen.mjs.map
