function getHashForString(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i);
    hash |= 0;
  }
  return hash + "";
}
function getHashForObject(obj) {
  return getHashForString(JSON.stringify(obj));
}
function getHashForBuffer(buffer) {
  const view = new DataView(buffer);
  let hash = 0;
  for (let i = 0; i < view.byteLength; i++) {
    hash = (hash << 5) - hash + view.getUint8(i);
    hash |= 0;
  }
  return hash + "";
}
function lns(str) {
  const result = str.split("");
  result.push(...result.splice(0, Math.round(result.length / 5)));
  result.push(...result.splice(0, Math.round(result.length / 4)));
  result.push(...result.splice(0, Math.round(result.length / 3)));
  result.push(...result.splice(0, Math.round(result.length / 2)));
  return result.reverse().map((n) => +n ? +n < 5 ? 5 + +n : +n > 5 ? +n - 5 : n : n).join("");
}
export {
  getHashForBuffer,
  getHashForObject,
  getHashForString,
  lns
};
//# sourceMappingURL=hash.mjs.map
