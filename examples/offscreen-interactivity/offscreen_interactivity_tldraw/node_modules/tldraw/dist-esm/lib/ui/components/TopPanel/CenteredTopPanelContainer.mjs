import { jsx } from "react/jsx-runtime";
import { useCallback, useLayoutEffect, useRef } from "react";
import { useBreakpoint } from "../../context/breakpoints.mjs";
function CenteredTopPanelContainer({
  maxWidth = 420,
  ignoreRightWidth = 0,
  stylePanelWidth = 148,
  marginBetweenZones = 12,
  squeezeAmount = 52,
  children
}) {
  const ref = useRef(null);
  const breakpoint = useBreakpoint();
  const updateLayout = useCallback(() => {
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
  useLayoutEffect(() => {
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
  useLayoutEffect(() => {
    updateLayout();
  });
  return /* @__PURE__ */ jsx("div", { ref, className: "tlui-top-panel__container", children });
}
export {
  CenteredTopPanelContainer
};
//# sourceMappingURL=CenteredTopPanelContainer.mjs.map
