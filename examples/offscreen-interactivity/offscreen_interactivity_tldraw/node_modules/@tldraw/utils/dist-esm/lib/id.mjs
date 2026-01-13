/*!
 * MIT License: https://github.com/ai/nanoid/blob/main/LICENSE
 * Modified code originally from <https://github.com/ai/nanoid>
 * Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
 *
 * `nanoid` is currently only distributed as an ES module. Some tools (jest, playwright) don't
 * properly support ESM-only code yet, and tldraw itself is distributed as both an ES module and a
 * CommonJS module. By including nanoid here, we can make sure it works well in every environment
 * where tldraw is used. We can also remove some unused features like custom alphabets.
 */
const crypto = globalThis.crypto;
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = new Uint8Array(bytes * POOL_SIZE_MULTIPLIER);
    crypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool(size -= 0);
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}
let impl = nanoid;
function mockUniqueId(fn) {
  impl = fn;
}
function restoreUniqueId() {
  impl = nanoid;
}
function uniqueId(size) {
  return impl(size);
}
export {
  mockUniqueId,
  restoreUniqueId,
  uniqueId
};
//# sourceMappingURL=id.mjs.map
