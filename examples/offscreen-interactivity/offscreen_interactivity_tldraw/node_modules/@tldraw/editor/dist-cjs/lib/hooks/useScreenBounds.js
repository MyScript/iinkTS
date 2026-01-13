"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useScreenBounds_exports = {};
__export(useScreenBounds_exports, {
  useScreenBounds: () => useScreenBounds
});
module.exports = __toCommonJS(useScreenBounds_exports);
var import_utils = require("@tldraw/utils");
var import_react = require("react");
var import_useEditor = require("./useEditor");
function useScreenBounds(ref) {
  const editor = (0, import_useEditor.useEditor)();
  (0, import_react.useLayoutEffect)(() => {
    const updateBounds = (0, import_utils.throttle)(
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
//# sourceMappingURL=useScreenBounds.js.map
