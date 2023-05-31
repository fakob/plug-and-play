let ffmpeg;

(async () => {
  console.time('import');
  const packageName = '@ffmpeg/ffmpeg';
  const url = 'https://esm.sh/' + packageName;
  console.log(url);
  self.FFmpeg = await import(/* webpackIgnore: true */ url);
  console.log(self.FFmpeg);
  console.timeEnd('import');

  console.time('loadFFmpeg');
  ffmpeg = self.FFmpeg.createFFmpeg({
    mainName: 'main',
    corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
    log: true,
  });
  await ffmpeg.setProgress(progressMessage);
  console.log(ffmpeg);
  console.timeEnd('loadFFmpeg');
})();

self.onmessage = async (event) => {
  try {
    const { type, buffer, name, inType, outType } = event.data;

    const waitForFfmpeg = async () => {
      if (ffmpeg) {
        if (!ffmpeg.isLoaded()) {
          await ffmpeg.load();
        }
        console.log(ffmpeg);
        switch (type) {
          case 'transcode':
            const version = inType === outType ? '-in' : '';
            ffmpeg.FS(
              'writeFile',
              `${name}${version}.${inType}`,
              new Uint8Array(buffer)
            );
            await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
            const data = ffmpeg.FS('readFile', `${name}.${outType}`);

            self.postMessage(
              {
                buffer: data.buffer,
                type: 'transcodingResult',
                name: `${name}.${outType}`,
              },
              [data.buffer]
            );

            // delete files from memory
            ffmpeg.FS('unlink', `${name}${version}.${inType}`);
            ffmpeg.FS('unlink', `${name}.${outType}`);
            break;
          case 'getStills':
            ffmpeg.FS('writeFile', `${name}.${inType}`, new Uint8Array(buffer));
            // await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
            console.log(await ffmpeg.FS('readdir', '/'));
            await ffmpeg.FS('mkdir', '/frames');
            await ffmpeg.run(
              '-i',
              `${name}.${inType}`,
              // '-vf',
              // `select='not(mod(t,1))'`,
              '-r', // change framerate
              '1', // to once a second
              `/frames/${name}%03d.png`
            );

            const exportedFrames = await ffmpeg
              .FS('readdir', '/frames')
              .filter((f) => f.endsWith('.png'));
            console.log(exportedFrames);
            for (const [i, fileName] of exportedFrames.entries()) {
              const framePath = '/frames/' + fileName;
              const data = ffmpeg.FS('readFile', `${framePath}`);
              console.log(
                i,
                exportedFrames.length - 1,
                i / (exportedFrames.length - 1.0)
              );
              self.postMessage({
                type: 'progress',
                data: i / (exportedFrames.length - 1.0),
              });
              const isLast = i === exportedFrames.length - 1;
              self.postMessage(
                { buffer: data.buffer, type: 'frame', i, isLast },
                [data.buffer]
              );
              ffmpeg.FS('unlink', `${framePath}`);
            }
            await ffmpeg.FS('rmdir', '/frames');
            ffmpeg.FS('unlink', `${name}.${inType}`);
            console.log(await ffmpeg.FS('readdir', '/'));
            ffmpeg.exit();
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
    waitForFfmpeg();
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
