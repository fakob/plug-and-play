import { cv } from 'opencv-wasm';
import { VideoCaptureProperties } from './utils/openCVProperties';

// We alias self to ctx and give it our newly created type
const ctx: Worker = self as any;

// We send a message back to the main thread
ctx.addEventListener('message', (event) => {
  console.log(cv);
  const { objectURL, file } = event.data;
  console.log(objectURL, file);
  const objectURL2 = URL.createObjectURL(file);
  console.log(objectURL2);

  const vid = new cv.VideoCapture((objectURL2 as any).src);
  const frameCount = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_COUNT);
  const width = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_WIDTH);
  const height = vid.get(VideoCaptureProperties.CAP_PROP_FRAME_HEIGHT);
  const fps = vid.get(VideoCaptureProperties.CAP_PROP_FPS);
  console.log(frameCount, width, height, fps);

  const mat = cv.matFromArray(2, 3, cv.CV_8UC1, [1, 2, 3, 4, 5, 6]);
  console.log('cols =', mat.cols, '; rows =', mat.rows);
  console.log(mat.data8S);

  cv.transpose(mat, mat);
  console.log('cols =', mat.cols, '; rows =', mat.rows);
  console.log(mat.data8S);

  // Send the primes back to the main thread
  ctx.postMessage({ primes: 'jakob' });
});
