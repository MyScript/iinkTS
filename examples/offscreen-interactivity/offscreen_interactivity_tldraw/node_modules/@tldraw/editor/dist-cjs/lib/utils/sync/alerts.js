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
var alerts_exports = {};
__export(alerts_exports, {
  showCantReadFromIndexDbAlert: () => showCantReadFromIndexDbAlert,
  showCantWriteToIndexDbAlert: () => showCantWriteToIndexDbAlert
});
module.exports = __toCommonJS(alerts_exports);
function showCantWriteToIndexDbAlert() {
  window.alert(
    `Oops! We could not save changes to your browser's storage. We now need to reload the page and try again.

Keep seeing this message?
\u2022 If you're using tldraw in a private or "incognito" window, try loading tldraw in a regular window or in a different browser.
\u2022 If your hard disk is full, try clearing up some space and then reload the page.`
  );
}
function showCantReadFromIndexDbAlert() {
  window.alert(
    `Oops! We could not access your browser's storage\u2014and the app won't work correctly without that. We now need to reload the page and try again.

Keep seeing this message?
\u2022 If you're using tldraw in a private or "incognito" window, try loading tldraw in a regular window or in a different browser.`
  );
}
//# sourceMappingURL=alerts.js.map
