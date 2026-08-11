import { INDENT } from "../../shapes/shared/TextHelpers.mjs";
const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
function isRightToLeftLanguage(text) {
  return rtlRegex.test(text);
}
function replaceTabsWithSpaces(text) {
  return text.replace(/\t/g, INDENT);
}
function stripCommonMinimumIndentation(text) {
  const lines = text.split("\n");
  while (lines[0] && lines[0].trim().length === 0) {
    lines.shift();
  }
  let minIndentation = Infinity;
  for (const line of lines) {
    if (line.trim().length > 0) {
      const indentation = line.length - line.trimStart().length;
      minIndentation = Math.min(minIndentation, indentation);
    }
  }
  return lines.map((line) => line.slice(minIndentation)).join("\n");
}
const COMMON_ENTITY_MAP = {
  "&amp;": "&",
  "&quot;": '"',
  "&apos;": "'",
  "&#27;": "'",
  "&#34;": '"',
  "&#38;": "&",
  "&#39;": "'",
  "&#8211;": "\u2013",
  "&#8212;": "\u2014",
  "&#8216;": "\u2018",
  "&#8217;": "\u2019",
  "&#8220;": "\u201C",
  "&#8221;": "\u201D",
  "&#8230;": "\u2026"
};
const entityRegex = new RegExp(Object.keys(COMMON_ENTITY_MAP).join("|"), "g");
function convertCommonTitleHTMLEntities(text) {
  return text.replace(entityRegex, (m) => COMMON_ENTITY_MAP[m]);
}
function stripTrailingWhitespace(text) {
  return text.replace(/[ \t]+$/gm, "").replace(/\n+$/, "");
}
function cleanupText(text) {
  return stripTrailingWhitespace(stripCommonMinimumIndentation(replaceTabsWithSpaces(text)));
}
const truncateStringWithEllipsis = (str, maxLength) => {
  return str.length <= maxLength ? str : str.substring(0, maxLength - 3) + "...";
};
export {
  cleanupText,
  convertCommonTitleHTMLEntities,
  isRightToLeftLanguage,
  truncateStringWithEllipsis
};
//# sourceMappingURL=text.mjs.map
