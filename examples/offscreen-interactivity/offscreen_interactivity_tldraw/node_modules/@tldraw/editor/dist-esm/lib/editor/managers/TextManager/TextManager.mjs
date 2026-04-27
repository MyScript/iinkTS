import { objectMapKeys } from "@tldraw/utils";
const fixNewLines = /\r?\n|\r/g;
function normalizeTextForDom(text) {
  return text.replace(fixNewLines, "\n").split("\n").map((x) => x || " ").join("\n");
}
const textAlignmentsForLtr = {
  start: "left",
  "start-legacy": "left",
  middle: "center",
  "middle-legacy": "center",
  end: "right",
  "end-legacy": "right"
};
const spaceCharacterRegex = /\s/;
const initialDefaultStyles = Object.freeze({
  "overflow-wrap": "break-word",
  "word-break": "auto",
  width: null,
  height: null,
  "max-width": null,
  "min-width": null
});
class TextManager {
  constructor(editor) {
    this.editor = editor;
    const elm = document.createElement("div");
    elm.classList.add("tl-text");
    elm.classList.add("tl-text-measure");
    elm.setAttribute("dir", "auto");
    elm.tabIndex = -1;
    this.editor.getContainer().appendChild(elm);
    this.elm = elm;
    for (const key of objectMapKeys(initialDefaultStyles)) {
      elm.style.setProperty(key, initialDefaultStyles[key]);
    }
  }
  elm;
  setElementStyles(styles) {
    const stylesToReinstate = {};
    for (const key of objectMapKeys(styles)) {
      if (typeof styles[key] === "string") {
        const oldValue = this.elm.style.getPropertyValue(key);
        if (oldValue === styles[key]) continue;
        stylesToReinstate[key] = oldValue;
        this.elm.style.setProperty(key, styles[key]);
      }
    }
    return () => {
      for (const key of objectMapKeys(stylesToReinstate)) {
        this.elm.style.setProperty(key, stylesToReinstate[key]);
      }
    };
  }
  dispose() {
    return this.elm.remove();
  }
  measureText(textToMeasure, opts) {
    const div = document.createElement("div");
    div.textContent = normalizeTextForDom(textToMeasure);
    return this.measureHtml(div.innerHTML, opts);
  }
  measureHtml(html, opts) {
    const { elm } = this;
    const newStyles = {
      "font-family": opts.fontFamily,
      "font-style": opts.fontStyle,
      "font-weight": opts.fontWeight,
      "font-size": opts.fontSize + "px",
      "line-height": opts.lineHeight.toString(),
      padding: opts.padding,
      "max-width": opts.maxWidth ? opts.maxWidth + "px" : void 0,
      "min-width": opts.minWidth ? opts.minWidth + "px" : void 0,
      "overflow-wrap": opts.disableOverflowWrapBreaking ? "normal" : void 0,
      ...opts.otherStyles
    };
    const restoreStyles = this.setElementStyles(newStyles);
    try {
      elm.innerHTML = html;
      const scrollWidth = opts.measureScrollWidth ? elm.scrollWidth : 0;
      const rect = elm.getBoundingClientRect();
      return {
        x: 0,
        y: 0,
        w: rect.width,
        h: rect.height,
        scrollWidth
      };
    } finally {
      restoreStyles();
    }
  }
  /**
   * Given an html element, measure the position of each span of unbroken
   * word/white-space characters within any text nodes it contains.
   */
  measureElementTextNodeSpans(element, { shouldTruncateToFirstLine = false } = {}) {
    const spans = [];
    const elmBounds = element.getBoundingClientRect();
    const offsetX = -elmBounds.left;
    const offsetY = -elmBounds.top;
    const range = new Range();
    const textNode = element.childNodes[0];
    let idx = 0;
    let currentSpan = null;
    let prevCharWasSpaceCharacter = null;
    let prevCharTop = 0;
    let prevCharLeftForRTLTest = 0;
    let didTruncate = false;
    for (const childNode of element.childNodes) {
      if (childNode.nodeType !== Node.TEXT_NODE) continue;
      for (const char of childNode.textContent ?? "") {
        range.setStart(textNode, idx);
        range.setEnd(textNode, idx + char.length);
        const rects = range.getClientRects();
        const rect = rects[rects.length - 1];
        const top = rect.top + offsetY;
        const left = rect.left + offsetX;
        const right = rect.right + offsetX;
        const isRTL = left < prevCharLeftForRTLTest;
        const isSpaceCharacter = spaceCharacterRegex.test(char);
        if (
          // If we're at a word boundary...
          isSpaceCharacter !== prevCharWasSpaceCharacter || // ...or we're on a different line...
          top !== prevCharTop || // ...or we're at the start of the text and haven't created a span yet...
          !currentSpan
        ) {
          if (currentSpan) {
            if (shouldTruncateToFirstLine && top !== prevCharTop) {
              didTruncate = true;
              break;
            }
            spans.push(currentSpan);
          }
          currentSpan = {
            box: { x: left, y: top, w: rect.width, h: rect.height },
            text: char
          };
          prevCharLeftForRTLTest = left;
        } else {
          if (isRTL) {
            currentSpan.box.x = left;
          }
          currentSpan.box.w = isRTL ? currentSpan.box.w + rect.width : right - currentSpan.box.x;
          currentSpan.text += char;
        }
        if (char === "\n") {
          prevCharLeftForRTLTest = 0;
        }
        prevCharWasSpaceCharacter = isSpaceCharacter;
        prevCharTop = top;
        idx += char.length;
      }
    }
    if (currentSpan) {
      spans.push(currentSpan);
    }
    return { spans, didTruncate };
  }
  /**
   * Measure text into individual spans. Spans are created by rendering the
   * text, then dividing it up according to line breaks and word boundaries.
   *
   * It works by having the browser render the text, then measuring the
   * position of each character. You can use this to replicate the text-layout
   * algorithm of the current browser in e.g. an SVG export.
   */
  measureTextSpans(textToMeasure, opts) {
    if (textToMeasure === "") return [];
    const { elm } = this;
    const shouldTruncateToFirstLine = opts.overflow === "truncate-ellipsis" || opts.overflow === "truncate-clip";
    const elementWidth = Math.ceil(opts.width - opts.padding * 2);
    const newStyles = {
      "font-family": opts.fontFamily,
      "font-style": opts.fontStyle,
      "font-weight": opts.fontWeight,
      "font-size": opts.fontSize + "px",
      "line-height": opts.lineHeight.toString(),
      width: `${elementWidth}px`,
      height: "min-content",
      "text-align": textAlignmentsForLtr[opts.textAlign],
      "overflow-wrap": shouldTruncateToFirstLine ? "anywhere" : void 0,
      "word-break": shouldTruncateToFirstLine ? "break-all" : void 0,
      ...opts.otherStyles
    };
    const restoreStyles = this.setElementStyles(newStyles);
    try {
      const normalizedText = normalizeTextForDom(textToMeasure);
      elm.textContent = normalizedText;
      const { spans, didTruncate } = this.measureElementTextNodeSpans(elm, {
        shouldTruncateToFirstLine
      });
      if (opts.overflow === "truncate-ellipsis" && didTruncate) {
        elm.textContent = "\u2026";
        const ellipsisWidth = Math.ceil(this.measureElementTextNodeSpans(elm).spans[0].box.w);
        elm.style.setProperty("width", `${elementWidth - ellipsisWidth}px`);
        elm.textContent = normalizedText;
        const truncatedSpans = this.measureElementTextNodeSpans(elm, {
          shouldTruncateToFirstLine: true
        }).spans;
        const lastSpan = truncatedSpans[truncatedSpans.length - 1];
        truncatedSpans.push({
          text: "\u2026",
          box: {
            x: Math.min(lastSpan.box.x + lastSpan.box.w, opts.width - opts.padding - ellipsisWidth),
            y: lastSpan.box.y,
            w: ellipsisWidth,
            h: lastSpan.box.h
          }
        });
        return truncatedSpans;
      }
      return spans;
    } finally {
      restoreStyles();
    }
  }
}
export {
  TextManager
};
//# sourceMappingURL=TextManager.mjs.map
