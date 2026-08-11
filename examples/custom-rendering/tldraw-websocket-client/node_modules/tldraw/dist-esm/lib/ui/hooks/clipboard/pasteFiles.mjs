async function pasteFiles(editor, blobs, point, sources) {
  const files = blobs.map(
    (blob) => blob instanceof File ? blob : new File([blob], "tldrawFile", { type: blob.type })
  );
  editor.markHistoryStoppingPoint("paste");
  await editor.putExternalContent({
    type: "files",
    files,
    point,
    sources
  });
}
export {
  pasteFiles
};
//# sourceMappingURL=pasteFiles.mjs.map
