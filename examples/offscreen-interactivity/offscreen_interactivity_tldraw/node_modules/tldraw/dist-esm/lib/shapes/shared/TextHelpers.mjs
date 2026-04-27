const INDENT = "  ";
class TextHelpers {
  static fixNewLines = /\r?\n|\r/g;
  static normalizeText(text) {
    return text.replace(TextHelpers.fixNewLines, "\n");
  }
  static normalizeTextForDom(text) {
    return text.replace(TextHelpers.fixNewLines, "\n").split("\n").map((x) => x || " ").join("\n");
  }
}
export {
  INDENT,
  TextHelpers
};
//# sourceMappingURL=TextHelpers.mjs.map
