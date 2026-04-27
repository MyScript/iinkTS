import { jsx } from "react/jsx-runtime";
import React, { createContext } from "react";
import { IdProvider } from "./useSafeId.mjs";
const EditorContext = createContext(null);
function useEditor() {
  const editor = React.useContext(EditorContext);
  if (!editor) {
    throw new Error(
      "useEditor must be used inside of the <Tldraw /> or <TldrawEditor /> components"
    );
  }
  return editor;
}
function useMaybeEditor() {
  return React.useContext(EditorContext);
}
function EditorProvider({ editor, children }) {
  return /* @__PURE__ */ jsx(EditorContext.Provider, { value: editor, children: /* @__PURE__ */ jsx(IdProvider, { children }) });
}
export {
  EditorContext,
  EditorProvider,
  useEditor,
  useMaybeEditor
};
//# sourceMappingURL=useEditor.mjs.map
