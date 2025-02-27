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
var translations_exports = {};
__export(translations_exports, {
  RTL_LANGUAGES: () => RTL_LANGUAGES,
  fetchTranslation: () => fetchTranslation
});
module.exports = __toCommonJS(translations_exports);
var import_editor = require("@tldraw/editor");
var import_defaultTranslation = require("./defaultTranslation");
const RTL_LANGUAGES = /* @__PURE__ */ new Set(["ar", "fa", "he", "ur", "ku"]);
const EN_TRANSLATION = {
  locale: "en",
  label: "English",
  messages: import_defaultTranslation.DEFAULT_TRANSLATION,
  dir: "ltr"
};
async function fetchTranslation(locale, assetUrls) {
  const mainRes = await (0, import_editor.fetch)(assetUrls.translations.en);
  if (!mainRes.ok) {
    console.warn(`No main translations found.`);
    return EN_TRANSLATION;
  }
  if (locale === "en") {
    return EN_TRANSLATION;
  }
  const language = import_editor.LANGUAGES.find((t) => t.locale === locale);
  if (!language) {
    console.warn(`No translation found for locale ${locale}`);
    return EN_TRANSLATION;
  }
  const res = await (0, import_editor.fetch)(assetUrls.translations[language.locale]);
  const messages = await res.json();
  if (!messages) {
    console.warn(`No messages found for locale ${locale}`);
    return EN_TRANSLATION;
  }
  const missing = [];
  for (const key in EN_TRANSLATION.messages) {
    if (!messages[key]) {
      missing.push(key);
    }
  }
  if (missing.length > 0 && process.env.NODE_ENV === "development") {
    console.warn(`Language ${locale}: missing messages for keys:
${missing.join("\n")}`);
  }
  return {
    locale,
    label: language.label,
    dir: RTL_LANGUAGES.has(language.locale) ? "rtl" : "ltr",
    messages: { ...EN_TRANSLATION.messages, ...messages }
  };
}
//# sourceMappingURL=translations.js.map
