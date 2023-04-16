// worker.js
self.addEventListener('message', (event) => {
  const input = event.data;
  // Perform the computationally intensive task here
  const result = 1; /* some operation on input */

  // Send the result back to the main thread
  self.postMessage(result);
});
