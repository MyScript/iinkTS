import { objectMapValues } from "@tldraw/editor";
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
const allDefaultFontFaces = objectMapValues(DefaultFontFaces).flatMap(
  (font) => objectMapValues(font).flatMap((fontFace) => Object.values(fontFace))
);
export {
  DefaultFontFaces,
  allDefaultFontFaces
};
//# sourceMappingURL=defaultFonts.mjs.map
