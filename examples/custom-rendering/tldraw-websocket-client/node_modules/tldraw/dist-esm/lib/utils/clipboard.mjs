import { getOwnProperty, objectMapFromEntries } from "@tldraw/editor";
const TLDRAW_CUSTOM_PNG_MIME_TYPE = "web image/vnd.tldraw+png";
const additionalClipboardWriteTypes = {
  png: TLDRAW_CUSTOM_PNG_MIME_TYPE
};
const canonicalClipboardReadTypes = {
  [TLDRAW_CUSTOM_PNG_MIME_TYPE]: "image/png"
};
function getAdditionalClipboardWriteType(format) {
  return getOwnProperty(additionalClipboardWriteTypes, format) ?? null;
}
function getCanonicalClipboardReadType(mimeType) {
  return getOwnProperty(canonicalClipboardReadTypes, mimeType) ?? mimeType;
}
function doesClipboardSupportType(mimeType) {
  return typeof ClipboardItem !== "undefined" && "supports" in ClipboardItem && ClipboardItem.supports(mimeType);
}
function clipboardWrite(types) {
  const entries = Object.entries(types);
  for (const [_, promise] of entries) promise.catch((err) => console.error(err));
  return navigator.clipboard.write([new ClipboardItem(types)]).catch((err) => {
    console.error(err);
    return Promise.all(
      entries.map(async ([type, promise]) => {
        return [type, await promise];
      })
    ).then((entries2) => {
      const resolvedTypes = objectMapFromEntries(entries2);
      return navigator.clipboard.write([new ClipboardItem(resolvedTypes)]);
    });
  });
}
export {
  TLDRAW_CUSTOM_PNG_MIME_TYPE,
  clipboardWrite,
  doesClipboardSupportType,
  getAdditionalClipboardWriteType,
  getCanonicalClipboardReadType
};
//# sourceMappingURL=clipboard.mjs.map
