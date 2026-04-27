import { Fragment, jsx } from "react/jsx-runtime";
import { uniqueId, useAtom } from "@tldraw/editor";
import { Toast as _Toast } from "radix-ui";
import { createContext, useContext, useMemo } from "react";
const ToastsContext = createContext(null);
function TldrawUiToastsProvider({ children }) {
  const toasts = useAtom("toasts", []);
  const ctx = useContext(ToastsContext);
  const current = useMemo(() => {
    return {
      toasts,
      addToast(toast) {
        const id = toast.id ?? uniqueId();
        toasts.update((d) => [...d.filter((m) => m.id !== toast.id), { ...toast, id }]);
        return id;
      },
      removeToast(id) {
        toasts.update((d) => d.filter((m) => m.id !== id));
        return id;
      },
      clearToasts() {
        toasts.set([]);
      }
    };
  }, [toasts]);
  if (ctx) {
    return /* @__PURE__ */ jsx(Fragment, { children });
  }
  return /* @__PURE__ */ jsx(_Toast.Provider, { children: /* @__PURE__ */ jsx(ToastsContext.Provider, { value: current, children }) });
}
function useToasts() {
  const ctx = useContext(ToastsContext);
  if (!ctx) {
    throw new Error("useToasts must be used within a ToastsProvider");
  }
  return ctx;
}
export {
  TldrawUiToastsProvider,
  ToastsContext,
  useToasts
};
//# sourceMappingURL=toasts.mjs.map
