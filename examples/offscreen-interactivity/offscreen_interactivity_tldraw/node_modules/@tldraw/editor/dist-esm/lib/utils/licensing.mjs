function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function importPublicKey(pemContents) {
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);
  return crypto.subtle.importKey(
    "spki",
    new Uint8Array(binaryDer),
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["verify"]
  );
}
export {
  importPublicKey,
  str2ab
};
//# sourceMappingURL=licensing.mjs.map
