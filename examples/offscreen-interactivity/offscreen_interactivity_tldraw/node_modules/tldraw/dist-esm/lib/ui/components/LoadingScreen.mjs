import { jsx } from "react/jsx-runtime";
import { LoadingScreen as LoadingScreenContainer, useEditorComponents } from "@tldraw/editor";
const LoadingScreen = () => {
  const { Spinner } = useEditorComponents();
  return /* @__PURE__ */ jsx(LoadingScreenContainer, { children: Spinner ? /* @__PURE__ */ jsx(Spinner, {}) : null });
};
export {
  LoadingScreen
};
//# sourceMappingURL=LoadingScreen.mjs.map
