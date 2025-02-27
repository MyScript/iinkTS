async function pasteUrl(editor, url, point, sources) {
  editor.markHistoryStoppingPoint("paste");
  return await editor.putExternalContent({
    type: "url",
    point,
    url,
    sources
  });
}
export {
  pasteUrl
};
//# sourceMappingURL=pasteUrl.mjs.map
