import { assertExists, getOwnProperty, objectMapValues, uniqueId } from "@tldraw/utils";
import { FontEmbedder } from "./FontEmbedder.mjs";
import { cssRules } from "./cssRules.mjs";
import {
  elementStyle,
  getComputedStyle,
  getRenderedChildNodes,
  getRenderedChildren
} from "./domUtils.mjs";
import { resourceToDataUrl } from "./fetchCache.mjs";
import { parseCssValueUrls, shouldIncludeCssProperty } from "./parseCss.mjs";
const NO_STYLES = {};
class StyleEmbedder {
  constructor(root) {
    this.root = root;
  }
  styles = /* @__PURE__ */ new Map();
  fonts = new FontEmbedder();
  readRootElementStyles(rootElement) {
    this.readElementStyles(rootElement, {
      shouldRespectDefaults: false,
      shouldSkipInheritedParentStyles: false
    });
    const children = Array.from(getRenderedChildren(rootElement));
    while (children.length) {
      const child = children.pop();
      children.push(...getRenderedChildren(child));
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
      for (const styles of objectMapValues(info)) {
        if (!styles) continue;
        for (const [property, value] of Object.entries(styles)) {
          if (!value) continue;
          if (property === "font-family") {
            this.fonts.onFontFamilyValue(value);
          }
          const urlMatches = parseCssValueUrls(value);
          if (urlMatches.length === 0) continue;
          promises.push(
            ...urlMatches.map(async ({ url, original }) => {
              const dataUrl = (await resourceToDataUrl(url)) ?? "data:";
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
        for (const child of getRenderedChildNodes(element)) {
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
        const className = `pseudo-${uniqueId()}`;
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
      const style = elementStyle(element);
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
  return styleFromComputedStyle(getComputedStyle(element), { defaultStyles, parentStyles });
}
function styleFromPseudoElement(element, pseudo) {
  const style = getComputedStyle(element, pseudo);
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
    if (!shouldIncludeCssProperty(property)) continue;
    const value = style.get(property).toString();
    if (defaultStyles[property] === value) continue;
    const rule = getOwnProperty(cssRules, property);
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
    if (!shouldIncludeCssProperty(property)) continue;
    const value = style.getPropertyValue(property);
    if (defaultStyles[property] === value) continue;
    const rule = getOwnProperty(cssRules, property);
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
    const frameDocument = assertExists(frame.contentDocument, "frame must have a document");
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
    existing = element.computedStyleMap ? styleFromComputedStyleMap(element.computedStyleMap(), defaultStyleReadOptions) : styleFromComputedStyle(getComputedStyle(element), defaultStyleReadOptions);
    foreignObject.removeChild(element);
    defaultStylesByTagName[tagName] = existing;
  }
  return existing;
}
export {
  StyleEmbedder
};
//# sourceMappingURL=StyleEmbedder.mjs.map
