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
var CenteredTopPanelContainer_exports = {};
__export(CenteredTopPanelContainer_exports, {
  CenteredTopPanelContainer: () => CenteredTopPanelContainer
});
module.exports = __toCommonJS(CenteredTopPanelContainer_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_react = require("react");
var import_breakpoints = require("../../context/breakpoints");
function CenteredTopPanelContainer({
  maxWidth = 420,
  ignoreRightWidth = 0,
  stylePanelWidth = 148,
  marginBetweenZones = 12,
  squeezeAmount = 52,
  children
}) {
  const ref = (0, import_react.useRef)(null);
  const breakpoint = (0, import_breakpoints.useBreakpoint)();
  const updateLayout = (0, import_react.useCallback)(() => {
    const element = ref.current;
    if (!element) return;
    const layoutTop = element.parentElement.parentElement;
    const leftPanel = layoutTop.querySelector(".tlui-layout__top__left");
    const rightPanel = layoutTop.querySelector(".tlui-layout__top__right");
    const totalWidth = layoutTop.offsetWidth;
    const leftWidth = leftPanel.offsetWidth;
    const rightWidth = rightPanel.offsetWidth;
    const selfWidth = element.offsetWidth - ignoreRightWidth;
    let xCoordIfCentered = (totalWidth - selfWidth) / 2;
    if (totalWidth % 2 !== 0) {
      xCoordIfCentered -= 0.5;
    }
    const xCoordIfLeftAligned = leftWidth + marginBetweenZones;
    const left = element.offsetLeft;
    const maxWidthProperty = Math.min(
      totalWidth - rightWidth - leftWidth - 2 * marginBetweenZones,
      maxWidth
    );
    const xCoord = Math.max(xCoordIfCentered, xCoordIfLeftAligned) - left;
    if (rightPanel.offsetWidth > stylePanelWidth && breakpoint <= 6) {
      element.style.setProperty("max-width", maxWidthProperty - squeezeAmount + "px");
    } else {
      element.style.setProperty("max-width", maxWidthProperty + "px");
    }
    element.style.setProperty("transform", `translate(${xCoord}px, 0px)`);
  }, [breakpoint, ignoreRightWidth, marginBetweenZones, maxWidth, squeezeAmount, stylePanelWidth]);
  (0, import_react.useLayoutEffect)(() => {
    const element = ref.current;
    if (!element) return;
    const layoutTop = element.parentElement.parentElement;
    const leftPanel = layoutTop.querySelector(".tlui-layout__top__left");
    const rightPanel = layoutTop.querySelector(".tlui-layout__top__right");
    const observer = new ResizeObserver(updateLayout);
    observer.observe(leftPanel);
    observer.observe(rightPanel);
    observer.observe(layoutTop);
    observer.observe(element);
    updateLayout();
    return () => {
      observer.disconnect();
    };
  }, [updateLayout]);
  (0, import_react.useLayoutEffect)(() => {
    updateLayout();
  });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref, className: "tlui-top-panel__container", children });
}
//# sourceMappingURL=CenteredTopPanelContainer.js.map
