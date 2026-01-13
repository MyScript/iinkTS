import { throttle } from "@tldraw/utils";
import { useLayoutEffect } from "react";
import { useEditor } from "./useEditor.mjs";
function useScreenBounds(ref) {
  const editor = useEditor();
  useLayoutEffect(() => {
    const updateBounds = throttle(
      () => {
        if (!ref.current) return;
        editor.updateViewportScreenBounds(ref.current);
      },
      200,
      {
        trailing: true
      }
    );
    const interval = editor.timers.setInterval(updateBounds, 1e3);
    window.addEventListener("resize", updateBounds);
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0].contentRect) return;
      updateBounds();
    });
    const container = ref.current;
    let scrollingParent = null;
    if (container) {
      resizeObserver.observe(container);
      scrollingParent = getNearestScrollableContainer(container);
      scrollingParent.addEventListener("scroll", updateBounds);
    }
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateBounds);
      resizeObserver.disconnect();
      scrollingParent?.removeEventListener("scroll", updateBounds);
      updateBounds.cancel();
    };
  }, [editor, ref]);
}
/*!
 * Author: excalidraw
 * MIT License: https://github.com/excalidraw/excalidraw/blob/master/LICENSE
 * https://github.com/excalidraw/excalidraw/blob/48c3465b19f10ec755b3eb84e21a01a468e96e43/packages/excalidraw/utils.ts#L600
 */
const getNearestScrollableContainer = (element) => {
  let parent = element.parentElement;
  while (parent) {
    if (parent === document.body) {
      return document;
    }
    const { overflowY } = window.getComputedStyle(parent);
    const hasScrollableContent = parent.scrollHeight > parent.clientHeight;
    if (hasScrollableContent && (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay")) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document;
};
export {
  useScreenBounds
};
//# sourceMappingURL=useScreenBounds.mjs.map
