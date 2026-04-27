import { LANGUAGES } from "./languages.mjs";
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
  const exactMatch = LANGUAGES.find((t) => t.locale === locale.toLowerCase());
  if (exactMatch) {
    return exactMatch.locale;
  }
  const [language, region] = locale.split(/[-_]/).map((s) => s.toLowerCase());
  if (region) {
    const languageMatch = LANGUAGES.find((t) => t.locale === language);
    if (languageMatch) {
      return languageMatch.locale;
    }
  }
  if (language in DEFAULT_LOCALE_REGIONS) {
    return DEFAULT_LOCALE_REGIONS[language];
  }
  return null;
}
export {
  LANGUAGES,
  _getDefaultTranslationLocale,
  getDefaultTranslationLocale
};
//# sourceMappingURL=translations.mjs.map
