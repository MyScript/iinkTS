import { debugFlags, pointerCaptureTrackingObject } from "./debug-flags.mjs";
function loopToHtmlElement(elm) {
  if (elm.nodeType === Node.ELEMENT_NODE) return elm;
  if (elm.parentElement) return loopToHtmlElement(elm.parentElement);
  else throw Error("Could not find a parent element of an HTML type!");
}
function preventDefault(event) {
  event.preventDefault();
  if (debugFlags.logPreventDefaults.get()) {
    console.warn("preventDefault called on event:", event);
  }
}
function setPointerCapture(element, event) {
  element.setPointerCapture(event.pointerId);
  if (debugFlags.logPointerCaptures.get()) {
    const trackingObj = pointerCaptureTrackingObject.get();
    trackingObj.set(element, (trackingObj.get(element) ?? 0) + 1);
    console.warn("setPointerCapture called on element:", element, event);
  }
}
function releasePointerCapture(element, event) {
  if (!element.hasPointerCapture(event.pointerId)) {
    return;
  }
  element.releasePointerCapture(event.pointerId);
  if (debugFlags.logPointerCaptures.get()) {
    const trackingObj = pointerCaptureTrackingObject.get();
    if (trackingObj.get(element) === 1) {
      trackingObj.delete(element);
    } else if (trackingObj.has(element)) {
      trackingObj.set(element, trackingObj.get(element) - 1);
    } else {
      console.warn("Release without capture");
    }
    console.warn("releasePointerCapture called on element:", element, event);
  }
}
const stopEventPropagation = (e) => e.stopPropagation();
const setStyleProperty = (elm, property, value) => {
  if (!elm) return;
  elm.style.setProperty(property, value);
};
function activeElementShouldCaptureKeys(allowButtons = false) {
  const { activeElement } = document;
  const elements = allowButtons ? ["input", "textarea"] : ["input", "select", "button", "textarea"];
  return !!(activeElement && (activeElement.isContentEditable || elements.indexOf(activeElement.tagName.toLowerCase()) > -1 || activeElement.classList.contains("tlui-slider__thumb")));
}
export {
  activeElementShouldCaptureKeys,
  loopToHtmlElement,
  preventDefault,
  releasePointerCapture,
  setPointerCapture,
  setStyleProperty,
  stopEventPropagation
};
//# sourceMappingURL=dom.mjs.map
