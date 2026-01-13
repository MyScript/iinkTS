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
  LANGUAGES: () => import_languages.LANGUAGES,
  _getDefaultTranslationLocale: () => _getDefaultTranslationLocale,
  getDefaultTranslationLocale: () => getDefaultTranslationLocale
});
module.exports = __toCommonJS(translations_exports);
var import_languages = require("./languages");
function getDefaultTranslationLocale() {
  const locales = typeof window !== "undefined" ? window.navigator.languages ?? ["en"] : ["en"];
  return _getDefaultTranslationLocale(locales);
}
function _getDefaultTranslationLocale(locales) {
  for (const locale of locales) {
    const supportedLocale = getSupportedLocale(locale);
    if (supportedLocale) {
      return supportedLocale;
    }
  }
  return "en";
}
const DEFAULT_LOCALE_REGIONS = {
  zh: "zh-cn",
  pt: "pt-br",
  ko: "ko-kr",
  hi: "hi-in"
};
function getSupportedLocale(locale) {
  const exactMatch = import_languages.LANGUAGES.find((t) => t.locale === locale.toLowerCase());
  if (exactMatch) {
    return exactMatch.locale;
  }
  const [language, region] = locale.split(/[-_]/).map((s) => s.toLowerCase());
  if (region) {
    const languageMatch = import_languages.LANGUAGES.find((t) => t.locale === language);
    if (languageMatch) {
      return languageMatch.locale;
    }
  }
  if (language in DEFAULT_LOCALE_REGIONS) {
    return DEFAULT_LOCALE_REGIONS[language];
  }
  return null;
}
//# sourceMappingURL=translations.js.map
