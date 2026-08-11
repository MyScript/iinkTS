async function fetch(input, init) {
  return window.fetch(input, {
    // We want to make sure that the referrer is not sent to other domains.
    referrerPolicy: "strict-origin-when-cross-origin",
    ...init
  });
}
const Image = (width, height) => {
  const img = new window.Image(width, height);
  img.referrerPolicy = "strict-origin-when-cross-origin";
  return img;
};
export {
  Image,
  fetch
};
//# sourceMappingURL=network.mjs.map
