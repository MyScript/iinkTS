import { fetch } from "@tldraw/utils";
import { version } from "../../version.mjs";
function dataUrlToFile(url, filename, mimeType) {
  return fetch(url).then(function(res) {
    return res.arrayBuffer();
  }).then(function(buf) {
    return new File([buf], filename, { type: mimeType });
  });
}
const CDN_BASE_URL = "https://cdn.tldraw.com";
function getDefaultCdnBaseUrl() {
  return `${CDN_BASE_URL}/${version}`;
}
export {
  dataUrlToFile,
  getDefaultCdnBaseUrl
};
//# sourceMappingURL=assets.mjs.map
