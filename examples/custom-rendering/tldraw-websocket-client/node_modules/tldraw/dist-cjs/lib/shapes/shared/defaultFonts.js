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
var defaultFonts_exports = {};
__export(defaultFonts_exports, {
  DefaultFontFaces: () => DefaultFontFaces,
  allDefaultFontFaces: () => allDefaultFontFaces
});
module.exports = __toCommonJS(defaultFonts_exports);
var import_editor = require("@tldraw/editor");
const DefaultFontFaces = {
  tldraw_draw: {
    normal: {
      normal: {
        family: "tldraw_draw",
        src: { url: "tldraw_draw", format: "woff2" },
        weight: "normal"
      },
      bold: {
        family: "tldraw_draw",
        src: { url: "tldraw_draw_bold", format: "woff2" },
        weight: "bold"
      }
    },
    italic: {
      normal: {
        family: "tldraw_draw",
        src: { url: "tldraw_draw_italic", format: "woff2" },
        weight: "normal",
        style: "italic"
      },
      bold: {
        family: "tldraw_draw",
        src: { url: "tldraw_draw_italic_bold", format: "woff2" },
        weight: "bold",
        style: "italic"
      }
    }
  },
  tldraw_sans: {
    normal: {
      normal: {
        family: "tldraw_sans",
        src: { url: "tldraw_sans", format: "woff2" },
        weight: "normal",
        style: "normal"
      },
      bold: {
        family: "tldraw_sans",
        src: { url: "tldraw_sans_bold", format: "woff2" },
        weight: "bold",
        style: "normal"
      }
    },
    italic: {
      normal: {
        family: "tldraw_sans",
        src: { url: "tldraw_sans_italic", format: "woff2" },
        weight: "normal",
        style: "italic"
      },
      bold: {
        family: "tldraw_sans",
        src: { url: "tldraw_sans_italic_bold", format: "woff2" },
        weight: "bold",
        style: "italic"
      }
    }
  },
  tldraw_serif: {
    normal: {
      normal: {
        family: "tldraw_serif",
        src: { url: "tldraw_serif", format: "woff2" },
        weight: "normal",
        style: "normal"
      },
      bold: {
        family: "tldraw_serif",
        src: { url: "tldraw_serif_bold", format: "woff2" },
        weight: "bold",
        style: "normal"
      }
    },
    italic: {
      normal: {
        family: "tldraw_serif",
        src: { url: "tldraw_serif_italic", format: "woff2" },
        weight: "normal",
        style: "italic"
      },
      bold: {
        family: "tldraw_serif",
        src: { url: "tldraw_serif_italic_bold", format: "woff2" },
        weight: "bold",
        style: "italic"
      }
    }
  },
  tldraw_mono: {
    normal: {
      normal: {
        family: "tldraw_mono",
        src: { url: "tldraw_mono", format: "woff2" },
        weight: "normal",
        style: "normal"
      },
      bold: {
        family: "tldraw_mono",
        src: { url: "tldraw_mono_bold", format: "woff2" },
        weight: "bold",
        style: "normal"
      }
    },
    italic: {
      normal: {
        family: "tldraw_mono",
        src: { url: "tldraw_mono_italic", format: "woff2" },
        weight: "normal",
        style: "italic"
      },
      bold: {
        family: "tldraw_mono",
        src: { url: "tldraw_mono_italic_bold", format: "woff2" },
        weight: "bold",
        style: "italic"
      }
    }
  }
};
const allDefaultFontFaces = (0, import_editor.objectMapValues)(DefaultFontFaces).flatMap(
  (font) => (0, import_editor.objectMapValues)(font).flatMap((fontFace) => Object.values(fontFace))
);
//# sourceMappingURL=defaultFonts.js.map
