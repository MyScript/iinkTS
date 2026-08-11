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
export {
  elementStyle,
  getComputedStyle,
  getRenderedChildNodes,
  getRenderedChildren,
  isElement
};
//# sourceMappingURL=domUtils.mjs.map
