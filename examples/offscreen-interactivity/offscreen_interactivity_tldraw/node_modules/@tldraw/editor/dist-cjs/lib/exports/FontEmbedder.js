"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
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
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var FontEmbedder_exports = {};
__export(FontEmbedder_exports, {
  FontEmbedder: () => FontEmbedder,
  SVG_EXPORT_CLASSNAME: () => SVG_EXPORT_CLASSNAME
});
module.exports = __toCommonJS(FontEmbedder_exports);
var import_utils = require("@tldraw/utils");
var import_fetchCache = require("./fetchCache");
var import_parseCss = require("./parseCss");
var _onFontFamilyValue_dec, _init;
const SVG_EXPORT_CLASSNAME = "tldraw-svg-export";
_onFontFamilyValue_dec = [import_utils.bind];
class FontEmbedder {
  constructor() {
    __runInitializers(_init, 5, this);
    __publicField(this, "fontFacesPromise", null);
    __publicField(this, "foundFontNames", /* @__PURE__ */ new Set());
    __publicField(this, "fontFacesToEmbed", /* @__PURE__ */ new Set());
    __publicField(this, "pendingPromises", []);
  }
  startFindingCurrentDocumentFontFaces() {
    (0, import_utils.assert)(!this.fontFacesPromise, "FontEmbedder already started");
    this.fontFacesPromise = getCurrentDocumentFontFaces();
  }
  onFontFamilyValue(fontFamilyValue) {
    (0, import_utils.assert)(this.fontFacesPromise, "FontEmbedder not started");
    const fonts = (0, import_parseCss.parseCssFontFamilyValue)(fontFamilyValue);
    for (const font of fonts) {
      if (this.foundFontNames.has(font)) return;
      this.foundFontNames.add(font);
      this.pendingPromises.push(
        this.fontFacesPromise.then((fontFaces) => {
          const relevantFontFaces = fontFaces.filter((fontFace) => fontFace.fontFamilies.has(font));
          for (const fontFace of relevantFontFaces) {
            if (this.fontFacesToEmbed.has(fontFace)) continue;
            this.fontFacesToEmbed.add(fontFace);
            for (const url of fontFace.urls) {
              if (!url.resolved || url.embedded) continue;
              url.embedded = (0, import_fetchCache.resourceToDataUrl)(url.resolved);
            }
          }
        })
      );
    }
  }
  async createCss() {
    await Promise.all(this.pendingPromises);
    let css = "";
    for (const fontFace of this.fontFacesToEmbed) {
      let fontFaceString = `@font-face {${fontFace.fontFace}}`;
      for (const url of fontFace.urls) {
        if (!url.embedded) continue;
        const dataUrl = await url.embedded;
        if (!dataUrl) continue;
        fontFaceString = fontFaceString.replace(url.original, dataUrl);
      }
      css += fontFaceString;
    }
    return css;
  }
}
_init = __decoratorStart(null);
__decorateElement(_init, 1, "onFontFamilyValue", _onFontFamilyValue_dec, FontEmbedder);
__decoratorMetadata(_init, FontEmbedder);
async function getCurrentDocumentFontFaces() {
  const fontFaces = [];
  const styleSheetsWithoutSvgExports = Array.from(document.styleSheets).filter(
    (styleSheet) => !styleSheet.ownerNode?.closest(`.${SVG_EXPORT_CLASSNAME}`)
  );
  for (const styleSheet of styleSheetsWithoutSvgExports) {
    let cssRules;
    try {
      cssRules = styleSheet.cssRules;
    } catch {
    }
    if (cssRules) {
      for (const rule of styleSheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          fontFaces.push((0, import_parseCss.parseCssFontFaces)(rule.cssText, styleSheet.href ?? document.baseURI));
        } else if (rule instanceof CSSImportRule) {
          const absoluteUrl = new URL(rule.href, rule.parentStyleSheet?.href ?? document.baseURI);
          fontFaces.push(fetchCssFontFaces(absoluteUrl.href));
        }
      }
    } else if (styleSheet.href) {
      fontFaces.push(fetchCssFontFaces(styleSheet.href));
    }
  }
  return (0, import_utils.compact)(await Promise.all(fontFaces)).flat();
}
const fetchCssFontFaces = (0, import_fetchCache.fetchCache)(async (response) => {
  const parsed = (0, import_parseCss.parseCss)(await response.text(), response.url);
  const importedFontFaces = await Promise.all(
    parsed.imports.map(({ url }) => fetchCssFontFaces(new URL(url, response.url).href))
  );
  return [...parsed.fontFaces, ...(0, import_utils.compact)(importedFontFaces).flat()];
});
//# sourceMappingURL=FontEmbedder.js.map
