import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { track, useEditor } from "@tldraw/editor";
import { useRef, useState } from "react";
import {
  isCustomEmbedDefinition,
  isDefaultEmbedDefinitionType
} from "../../defaultEmbedDefinitions.mjs";
import { useAssetUrls } from "../context/asset-urls.mjs";
import { useGetEmbedDefinition } from "../hooks/useGetEmbedDefinition.mjs";
import { useGetEmbedDefinitions } from "../hooks/useGetEmbedDefinitions.mjs";
import { untranslated, useTranslation } from "../hooks/useTranslation/useTranslation.mjs";
import { TldrawUiButton } from "./primitives/Button/TldrawUiButton.mjs";
import { TldrawUiButtonLabel } from "./primitives/Button/TldrawUiButtonLabel.mjs";
import {
  TldrawUiDialogBody,
  TldrawUiDialogCloseButton,
  TldrawUiDialogFooter,
  TldrawUiDialogHeader,
  TldrawUiDialogTitle
} from "./primitives/TldrawUiDialog.mjs";
import { TldrawUiInput } from "./primitives/TldrawUiInput.mjs";
const EmbedDialog = track(function EmbedDialog2({ onClose }) {
  const editor = useEditor();
  const msg = useTranslation();
  const assetUrls = useAssetUrls();
  const [embedDefinition, setEmbedDefinition] = useState(null);
  const [url, setUrl] = useState("");
  const [embedInfoForUrl, setEmbedInfoForUrl] = useState(null);
  const [showError, setShowError] = useState(false);
  const rShowErrorTimeout = useRef(-1);
  const definitions = useGetEmbedDefinitions();
  const getEmbedDefinition = useGetEmbedDefinition();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs(TldrawUiDialogHeader, { children: [
      /* @__PURE__ */ jsx(TldrawUiDialogTitle, { children: embedDefinition ? `${msg("embed-dialog.title")} \u2014 ${embedDefinition.title}` : msg("embed-dialog.title") }),
      /* @__PURE__ */ jsx(TldrawUiDialogCloseButton, {})
    ] }),
    embedDefinition ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(TldrawUiDialogBody, { className: "tlui-embed-dialog__enter", children: [
        /* @__PURE__ */ jsx(
          TldrawUiInput,
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
        url === "" ? /* @__PURE__ */ jsxs("div", { className: "tlui-embed-dialog__instruction", children: [
          /* @__PURE__ */ jsx("span", { children: msg("embed-dialog.instruction") }),
          " ",
          embedDefinition.instructionLink && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
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
        ] }) : /* @__PURE__ */ jsx("div", { className: "tlui-embed-dialog__warning", children: showError ? msg("embed-dialog.invalid-url") : "\xA0" })
      ] }),
      /* @__PURE__ */ jsxs(TldrawUiDialogFooter, { className: "tlui-dialog__footer__actions", children: [
        /* @__PURE__ */ jsx(
          TldrawUiButton,
          {
            type: "normal",
            onClick: () => {
              setEmbedDefinition(null);
              setEmbedInfoForUrl(null);
              setUrl("");
            },
            children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: msg("embed-dialog.back") })
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "tlui-embed__spacer" }),
        /* @__PURE__ */ jsx(TldrawUiButton, { type: "normal", onClick: onClose, children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: msg("embed-dialog.cancel") }) }),
        /* @__PURE__ */ jsx(
          TldrawUiButton,
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
            children: /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: msg("embed-dialog.create") })
          }
        )
      ] })
    ] }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(TldrawUiDialogBody, { className: "tlui-embed-dialog__list", children: definitions.map((def) => {
      const url2 = isDefaultEmbedDefinitionType(def.type) ? assetUrls.embedIcons[def.type] : isCustomEmbedDefinition(def) ? def.icon : void 0;
      return /* @__PURE__ */ jsxs(TldrawUiButton, { type: "menu", onClick: () => setEmbedDefinition(def), children: [
        /* @__PURE__ */ jsx(TldrawUiButtonLabel, { children: untranslated(def.title) }),
        url2 && /* @__PURE__ */ jsx(
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
export {
  EmbedDialog
};
//# sourceMappingURL=EmbedDialog.mjs.map
