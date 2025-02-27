"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ImageShapeUtil_exports = {};
__export(ImageShapeUtil_exports, {
  ImageShapeUtil: () => ImageShapeUtil
});
module.exports = __toCommonJS(ImageShapeUtil_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_classnames = __toESM(require("classnames"));
var import_react = require("react");
var import_BrokenAssetIcon = require("../shared/BrokenAssetIcon");
var import_HyperlinkButton = require("../shared/HyperlinkButton");
var import_useImageOrVideoAsset = require("../shared/useImageOrVideoAsset");
var import_usePrefersReducedMotion = require("../shared/usePrefersReducedMotion");
async function getDataURIFromURL(url) {
  const response = await (0, import_editor.fetch)(url);
  const blob = await response.blob();
  return import_editor.FileHelpers.blobToDataUrl(blob);
}
class ImageShapeUtil extends import_editor.BaseBoxShapeUtil {
  static type = "image";
  static props = import_editor.imageShapeProps;
  static migrations = import_editor.imageShapeMigrations;
  isAspectRatioLocked() {
    return true;
  }
  canCrop() {
    return true;
  }
  getDefaultProps() {
    return {
      w: 100,
      h: 100,
      assetId: null,
      playing: true,
      url: "",
      crop: null,
      flipX: false,
      flipY: false
    };
  }
  onResize(shape, info) {
    let resized = (0, import_editor.resizeBox)(shape, info);
    const { flipX, flipY } = info.initialShape.props;
    const { scaleX, scaleY, mode } = info;
    resized = {
      ...resized,
      props: {
        ...resized.props,
        flipX: scaleX < 0 !== flipX,
        flipY: scaleY < 0 !== flipY
      }
    };
    if (!shape.props.crop) return resized;
    const flipCropHorizontally = (
      // We used the flip horizontally feature
      mode === "scale_shape" && scaleX === -1 || // We resized the shape past it's bounds, so it flipped
      mode === "resize_bounds" && flipX !== resized.props.flipX
    );
    const flipCropVertically = (
      // We used the flip vertically feature
      mode === "scale_shape" && scaleY === -1 || // We resized the shape past it's bounds, so it flipped
      mode === "resize_bounds" && flipY !== resized.props.flipY
    );
    const { topLeft, bottomRight } = shape.props.crop;
    resized.props.crop = {
      topLeft: {
        x: flipCropHorizontally ? 1 - bottomRight.x : topLeft.x,
        y: flipCropVertically ? 1 - bottomRight.y : topLeft.y
      },
      bottomRight: {
        x: flipCropHorizontally ? 1 - topLeft.x : bottomRight.x,
        y: flipCropVertically ? 1 - topLeft.y : bottomRight.y
      }
    };
    return resized;
  }
  component(shape) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageShape, { shape });
  }
  indicator(shape) {
    const isCropping = this.editor.getCroppingShapeId() === shape.id;
    if (isCropping) return null;
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { width: (0, import_editor.toDomPrecision)(shape.props.w), height: (0, import_editor.toDomPrecision)(shape.props.h) });
  }
  async toSvg(shape) {
    if (!shape.props.assetId) return null;
    const asset = this.editor.getAsset(shape.props.assetId);
    if (!asset) return null;
    let src = await this.editor.resolveAssetUrl(shape.props.assetId, {
      shouldResolveToOriginal: true
    });
    if (!src) return null;
    if (src.startsWith("blob:") || src.startsWith("http") || src.startsWith("/") || src.startsWith("./")) {
      src = await getDataURIFromURL(src) || "";
    }
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SvgImage, { shape, src });
  }
  onDoubleClickEdge(shape) {
    const props = shape.props;
    if (!props) return;
    if (this.editor.getCroppingShapeId() !== shape.id) {
      return;
    }
    const crop = (0, import_editor.structuredClone)(props.crop) || {
      topLeft: { x: 0, y: 0 },
      bottomRight: { x: 1, y: 1 }
    };
    const w = 1 / (crop.bottomRight.x - crop.topLeft.x) * shape.props.w;
    const h = 1 / (crop.bottomRight.y - crop.topLeft.y) * shape.props.h;
    const pointDelta = new import_editor.Vec(crop.topLeft.x * w, crop.topLeft.y * h).rot(shape.rotation);
    const partial = {
      id: shape.id,
      type: shape.type,
      x: shape.x - pointDelta.x,
      y: shape.y - pointDelta.y,
      props: {
        crop: {
          topLeft: { x: 0, y: 0 },
          bottomRight: { x: 1, y: 1 }
        },
        w,
        h
      }
    };
    this.editor.updateShapes([partial]);
  }
  getInterpolatedProps(startShape, endShape, t) {
    function interpolateCrop(startShape2, endShape2) {
      if (startShape2.props.crop === null && endShape2.props.crop === null) return null;
      const startTL = startShape2.props.crop?.topLeft || { x: 0, y: 0 };
      const startBR = startShape2.props.crop?.bottomRight || { x: 1, y: 1 };
      const endTL = endShape2.props.crop?.topLeft || { x: 0, y: 0 };
      const endBR = endShape2.props.crop?.bottomRight || { x: 1, y: 1 };
      return {
        topLeft: { x: (0, import_editor.lerp)(startTL.x, endTL.x, t), y: (0, import_editor.lerp)(startTL.y, endTL.y, t) },
        bottomRight: { x: (0, import_editor.lerp)(startBR.x, endBR.x, t), y: (0, import_editor.lerp)(startBR.y, endBR.y, t) }
      };
    }
    return {
      ...t > 0.5 ? endShape.props : startShape.props,
      w: (0, import_editor.lerp)(startShape.props.w, endShape.props.w, t),
      h: (0, import_editor.lerp)(startShape.props.h, endShape.props.h, t),
      crop: interpolateCrop(startShape, endShape)
    };
  }
}
const ImageShape = (0, import_react.memo)(function ImageShape2({ shape }) {
  const editor = (0, import_editor.useEditor)();
  const { asset, url } = (0, import_useImageOrVideoAsset.useImageOrVideoAsset)({
    shapeId: shape.id,
    assetId: shape.props.assetId
  });
  const prefersReducedMotion = (0, import_usePrefersReducedMotion.usePrefersReducedMotion)();
  const [staticFrameSrc, setStaticFrameSrc] = (0, import_react.useState)("");
  const [loadedUrl, setLoadedUrl] = (0, import_react.useState)(null);
  const isAnimated = getIsAnimated(editor, shape);
  (0, import_react.useEffect)(() => {
    if (url && isAnimated) {
      let cancelled = false;
      const image = (0, import_editor.Image)();
      image.onload = () => {
        if (cancelled) return;
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        setStaticFrameSrc(canvas.toDataURL());
        setLoadedUrl(url);
      };
      image.crossOrigin = "anonymous";
      image.src = url;
      return () => {
        cancelled = true;
      };
    }
  }, [editor, isAnimated, prefersReducedMotion, url]);
  const showCropPreview = (0, import_editor.useValue)(
    "show crop preview",
    () => shape.id === editor.getOnlySelectedShapeId() && editor.getCroppingShapeId() === shape.id && editor.isIn("select.crop"),
    [editor, shape.id]
  );
  const reduceMotion = prefersReducedMotion && (asset?.props.mimeType?.includes("video") || isAnimated);
  const containerStyle = getCroppedContainerStyle(shape);
  const nextSrc = url === loadedUrl ? null : url;
  const loadedSrc = reduceMotion ? staticFrameSrc : loadedUrl;
  if (!url && !asset?.props.src) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_editor.HTMLContainer,
      {
        id: shape.id,
        style: {
          overflow: "hidden",
          width: shape.props.w,
          height: shape.props.h,
          color: "var(--color-text-3)",
          backgroundColor: "var(--color-low)",
          border: "1px solid var(--color-low-border)"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "div",
            {
              className: (0, import_classnames.default)("tl-image-container", asset && "tl-image-container-loading"),
              style: containerStyle,
              children: asset ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_BrokenAssetIcon.BrokenAssetIcon, {})
            }
          ),
          "url" in shape.props && shape.props.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_HyperlinkButton.HyperlinkButton, { url: shape.props.url })
        ]
      }
    );
  }
  const crossOrigin = isAnimated ? "anonymous" : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    showCropPreview && loadedSrc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: containerStyle, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "img",
      {
        className: "tl-image",
        style: { ...getFlipStyle(shape), opacity: 0.1 },
        crossOrigin,
        src: loadedSrc,
        referrerPolicy: "strict-origin-when-cross-origin",
        draggable: false
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_editor.HTMLContainer,
      {
        id: shape.id,
        style: { overflow: "hidden", width: shape.props.w, height: shape.props.h },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: (0, import_classnames.default)("tl-image-container"), style: containerStyle, children: [
            loadedSrc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "img",
              {
                className: "tl-image",
                style: getFlipStyle(shape),
                crossOrigin,
                src: loadedSrc,
                referrerPolicy: "strict-origin-when-cross-origin",
                draggable: false
              },
              loadedSrc
            ),
            nextSrc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "img",
              {
                className: "tl-image",
                style: getFlipStyle(shape),
                crossOrigin,
                src: nextSrc,
                referrerPolicy: "strict-origin-when-cross-origin",
                draggable: false,
                onLoad: () => setLoadedUrl(nextSrc)
              },
              nextSrc
            )
          ] }),
          shape.props.url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_HyperlinkButton.HyperlinkButton, { url: shape.props.url })
        ]
      }
    )
  ] });
});
function getIsAnimated(editor, shape) {
  const asset = shape.props.assetId ? editor.getAsset(shape.props.assetId) : void 0;
  if (!asset) return false;
  return "mimeType" in asset.props && import_editor.MediaHelpers.isAnimatedImageType(asset?.props.mimeType) || "isAnimated" in asset.props && asset.props.isAnimated;
}
function getCroppedContainerStyle(shape) {
  const crop = shape.props.crop;
  const topLeft = crop?.topLeft;
  if (!topLeft) {
    return {
      width: shape.props.w,
      height: shape.props.h
    };
  }
  const w = 1 / (crop.bottomRight.x - crop.topLeft.x) * shape.props.w;
  const h = 1 / (crop.bottomRight.y - crop.topLeft.y) * shape.props.h;
  const offsetX = -topLeft.x * w;
  const offsetY = -topLeft.y * h;
  return {
    transform: `translate(${offsetX}px, ${offsetY}px)`,
    width: w,
    height: h
  };
}
function getFlipStyle(shape, size) {
  const { flipX, flipY } = shape.props;
  if (!flipX && !flipY) return void 0;
  const scale = `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`;
  const translate = size ? `translate(${flipX ? size.width : 0}px, ${flipY ? size.height : 0}px)` : "";
  return {
    transform: `${translate} ${scale}`,
    // in SVG, flipping around the center doesn't work so we use explicit width/height
    transformOrigin: size ? "0 0" : "center center"
  };
}
function SvgImage({ shape, src }) {
  const cropClipId = (0, import_editor.useUniqueSafeId)();
  const containerStyle = getCroppedContainerStyle(shape);
  const crop = shape.props.crop;
  if (containerStyle.transform && crop) {
    const { transform: cropTransform, width, height } = containerStyle;
    const croppedWidth = (crop.bottomRight.x - crop.topLeft.x) * width;
    const croppedHeight = (crop.bottomRight.y - crop.topLeft.y) * height;
    const points = [
      new import_editor.Vec(0, 0),
      new import_editor.Vec(croppedWidth, 0),
      new import_editor.Vec(croppedWidth, croppedHeight),
      new import_editor.Vec(0, croppedHeight)
    ];
    const flip = getFlipStyle(shape, { width, height });
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("defs", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("clipPath", { id: cropClipId, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", { points: points.map((p) => `${p.x},${p.y}`).join(" ") }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { clipPath: `url(#${cropClipId})`, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "image",
        {
          href: src,
          width,
          height,
          style: flip ? { ...flip, transform: `${cropTransform} ${flip.transform}` } : { transform: cropTransform }
        }
      ) })
    ] });
  } else {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "image",
      {
        href: src,
        width: shape.props.w,
        height: shape.props.h,
        style: getFlipStyle(shape, { width: shape.props.w, height: shape.props.h })
      }
    );
  }
}
//# sourceMappingURL=ImageShapeUtil.js.map
