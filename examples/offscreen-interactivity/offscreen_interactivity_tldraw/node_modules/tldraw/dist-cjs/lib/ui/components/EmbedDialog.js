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
var EmbedDialog_exports = {};
__export(EmbedDialog_exports, {
  EmbedDialog: () => EmbedDialog
});
module.exports = __toCommonJS(EmbedDialog_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_defaultEmbedDefinitions = require("../../defaultEmbedDefinitions");
var import_asset_urls = require("../context/asset-urls");
var import_useGetEmbedDefinition = require("../hooks/useGetEmbedDefinition");
var import_useGetEmbedDefinitions = require("../hooks/useGetEmbedDefinitions");
var import_useTranslation = require("../hooks/useTranslation/useTranslation");
var import_TldrawUiButton = require("./primitives/Button/TldrawUiButton");
var import_TldrawUiButtonLabel = require("./primitives/Button/TldrawUiButtonLabel");
var import_TldrawUiDialog = require("./primitives/TldrawUiDialog");
var import_TldrawUiInput = require("./primitives/TldrawUiInput");
const EmbedDialog = (0, import_editor.track)(function EmbedDialog2({ onClose }) {
  const editor = (0, import_editor.useEditor)();
  const msg = (0, import_useTranslation.useTranslation)();
  const assetUrls = (0, import_asset_urls.useAssetUrls)();
  const [embedDefinition, setEmbedDefinition] = (0, import_react.useState)(null);
  const [url, setUrl] = (0, import_react.useState)("");
  const [embedInfoForUrl, setEmbedInfoForUrl] = (0, import_react.useState)(null);
  const [showError, setShowError] = (0, import_react.useState)(false);
  const rShowErrorTimeout = (0, import_react.useRef)(-1);
  const definitions = (0, import_useGetEmbedDefinitions.useGetEmbedDefinitions)();
  const getEmbedDefinition = (0, import_useGetEmbedDefinition.useGetEmbedDefinition)();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogHeader, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogTitle, { children: embedDefinition ? `${msg("embed-dialog.title")} \u2014 ${embedDefinition.title}` : msg("embed-dialog.title") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogCloseButton, {})
    ] }),
    embedDefinition ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogBody, { className: "tlui-embed-dialog__enter", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiInput.TldrawUiInput,
          {
            className: "tlui-embed-dialog__input",
            label: "embed-dialog.url",
            placeholder: "https://example.com",
            autoFocus: true,
            onValueChange: (value) => {
              setUrl(value);
              const embedInfo = getEmbedDefinition(value);
              setEmbedInfoForUrl(
                embedInfo && embedInfo.definition.type === embedDefinition.type ? embedInfo : null
              );
              setShowError(false);
              clearTimeout(rShowErrorTimeout.current);
              rShowErrorTimeout.current = editor.timers.setTimeout(
                () => setShowError(!embedInfo),
                320
              );
            }
          }
        ),
        url === "" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "tlui-embed-dialog__instruction", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: msg("embed-dialog.instruction") }),
          " ",
          embedDefinition.instructionLink && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "a",
              {
                target: "_blank",
                rel: "noopener noreferrer",
                href: embedDefinition.instructionLink,
                className: "tlui-embed-dialog__instruction__link",
                children: "Learn more"
              }
            ),
            "."
          ] })
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-embed-dialog__warning", children: showError ? msg("embed-dialog.invalid-url") : "\xA0" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiDialog.TldrawUiDialogFooter, { className: "tlui-dialog__footer__actions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "normal",
            onClick: () => {
              setEmbedDefinition(null);
              setEmbedInfoForUrl(null);
              setUrl("");
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: msg("embed-dialog.back") })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "tlui-embed__spacer" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButton.TldrawUiButton, { type: "normal", onClick: onClose, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: msg("embed-dialog.cancel") }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_TldrawUiButton.TldrawUiButton,
          {
            type: "primary",
            disabled: !embedInfoForUrl,
            onClick: () => {
              if (!embedInfoForUrl) return;
              editor.putExternalContent({
                type: "embed",
                url,
                point: editor.getViewportPageBounds().center,
                embed: embedInfoForUrl.definition
              });
              onClose();
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: msg("embed-dialog.create") })
          }
        )
      ] })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiDialog.TldrawUiDialogBody, { className: "tlui-embed-dialog__list", children: definitions.map((def) => {
      const url2 = (0, import_defaultEmbedDefinitions.isDefaultEmbedDefinitionType)(def.type) ? assetUrls.embedIcons[def.type] : (0, import_defaultEmbedDefinitions.isCustomEmbedDefinition)(def) ? def.icon : void 0;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_TldrawUiButton.TldrawUiButton, { type: "menu", onClick: () => setEmbedDefinition(def), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_TldrawUiButtonLabel.TldrawUiButtonLabel, { children: (0, import_useTranslation.untranslated)(def.title) }),
        url2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            className: "tlui-embed-dialog__item__image",
            style: { backgroundImage: `url(${url2})` }
          }
        )
      ] }, def.type);
    }) }) })
  ] });
});
//# sourceMappingURL=EmbedDialog.js.map
