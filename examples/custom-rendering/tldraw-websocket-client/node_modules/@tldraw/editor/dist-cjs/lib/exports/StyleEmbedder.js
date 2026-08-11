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
var StyleEmbedder_exports = {};
__export(StyleEmbedder_exports, {
  StyleEmbedder: () => StyleEmbedder
});
module.exports = __toCommonJS(StyleEmbedder_exports);
var import_utils = require("@tldraw/utils");
var import_FontEmbedder = require("./FontEmbedder");
var import_cssRules = require("./cssRules");
var import_domUtils = require("./domUtils");
var import_fetchCache = require("./fetchCache");
var import_parseCss = require("./parseCss");
const NO_STYLES = {};
class StyleEmbedder {
  constructor(root) {
    this.root = root;
  }
  styles = /* @__PURE__ */ new Map();
  fonts = new import_FontEmbedder.FontEmbedder();
  readRootElementStyles(rootElement) {
    this.readElementStyles(rootElement, {
      shouldRespectDefaults: false,
      shouldSkipInheritedParentStyles: false
    });
    const children = Array.from((0, import_domUtils.getRenderedChildren)(rootElement));
    while (children.length) {
      const child = children.pop();
      children.push(...(0, import_domUtils.getRenderedChildren)(child));
      this.readElementStyles(child, {
        shouldRespectDefaults: true,
        shouldSkipInheritedParentStyles: true
      });
    }
  }
  readElementStyles(element, { shouldRespectDefaults = true, shouldSkipInheritedParentStyles = true }) {
    const defaultStyles = shouldRespectDefaults ? getDefaultStylesForTagName(element.tagName.toLowerCase()) : NO_STYLES;
    const parentStyles = Object.assign({}, NO_STYLES);
    if (shouldSkipInheritedParentStyles) {
      let el = element.parentElement;
      while (el) {
        const currentStyles = this.styles.get(el)?.self;
        for (const style in currentStyles) {
          if (!parentStyles[style]) {
            parentStyles[style] = currentStyles[style];
          }
        }
        el = el.parentElement;
      }
    }
    const info = {
      self: styleFromElement(element, { defaultStyles, parentStyles }),
      before: styleFromPseudoElement(element, "::before"),
      after: styleFromPseudoElement(element, "::after")
    };
    this.styles.set(element, info);
  }
  fetchResources() {
    const promises = [];
    for (const info of this.styles.values()) {
      for (const styles of (0, import_utils.objectMapValues)(info)) {
        if (!styles) continue;
        for (const [property, value] of Object.entries(styles)) {
          if (!value) continue;
          if (property === "font-family") {
            this.fonts.onFontFamilyValue(value);
          }
          const urlMatches = (0, import_parseCss.parseCssValueUrls)(value);
          if (urlMatches.length === 0) continue;
          promises.push(
            ...urlMatches.map(async ({ url, original }) => {
              const dataUrl = await (0, import_fetchCache.resourceToDataUrl)(url) ?? "data:";
              styles[property] = value.replace(original, `url("${dataUrl}")`);
            })
          );
        }
      }
    }
    return Promise.all(promises);
  }
  // custom elements are tricky. if we serialize the dom as-is, the custom elements wont have
  // their shadow-dom contents serialized. after we've read all the styles, we need to unwrap the
  // contents of each custom elements shadow dom directly into the parent element itself.
  unwrapCustomElements() {
    const visited = /* @__PURE__ */ new Set();
    const visit = (element, clonedParent) => {
      if (visited.has(element)) return;
      visited.add(element);
      const shadowRoot = element.shadowRoot;
      if (shadowRoot) {
        const clonedCustomEl = document.createElement("div");
        this.styles.set(clonedCustomEl, this.styles.get(element));
        clonedCustomEl.setAttribute("data-tl-custom-element", element.tagName);
        (clonedParent ?? element.parentElement).appendChild(clonedCustomEl);
        for (const child of shadowRoot.childNodes) {
          if (child instanceof Element) {
            visit(child, clonedCustomEl);
          } else {
            clonedCustomEl.appendChild(child.cloneNode(true));
          }
        }
        element.remove();
      } else if (clonedParent) {
        if (element.tagName.toLowerCase() === "style") {
          return;
        }
        const clonedEl = element.cloneNode(false);
        this.styles.set(clonedEl, this.styles.get(element));
        clonedParent.appendChild(clonedEl);
        for (const child of (0, import_domUtils.getRenderedChildNodes)(element)) {
          if (child instanceof Element) {
            visit(child, clonedEl);
          } else {
            clonedEl.appendChild(child.cloneNode(true));
          }
        }
      }
    };
    for (const element of this.styles.keys()) {
      visit(element, null);
    }
  }
  embedStyles() {
    let css = "";
    for (const [element, info] of this.styles) {
      if (info.after || info.before) {
        const className = `pseudo-${(0, import_utils.uniqueId)()}`;
        element.classList.add(className);
        if (info.before) {
          css += `.${className}::before {${formatCss(info.before)}}
`;
        }
        if (info.after) {
          css += `.${className}::after {${formatCss(info.after)}}
`;
        }
      }
      const style = (0, import_domUtils.elementStyle)(element);
      for (const [property, value] of Object.entries(info.self)) {
        if (!value) continue;
        style.setProperty(property, value);
      }
      if (style.fontKerning === "auto") {
        style.fontKerning = "normal";
      }
    }
    return css;
  }
  async getFontFaceCss() {
    return await this.fonts.createCss();
  }
  dispose() {
    destroyDefaultStyleFrame();
  }
}
function styleFromElement(element, { defaultStyles, parentStyles }) {
  if (element.computedStyleMap) {
    return styleFromComputedStyleMap(element.computedStyleMap(), { defaultStyles, parentStyles });
  }
  return styleFromComputedStyle((0, import_domUtils.getComputedStyle)(element), { defaultStyles, parentStyles });
}
function styleFromPseudoElement(element, pseudo) {
  const style = (0, import_domUtils.getComputedStyle)(element, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return void 0;
  }
  return styleFromComputedStyle(style, { defaultStyles: NO_STYLES, parentStyles: NO_STYLES });
}
function styleFromComputedStyleMap(style, { defaultStyles, parentStyles }) {
  const styles = {};
  const currentColor = style.get("color")?.toString() || "";
  const ruleOptions = {
    currentColor,
    parentStyles,
    defaultStyles,
    getStyle: (property) => style.get(property)?.toString() ?? ""
  };
  for (const property of style.keys()) {
    if (!(0, import_parseCss.shouldIncludeCssProperty)(property)) continue;
    const value = style.get(property).toString();
    if (defaultStyles[property] === value) continue;
    const rule = (0, import_utils.getOwnProperty)(import_cssRules.cssRules, property);
    if (rule && rule(value, property, ruleOptions)) continue;
    styles[property] = value;
  }
  return styles;
}
function styleFromComputedStyle(style, { defaultStyles, parentStyles }) {
  const styles = {};
  const currentColor = style.color;
  const ruleOptions = {
    currentColor,
    parentStyles,
    defaultStyles,
    getStyle: (property) => style.getPropertyValue(property)
  };
  for (const property in style) {
    if (!(0, import_parseCss.shouldIncludeCssProperty)(property)) continue;
    const value = style.getPropertyValue(property);
    if (defaultStyles[property] === value) continue;
    const rule = (0, import_utils.getOwnProperty)(import_cssRules.cssRules, property);
    if (rule && rule(value, property, ruleOptions)) continue;
    styles[property] = value;
  }
  return styles;
}
function formatCss(style) {
  let cssText = "";
  for (const [property, value] of Object.entries(style)) {
    cssText += `${property}: ${value};`;
  }
  return cssText;
}
let defaultStyleFrame;
const defaultStylesByTagName = {};
function getDefaultStyleFrame() {
  if (!defaultStyleFrame) {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    document.body.appendChild(frame);
    const frameDocument = (0, import_utils.assertExists)(frame.contentDocument, "frame must have a document");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    svg.appendChild(foreignObject);
    frameDocument.body.appendChild(svg);
    defaultStyleFrame = { iframe: frame, foreignObject, document: frameDocument };
  }
  return defaultStyleFrame;
}
function destroyDefaultStyleFrame() {
  if (defaultStyleFrame) {
    document.body.removeChild(defaultStyleFrame.iframe);
    defaultStyleFrame = void 0;
  }
}
const defaultStyleReadOptions = { defaultStyles: NO_STYLES, parentStyles: NO_STYLES };
function getDefaultStylesForTagName(tagName) {
  let existing = defaultStylesByTagName[tagName];
  if (!existing) {
    const { foreignObject, document: document2 } = getDefaultStyleFrame();
    const element = document2.createElement(tagName);
    foreignObject.appendChild(element);
    existing = element.computedStyleMap ? styleFromComputedStyleMap(element.computedStyleMap(), defaultStyleReadOptions) : styleFromComputedStyle((0, import_domUtils.getComputedStyle)(element), defaultStyleReadOptions);
    foreignObject.removeChild(element);
    defaultStylesByTagName[tagName] = existing;
  }
  return existing;
}
//# sourceMappingURL=StyleEmbedder.js.map
