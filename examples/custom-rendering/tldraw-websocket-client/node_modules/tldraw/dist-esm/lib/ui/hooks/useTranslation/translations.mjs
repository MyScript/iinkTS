import { LANGUAGES, fetch } from "@tldraw/editor";
import { DEFAULT_TRANSLATION } from "./defaultTranslation.mjs";
const RTL_LANGUAGES = /* @__PURE__ */ new Set(["ar", "fa", "he", "ur", "ku"]);
const EN_TRANSLATION = {
  locale: "en",
  label: "English",
  messages: DEFAULT_TRANSLATION,
  dir: "ltr"
};
async function fetchTranslation(locale, assetUrls) {
  const mainRes = await fetch(assetUrls.translations.en);
  if (!mainRes.ok) {
    console.warn(`No main translations found.`);
    return EN_TRANSLATION;
  }
  if (locale === "en") {
    return EN_TRANSLATION;
  }
  const language = LANGUAGES.find((t) => t.locale === locale);
  if (!language) {
    console.warn(`No translation found for locale ${locale}`);
    return EN_TRANSLATION;
  }
  const res = await fetch(assetUrls.translations[language.locale]);
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
export {
  RTL_LANGUAGES,
  fetchTranslation
};
//# sourceMappingURL=translations.mjs.map
