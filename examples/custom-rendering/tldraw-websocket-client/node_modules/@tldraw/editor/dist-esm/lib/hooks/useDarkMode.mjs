import { useValue } from "@tldraw/state-react";
import React from "react";
import { debugFlags } from "../utils/debug-flags.mjs";
import { useContainer } from "./useContainer.mjs";
import { useEditor } from "./useEditor.mjs";
import { useIsDarkMode } from "./useIsDarkMode.mjs";
function useDarkMode() {
  const editor = useEditor();
  const container = useContainer();
  const isDarkMode = useIsDarkMode();
  const forceSrgb = useValue(debugFlags.forceSrgb);
  React.useEffect(() => {
    if (isDarkMode) {
      container.setAttribute("data-color-mode", "dark");
      container.classList.remove("tl-theme__light");
      container.classList.add("tl-theme__dark");
    } else {
      container.setAttribute("data-color-mode", "light");
      container.classList.remove("tl-theme__dark");
      container.classList.add("tl-theme__light");
    }
    if (forceSrgb) {
      container.classList.add("tl-theme__force-sRGB");
    } else {
      container.classList.remove("tl-theme__force-sRGB");
    }
  }, [editor, container, forceSrgb, isDarkMode]);
}
export {
  useDarkMode
};
//# sourceMappingURL=useDarkMode.mjs.map
