import { Fragment, jsx } from "react/jsx-runtime";
import { tlmenus, uniqueId, useAtom } from "@tldraw/editor";
import { createContext, useContext, useMemo } from "react";
import { useUiEvents } from "./events.mjs";
const DialogsContext = createContext(null);
function TldrawUiDialogsProvider({ context, children }) {
  const ctx = useContext(DialogsContext);
  const trackEvent = useUiEvents();
  const dialogs = useAtom("dialogs", []);
  const content = useMemo(() => {
    return {
      dialogs,
      addDialog(dialog) {
        const id = dialog.id ?? uniqueId();
        dialogs.update((d) => {
          return [...d.filter((m) => m.id !== dialog.id), { ...dialog, id }];
        });
        trackEvent("open-menu", { source: "dialog", id });
        tlmenus.addOpenMenu(id, context);
        return id;
      },
      removeDialog(id) {
        const dialog = dialogs.get().find((d) => d.id === id);
        if (dialog) {
          dialog.onClose?.();
          trackEvent("close-menu", { source: "dialog", id });
          tlmenus.deleteOpenMenu(id, context);
          dialogs.update((d) => d.filter((m) => m !== dialog));
        }
        return id;
      },
      clearDialogs() {
        const current = dialogs.get();
        if (current.length === 0) return;
        current.forEach((d) => {
          d.onClose?.();
          trackEvent("close-menu", { source: "dialog", id: d.id });
          tlmenus.deleteOpenMenu(d.id, context);
        });
        dialogs.set([]);
      }
    };
  }, [trackEvent, dialogs, context]);
  if (ctx) return /* @__PURE__ */ jsx(Fragment, { children });
  return /* @__PURE__ */ jsx(DialogsContext.Provider, { value: content, children });
}
function useDialogs() {
  const ctx = useContext(DialogsContext);
  if (!ctx) {
    throw new Error("useDialogs must be used within a DialogsProvider");
  }
  return ctx;
}
export {
  DialogsContext,
  TldrawUiDialogsProvider,
  useDialogs
};
//# sourceMappingURL=dialogs.mjs.map
