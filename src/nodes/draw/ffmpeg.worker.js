let ffmpeg;

(async () => {
  console.time('ffmpeg imported');
  const packageName = '@ffmpeg/ffmpeg@0.11.6';
  const url = 'https://esm.sh/' + packageName;
  self.FFmpeg = await import(/* webpackIgnore: true */ url);
  console.timeEnd('ffmpeg imported');

  console.time('ffmpeg initialized');
  ffmpeg = self.FFmpeg.createFFmpeg({
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
    // log: true,
  });
  await ffmpeg.setProgress(progressMessage);
  console.timeEnd('ffmpeg initialized');
})();

self.onmessage = async (event) => {
  try {
    const { type, buffer, name, inType, outType } = event.data;

    const waitForFfmpeg = async () => {
      if (ffmpeg) {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
        }
        switch (type) {
          case 'transcode':
            const version = inType === outType ? '-in' : '';
            ffmpeg.FS(
              'writeFile',
              `${name}${version}.${inType}`,
              new Uint8Array(buffer),
            );
            await ffmpeg.run(
              '-i',
              `${name}${version}.${inType}`,
              `${name}.${outType}`,
            );
            const data = ffmpeg.FS('readFile', `${name}.${outType}`);

            self.postMessage(
              {
                buffer: data.buffer,
                type: 'transcodingResult',
                name: `${name}.${outType}`,
              },
              [data.buffer],
            );

            // delete files from memory
            ffmpeg.FS('unlink', `${name}${version}.${inType}`);
            ffmpeg.FS('unlink', `${name}.${outType}`);
            break;
          default:
            console.warn('Unknown message type', event.data);
            break;
        }
        // due to a bug you can always only execute one ffmpeg.run command
        // after that you need to exit -> load again
        ffmpeg.exit();
      } else {
        console.log('wait');
        setTimeout(waitForFfmpeg, 100);
      }
    };
    await waitForFfmpeg();
  } catch (e) {
    self.postMessage({ type: 'error', error: e });
  }
};

self.onerror = (err) => {
  console.error(err);
};

self.onmessageerror = (err) => {
  console.error(err);
};

const progressMessage = ({ ratio }) => {
  console.log(ratio);
  self.postMessage({ type: 'progress', data: ratio });
};
