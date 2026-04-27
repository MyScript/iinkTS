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
var domUtils_exports = {};
__export(domUtils_exports, {
  elementStyle: () => elementStyle,
  getComputedStyle: () => getComputedStyle,
  getRenderedChildNodes: () => getRenderedChildNodes,
  getRenderedChildren: () => getRenderedChildren,
  isElement: () => isElement
});
module.exports = __toCommonJS(domUtils_exports);
function getRenderedChildNodes(node) {
  if (node.shadowRoot) {
    return node.shadowRoot.childNodes;
  }
  if (isShadowSlotElement(node)) {
    const assignedNodes = node.assignedNodes();
    if (assignedNodes?.length) {
      return assignedNodes;
    }
  }
  return node.childNodes;
}
function* getRenderedChildren(node) {
  for (const child of getRenderedChildNodes(node)) {
    if (isElement(child)) yield child;
  }
}
function getWindow(node) {
  return node.ownerDocument?.defaultView ?? globalThis;
}
function isElement(node) {
  return node instanceof getWindow(node).Element;
}
function isShadowRoot(node) {
  return node instanceof getWindow(node).ShadowRoot;
}
function isInShadowRoot(node) {
  return "getRootNode" in node && isShadowRoot(node.getRootNode());
}
function isShadowSlotElement(node) {
  return isInShadowRoot(node) && node instanceof getWindow(node).HTMLSlotElement;
}
function elementStyle(element) {
  return element.style;
}
function getComputedStyle(element, pseudoElement) {
  return getWindow(element).getComputedStyle(element, pseudoElement);
}
//# sourceMappingURL=domUtils.js.map
