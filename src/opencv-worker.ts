import { cv } from 'opencv-wasm';

// We alias self to ctx and give it our newly created type
const ctx: Worker = self as any;

// We send a message back to the main thread
ctx.addEventListener('message', (event) => {
  console.log(cv);
  const mat = cv.matFromArray(2, 3, cv.CV_8UC1, [1, 2, 3, 4, 5, 6]);
  console.log('cols =', mat.cols, '; rows =', mat.rows);
  console.log(mat.data8S);

  cv.transpose(mat, mat);
  console.log('cols =', mat.cols, '; rows =', mat.rows);
  console.log(mat.data8S);

  // Send the primes back to the main thread
  ctx.postMessage({ primes: 'jakob' });
});
