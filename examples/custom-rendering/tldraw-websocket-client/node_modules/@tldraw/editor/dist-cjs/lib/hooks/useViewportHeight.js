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
var useViewportHeight_exports = {};
__export(useViewportHeight_exports, {
  useViewportHeight: () => useViewportHeight
});
module.exports = __toCommonJS(useViewportHeight_exports);
var import_react = require("react");
/*!
 * BSD License: https://github.com/outline/rich-markdown-editor/blob/main/LICENSE
 * Copyright (c) 2020 General Outline, Inc (https://www.getoutline.com/) and individual contributors.
 *
 * Returns the height of the viewport.
 * This is mainly to account for virtual keyboards on mobile devices.
 *
 * N.B. On iOS, you have to take into account the offsetTop as well so that you get an accurate position
 * while using the virtual keyboard.
 */
function useViewportHeight() {
  const visualViewport = window.visualViewport;
  const [height, setHeight] = (0, import_react.useState)(
    () => visualViewport ? visualViewport.height + visualViewport.offsetTop : window.innerHeight
  );
  (0, import_react.useLayoutEffect)(() => {
    const handleResize = () => {
      const visualViewport2 = window.visualViewport;
      setHeight(
        () => visualViewport2 ? visualViewport2.height + visualViewport2.offsetTop : window.innerHeight
      );
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, []);
  return height;
}
//# sourceMappingURL=useViewportHeight.js.map
