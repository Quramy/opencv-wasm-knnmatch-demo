
importScripts('wasm-util.js', 'module.js', 'build/cv-wasm.js');

function match(img1array, img2array) {
  const img1Raw = cv.matFromArray(img1array, 24), img1 = new cv.Mat();
  cv.cvtColor(img1Raw, img1, cv.ColorConversionCodes.COLOR_RGBA2RGB.value, 0);

  const img2Raw = cv.matFromArray(img2array, 24), img2 = new cv.Mat();
  cv.cvtColor(img2Raw, img2, cv.ColorConversionCodes.COLOR_RGBA2RGB.value, 0);

  const mask = new cv.Mat(), kp1 = new cv.KeyPointVector(), des1 = new cv.Mat(), kp2 = new cv.KeyPointVector(), des2 = new cv.Mat();
  const akaze = new cv.AKAZE(5, 0, 3, 0.001, 4, 4, 1);
  akaze.detectAndCompute(img1, mask, kp1, des1, false);
  akaze.detectAndCompute(img2, mask, kp2, des2, false);

  const matches = new cv.DMatchVectorVector();
  const bf = new cv.BFMatcher(2, false);
  bf.knnMatch(des1, des2, matches, 2, mask, false);

  const ratio = .5, good = new cv.DMatchVectorVector();
  for (let i = 0; i < matches.size(); i++) {
    const m = matches.get(i).get(0), n = matches.get(i).get(1);
    if (m.distance < ratio * n.distance) {
      const t = new cv.DMatchVector();
      t.push_back(m);
      good.push_back(t);
    }
  }

  // console.log(matches.size(), kp1.size(), kp2.size(), good.size());
  const matchingImage = new cv.Mat(), mc = new cv.Scalar(-1, -1, -1, -1), sc = new cv.Scalar(0, 255, 0, 0), maskingCharVecVec = new cv.CharVectorVector();
  cv.drawMatchesKnn(img1, kp1, img2, kp2, good, matchingImage, mc, sc, maskingCharVecVec, 2);
  const width = matchingImage.cols,
        height = matchingImage.rows,
        channels = matchingImage.channels(),
        // data = matchingImage.data();
        // FIXME Copy array instance to work arround for FireFox's "cannot transfer WebAssembly/asm.js ArrayBuffer" message.
        data = new Uint8Array(matchingImage.data());
  postMessage({ type: 'res_match', width, height, channels, data }, [data.buffer]);
  // showImage(matchingImage, 'output');

  [img1Raw, img2Raw, img1, img2, akaze, mask, kp1, des1, kp2, des2, bf, matches, good, matchingImage, mc, sc, maskingCharVecVec].forEach(m => m.delete());

}

addEventListener('message', (ev) => {
  const meta = ev.data;
  switch (meta.type) {
    case 'req_match':
      const { img1, img2 } = ev.data;
      match(img1, img2);
      break;
    default:
  }
});

Module.onInit(cv => {
  postMessage({ type: 'init' });
});
