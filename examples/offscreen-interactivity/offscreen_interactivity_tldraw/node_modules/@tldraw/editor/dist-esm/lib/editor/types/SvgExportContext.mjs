import { jsx } from "react/jsx-runtime";
import { promiseWithResolve } from "@tldraw/utils";
import { createContext, useContext, useEffect, useState } from "react";
import { ContainerProvider } from "../../hooks/useContainer.mjs";
import { EditorProvider } from "../../hooks/useEditor.mjs";
import { useEvent } from "../../hooks/useEvent.mjs";
const Context = createContext(null);
function SvgExportContextProvider({
  context,
  editor,
  children
}) {
  const Provider = editor.options.exportProvider;
  return /* @__PURE__ */ jsx(EditorProvider, { editor, children: /* @__PURE__ */ jsx(ContainerProvider, { container: editor.getContainer(), children: /* @__PURE__ */ jsx(Context.Provider, { value: context, children: /* @__PURE__ */ jsx(Provider, { children }) }) }) });
}
function useSvgExportContext() {
  return useContext(Context);
}
function useDelaySvgExport() {
  const ctx = useContext(Context);
  const [promise] = useState(promiseWithResolve);
  useEffect(() => {
    ctx?.waitUntil(promise);
    return () => {
      promise.resolve();
    };
  }, [promise, ctx]);
  return useEvent(() => {
    promise.resolve();
  });
}
export {
  SvgExportContextProvider,
  useDelaySvgExport,
  useSvgExportContext
};
//# sourceMappingURL=SvgExportContext.mjs.map
